import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle, X, ChevronDown, ChevronUp, Edit2, Eye, EyeOff, Paperclip, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { GenerateReportSection } from '../components/GenerateReportSection';

function BarChart({ data }) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([label, count]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-48 flex-shrink-0 truncate">{label}</span>
          <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{ width: `${(count / max) * 100}%`, backgroundColor: '#4A00F8' }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-5 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

function KpiBadge({ label, value }) {
  if (value === null) return (
    <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
      {label} N/A
    </span>
  );
  const color = value >= 75 ? '#16A34A' : value >= 50 ? '#D97706' : '#DC2626';
  const bg = value >= 75 ? '#F0FDF4' : value >= 50 ? '#FFFBEB' : '#FEF2F2';
  return (
    <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: bg, color }}>
      {label} {value}%
    </span>
  );
}

function ResponseRow({ response, survey, canExclude, onToggleExclusion, expertKpis }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${response.excluded ? 'opacity-60' : ''}`}>
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: '#4A00F8' }}
            >
              {response.expertName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className={`text-sm font-medium ${response.excluded ? 'line-through text-gray-400' : 'text-gray-800'}`}>{response.expertName}</p>
              <p className="text-xs text-gray-400">{response.company}</p>
              {expertKpis && (
                <div className="flex items-center gap-1 mt-1">
                  <KpiBadge label="RR" value={expertKpis.reactionRate} />
                  <KpiBadge label="DAR" value={expertKpis.acceptanceRate} />
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{response.submittedAt}</td>
        <td className="px-4 py-3">
          {response.excluded
            ? <Badge color="red" size="xs">Excluded</Badge>
            : <Badge color="green" size="xs">Included</Badge>
          }
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 justify-end">
            {canExclude && (
              <button
                onClick={() => onToggleExclusion(response.expertId)}
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border transition-colors ${
                  response.excluded
                    ? 'border-green-200 text-green-600 hover:bg-green-50'
                    : 'border-red-200 text-red-500 hover:bg-red-50'
                }`}
              >
                {response.excluded ? <><Eye size={11} /> Include</> : <><EyeOff size={11} /> Exclude</>}
              </button>
            )}
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 p-1">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-purple-50/30">
          <td colSpan={4} className="px-5 py-3">
            <div className="grid grid-cols-2 gap-3">
              {survey.questions.map(q => {
                const ans = response.answers[q.id];
                if (!ans && ans !== 0) return null;
                return (
                  <div key={q.id} className="bg-white rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium mb-1 truncate">{q.text}</p>
                    <p className="text-sm text-gray-800">
                      {Array.isArray(ans) ? ans.join(', ') : String(ans)}
                    </p>
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PostCloseReview() {
  const { projectId, surveyId } = useParams();
  const navigate = useNavigate();
  const { surveys, projects, currentUser, toggleExclusion, addToast, experts } = useApp();

  const survey = surveys.find(s => s.id === surveyId);
  const project = projects.find(p => p.id === projectId);

  if (!survey) return <div className="p-6 text-center text-gray-500">Survey not found.</div>;

  const canExclude = ['Super Admin', 'Admin', 'Standard User'].includes(currentUser.role);

  const MIN_KPI = 3;
  const getExpertKpis = (expertId) => {
    const e = experts.find(x => x.id === expertId);
    if (!e) return null;
    return {
      reactionRate: e.surveysSent >= MIN_KPI ? Math.round((e.surveysResponded / e.surveysSent) * 100) : null,
      acceptanceRate: e.surveysResponded >= MIN_KPI ? Math.round((e.responsesAccepted / e.surveysResponded) * 100) : null,
    };
  };
  const excludedCount = survey.responses.filter(r => r.excluded).length;
  const includedCount = survey.responses.length - excludedCount;
  const includedResponses = survey.responses.filter(r => !r.excluded);

  const q1Data = {};
  survey.questions[0]?.options?.forEach(o => q1Data[o] = 0);
  includedResponses.forEach(r => {
    const ans = r.answers.q1;
    if (ans) q1Data[ans] = (q1Data[ans] || 0) + 1;
  });

  const q2Values = includedResponses.map(r => r.answers.q2).filter(Boolean);
  const q2Avg = q2Values.length > 0 ? (q2Values.reduce((a, b) => a + b, 0) / q2Values.length).toFixed(1) : '—';

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{survey.name}</h1>
                <StatusBadge status={survey.status === 'Transferred' ? 'Transferred' : 'Review'} />
              </div>
              <p className="text-sm text-gray-500">{project?.name} · Wave {survey.wave}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/survey/demo123/results?state=closed')}>
                <Eye size={13} /> Preview expert view
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${projectId}`)}>
                ← Back to Project
              </Button>
            </div>
          </div>

          {/* Review mode banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-5">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              <strong>Review mode</strong> — This dataset is in the post-close review window. Verify responses before transfer to DataHub.
            </p>
          </div>

          {/* Success banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200 mb-5">
            <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">
              <strong>Wave {survey.wave} results ready for review</strong> — {survey.responsesReceived}/{survey.expertsTargeted} responses collected ({survey.responseRate}% response rate).{excludedCount > 0 ? ` ${excludedCount} response${excludedCount > 1 ? 's' : ''} excluded from analysis.` : ' All responses included.'}
            </p>
          </div>

          {/* Generate report section */}
          {survey.status !== 'Transferred' && canExclude && (
            <div className="mb-5">
              <GenerateReportSection survey={survey} addToast={addToast} />
            </div>
          )}

          {/* Response table */}
          <Card className="mb-5">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Responses</h2>
              <Badge color={excludedCount > 0 ? 'amber' : 'green'} size="xs">{includedCount} included · {excludedCount} excluded</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Expert</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Submitted</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {survey.responses.map(r => (
                    <ResponseRow key={r.expertId} response={r} survey={survey} canExclude={canExclude} onToggleExclusion={(expertId) => toggleExclusion(survey.id, expertId)} expertKpis={getExpertKpis(r.expertId)} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Summary cards */}
          <div className="space-y-4">
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">{survey.questions[0]?.text}</p>
              <BarChart data={q1Data} />
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">{survey.questions[1]?.text}</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold" style={{ color: '#4A00F8' }}>{q2Avg}</span>
                <span className="text-sm text-gray-400">/ 5 avg</span>
              </div>
            </Card>
            {survey.questions[2] && (
              <Card className="p-5">
                <p className="text-sm font-semibold text-gray-800 mb-3">{survey.questions[2].text}</p>
                <div className="space-y-2">
                  {includedResponses
                    .filter(r => r.answers.q3)
                    .map(r => (
                      <blockquote key={r.expertId} className="border-l-2 pl-3 py-1" style={{ borderColor: '#4A00F8' }}>
                        <p className="text-sm text-gray-700 italic">"{r.answers.q3}"</p>
                        <footer className="text-xs text-gray-400 mt-1">— {r.expertName}</footer>
                      </blockquote>
                    ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 flex-shrink-0 border-l border-gray-100 bg-white flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={16} style={{ color: '#4A00F8' }} />
            Review Window
          </h2>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Responses</span>
              <span className="font-semibold text-gray-800">{survey.responsesReceived}/{survey.expertsTargeted}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Response rate</span>
              <span className="font-semibold text-green-600">{survey.responseRate}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Excluded</span>
              <span className="font-semibold text-gray-800">{survey.responses.filter(r => r.excluded).length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Wave</span>
              <span className="font-semibold text-gray-800">Wave {survey.wave}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
            <p className="text-xs font-semibold text-purple-700 mb-0.5">Phase 1 — Review is terminal</p>
            <p className="text-xs text-purple-600">DataHub transfer will be available in Phase 2.</p>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Review Checklist</h3>
          <div className="space-y-2">
            {[
              { label: 'Wave closed', ok: true },
              { label: 'Responses verified', ok: survey.responses.length > 0 },
              { label: 'Outliers reviewed', ok: true },
              { label: 'Annotations complete', ok: true },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${ok ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {ok
                    ? <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#10B981" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  }
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
