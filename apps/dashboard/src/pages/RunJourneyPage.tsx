import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.ts';
import type { Application } from '@flowpilot/shared';

const PRESET_GOALS = [
  'Purchase a laptop from the home page through to order confirmation',
  'Search for headphones and add them to the cart',
  'Register a new account and complete a purchase',
  'Log in and view order history',
  'Find the cheapest product and complete checkout',
];

export function RunJourneyPage() {
  const [searchParams] = useSearchParams();
  const preselectedAppId = searchParams.get('applicationId');

  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState(preselectedAppId ?? '');
  const [userGoal, setUserGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.applications
      .list()
      .then((apps) => {
        setApplications(apps);
        if (!selectedApp && apps.length > 0 && apps[0]) {
          setSelectedApp(apps[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedApp || !userGoal.trim()) return;

    setRunning(true);
    setError('');

    try {
      const { journeyId } = await api.journeys.run(selectedApp, userGoal.trim());
      navigate(`/journeys/${journeyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start journey');
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Run a Journey</h1>
        <p className="text-gray-500 text-sm mt-1">
          Describe what a user wants to achieve. The agent will plan and execute the path.
        </p>
      </div>

      <form onSubmit={handleRun} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        {/* Application selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Application</label>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-400">
              No applications configured. The Demo Shop should appear after the server starts.
            </p>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => (
                <label
                  key={app.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedApp === app.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="app"
                    value={app.id}
                    checked={selectedApp === app.id}
                    onChange={() => setSelectedApp(app.id)}
                    className="text-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{app.name}</p>
                    <p className="text-xs text-gray-400">{app.baseUrl}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* User goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User Goal
            <span className="text-gray-400 font-normal ml-1">— describe what the user wants to do</span>
          </label>
          <textarea
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            placeholder="e.g. Purchase a laptop from the home page through to order confirmation"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            required
          />
        </div>

        {/* Preset goals */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Or choose a preset:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setUserGoal(goal)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  userGoal === goal
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {goal.slice(0, 50)}…
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={running || !selectedApp || !userGoal.trim()}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {running ? (
            <>
              <span className="animate-spin">⟳</span>
              Starting Agent...
            </>
          ) : (
            <>▷ Run Journey</>
          )}
        </button>
      </form>

      <div className="mt-6 bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">What the agent will do:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
          <li>Discover routes and build a flow graph</li>
          <li>Plan a path to accomplish your goal</li>
          <li>Execute each step in a real browser</li>
          <li>Capture screenshots and evidence</li>
          <li>Detect failures, friction, and deviations</li>
          <li>Generate an evidence-backed quality report</li>
        </ol>
      </div>
    </div>
  );
}
