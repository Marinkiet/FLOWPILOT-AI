import { v4 as uuid } from 'uuid';
import { listApplications, upsertApplication } from './db/repositories.js';
import type { Application } from '@flowpilot/shared';

export async function seedDemoData(): Promise<void> {
  const existing = await listApplications();
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  const demoApp: Application = {
    id: uuid(),
    name: 'Demo Shop',
    description: 'Sample e-commerce app with intentional quality issues for FlowPilot to discover.',
    baseUrl: 'http://localhost:5174',
    type: 'spa',
    authConfig: {
      loginUrl: 'http://localhost:5174/login',
      usernameSelector: '[name="email"]',
      passwordSelector: '[name="password"]',
      submitSelector: '[type="submit"]',
      username: 'demo@flowpilot.ai',
      password: 'demo1234',
      successUrl: '/products',
    },
    tags: ['demo', 'e-commerce'],
    createdAt: now,
    updatedAt: now,
  };

  await upsertApplication(demoApp);
  console.log('[Seed] Demo application registered:', demoApp.name);
}
