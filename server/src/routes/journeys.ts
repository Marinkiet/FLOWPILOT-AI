import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import {
  listJourneys,
  getJourney,
  upsertJourney,
  getApplication,
  listScreenshots,
  getReport,
  saveReport,
  saveScreenshot,
  listFlowNodes,
  upsertFlowNode,
} from '../db/repositories.js';
import { AgentOrchestrator, FlowArchitectAgent, createLLMProvider } from '@flowpilot/agent-core';
import type { OrchestratorRunOptions } from '@flowpilot/agent-core';
import { PlaywrightBrowserContext } from '@flowpilot/browser-runner';
import type { Journey } from '@flowpilot/shared';
import { join } from 'path';

export const journeysRouter = Router();

journeysRouter.get('/', async (req, res) => {
  const appId = req.query['applicationId'] as string | undefined;
  res.json(await listJourneys(appId));
});

journeysRouter.get('/:id', async (req, res) => {
  const journey = await getJourney(req.params['id'] ?? '');
  if (!journey) return res.status(404).json({ error: 'Journey not found' });
  return res.json(journey);
});

journeysRouter.get('/:id/screenshots', async (req, res) => {
  const screenshots = await listScreenshots(req.params['id'] ?? '');
  res.json(screenshots);
});

journeysRouter.get('/:id/report', async (req, res) => {
  const report = await getReport(req.params['id'] ?? '');
  if (!report) return res.status(404).json({ error: 'Report not found' });
  return res.json(report);
});

/**
 * POST /journeys/run
 * Triggers the full agent loop for a given application and user goal.
 */
journeysRouter.post('/run', async (req, res) => {
  const { applicationId, userGoal, headless = true } = req.body as {
    applicationId: string;
    userGoal: string;
    headless?: boolean;
  };

  if (!applicationId || !userGoal) {
    return res.status(400).json({ error: 'applicationId and userGoal are required' });
  }

  const application = await getApplication(applicationId);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const journeyId = uuid();
  const pendingJourney: Journey = {
    id: journeyId,
    applicationId,
    name: `Journey: ${userGoal.slice(0, 60)}`,
    description: `Auto-generated journey for goal: "${userGoal}"`,
    userGoal,
    steps: [],
    status: 'running',
    startedAt: new Date().toISOString(),
    frictionPoints: [],
    findings: [],
  };
  await upsertJourney(pendingJourney);

  // Run agent in background
  void runAgentAsync(journeyId, application, userGoal, headless);

  return res.status(202).json({ journeyId, message: 'Journey started' });
});

/**
 * POST /journeys/discover
 */
journeysRouter.post('/discover', async (req, res) => {
  const { applicationId } = req.body as { applicationId: string };
  if (!applicationId) {
    return res.status(400).json({ error: 'applicationId is required' });
  }

  const application = await getApplication(applicationId);
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const llm = createLLMProvider();
  const architect = new FlowArchitectAgent(llm, applicationId);
  const browser = new PlaywrightBrowserContext({
    headless: true,
    screenshotDir: getScreenshotDir(),
  });

  try {
    const nodes = await architect.discover(application.baseUrl, browser);
    const now = new Date().toISOString();
    for (const node of nodes) {
      await upsertFlowNode(node, now);
    }
    return res.json({ nodes, discoveredAt: now });
  } finally {
    await browser.close();
  }
});

// ─── SSE stream ───────────────────────────────────────────────────────────────

journeysRouter.get('/:id/stream', async (req, res) => {
  const journeyId = req.params['id'];
  const journey = await getJourney(journeyId ?? '');
  if (!journey) return res.status(404).json({ error: 'Journey not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const pollInterval = setInterval(async () => {
    const updated = await getJourney(journeyId ?? '');
    if (!updated) return;

    res.write(`data: ${JSON.stringify(updated)}\n\n`);

    if (updated.status === 'completed' || updated.status === 'failed') {
      clearInterval(pollInterval);
      res.end();
    }
  }, 500);

  req.on('close', () => clearInterval(pollInterval));
  return undefined;
});

