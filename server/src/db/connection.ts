/**
 * lowdb connection — JSON file-backed database.
 * Zero native dependencies, works on any Node version.
 */

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'path';
import type { DbSchema } from './schema.js';

const DEFAULT_DATA: DbSchema = {
  applications: [],
  journeys: [],
  flowNodes: [],
  screenshots: [],
  reports: [],
};

let _db: Low<DbSchema> | null = null;

export async function getDb(): Promise<Low<DbSchema>> {
  if (_db) return _db;

  const dbPath = process.env['DATABASE_PATH'] ?? join(process.cwd(), 'flowpilot.json');
  const adapter = new JSONFile<DbSchema>(dbPath);
  _db = new Low<DbSchema>(adapter, DEFAULT_DATA);
  await _db.read();

  // Ensure all collections exist (handles first run)
  _db.data ??= DEFAULT_DATA;
  _db.data.applications ??= [];
  _db.data.journeys ??= [];
  _db.data.flowNodes ??= [];
  _db.data.screenshots ??= [];
  _db.data.reports ??= [];

  return _db;
}

export async function write(): Promise<void> {
  const db = await getDb();
  await db.write();
}
