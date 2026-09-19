/**
 * Quality Investigator Agent
 *
 * Phase: INVESTIGATE
 * Responsibility: Correlate evidence (screenshots, errors, network failures, logs)
 * to produce root-cause hypotheses. Clearly separates confirmed facts from inference.
 */

import type {
  QualityInvestigator as IQualityInvestigator,
  JourneyRunResult,
  LLMProvider,
  QualityReport,
} from '@flowpilot/shared';
import type { AnalysisResult } from '@flowpilot/shared';
import type { Recommendation } from '@flowpilot/shared';
import { generateId } from '../utils/id.js';

const INVESTIGATOR_SYSTEM_PROMPT = `You are the Quality Investigator component of FlowPilot AI.
Your job is to produce a comprehensive quality report.
You must:
1. Clearly separate CONFIRMED evidence from INFERRED hypotheses
2. Correlate screenshots, console errors, and network failures
3. Score the quality 0-100 based on the evidence
4. Produce actionable recommendations prioritized by impact

Be honest about uncertainty. "INFERRED" means you believe it but cannot confirm it.
"CONFIRMED" means you have direct evidence.`;

export class QualityInvestigatorAgent implements IQualityInvestigator {
  constructor(private readonly llm: LLMProvider) {}

  async investigate(
    result: JourneyRunResult,
    analysis: AnalysisResult
  ): Promise<QualityReport> {
    const score = this.calculateScore(result, analysis);
    const recommendations = await this.generateRecommendations(result, analysis);
    const summary = await this.generateSummary(result, analysis, score);

    const passedSteps = result.journey.steps.filter((s) => s.status === 'passed').length;
    const failedSteps = result.journey.steps.filter((s) => s.status === 'failed').length;
    const totalSteps = result.journey.steps.length;
    const goalCompletionRate = totalSteps > 0 ? (passedSteps / totalSteps) * 100 : 0;

    return {
      id: generateId('report'),
      journeyId: result.journey.id,
      applicationId: result.journey.applicationId,
      generatedAt: new Date().toISOString(),
      score,
      summary,
      findings: analysis.findings,
      frictionPoints: analysis.frictionPoints,
      passedSteps,
      failedSteps,
      totalSteps,
      goalCompletionRate,
      recommendations,
      agentReasoningLog: result.reasoningLog,
    };
  }

  private calculateScore(result: JourneyRunResult, analysis: AnalysisResult): number {
    let score = 100;

    // Deduct for failed steps
    const failedSteps = result.journey.steps.filter((s) => s.status === 'failed').length;
    const totalSteps = result.journey.steps.length;
    if (totalSteps > 0) {
      score -= (failedSteps / totalSteps) * 40;
    }

    // Deduct for critical findings
    const criticalFindings = analysis.findings.filter((f) => f.severity === 'critical').length;
    const highFindings = analysis.findings.filter((f) => f.severity === 'high').length;
    const mediumFindings = analysis.findings.filter((f) => f.severity === 'medium').length;

    score -= criticalFindings * 15;
    score -= highFindings * 8;
    score -= mediumFindings * 3;

    // Deduct for friction
    const highFriction = analysis.frictionPoints.filter((f) => f.severity === 'high').length;
    const mediumFriction = analysis.frictionPoints.filter((f) => f.severity === 'medium').length;
    score -= highFriction * 5;
    score -= mediumFriction * 2;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private async generateRecommendations(
    result: JourneyRunResult,
    analysis: AnalysisResult
  ): Promise<Recommendation[]> {
    const prompt = `
Based on these quality findings and friction points, generate prioritized recommendations:

Findings:
${analysis.findings.map((f) => `[${f.severity}] ${f.title}: ${f.description}`).join('\n')}

Friction points:
${analysis.frictionPoints.map((f) => `[${f.severity}] ${f.type}: ${f.description}`).join('\n')}

Journey success: ${result.success}

Return JSON array of recommendations, each with:
{
  "priority": "high|medium|low",
  "title": "short actionable title",
  "description": "specific, actionable recommendation",
  "affectedStep": "step name if applicable"
}`;

    const response = await this.llm.chat([
      { role: 'system', content: INVESTIGATOR_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    try {
      const parsed = JSON.parse(
        response.content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      ) as Recommendation[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Fallback recommendations from findings
      return analysis.findings
        .filter((f) => f.recommendation)
        .map((f) => ({
          priority: f.severity === 'critical' || f.severity === 'high' ? 'high' as const : 'medium' as const,
          title: f.title,
          description: f.recommendation ?? '',
        }));
    }
  }

  private async generateSummary(
    result: JourneyRunResult,
    analysis: AnalysisResult,
    score: number
  ): Promise<string> {
    const prompt = `
Write a concise executive summary (2-4 sentences) for this quality report:

Journey: "${result.journey.name}"
Goal: "${result.journey.userGoal}"
Quality score: ${score}/100
Steps passed: ${result.journey.steps.filter((s) => s.status === 'passed').length}/${result.journey.steps.length}
Critical findings: ${analysis.findings.filter((f) => f.severity === 'critical').length}
High findings: ${analysis.findings.filter((f) => f.severity === 'high').length}
Journey completed successfully: ${result.success}

Top finding: ${analysis.findings[0]?.title ?? 'None'}`;

    const response = await this.llm.chat([
      { role: 'system', content: INVESTIGATOR_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    // If the LLM returns JSON (e.g. mock provider), extract the summary field
    const text = response.content.trim();
    try {
      const parsed = JSON.parse(
        text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      ) as { summary?: string };
      if (parsed.summary) return parsed.summary;
    } catch {
      // Not JSON — use as-is
    }
    return text;
  }
}
