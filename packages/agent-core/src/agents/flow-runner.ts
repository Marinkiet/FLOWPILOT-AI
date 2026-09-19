/**
 * Flow Runner Agent
 *
 * Phase: ACT + OBSERVE
 * Responsibility: Execute a user journey step by step in the browser.
 * Records actions, screenshots, timing, console errors, and network failures.
 * Observes after each action to decide if the step succeeded (OBSERVE → ACT loop).
 */

import type {
  FlowRunner as IFlowRunner,
  Journey,
  JourneyStep,
  BrowserContext,
  LLMProvider,
  JourneyRunResult,
  AgentReasoningEntry,
  NetworkFailure,
} from '@flowpilot/shared';
import type { Screenshot } from '@flowpilot/shared';
import { generateId } from '../utils/id.js';

const RUNNER_SYSTEM_PROMPT = `You are the Flow Runner component of FlowPilot AI.
You execute user journey steps in a browser and observe the results.
After each action, you observe the page state and decide if the step succeeded.
You are methodical, precise, and evidence-based.
Report what you see — do not assume success without verification.`;

export class FlowRunnerAgent implements IFlowRunner {
  private readonly reasoningLog: AgentReasoningEntry[] = [];
  private readonly screenshots: Screenshot[] = [];

  constructor(
    private readonly llm: LLMProvider,
    private readonly screenshotDir: string = './screenshots'
  ) {}

  async run(
    journey: Journey,
    browser: BrowserContext,
    onStepComplete?: (step: JourneyStep) => void
  ): Promise<JourneyRunResult> {
    this.reasoningLog.length = 0;
    this.screenshots.length = 0;

    this.log('observe', `Starting journey: "${journey.name}" — Goal: "${journey.userGoal}"`);

    const updatedSteps: JourneyStep[] = [];

    for (const step of journey.steps) {
      this.log('act', `Executing step: ${step.name}`);

      const updatedStep = await this.executeStep(step, browser, journey.id);
      updatedSteps.push(updatedStep);

      onStepComplete?.(updatedStep);

      if (updatedStep.status === 'failed') {
        this.log(
          'observe',
          `Step "${step.name}" failed — ${updatedStep.error ?? 'unknown error'}. Continuing to collect evidence...`
        );
        // Do NOT abort — collect maximum evidence across all steps
      }
    }

    const success = updatedSteps
      .filter((s) => s.status !== 'skipped')
      .every((s) => s.status === 'passed');

    this.log(
      'observe',
      `Journey complete. Success: ${success}. Passed: ${
        updatedSteps.filter((s) => s.status === 'passed').length
      }/${updatedSteps.length}`
    );

    return {
      journey: {
        ...journey,
        steps: updatedSteps,
        status: success ? 'completed' : 'failed',
        completedAt: new Date().toISOString(),
        success,
      },
      screenshots: this.screenshots,
      reasoningLog: [...this.reasoningLog],
      success,
    };
  }

