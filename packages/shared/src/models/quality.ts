/**
 * Quality findings, friction detection, and report models.
 */

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingCategory =
  | 'broken-flow'
  | 'missing-validation'
  | 'confusing-navigation'
  | 'error-handling'
  | 'performance'
  | 'accessibility'
  | 'security'
  | 'friction'
  | 'duplicate-submission'
  | 'dead-end'
  | 'other';

export type FrictionType =
  | 'repeated-click'
  | 'backtrack'
  | 'unexpected-redirect'
  | 'long-wait'
  | 'abandoned-flow'
  | 'error-loop'
  | 'missing-feedback';

/** A detected quality issue */
export interface QualityFinding {
  id: string;
  journeyId: string;
  stepId?: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  category: FindingCategory;
  /** Specific evidence that supports this finding */
  evidence: FindingEvidence[];
  /** Agent's hypothesis about root cause */
  rootCauseHypothesis?: string;
  /** Suggested improvement */
  recommendation?: string;
  /** Whether this is confirmed fact or agent inference */
  isConfirmed: boolean;
}

export interface FindingEvidence {
  type: 'screenshot' | 'console-error' | 'network-failure' | 'url-change' | 'timing' | 'observation';
  description: string;
  /** Reference ID to the actual artifact */
  referenceId?: string;
  value?: string;
}

/** A friction point detected during journey execution */
export interface FrictionPoint {
  id: string;
  journeyId: string;
  stepId: string;
  type: FrictionType;
  description: string;
  severity: FindingSeverity;
  /** e.g. number of clicks, wait time in ms */
  measuredValue?: number;
  unit?: string;
}

/** The final quality report for a journey run */
export interface QualityReport {
  id: string;
  journeyId: string;
  applicationId: string;
  generatedAt: string;
  /** Overall quality score 0-100 */
  score: number;
  summary: string;
  findings: QualityFinding[];
  frictionPoints: FrictionPoint[];
  /** Journey steps that passed */
  passedSteps: number;
  /** Journey steps that failed */
  failedSteps: number;
  totalSteps: number;
  /** Percentage of user goal completed */
  goalCompletionRate: number;
  recommendations: Recommendation[];
  /** Raw agent reasoning chain */
  agentReasoningLog?: AgentReasoningEntry[];
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedStep?: string;
}

export interface AgentReasoningEntry {
  timestamp: string;
  phase: 'observe' | 'reason' | 'act' | 'investigate' | 'report';
  content: string;
}
