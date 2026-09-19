import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.ts';
import type { Journey } from '@flowpilot/shared';

const statusColors: Record<Journey['status'], string> = {
  pending: 'bg-gray-100 text-gray-600',
  running: 'bg-blue-100 text-blue-600 animate-pulse',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
  aborted: 'bg-yellow-100 text-yellow-700',
};

export function JourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.journeys
      .list()
      .then(setJourneys)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Journeys</h1>
          <p className="text-gray-500 text-sm mt-1">All agent-executed user journeys.</p>
        </div>
        <Link
          to="/run"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          ▷ Run New Journey
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : journeys.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No journeys yet.</p>
          <Link to="/run" className="text-indigo-600 hover:underline text-sm mt-2 block">
            Run your first journey →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {journeys.map((journey) => (
            <Link
              key={journey.id}
              to={`/journeys/${journey.id}`}
              className="block bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="font-semibold text-gray-800 truncate">{journey.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">
                    Goal: {journey.userGoal}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${statusColors[journey.status]}`}>
                  {journey.status}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                <span>{journey.steps.length} steps</span>
                <span>{journey.findings.length} findings</span>
                {journey.startedAt && (
                  <span>{new Date(journey.startedAt).toLocaleString()}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
