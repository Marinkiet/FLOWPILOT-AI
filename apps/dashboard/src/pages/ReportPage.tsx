import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.ts';
import { ScoreRing } from '../components/ScoreRing.tsx';
import { SeverityBadge } from '../components/SeverityBadge.tsx';
import type { QualityReport } from '@flowpilot/shared';

export function ReportPage() {
  const { journeyId } = useParams<{ journeyId: string }>();
  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'findings' | 'friction' | 'recommendations' | 'reasoning'>('findings');

  useEffect(() => {
    if (!journeyId) return;
    api.journeys
      .getReport(journeyId)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [journeyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Loading report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Report not available yet.</p>
        <Link to={`/journeys/${journeyId}`} className="text-indigo-600 hover:underline text-sm mt-2 block">
          ← Back to journey
        </Link>
      </div>
    );
  }

  const criticalCount = report.findings.filter((f) => f.severity === 'critical').length;
  const highCount = report.findings.filter((f) => f.severity === 'high').length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            to={`/journeys/${journeyId}`}
            className="text-sm text-indigo-600 hover:underline mb-2 block"
          >
            ← Back to Journey
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Quality Report</h1>
          <p className="text-gray-500 text-sm mt-1">
            Generated {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <ScoreRing score={report.score} size={90} />
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-2">Executive Summary</h2>
        <p className="text-gray-600 text-sm leading-relaxed">{report.summary}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <MetricCard label="Score" value={`${report.score}/100`} highlight={report.score < 60} />
        <MetricCard label="Steps Passed" value={`${report.passedSteps}/${report.totalSteps}`} />
        <MetricCard
          label="Goal Completion"
          value={`${Math.round(report.goalCompletionRate)}%`}
          highlight={report.goalCompletionRate < 80}
        />
        <MetricCard label="Critical" value={criticalCount} highlight={criticalCount > 0} />
        <MetricCard label="High" value={highCount} highlight={highCount > 0} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4 w-fit">
        {(['findings', 'friction', 'recommendations', 'reasoning'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'findings' && report.findings.length > 0 && (
              <span className="ml-1 bg-red-100 text-red-600 text-xs px-1.5 rounded-full">
                {report.findings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {activeTab === 'findings' && (
          <div className="space-y-4">
            {report.findings.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No findings. 🎉</p>
            ) : (
              report.findings.map((finding) => (
                <div key={finding.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-gray-800 text-sm">{finding.title}</h3>
                    <SeverityBadge severity={finding.severity} />
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{finding.description}</p>

                  {finding.rootCauseHypothesis && (
                    <div className="bg-orange-50 rounded p-2 mb-2">
                      <p className="text-xs font-semibold text-orange-600 mb-0.5">
                        Root Cause {finding.isConfirmed ? '(CONFIRMED)' : '(INFERRED)'}
                      </p>
                      <p className="text-xs text-orange-700">{finding.rootCauseHypothesis}</p>
                    </div>
                  )}

                  {finding.recommendation && (
                    <div className="bg-green-50 rounded p-2">
                      <p className="text-xs font-semibold text-green-600 mb-0.5">Recommendation</p>
                      <p className="text-xs text-green-700">{finding.recommendation}</p>
                    </div>
                  )}

                  {finding.evidence.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 font-medium mb-1">Evidence:</p>
                      <ul className="space-y-0.5">
                        {finding.evidence.map((e, i) => (
                          <li key={i} className="text-xs text-gray-500">
                            <span className="font-mono text-gray-400">[{e.type}]</span>{' '}
                            {e.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'friction' && (
          <div className="space-y-3">
            {report.frictionPoints.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No friction points detected.</p>
            ) : (
              report.frictionPoints.map((fp) => (
                <div key={fp.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-gray-400 uppercase">{fp.type}</span>
                    <SeverityBadge severity={fp.severity} />
                  </div>
                  <p className="text-sm text-gray-700">{fp.description}</p>
                  {fp.measuredValue !== undefined && (
                    <p className="text-xs text-gray-400 mt-1">
                      Measured: {fp.measuredValue} {fp.unit ?? ''}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            {report.recommendations.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No recommendations.</p>
            ) : (
              report.recommendations.map((rec, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${
                        rec.priority === 'high'
                          ? 'bg-red-100 text-red-600'
                          : rec.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {rec.priority}
                    </span>
                    <h4 className="text-sm font-medium text-gray-800">{rec.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600">{rec.description}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reasoning' && (
          <div className="space-y-2 evidence-scroll max-h-96 overflow-auto">
            {!report.agentReasoningLog || report.agentReasoningLog.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No reasoning log available.</p>
            ) : (
              report.agentReasoningLog.map((entry, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded font-mono capitalize ${
                      entry.phase === 'observe'
                        ? 'bg-blue-100 text-blue-600'
                        : entry.phase === 'reason'
                        ? 'bg-purple-100 text-purple-600'
                        : entry.phase === 'act'
                        ? 'bg-green-100 text-green-600'
                        : entry.phase === 'investigate'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {entry.phase}
                  </span>
                  <p className="text-gray-600">{entry.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 text-center ${
        highlight ? 'bg-red-50 border border-red-100' : 'bg-white shadow-sm'
      }`}
    >
      <p className={`text-xl font-bold ${highlight ? 'text-red-600' : 'text-gray-800'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
