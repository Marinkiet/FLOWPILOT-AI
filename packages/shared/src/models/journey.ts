/**
 * Core journey and flow data models.
 * These represent the graph of possible user paths through an application.
 */

import type { NetworkFailure } from './evidence.js';
import type { FrictionPoint, QualityFinding } from './quality.js';

export type JourneyStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'aborted';

export type StepStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'skipped';

export type ActionType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'select'
  | 'scroll'
  | 'wait'
  | 'assert'
  | 'screenshot'
  | 'custom';

/** A single action the agent can perform in the browser */
export interface FlowAction {
  type: ActionType;
  /** CSS selector, URL, or description depending on action type */
  target?: string;
  value?: string;
  description: string;
  /** Expected outcome after this action */
  expectedOutcome?: string;
}

/** A single step in a user journey */
export interface JourneyStep {
  id: string;
  name: string;
  description: string;
  actions: FlowAction[];
  status: StepStatus;
  /** Screenshot taken at the end of this step */
  screenshotPath?: string;
  /** Actual URL when step completed */
  actualUrl?: string;
  /** Expected URL pattern or exact URL */
  expectedUrl?: string;
  /** Time taken in milliseconds */
  durationMs?: number;
  error?: string;
  /** Console errors captured during this step */
  consoleErrors: string[];
  /** Network failures captured during this step */
  networkFailures: NetworkFailure[];
  /** Agent's observation note for this step */
  agentObservation?: string;
}

/** A complete user journey definition */
export interface Journey {
  id: string;
  applicationId: string;
  name: string;
  description: string;
  /** The user goal expressed in plain language */
  userGoal: string;
  steps: JourneyStep[];
  status: JourneyStatus;
  startedAt?: string;
  completedAt?: string;
  /** Overall success — all critical steps passed */
  success?: boolean;
  /** Agent's summary of the run */
  agentSummary?: string;
  /** Detected friction points */
  frictionPoints: FrictionPoint[];
  /** Quality findings */
  findings: QualityFinding[];
}

/** A node in the application flow graph */
export interface FlowNode {
  id: string;
  applicationId: string;
  /** Page/route name */
  name: string;
  /** URL path, e.g. /checkout */
  path: string;
  /** Page title if discovered */
  title?: string;
  /** Key UI elements discovered on this page */
  elements: UIElement[];
  /** Outbound links/actions from this node */
  edges: FlowEdge[];
}

/** A directed edge in the flow graph */
export interface FlowEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  /** The action that triggers this transition */
  trigger: string;
  /** e.g. 'navigation', 'form-submit', 'click', 'api-call' */
  transitionType: string;
}

/** A discovered UI element */
export interface UIElement {
  selector: string;
  type: 'button' | 'link' | 'input' | 'form' | 'nav' | 'heading' | 'other';
  text?: string;
  ariaLabel?: string;
  isInteractive: boolean;
}
