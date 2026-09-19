/**
 * Typed API client for the FlowPilot server.
 * All server communication goes through these functions.
 */

import type { Application, Journey, QualityReport } from '@flowpilot/shared';

const BASE = '/api';

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error((error as { error?: string }).error ?? response.statusText);
  }
  return response.json() as Promise<T>;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export const api = {
  applications: {
    list: () => fetchJSON<Application[]>('/applications'),
    get: (id: string) => fetchJSON<Application>(`/applications/${id}`),
    create: (data: Pick<Application, 'name' | 'baseUrl'> & Partial<Application>) =>
      fetchJSON<Application>('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Application>) =>
      fetchJSON<Application>(`/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  journeys: {
    list: (applicationId?: string) =>
      fetchJSON<Journey[]>(`/journeys${applicationId ? `?applicationId=${applicationId}` : ''}`),
    get: (id: string) => fetchJSON<Journey>(`/journeys/${id}`),
    run: (applicationId: string, userGoal: string, headless = true) =>
      fetchJSON<{ journeyId: string; message: string }>('/journeys/run', {
        method: 'POST',
        body: JSON.stringify({ applicationId, userGoal, headless }),
      }),
    discover: (applicationId: string) =>
      fetchJSON<{ nodes: unknown[]; discoveredAt: string }>('/journeys/discover', {
        method: 'POST',
        body: JSON.stringify({ applicationId }),
      }),
    getReport: (journeyId: string) =>
      fetchJSON<QualityReport>(`/journeys/${journeyId}/report`),
  },

  reports: {
    list: (applicationId?: string) =>
      fetchJSON<QualityReport[]>(`/reports${applicationId ? `?applicationId=${applicationId}` : ''}`),
    get: (journeyId: string) => fetchJSON<QualityReport>(`/reports/${journeyId}`),
  },
};
