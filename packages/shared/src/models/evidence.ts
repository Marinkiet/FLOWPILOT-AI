/**
 * Evidence models — screenshots, errors, network data captured during runs.
 */

export interface Screenshot {
  id: string;
  journeyId: string;
  stepId: string;
  /** Relative path from project root */
  path: string;
  /** Absolute URL at time of screenshot */
  url: string;
  takenAt: string;
  /** Human-readable label */
  label: string;
  /** Width x Height */
  dimensions?: { width: number; height: number };
}

export interface ConsoleMessage {
  id: string;
  journeyId: string;
  stepId: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
  url?: string;
  lineNumber?: number;
  timestamp: string;
}

export interface NetworkFailure {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  /** 'failed', 'timeout', 'aborted' */
  failureReason: string;
  timestamp: string;
  durationMs?: number;
}

export interface NetworkRequest {
  id: string;
  journeyId: string;
  stepId: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  durationMs: number;
  timestamp: string;
  isFailure: boolean;
  /** Response size in bytes */
  responseSize?: number;
}
