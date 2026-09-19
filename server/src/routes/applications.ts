import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import {
  listApplications,
  getApplication,
  upsertApplication,
} from '../db/repositories.js';
import type { Application } from '@flowpilot/shared';

export const applicationsRouter = Router();

applicationsRouter.get('/', async (_req, res) => {
  res.json(await listApplications());
});

applicationsRouter.get('/:id', async (req, res) => {
  const app = await getApplication(req.params['id'] ?? '');
  if (!app) return res.status(404).json({ error: 'Application not found' });
  return res.json(app);
});

applicationsRouter.post('/', async (req, res) => {
  const body = req.body as Partial<Application>;
  if (!body.name || !body.baseUrl) {
    return res.status(400).json({ error: 'name and baseUrl are required' });
  }

  const now = new Date().toISOString();
  const app: Application = {
    id: uuid(),
    name: body.name,
    description: body.description,
    baseUrl: body.baseUrl,
    type: body.type ?? 'spa',
    authConfig: body.authConfig,
    tags: body.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };

  await upsertApplication(app);
  return res.status(201).json(app);
});

applicationsRouter.patch('/:id', async (req, res) => {
  const existing = await getApplication(req.params['id'] ?? '');
  if (!existing) return res.status(404).json({ error: 'Application not found' });

  const body = req.body as Partial<Application>;
  const updated: Application = {
    ...existing,
    ...body,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  await upsertApplication(updated);
  return res.json(updated);
});
