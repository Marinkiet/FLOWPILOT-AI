import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { applicationsRouter } from './routes/applications.js';
import { journeysRouter } from './routes/journeys.js';
import { reportsRouter } from './routes/reports.js';
import { seedDemoData } from './seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env['PORT'] ?? 3001;

const app = express();

app.use(cors());
app.use(express.json());

// Serve screenshots as static files
app.use('/screenshots', express.static(join(process.cwd(), 'screenshots')));

// API routes
app.use('/api/applications', applicationsRouter);
app.use('/api/journeys', journeysRouter);
app.use('/api/reports', reportsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0', timestamp: new Date().toISOString() });
});

// Seed demo data on startup
seedDemoData().catch(console.error);

app.listen(PORT, () => {
  console.log(`\n✦ FlowPilot API running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:5173`);
  console.log(`🛒 Demo Shop: http://localhost:5174\n`);
});