// ─── Internal: run agent asynchronously ──────────────────────────────────────

async function runAgentAsync(
  journeyId: string,
  application: import('@flowpilot/shared').Application,
  userGoal: string,
  headless: boolean
): Promise<void> {
  try {
    const llm = createLLMProvider();
    const architect = new FlowArchitectAgent(llm, application.id);
    const browser = new PlaywrightBrowserContext({
      headless,
      screenshotDir: getScreenshotDir(),
    });

    try {
      let nodes = await listFlowNodes(application.id);
      if (nodes.length === 0) {
        // Try live browser discovery first
        try {
          nodes = await architect.discover(application.baseUrl, browser);
        } catch (discoverErr) {
          console.warn('[Agent] Browser discovery failed, using synthetic graph:', discoverErr);
        }

        // If live discovery produced nothing, build a synthetic graph from known paths
        if (nodes.length === 0) {
          nodes = buildSyntheticNodes(application.id, application.baseUrl);
          console.log('[Agent] Using synthetic flow graph with', nodes.length, 'nodes');
        }

        const now = new Date().toISOString();
        for (const node of nodes) {
          await upsertFlowNode(node, now);
        }
      }

      const graph = await architect.buildJourneyGraph(nodes);
      const orchestrator = new AgentOrchestrator({ llmProvider: llm });

      // Capture the executed journey so we can persist its steps.
      // Use a container object so TS control-flow doesn't narrow to never.
      const captured: { journey: import('@flowpilot/shared').Journey | null } = { journey: null };
      orchestrator.on('report:ready', (data) => {
        const d = data as { journey?: import('@flowpilot/shared').Journey };
        if (d.journey) captured.journey = d.journey;
      });

      const runOptions: OrchestratorRunOptions = {
        headless,
        screenshotDir: getScreenshotDir(),
        existingGraph: graph,
        browser,
        journeyId,  // Ensures report.journeyId matches our DB record
      };

      const report = await orchestrator.runJourney(application.id, userGoal, runOptions);

      // Ensure the report points to our DB journey ID, not the internal one
      report.journeyId = journeyId;
      await saveReport(report);

      const journey = await getJourney(journeyId);
      if (journey) {
        await upsertJourney({
          ...journey,
          // Merge steps from the actual executed journey if available
          steps: captured.journey?.steps ?? journey.steps,
          id: journeyId,
          applicationId: application.id,
          status: report.goalCompletionRate >= 80 ? 'completed' : 'failed',
          success: report.goalCompletionRate >= 80,
          completedAt: new Date().toISOString(),
          agentSummary: report.summary,
          findings: report.findings,
          frictionPoints: report.frictionPoints,
        });
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('[Agent] Fatal error during journey run:', error);
    const journey = await getJourney(journeyId);
    if (journey) {
      await upsertJourney({
        ...journey,
        status: 'failed',
        completedAt: new Date().toISOString(),
        agentSummary: `Agent error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
}

function getScreenshotDir(): string {
  return join(process.cwd(), 'screenshots');
}

/**
 * Build a synthetic flow graph from well-known e-commerce routes.
 * Used as fallback when browser discovery fails or returns nothing.
 */
function buildSyntheticNodes(
  applicationId: string,
  baseUrl: string
): import('@flowpilot/shared').FlowNode[] {
  const routes = [
    { path: '/', name: 'Home' },
    { path: '/login', name: 'Login' },
    { path: '/register', name: 'Register' },
    { path: '/products', name: 'Products' },
    { path: '/cart', name: 'Cart' },
    { path: '/checkout', name: 'Checkout' },
    { path: '/payment', name: 'Payment' },
    { path: '/order-confirmation', name: 'Order Confirmation' },
    { path: '/orders', name: 'Order History' },
  ];

  return routes.map((r, i) => ({
    id: `synthetic_node_${i}`,
    applicationId,
    name: r.name,
    path: `${baseUrl}${r.path}`,
    title: r.name,
    elements: [],
    edges: [],
  }));
}
