/**
 * Static Route Analyzer
 *
 * Analyzes a Vite/React SPA's route configuration from the filesystem.
 * This lets FlowPilot understand routes without needing to crawl a live server.
 *
 * Current implementation: reads a routes manifest if present,
 * or scans a pages directory for common patterns.
 */

import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';

export interface StaticRoute {
  path: string;
  component: string;
  name: string;
}

/**
 * Attempt to discover routes from a Vite React app at the given root.
 * Returns an empty array if no routes can be determined.
 */
export async function discoverStaticRoutes(appRoot: string): Promise<StaticRoute[]> {
  const routes: StaticRoute[] = [];

  // Strategy 1: Look for a routes.ts / routes.tsx file
  try {
    const routesFile = await findRoutesFile(appRoot);
    if (routesFile) {
      const content = await readFile(routesFile, 'utf-8');
      const extracted = extractRoutesFromSource(content);
      routes.push(...extracted);
    }
  } catch {
    // Fall through to next strategy
  }

  // Strategy 2: Scan pages directory
  if (routes.length === 0) {
    try {
      const pagesDir = join(appRoot, 'src', 'pages');
      const pageRoutes = await scanPagesDirectory(pagesDir);
      routes.push(...pageRoutes);
    } catch {
      // Pages directory not found — that's fine
    }
  }

  return routes;
}

async function findRoutesFile(root: string): Promise<string | null> {
  const candidates = [
    join(root, 'src', 'routes.tsx'),
    join(root, 'src', 'routes.ts'),
    join(root, 'src', 'router.tsx'),
    join(root, 'src', 'router.ts'),
    join(root, 'src', 'App.tsx'),
  ];

  for (const candidate of candidates) {
    try {
      await readFile(candidate, 'utf-8');
      return candidate;
    } catch {
      // Not found, try next
    }
  }
  return null;
}

function extractRoutesFromSource(source: string): StaticRoute[] {
  const routes: StaticRoute[] = [];
  // Match path="..." or path='...' in JSX Route elements
  const pathRegex = /path=["']([^"']+)["']/g;
  let match: RegExpExecArray | null;

  while ((match = pathRegex.exec(source)) !== null) {
    const path = match[1];
    if (path && !path.includes('*')) {
      routes.push({
        path,
        component: 'unknown',
        name: pathToName(path),
      });
    }
  }

  return routes;
}

async function scanPagesDirectory(dir: string): Promise<StaticRoute[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const routes: StaticRoute[] = [];

  for (const entry of entries) {
    if (entry.isFile() && ['.tsx', '.ts', '.jsx', '.js'].includes(extname(entry.name))) {
      const baseName = entry.name.replace(/\.(tsx?|jsx?)$/, '');
      const path = baseName === 'index' ? '/' : `/${baseName.toLowerCase()}`;
      routes.push({
        path,
        component: entry.name,
        name: pathToName(path),
      });
    }
  }

  return routes;
}

function pathToName(path: string): string {
  if (path === '/') return 'Home';
  return path
    .replace(/^\//, '')
    .split('/')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}