  private async executeStep(
    step: JourneyStep,
    browser: BrowserContext,
    journeyId: string
  ): Promise<JourneyStep> {
    const startTime = Date.now();
    const consoleErrors: string[] = [];
    const networkFailures: NetworkFailure[] = [...(step.networkFailures ?? [])];

    try {
      // Execute each action in the step
      for (const action of step.actions) {
        this.log('act', `Action: ${action.type} — ${action.description}`);

        switch (action.type) {
          case 'navigate':
            if (action.target) await browser.goto(action.target);
            break;

          case 'click':
            if (action.target) {
              const exists = await browser.exists(action.target);
              if (!exists) throw new Error(`Element not found: ${action.target}`);
              await browser.click(action.target);
            }
            break;

          case 'fill':
            if (action.target && action.value !== undefined) {
              await browser.fill(action.target, action.value);
            }
            break;

          case 'select':
            if (action.target && action.value !== undefined) {
              await browser.select(action.target, action.value);
            }
            break;

          case 'wait':
            if (action.target) {
              await browser.waitForSelector(action.target, 5000);
            }
            break;

          case 'assert':
            if (action.target) {
              const assertExists = await browser.exists(action.target);
              if (!assertExists) {
                throw new Error(
                  `Assertion failed: "${action.target}" not found. Expected: ${
                    action.expectedOutcome ?? 'element to be present'
                  }`
                );
              }
            }
            break;

          case 'screenshot':
            // Explicit screenshot — taken automatically below too
            break;

          case 'scroll':
          case 'custom':
            // Future: implement as needed
            break;
        }
      }

      // Observe state after all actions complete
      const currentUrl = await browser.currentUrl();
      const consoleMsgs = await browser.drainConsoleMessages();
      const networkFails = await browser.drainNetworkFailures();

      for (const msg of consoleMsgs) {
        if (msg.level === 'error') consoleErrors.push(msg.text);
      }

      for (const fail of networkFails) {
        networkFailures.push(fail);
      }

      // Always take an evidence screenshot
      const screenshotPath = await browser.screenshot(`${step.name}`);
      const screenshot: Screenshot = {
        id: generateId('screenshot'),
        journeyId,
        stepId: step.id,
        path: screenshotPath,
        url: currentUrl,
        takenAt: new Date().toISOString(),
        label: step.name,
      };
      this.screenshots.push(screenshot);

      // OBSERVE: ask the LLM if this step truly succeeded
      const observation = await this.assessStepSuccess(
        step,
        currentUrl,
        consoleErrors,
        networkFails
      );
      this.log('observe', observation.assessment);

      const durationMs = Date.now() - startTime;

      return {
        ...step,
        status: observation.passed ? 'passed' : 'failed',
        screenshotPath,
        actualUrl: currentUrl,
        durationMs,
        consoleErrors,
        networkFailures,
        agentObservation: observation.assessment,
        error: observation.passed ? undefined : observation.issue,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.log('observe', `Step "${step.name}" threw an error: ${errorMessage}`);

      // Still take a failure screenshot for evidence
      let screenshotPath: string | undefined;
      try {
        screenshotPath = await browser.screenshot(`FAILED-${step.name}`);
        const currentUrl = await browser.currentUrl();
        this.screenshots.push({
          id: generateId('screenshot'),
          journeyId,
          stepId: step.id,
          path: screenshotPath,
          url: currentUrl,
          takenAt: new Date().toISOString(),
          label: `FAILURE: ${step.name}`,
        });
      } catch {
        // Screenshot itself failed — not fatal
      }

      return {
        ...step,
        status: 'failed',
        screenshotPath,
        durationMs,
        consoleErrors,
        networkFailures,
        error: errorMessage,
      };
    }
  }

  private async assessStepSuccess(
    step: JourneyStep,
    currentUrl: string,
    consoleErrors: string[],
    networkFailures: NetworkFailure[]
  ): Promise<{ passed: boolean; assessment: string; issue?: string }> {
    const hasNetworkFailures = networkFailures.length > 0;
    const hasCriticalErrors = consoleErrors.some(
      (e) => e.toLowerCase().includes('error') || e.toLowerCase().includes('failed')
    );

    let urlMatch = true;
    if (step.expectedUrl) {
      urlMatch = currentUrl.includes(step.expectedUrl);
    }

    const context = `
Step: ${step.name}
Expected URL: ${step.expectedUrl ?? 'Not specified'}
Actual URL: ${currentUrl}
Console errors: ${consoleErrors.length > 0 ? consoleErrors.slice(0, 3).join('\n') : 'None'}
Network failures: ${hasNetworkFailures ? JSON.stringify(networkFailures.slice(0, 3)) : 'None'}
URL matches expectation: ${urlMatch}
    `.trim();

    const response = await this.llm.chat([
      { role: 'system', content: RUNNER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Assess if this step passed or failed based on the evidence:\n\n${context}\n\nRespond with JSON only: {"passed": boolean, "assessment": "one sentence observation", "issue": "description if failed or null"}`,
      },
    ]);

    try {
      const result = JSON.parse(
        response.content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      ) as { passed: boolean; assessment: string; issue?: string };
      return result;
    } catch {
      // Fallback to rule-based assessment
      const passed = urlMatch && !hasCriticalErrors && !hasNetworkFailures;
      return {
        passed,
        assessment: passed
          ? `Step completed. URL: ${currentUrl}`
          : `Step may have issues. URL: ${currentUrl}. Errors: ${consoleErrors.length}. Network failures: ${networkFailures.length}`,
        issue: passed ? undefined : 'Could not verify step success',
      };
    }
  }

  private log(phase: AgentReasoningEntry['phase'], content: string): void {
    this.reasoningLog.push({
      timestamp: new Date().toISOString(),
      phase,
      content,
    });
  }
}
