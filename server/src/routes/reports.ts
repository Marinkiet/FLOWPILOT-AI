import { Router } from 'express';
import { listReports, getReport } from '../db/repositories.js';

export const reportsRouter = Router();

reportsRouter.get('/', async (req, res) => {
  const appId = req.query['applicationId'] as string | undefined;
  res.json(await listReports(appId));
});

reportsRouter.get('/:journeyId', async (req, res) => {
  const report = await getReport(req.params['journeyId'] ?? '');
  if (!report) return res.status(404).json({ error: 'Report not found' });
  return res.json(report);
});
