/**
 * Database schema — type definitions for the lowdb JSON store.
 * lowdb is a pure-JS zero-native JSON file database, perfect for hackathon demos.
 * To migrate to PostgreSQL, replace the repository implementations only.
 */

import type {
  Application,
  Journey,
  FlowNode,
  Screenshot,
  QualityReport,
} from '@flowpilot/shared';

export interface DbSchema {
  applications: Application[];
  journeys: Journey[];
  flowNodes: FlowNodeRecord[];
  screenshots: Screenshot[];
  reports: QualityReport[];
}

export interface FlowNodeRecord extends FlowNode {
  discoveredAt: string;
}
