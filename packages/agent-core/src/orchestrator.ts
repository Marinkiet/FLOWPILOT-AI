/**
 * Agent Orchestrator
 *
 * The central coordinator that drives the complete agent loop:
 *   OBSERVE → REASON → ACT → OBSERVE AGAIN → INVESTIGATE → REPORT
 *
 * The orchestrator accepts a BrowserContext interface — it never imports
 * Playwright directly. The caller (server) is responsible for providing one.
 */

import type {
  AgentOrchestrator as IAgentOrchestrator,
  AgentRunOptions,
  AgentEvent,
  QualityReport,
  LLMProvider,
  JourneyStep,
  BrowserContext,
} from '@flowpilot/shared';
import { FlowArchitectAgent } from './agents/flow-architect.js';
import { FlowRunnerAgent } from './agents/flow-runner.js';
import { FlowAnalystAgent } from './agents/flow-analyst.js';
import { QualityInvestigatorAgent } from './agents/quality-investigator.js';
import { JourneyOptimizerAgent } from './agents/journey-optimizer.js';
import { createLLMProvider } from './llm/provider-factory.js';
import { generateId } from './utils/id.js';

type EventHandler = (data: unknown) => void;

export interface OrchestratorRunOptions extends AgentRunOptions {
  /** Caller provides the browser context — orchestrator never instantiates Playwright */
  browser: BrowserContext;
  /** Caller's journey ID — report will be saved against this ID */
  journeyId?: string;
}

export class AgentOrchestrator implements IAgentOrchestrator {
  private readonly llm: LLMProvider;
  private readonly eventHandlers = new Map<AgentEvent, Set<EventHandler>>();

  constructor(options?: { llmProvider?: LLMProvider }) {
    this.llm = options?.llmProvider ?? createLLMProvider();
  }

  /**
   * Run the full OBSERVE → REASON → ACT → INVESTIGATE → REPORT loop.
   * Caller must provide a BrowserContext (e.g. PlaywrightBrowserContext).
   * Caller is responsible for closing the browser after this resolves.
   */
  async runJourney(
    applicationId: string,
    userGoal: string,
    options: OrchestratorRunOptions
  ): Promise<QualityReport> {
    const llm = options.llmProvider ?? this.llm;
    const browser = options.browser;

    // ── Phase 1: OBSERVE — Build/use the flow graph ───────────────────────────
    this.emit('observation', { phase: 'observe', message: 'Building flow graph...' });

    const architect = new FlowArchitectAgent(llm, applicationId);

    let graph = options.existingGraph;
    if (!graph || graph.nodes.length === 0) {
      throw new Error(
        'A non-empty journey graph (existingGraph) is required. Run flow discovery first.'
      );
    }

    // ── Phase 2: REASON — Plan the journey ───────────────────────────────────
    this.emit('reasoning', { phase: 'reason', message: 'Planning journey steps...' });

    const suggestions = await architect.suggestJourneys(graph, userGoal);
    const bestSuggestion = suggestions[0];

    if (!bestSuggestion) {
      throw new Error(`Could not plan a journey for goal: "${userGoal}"`);
    }

    this.emit('reasoning', {
      phase: 'reason',
      message: `Planned journey: "${bestSuggestion.name}" with ${bestSuggestion.path.length} waypoints`,
    });

    const journey = this.buildJourneyFromSuggestion(
      applicationId,
      userGoal,
      bestSuggestion,
      graph,
      options.journeyId  // Use caller's ID if provided
    );

    // ── Phase 3: ACT — Execute the journey ───────────────────────────────────
    this.emit('step:start', { journey });

    const runner = new FlowRunnerAgent(llm, options.screenshotDir);

    const result = await runner.run(journey, browser, (step: JourneyStep) => {
      this.emit(step.status === 'passed' ? 'step:complete' : 'step:failed', { step });
      if (step.screenshotPath) {
        this.emit('screenshot:taken', { path: step.screenshotPath, step });
      }
    });

    // ── Phase 4: OBSERVE AGAIN + INVESTIGATE ─────────────────────────────────
    this.emit('observation', { phase: 'observe', message: 'Analyzing journey results...' });

    const analyst = new FlowAnalystAgent(llm);
    const analysis = await analyst.analyze(result);

    for (const finding of analysis.findings) {
      this.emit('finding:detected', { finding });
    }

    // ── Phase 5: REPORT ───────────────────────────────────────────────────────
    this.emit('reasoning', { phase: 'report', message: 'Generating quality report...' });

    const investigator = new QualityInvestigatorAgent(llm);
    const report = await investigator.investigate(result, analysis);

    // Enhance with journey optimizer suggestions
    const optimizer = new JourneyOptimizerAgent(llm);
    const optimizations = await optimizer.optimize(report);
    report.recommendations = [...report.recommendations, ...optimizations];

    this.emit('report:ready', { report, journey: result.journey });

    return report;
  }

  on(event: AgentEvent, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: AgentEvent, handler: EventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: AgentEvent, data: unknown): void {
    for (const handler of this.eventHandlers.get(event) ?? []) {
      try {
        handler(data);
      } catch (err) {
        console.error(`[Orchestrator] Event handler error for "${event}":`, err);
      }
    }
  }

  private buildJourneyFromSuggestion(
    applicationId: string,
    userGoal: string,
    suggestion: import('@flowpilot/shared').JourneySuggestion,
    graph: import('@flowpilot/shared').JourneyGraph,
    existingJourneyId?: string
  ): import('@flowpilot/shared').Journey {
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    const steps: JourneyStep[] = suggestion.path.map((nodeId, index) => {
      const node = nodeMap.get(nodeId);
      return {
        id: generateId('step'),
        name: node?.name ?? `Step ${index + 1}`,
        description: `Navigate to ${node?.path ?? nodeId}`,
        actions: node
          ? [
              {
                type: 'navigate' as const,
                target: node.path,
                description: `Go to ${node.name}`,
              },
            ]
          : [],
        status: 'pending' as const,
        consoleErrors: [],
        networkFailures: [],
        expectedUrl: node?.path,
      };
    });

    return {
      id: existingJourneyId ?? generateId('journey'),
      applicationId,
      name: suggestion.name,
      description: suggestion.description,
      userGoal,
      steps,
      status: 'pending',
      frictionPoints: [],
      findings: [],
    };
  }
}
