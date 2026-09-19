import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.ts';
import { SeverityBadge } from '../components/SeverityBadge.tsx';
import type { Journey } from '@flowpilot/shared';

const stepStatusColors = {
  pending: 'bg-gray-100 text-gray-500',
  running: 'bg-blue-100 text-blue-600 animate-pulse',
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
  skipped: 'bg-gray-100 text-gray-400',
};

export function JourneyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Poll while running
    const load = () => {
      api.journeys
        .get(id)
        .then((j) => {
          setJourney(j);
          setLoading(false);
          if (j.status === 'running' || j.status === 'pending') {
            setTimeout(load, 1500); // Poll every 1.5s
          }
        })
        .catch(console.error);
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Loading journey...</div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="p-8 text-center text-gray-500">Journey not found.</div>
    );
  }

  const isLive = journey.status === 'running' || journey.status === 'pending';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${
                journey.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : journey.status === 'failed'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {isLive ? '● Live' : journey.status}
            </span>
            {isLive && (
              <span className="text-xs text-gray-400 animate-pulse">Agent is running…</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{journey.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Goal: {journey.userGoal}</p>
        </div>

        {(journey.status === 'completed' || journey.status === 'failed') && (
          <Link
            to={`/reports/${journey.id}`}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
          >
            View Report →
          </Link>
        )}
      </div>

      {/* Agent Summary */}
      {journey.agentSummary && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-indigo-400 uppercase mb-1">Agent Summary</p>
          <p className="text-indigo-800 text-sm">{journey.agentSummary}</p>
        </div>
      )}

      {/* Steps */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">
          Steps ({journey.steps.filter((s) => s.status === 'passed').length}/
          {journey.steps.length} passed)
        </h2>
        {journey.steps.length === 0 ? (
          <p className="text-gray-400 text-sm">
            {isLive ? 'Agent is planning steps...' : 'No steps recorded.'}
          </p>
        ) : (
          <div className="space-y-3">
            {journey.steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${stepStatusColors[step.status]}`}
                  >
                    {step.status === 'passed' ? '✓' : step.status === 'failed' ? '✗' : index + 1}
                  </span>
                  {index < journey.steps.length - 1 && (
                    <div className="w-0.5 h-4 bg-gray-200 my-1" />
                  )}
                </div>

                <div className="flex-1 pb-2">
                  <p className="text-sm font-medium text-gray-800">{step.name}</p>
                  {step.agentObservation && (
                    <p className="text-xs text-gray-500 mt-0.5">{step.agentObservation}</p>
                  )}
                  {step.error && (
                    <p className="text-xs text-red-500 mt-0.5">Error: {step.error}</p>
                  )}
                  {step.durationMs !== undefined && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(step.durationMs / 1000).toFixed(1)}s
                      {step.actualUrl && ` — ${step.actualUrl}`}
                    </p>
                  )}
                  {step.consoleErrors.length > 0 && (
                    <p className="text-xs text-orange-500 mt-0.5">
                      {step.consoleErrors.length} console error(s)
                    </p>
                  )}
                </div>

                {step.screenshotPath && (
                  <a
                    href={`/screenshots/${step.screenshotPath.split('/').pop()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <img
                      src={`/screenshots/${step.screenshotPath.split('/').pop()}`}
                      alt={`Screenshot: ${step.name}`}
                      className="w-20 h-14 object-cover rounded border border-gray-200 hover:border-indigo-400"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Findings */}
      {journey.findings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            Findings ({journey.findings.length})
          </h2>
          <div className="space-y-3">
            {journey.findings.map((finding) => (
              <div key={finding.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">{finding.title}</p>
                  <SeverityBadge severity={finding.severity} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{finding.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
