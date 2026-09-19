/**
 * Flow Analyst Agent
 *
 * Phase: REASON (post-run)
 * Responsibility: Compare intended vs actual journey.
 * Detects deviations, friction, dead ends, and failures.
 */

import type {
  FlowAnalyst as IFlowAnalyst,
  JourneyRunResult,
  LLMProvider,
} from '@flowpilot/shared';
import type { AnalysisResult, Deviation } from '@flowpilot/shared';
import type { FrictionPoint, QualityFinding } from '@flowpilot/shared';
import { generateId } from '../utils/id.js';

const ANALYST_SYSTEM_PROMPT = `You are the Flow Analyst component of FlowPilot AI.
You analyze the results of a user journey execution and identify:
1. Deviations from expected behavior
2. Friction points (repeated actions, backtracking, long waits, missing feedback)
3. Quality findings (broken flows, missing validation, confusing navigation)

Be specific and evidence-based. Separate confirmed findings from inferences.
Return structured JSON only.`;

export class FlowAnalystAgent implements IFlowAnalyst {
  constructor(private readonly llm: LLMProvider) {}

  async analyze(result: JourneyRunResult): Promise<AnalysisResult> {
    const deviations = this.detectDeviations(result);
    const frictionPoints = await this.detectFriction(result);
    const findings = await this.detectFindings(result, deviations, frictionPoints);

    return { deviations, frictionPoints, findings };
  }

  private detectDeviations(result: JourneyRunResult): Deviation[] {
    const deviations: Deviation[] = [];

    for (const step of result.journey.steps) {
      // URL deviation
      if (step.expectedUrl && step.actualUrl && !step.actualUrl.includes(step.expectedUrl)) {
        deviations.push({
          stepId: step.id,
          expected: `URL to contain "${step.expectedUrl}"`,
          actual: `URL was "${step.actualUrl}"`,
          severity: 'high',
        });
      }

      // Step failure deviation
      if (step.status === 'failed') {
        deviations.push({
          stepId: step.id,
          expected: `Step "${step.name}" to complete successfully`,
          actual: step.error ?? 'Step failed without a specific error message',
          severity: 'critical',
        });
      }

      // Console error deviation
      if (step.consoleErrors.length > 0) {
        deviations.push({
          stepId: step.id,
          expected: 'No console errors',
          actual: `${step.consoleErrors.length} console error(s): ${step.consoleErrors[0]}`,
          severity: 'medium',
        });
      }

      // Network failure deviation
      if (step.networkFailures.length > 0) {
        deviations.push({
          stepId: step.id,
          expected: 'All network requests to succeed',
          actual: `${step.networkFailures.length} network failure(s): ${step.networkFailures[0]?.url ?? 'unknown'}`,
          severity: 'high',
        });
      }
    }

    return deviations;
  }

  private async detectFriction(result: JourneyRunResult): Promise<FrictionPoint[]> {
    const frictionPoints: FrictionPoint[] = [];

    for (const step of result.journey.steps) {
      // Slow steps (>3s is friction for a UI action)
      if (step.durationMs !== undefined && step.durationMs > 3000) {
        frictionPoints.push({
          id: generateId('friction'),
          journeyId: result.journey.id,
          stepId: step.id,
          type: 'long-wait',
          description: `Step "${step.name}" took ${(step.durationMs / 1000).toFixed(1)}s — users expect < 3s`,
          severity: step.durationMs > 8000 ? 'high' : 'medium',
          measuredValue: step.durationMs,
          unit: 'ms',
        });
      }

      // Missing feedback after action (inferred from observation text)
      if (
        step.agentObservation?.toLowerCase().includes('no') &&
        step.agentObservation?.toLowerCase().includes('feedback')
      ) {
        frictionPoints.push({
          id: generateId('friction'),
          journeyId: result.journey.id,
          stepId: step.id,
          type: 'missing-feedback',
          description: `No visual feedback detected after "${step.name}"`,
          severity: 'medium',
        });
      }
    }

    // Use LLM for pattern-level friction that rule-based can't catch
    const llmFriction = await this.llmDetectFriction(result);
    frictionPoints.push(...llmFriction);

    return frictionPoints;
  }

  private async llmDetectFriction(result: JourneyRunResult): Promise<FrictionPoint[]> {
    const stepSummary = result.journey.steps.map((s) => ({
      name: s.name,
      status: s.status,
      durationMs: s.durationMs,
      observations: s.agentObservation,
      consoleErrors: s.consoleErrors.length,
      networkFailures: s.networkFailures.length,
    }));

    const prompt = `Analyze these journey steps for friction patterns:\n${JSON.stringify(stepSummary, null, 2)}\n\nReturn JSON array of friction points found. Each should have: type, description, severity, stepName.`;

    const response = await this.llm.chat([
      { role: 'system', content: ANALYST_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    try {
      const parsed = JSON.parse(
        response.content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      ) as Array<{ type: FrictionPoint['type']; description: string; severity: FrictionPoint['severity']; stepName?: string }>;

      const stepsMap = new Map(result.journey.steps.map((s) => [s.name, s.id]));

      return (Array.isArray(parsed) ? parsed : []).map((f) => ({
        id: generateId('friction'),
        journeyId: result.journey.id,
        stepId: stepsMap.get(f.stepName ?? '') ?? result.journey.steps[0]?.id ?? '',
        type: f.type,
        description: f.description,
        severity: f.severity,
      }));
    } catch {
      return [];
    }
  }

  private async detectFindings(
    result: JourneyRunResult,
    deviations: Deviation[],
    frictionPoints: FrictionPoint[]
  ): Promise<QualityFinding[]> {
    const prompt = `
Journey: "${result.journey.name}"
Goal: "${result.journey.userGoal}"
Success: ${result.success}

Deviations found:
${JSON.stringify(deviations, null, 2)}

Friction points found:
${JSON.stringify(frictionPoints, null, 2)}

Step observations:
${result.journey.steps.map((s) => `${s.name}: ${s.agentObservation ?? s.status}`).join('\n')}

Identify quality findings. For each finding return:
{
  "title": "short title",
  "description": "detailed description",
  "severity": "critical|high|medium|low|info",
  "category": "broken-flow|missing-validation|confusing-navigation|error-handling|performance|friction|dead-end|other",
  "rootCauseHypothesis": "...",
  "recommendation": "...",
  "isConfirmed": true/false,
  "evidence": [{"type": "...", "description": "..."}]
}

Return as JSON array.`;

    const response = await this.llm.chat([
      { role: 'system', content: ANALYST_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    try {
      const parsed = JSON.parse(
        response.content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      ) as Array<Omit<QualityFinding, 'id' | 'journeyId'>>;

      return (Array.isArray(parsed) ? parsed : []).map((f) => ({
        ...f,
        id: generateId('finding'),
        journeyId: result.journey.id,
      }));
    } catch {
      // Rule-based fallback
      const findings: QualityFinding[] = [];

      if (!result.success) {
        findings.push({
          id: generateId('finding'),
          journeyId: result.journey.id,
          title: 'User journey could not be completed',
          description: `The journey "${result.journey.name}" failed. The user could not complete their goal: "${result.journey.userGoal}"`,
          severity: 'critical',
          category: 'broken-flow',
          evidence: deviations.map((d) => ({
            type: 'observation' as const,
            description: d.actual,
          })),
          isConfirmed: true,
        });
      }

      return findings;
    }
  }
}
