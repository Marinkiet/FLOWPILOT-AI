import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.ts';
import type { Application } from '@flowpilot/shared';

export function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.applications
      .list()
      .then(setApplications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const app = await api.applications.create({ name, baseUrl });
      setApplications((prev) => [app, ...prev]);
      setName('');
      setBaseUrl('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Applications</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the apps FlowPilot can test.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          + Add Application
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow-sm p-6 mb-6 space-y-4"
        >
          <h2 className="font-semibold text-gray-700">New Application</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My App"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-500 text-sm hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No applications yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{app.name}</h3>
                  {app.description && (
                    <p className="text-sm text-gray-500 mt-1">{app.description}</p>
                  )}
                  <a
                    href={app.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-500 hover:underline mt-1 block"
                  >
                    {app.baseUrl}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    {app.type}
                  </span>
                  <Link
                    to={`/run?applicationId=${app.id}`}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100"
                  >
                    Run Journey
                  </Link>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {app.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
