/**
 * Agent interfaces — the contracts all agent components must implement.
 * Keeping these in shared/ ensures the dashboard, server, and agent packages
 * all use the same vocabulary.
 */

import type { Journey, JourneyStep, FlowNode } from './journey.js';
import type { QualityReport, AgentReasoningEntry } from './quality.js';
import type { Screenshot, NetworkFailure } from './evidence.js';

// ─── LLM Provider Abstraction ────────────────────────────────────────────────

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  /** Token usage if available */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** The raw provider-specific response */
  raw?: unknown;
}

export interface LLMProvider {
  name: string;
  /** Send a chat-style prompt and receive a text response */
  chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
  /** Stream tokens — optional, used for live dashboard updates */
  stream?(messages: LLMMessage[], options?: LLMOptions): AsyncIterable<string>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// ─── Browser Automation Abstraction ──────────────────────────────────────────

export interface BrowserContext {
  id: string;
  /** Navigate to a URL */
  goto(url: string): Promise<NavigationResult>;
  /** Click a selector */
  click(selector: string): Promise<void>;
  /** Fill an input */
  fill(selector: string, value: string): Promise<void>;
  /** Select an option */
  select(selector: string, value: string): Promise<void>;
  /** Take a screenshot, returns path */
  screenshot(label: string): Promise<string>;
  /** Get current URL */
  currentUrl(): Promise<string>;
  /** Get page title */
  pageTitle(): Promise<string>;
  /** Get all console messages since last clear */
  drainConsoleMessages(): Promise<ConsoleCapture[]>;
  /** Get all network failures since last clear */
  drainNetworkFailures(): Promise<NetworkFailure[]>;
  /** Get outer HTML of a selector */
  getHTML(selector: string): Promise<string>;
  /** Check if a selector exists */
  exists(selector: string): Promise<boolean>;
  /** Wait for selector */
  waitForSelector(selector: string, timeoutMs?: number): Promise<boolean>;
  /** Evaluate arbitrary JS in page context */
  evaluate<T>(fn: string): Promise<T>;
  /** Close the browser context */
  close(): Promise<void>;
}

export interface NavigationResult {
  url: string;
  status?: number;
  loadTimeMs: number;
}

export interface ConsoleCapture {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
  timestamp: string;
}

// ─── Agent Component Interfaces ───────────────────────────────────────────────

/** Flow Architect: discovers routes and builds the journey graph */
export interface FlowArchitect {
  discover(baseUrl: string, browser: BrowserContext): Promise<FlowNode[]>;
  buildJourneyGraph(nodes: FlowNode[]): Promise<JourneyGraph>;
  suggestJourneys(graph: JourneyGraph, userGoal: string): Promise<JourneySuggestion[]>;
}

export interface JourneyGraph {
  applicationId: string;
  nodes: FlowNode[];
  /** ISO timestamp of last discovery */
  discoveredAt: string;
}

export interface JourneySuggestion {
  name: string;
  description: string;
  userGoal: string;
  /** Ordered list of node IDs */
  path: string[];
  /** Agent's confidence 0-1 */
  confidence: number;
}

/** Flow Runner: executes a journey in the browser */
export interface FlowRunner {
  run(
    journey: Journey,
    browser: BrowserContext,
    onStepComplete?: (step: JourneyStep) => void
  ): Promise<JourneyRunResult>;
}

export interface JourneyRunResult {
  journey: Journey;
  screenshots: Screenshot[];
  reasoningLog: AgentReasoningEntry[];
  success: boolean;
}

/** Flow Analyst: compares expected vs actual, detects friction */
export interface FlowAnalyst {
  analyze(result: JourneyRunResult): Promise<AnalysisResult>;
}

export interface AnalysisResult {
  deviations: Deviation[];
  frictionPoints: import('./quality.js').FrictionPoint[];
  findings: import('./quality.js').QualityFinding[];
}

export interface Deviation {
  stepId: string;
  expected: string;
  actual: string;
  severity: import('./quality.js').FindingSeverity;
}

/** Quality Investigator: produces the final report */
export interface QualityInvestigator {
  investigate(
    result: JourneyRunResult,
    analysis: AnalysisResult
  ): Promise<QualityReport>;
}

/** Journey Optimizer: recommends improvements */
export interface JourneyOptimizer {
  optimize(report: QualityReport): Promise<import('./quality.js').Recommendation[]>;
}

// ─── Agent Orchestrator ───────────────────────────────────────────────────────

export interface AgentOrchestrator {
  /** Run the full OBSERVE → REASON → ACT → INVESTIGATE → REPORT loop */
  runJourney(
    applicationId: string,
    userGoal: string,
    options: AgentRunOptions & { browser: BrowserContext }
  ): Promise<QualityReport>;
  /** Emit real-time events for live dashboard streaming */
  on(event: AgentEvent, handler: (data: unknown) => void): void;
  off(event: AgentEvent, handler: (data: unknown) => void): void;
}

export type AgentEvent =
  | 'step:start'
  | 'step:complete'
  | 'step:failed'
  | 'screenshot:taken'
  | 'observation'
  | 'reasoning'
  | 'finding:detected'
  | 'report:ready';

export interface AgentRunOptions {
  headless?: boolean;
  maxSteps?: number;
  screenshotDir?: string;
  /** Override the LLM provider for this run */
  llmProvider?: LLMProvider;
  /** Pass existing flow nodes to skip discovery */
  existingGraph?: JourneyGraph;
  /** Browser context — required at runtime, injected by the server */
  browser?: BrowserContext;
}
