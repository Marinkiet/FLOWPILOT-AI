/**
 * Repository layer — all data access goes through these async functions.
 * Backed by lowdb (JSON file). Replace implementations here to use PostgreSQL.
 */

import type {
  Application,
  Journey,
  FlowNode,
  Screenshot,
  QualityReport,
} from '@flowpilot/shared';
import { getDb, write } from './connection.js';
import type { FlowNodeRecord } from './schema.js';

// ─── Applications ─────────────────────────────────────────────────────────────

export async function listApplications(): Promise<Application[]> {
  const db = await getDb();
  return [...db.data.applications].reverse();
}

export async function getApplication(id: string): Promise<Application | null> {
  const db = await getDb();
  return db.data.applications.find((a) => a.id === id) ?? null;
}

export async function upsertApplication(app: Application): Promise<void> {
  const db = await getDb();
  const index = db.data.applications.findIndex((a) => a.id === app.id);
  if (index >= 0) {
    db.data.applications[index] = app;
  } else {
    db.data.applications.push(app);
  }
  await write();
}

// ─── Journeys ─────────────────────────────────────────────────────────────────

export async function listJourneys(applicationId?: string): Promise<Journey[]> {
  const db = await getDb();
  const all = applicationId
    ? db.data.journeys.filter((j) => j.applicationId === applicationId)
    : db.data.journeys;
  return [...all].reverse();
}

export async function getJourney(id: string): Promise<Journey | null> {
  const db = await getDb();
  return db.data.journeys.find((j) => j.id === id) ?? null;
}

export async function upsertJourney(journey: Journey): Promise<void> {
  const db = await getDb();
  const index = db.data.journeys.findIndex((j) => j.id === journey.id);
  if (index >= 0) {
    db.data.journeys[index] = journey;
  } else {
    db.data.journeys.push(journey);
  }
  await write();
}

// ─── Flow Nodes ───────────────────────────────────────────────────────────────

export async function listFlowNodes(applicationId: string): Promise<FlowNode[]> {
  const db = await getDb();
  return db.data.flowNodes.filter((n) => n.applicationId === applicationId);
}

export async function upsertFlowNode(node: FlowNode, discoveredAt: string): Promise<void> {
  const db = await getDb();
  const record: FlowNodeRecord = { ...node, discoveredAt };
  const index = db.data.flowNodes.findIndex((n) => n.id === node.id);
  if (index >= 0) {
    db.data.flowNodes[index] = record;
  } else {
    db.data.flowNodes.push(record);
  }
  await write();
}

// ─── Screenshots ──────────────────────────────────────────────────────────────

export async function saveScreenshot(screenshot: Screenshot): Promise<void> {
  const db = await getDb();
  db.data.screenshots.push(screenshot);
  await write();
}

export async function listScreenshots(journeyId: string): Promise<Screenshot[]> {
  const db = await getDb();
  return db.data.screenshots.filter((s) => s.journeyId === journeyId);
}

// ─── Quality Reports ──────────────────────────────────────────────────────────

export async function saveReport(report: QualityReport): Promise<void> {
  const db = await getDb();
  const index = db.data.reports.findIndex((r) => r.id === report.id);
  if (index >= 0) {
    db.data.reports[index] = report;
  } else {
    db.data.reports.push(report);
  }
  await write();
}

export async function getReport(journeyId: string): Promise<QualityReport | null> {
  const db = await getDb();
  const matches = db.data.reports
    .filter((r) => r.journeyId === journeyId)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  return matches[0] ?? null;
}

export async function listReports(applicationId?: string): Promise<QualityReport[]> {
  const db = await getDb();
  const all = applicationId
    ? db.data.reports.filter((r) => r.applicationId === applicationId)
    : db.data.reports;
  return [...all].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}
