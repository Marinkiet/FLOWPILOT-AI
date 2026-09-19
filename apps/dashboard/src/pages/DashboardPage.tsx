import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.ts';
import { ScoreRing } from '../components/ScoreRing.tsx';
import type { Application, Journey, QualityReport } from '@flowpilot/shared';

export function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.applications.list(),
      api.journeys.list(),
      api.reports.list(),
    ])
      .then(([apps, j, r]) => {
        setApplications(apps);
        setJourneys(j);
        setReports(r);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const recentReports = reports.slice(0, 5);
  const avgScore =
    reports.length > 0
      ? Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length)
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          AI-powered quality engineering. Don't just test your app — walk through it.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Applications" value={applications.length} icon="⬚" color="indigo" />
        <StatCard label="Journeys Run" value={journeys.length} icon="⟳" color="blue" />
        <StatCard
          label="Passed"
          value={journeys.filter((j) => j.success).length}
          icon="✓"
          color="green"
        />
        <StatCard
          label="Avg Score"
          value={`${avgScore}/100`}
          icon="★"
          color={avgScore >= 80 ? 'green' : avgScore >= 60 ? 'yellow' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Applications</h2>
            <Link to="/applications" className="text-indigo-600 text-xs hover:underline">
              View all →
            </Link>
          </div>
          {applications.length === 0 ? (
            <div className="text-gray-400 text-sm py-4 text-center">
              No applications yet.{' '}
              <Link to="/applications" className="text-indigo-600 hover:underline">
                Add one
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {applications.map((app) => (
                <li key={app.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{app.name}</p>
                    <p className="text-xs text-gray-400">{app.baseUrl}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    {app.type}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Recent Reports</h2>
            <Link to="/journeys" className="text-indigo-600 text-xs hover:underline">
              View all →
            </Link>
          </div>
          {recentReports.length === 0 ? (
            <div className="text-gray-400 text-sm py-4 text-center">
              No reports yet.{' '}
              <Link to="/run" className="text-indigo-600 hover:underline">
                Run a journey
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentReports.map((report) => (
                <li key={report.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      Journey #{report.journeyId.slice(-6)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreRing score={report.score} size={40} />
                    <Link
                      to={`/reports/${report.journeyId}`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Start CTA */}
      {journeys.length === 0 && (
        <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-indigo-800">Ready to test your first journey?</h3>
            <p className="text-indigo-600 text-sm mt-1">
              The Demo Shop is loaded and ready. Run the full checkout journey.
            </p>
          </div>
          <Link
            to="/run"
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 whitespace-nowrap"
          >
            Run Journey ▷
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: 'indigo' | 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className={`inline-flex p-2 rounded-lg text-xl mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
