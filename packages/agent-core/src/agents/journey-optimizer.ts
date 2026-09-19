/**
 * Journey Optimizer Agent
 *
 * Phase: REPORT (enhancement)
 * Responsibility: Analyze observed user behavior to identify inefficient paths
 * and suggest improvements to the overall user journey.
 */

import type {
  JourneyOptimizer as IJourneyOptimizer,
  QualityReport,
  Recommendation,
  LLMProvider,
} from '@flowpilot/shared';

const OPTIMIZER_SYSTEM_PROMPT = `You are the Journey Optimizer component of FlowPilot AI.
Your job is to identify inefficient user paths and recommend concrete improvements
that reduce friction, improve conversion, and make the user experience more intuitive.

Focus on:
- Reducing the number of steps needed to complete a goal
- Removing unnecessary form fields
- Improving error messages
- Adding helpful defaults and smart pre-fill
- Improving page load performance
- Reducing cognitive load

Be specific and prioritize by business impact.`;

export class JourneyOptimizerAgent implements IJourneyOptimizer {
  constructor(private readonly llm: LLMProvider) {}

  async optimize(report: QualityReport): Promise<Recommendation[]> {
    const prompt = `
Analyze this quality report and suggest journey optimizations:

Quality Score: ${report.score}/100
Goal completion rate: ${report.goalCompletionRate.toFixed(0)}%

Current recommendations:
${report.recommendations.map((r) => `[${r.priority}] ${r.title}`).join('\n')}

Friction points:
${report.frictionPoints.map((f) => `${f.type}: ${f.description}`).join('\n')}

Suggest 3-5 journey optimization recommendations focused on improving the user experience
and increasing the likelihood a real user completes their goal.

Return JSON array with: {"priority": "high|medium|low", "title": "...", "description": "..."}`;

    const response = await this.llm.chat([
      { role: 'system', content: OPTIMIZER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    try {
      const parsed = JSON.parse(
        response.content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      ) as Recommendation[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
