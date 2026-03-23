import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, AlertTriangle, Mail, CheckCircle, MousePointerClick, Truck, XCircle, Edit2, EyeOff, Eye, Download, Send, Link, Paperclip, Share2, Clock, UserX, Filter, ArrowUpDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

function ResponseRate({ value, total, received }) {
  const color = value >= 70 ? '#10B981' : value >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="text-center">
      <div className="text-3xl font-bold" style={{ color }}>{value}%</div>
      <div className="text-xs text-gray-400 mt-1">{received} of {total} responses</div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2 w-24 mx-auto">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function EmailStatusIcon({ status }) {
  const config = {
    opened: { icon: CheckCircle, color: 'text-green-500', label: 'Opened' },
    clicked: { icon: MousePointerClick, color: 'text-purple-500', label: 'Clicked' },
    delivered: { icon: Truck, color: 'text-blue-400', label: 'Delivered' },
    bounced: { icon: XCircle, color: 'text-red-500', label: 'Bounced' },
    not_sent: { icon: Clock, color: 'text-gray-400', label: 'Not sent' },
    opted_out: { icon: UserX, color: 'text-orange-500', label: 'Opted-out' },
  };
  const c = config[status] || config.delivered;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.color}`}>
      <Icon size={12} />
      {c.label}
    </span>
  );
}

function BarChart({ data }) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([label, count]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-44 flex-shrink-0 truncate" title={label}>{label}</span>
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

function QuestionSummaryCard({ question, responses, excluded }) {
  const activeResponses = responses.filter(r => !r.excluded);

  let content = null;
  if (question.type === 'single_choice') {
    const counts = {};
    question.options.forEach(o => counts[o] = 0);
    activeResponses.forEach(r => {
      const ans = r.answers[question.id];
      if (ans) counts[ans] = (counts[ans] || 0) + 1;
    });
    content = <BarChart data={counts} />;
  } else if (question.type === 'multi_choice') {
    const counts = {};
    question.options.forEach(o => counts[o] = 0);
    activeResponses.forEach(r => {
      const ans = r.answers[question.id];
      if (Array.isArray(ans)) ans.forEach(a => counts[a] = (counts[a] || 0) + 1);
    });
    content = <BarChart data={counts} />;
  } else if (question.type === 'rating_scale') {
    const values = activeResponses.map(r => r.answers[question.id]).filter(Boolean);
    const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—';
    const counts = {};
    for (let i = 1; i <= question.scale; i++) counts[i] = 0;
    values.forEach(v => counts[v] = (counts[v] || 0) + 1);
    content = (
      <div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold" style={{ color: '#4A00F8' }}>{avg}</span>
          <span className="text-sm text-gray-400">/ {question.scale} avg</span>
        </div>
        <div className="flex gap-1.5">
          {Object.entries(counts).map(([n, c]) => (
            <div key={n} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: 40 }}>
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: `${c > 0 ? Math.max(4, (c / values.length) * 40) : 0}px`,
                    backgroundColor: '#4A00F8',
                    opacity: 0.3 + (c / (values.length || 1)) * 0.7
                  }}
                />
              </div>
              <span className="text-xs text-gray-400">{n}</span>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (question.type === 'open_text') {
    const texts = activeResponses.map(r => ({ text: r.answers[question.id], name: r.expertName })).filter(r => r.text);
    content = texts.length > 0 ? (
      <div className="space-y-2">
        {texts.map((r, i) => (
          <blockquote key={i} className="border-l-2 pl-3 py-1" style={{ borderColor: '#4A00F8' }}>
            <p className="text-sm text-gray-700 italic">"{r.text}"</p>
            <footer className="text-xs text-gray-400 mt-1">— {r.name}</footer>
          </blockquote>
        ))}
      </div>
    ) : <p className="text-sm text-gray-400 italic">No text responses</p>;
  } else {
    content = <p className="text-sm text-gray-400 italic">Response visualisation not available for this question type</p>;
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-2 mb-3">
        <Badge color="gray" size="xs">Q{question.id.replace('q', '')}</Badge>
        <p className="text-sm font-semibold text-gray-800 flex-1">{question.text}</p>
      </div>
      {excluded > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
          <AlertTriangle size={12} />
          {excluded} response{excluded > 1 ? 's' : ''} excluded from this summary
        </div>
      )}
      {content}
    </Card>
  );
}

function ResponseRow({ response, survey, onToggleExclusion, onAnnotationChange, orgTimezone }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [annotation, setAnnotation] = useState(response.annotation || '');

  const saveAnnotation = () => {
    onAnnotationChange(response.expertId, annotation);
    setEditing(false);
  };

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
              <p className={`text-sm font-medium ${response.excluded ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {response.expertName}
              </p>
              <p className="text-xs text-gray-400">{response.company}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{response.submittedAt}{response.submittedAt ? ` (${orgTimezone})` : ''}</td>
        <td className="px-4 py-3">
          {response.excluded
            ? <Badge color="red" size="xs">Excluded</Badge>
            : <Badge color="green" size="xs">Submitted</Badge>
          }
        </td>
        <td className="px-4 py-3">
          <div className="max-w-48">
            {editing ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={annotation}
                  onChange={e => setAnnotation(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveAnnotation()}
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1"
                  autoFocus
                />
                <button onClick={saveAnnotation} className="text-green-500"><CheckCircle size={14} /></button>
              </div>
            ) : (
              <div className="flex items-start gap-1">
                <p className="text-xs text-gray-500 flex-1 truncate" title={annotation}>
                  {annotation || <span className="text-gray-300 italic">No note</span>}
                </p>
                <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
                  <Edit2 size={12} />
                </button>
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
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
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-purple-50/30">
          <td colSpan={5} className="px-5 py-3">
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

function DistributionTab({ survey }) {
  const activeResponses = survey.responses.filter(r => !r.excluded);

  const byDate = activeResponses.reduce((acc, r) => {
    const date = r.submittedAt.split(' ')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  const maxDateCount = Math.max(...Object.values(byDate), 1);

  const byCompany = activeResponses.reduce((acc, r) => {
    acc[r.company] = (acc[r.company] || 0) + 1;
    return acc;
  }, {});

  const choiceQuestions = survey.questions.filter(q => q.type === 'single_choice' || q.type === 'multi_choice');

  if (activeResponses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-500 font-medium">No responses to analyse yet</p>
        <p className="text-sm text-gray-400 mt-1">Distribution data will appear once responses are received</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Response Timeline</h3>
        <div className="space-y-2.5">
          {Object.entries(byDate).sort().map(([date, count]) => (
            <div key={date} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-24 flex-shrink-0">{date}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500 flex items-center px-2"
                  style={{ width: `${(count / maxDateCount) * 100}%`, backgroundColor: '#4A00F8' }}
                >
                  <span className="text-white text-xs font-semibold">{count}</span>
                </div>
              </div>
              <span className="text-xs text-gray-400 w-20 flex-shrink-0">{count} response{count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Respondents by Company</h3>
        <div className="space-y-2.5">
          {Object.entries(byCompany).sort((a, b) => b[1] - a[1]).map(([company, count]) => {
            const pct = Math.round((count / activeResponses.length) * 100);
            return (
              <div key={company} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-36 flex-shrink-0 truncate" title={company}>{company}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: '#7C3AED' }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </Card>

      {choiceQuestions.map(q => {
        const counts = {};
        if (q.type === 'single_choice') {
          q.options.forEach(o => counts[o] = 0);
          activeResponses.forEach(r => { const ans = r.answers[q.id]; if (ans) counts[ans] = (counts[ans] || 0) + 1; });
        } else {
          q.options.forEach(o => counts[o] = 0);
          activeResponses.forEach(r => { const ans = r.answers[q.id]; if (Array.isArray(ans)) ans.forEach(a => counts[a] = (counts[a] || 0) + 1); });
        }
        const total = q.type === 'single_choice'
          ? activeResponses.length
          : activeResponses.filter(r => Array.isArray(r.answers[q.id]) && r.answers[q.id].length > 0).length || 1;

        return (
          <Card key={q.id} className="p-5">
            <div className="flex items-start gap-2 mb-4">
              <Badge color="gray" size="xs">Q{q.id.replace('q', '')}</Badge>
              <p className="text-sm font-semibold text-gray-800 flex-1">{q.text}</p>
            </div>
            <div className="space-y-2.5">
              {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([option, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={option} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-44 flex-shrink-0 truncate" title={option}>{option}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: pct >= 50 ? '#4A00F8' : pct >= 25 ? '#7C3AED' : '#A78BFA' }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-10 text-right">{pct}%</span>
                    <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">{activeResponses.length} active response{activeResponses.length !== 1 ? 's' : ''} included</p>
          </Card>
        );
      })}
    </div>
  );
}

function AttachReportSection({ addToast, responsesReceived }) {
  const [attachedFile, setAttachedFile] = useState(null);
  const [shared, setShared] = useState(false);

  const handleAttach = () => {
    setAttachedFile('Q2_2026_Steel_Market_Signal.pdf');
    addToast('Report attached successfully');
  };

  const handleShare = () => {
    setShared(true);
    addToast(`Report shared with ${responsesReceived} experts who responded`);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Paperclip size={15} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800">Attach Market Intelligence Report</h3>
      </div>
      {!attachedFile ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500 flex-1">Attach the final research report PDF to share with respondents.</p>
          <Button variant="secondary" size="sm" onClick={handleAttach}>
            <Paperclip size={13} /> Attach PDF
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
          <div className="w-9 h-9 rounded-lg bg-white border border-green-200 flex items-center justify-center flex-shrink-0">
            <Paperclip size={16} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{attachedFile}</p>
            <p className="text-xs text-gray-400">PDF · Attached just now</p>
          </div>
          {!shared ? (
            <Button size="sm" onClick={handleShare}>
              <Share2 size={13} /> Share with respondents
            </Button>
          ) : (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle size={13} /> Shared
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

export default function SurveyResults() {
  const { projectId, surveyId } = useParams();
  const navigate = useNavigate();
  const { surveys, projects, toggleExclusion, updateAnnotation, addToast, orgTimezone } = useApp();
  const [activeTab, setActiveTab] = useState('responses');
  const [emailCollapsed, setEmailCollapsed] = useState(false);
  const [responseFilter, setResponseFilter] = useState('all');
  const [responseSort, setResponseSort] = useState('newest');

  const survey = surveys.find(s => s.id === surveyId);
  const project = projects.find(p => p.id === projectId);

  if (!survey) return <div className="p-6 text-center text-gray-500">Survey not found.</div>;

  const excludedCount = survey.responses.filter(r => r.excluded).length;
  const pendingExperts = survey.emailStatus.filter(e => !survey.responses.find(r => r.expertId === e.expertId));
  const bouncedCount = survey.emailStatus.filter(e => e.status === 'bounced').length;
  const isRunning = survey.status === 'Running';
  const nonResponding = survey.emailStatus.filter(e => !survey.responses.find(r => r.expertId === e.expertId)).length;

  const tabs = ['Responses', 'Summary', 'Distribution'];

  const handleExportCSV = () => {
    const headers = ['Expert', 'Company', 'Submitted At', 'Status', 'Annotation', ...survey.questions.map(q => q.text)];
    const rows = survey.responses.map(r => [
      r.expertName,
      r.company || '',
      r.submittedAt || '',
      r.excluded ? 'Excluded' : 'Submitted',
      r.annotation || '',
      ...survey.questions.map(q => {
        const ans = r.answers[q.id];
        if (Array.isArray(ans)) return ans.join('; ');
        return ans != null ? String(ans) : '';
      }),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${survey.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Results exported to CSV');
  };
  const handleCopySurveyLink = () => addToast('Survey link copied');
  const handleSendReminder = () => addToast(`Reminder sent to ${nonResponding} non-responding experts`);

  // Empty state for running survey with no responses
  if (isRunning && survey.responses.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto fade-in">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{survey.name}</h1>
              <StatusBadge status={survey.status} />
            </div>
            <p className="text-sm text-gray-500">{project?.name} · Wave {survey.wave}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCSV}><Download size={13} /> Export CSV</Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${projectId}`)}>← Back to Project</Button>
          </div>
        </div>

        <Card className="p-12 text-center">
          <div className="text-5xl font-bold mb-3" style={{ color: '#9CA3AF' }}>0%</div>
          <p className="text-lg font-semibold text-gray-700 mb-2">Awaiting first response</p>
          <p className="text-sm text-gray-400 mb-6">Survey is live — waiting for experts to respond</p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleCopySurveyLink}>
              <Link size={13} /> Copy survey link
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSendReminder}>
              <Send size={13} /> Send reminder
            </Button>
          </div>
          {survey.closeDate && (
            <p className="text-xs text-gray-400 mt-4">Closes {survey.closeDate}</p>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{survey.name}</h1>
            <StatusBadge status={survey.status} />
          </div>
          <p className="text-sm text-gray-500">{project?.name} · Wave {survey.wave}</p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <Button variant="secondary" size="sm" onClick={handleSendReminder}>
              <Send size={13} /> Send Reminder ({nonResponding})
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download size={13} /> Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${projectId}`)}>
            ← Back to Project
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <Card className="p-4 text-center">
          <ResponseRate value={survey.responseRate} total={survey.expertsTargeted} received={survey.responsesReceived} />
          <p className="text-xs text-gray-400 mt-2">Response Rate</p>
        </Card>
        <Card className="p-4 text-center">
          {isRunning ? (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {survey.closeDate ? `${Math.max(0, Math.ceil((new Date(survey.closeDate) - new Date()) / (1000*60*60*24)))} days` : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-2">Until close</p>
              <p className="text-xs text-gray-400">Closes {survey.closeDate}</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">{survey.closeDate || '—'}</p>
              <p className="text-xs text-gray-400 mt-2">Closed <span className="font-medium">{orgTimezone}</span></p>
            </>
          )}
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{survey.reminders.length}</p>
          <p className="text-xs text-gray-400 mt-2">Reminders sent</p>
          {survey.reminders[0] && (
            <p className="text-xs text-gray-400">Last: {survey.reminders[0].sent}</p>
          )}
        </Card>
        <Card className={`p-4 text-center ${bouncedCount > 0 ? 'border-amber-200 bg-amber-50' : ''}`}>
          <p className={`text-2xl font-bold ${bouncedCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{bouncedCount}</p>
          <p className="text-xs text-gray-400 mt-2">Bounced emails</p>
          {bouncedCount > 0 && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <AlertTriangle size={11} className="text-amber-500" />
              <span className="text-xs text-amber-600">Needs attention</span>
            </div>
          )}
        </Card>
      </div>

      {/* Post-close attach report section */}
      {(survey.status === 'Review' || survey.status === 'Closed' || survey.status === 'Transferred') && (
        <div className="mb-5">
          <AttachReportSection addToast={addToast} responsesReceived={survey.responsesReceived} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 w-fit mb-5 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === tab.toLowerCase() ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
            style={activeTab === tab.toLowerCase() ? { backgroundColor: '#4A00F8' } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Responses tab */}
      {activeTab === 'responses' && (
        <div className="space-y-4">
          {excludedCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <AlertTriangle size={15} className="text-amber-500" />
              <p className="text-sm text-amber-700">
                <strong>{excludedCount}</strong> response{excludedCount > 1 ? 's are' : ' is'} excluded from analysis. Toggle to include.
              </p>
            </div>
          )}

          {/* Filter + sort controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Filter size={13} /> Filter:
            </div>
            {[
              { key: 'all', label: 'All' },
              { key: 'responded', label: 'Responded' },
              { key: 'awaiting', label: 'Awaiting' },
              { key: 'excluded', label: 'Excluded' },
              { key: 'bounced', label: 'Bounced' },
              { key: 'opted_out', label: 'Opted-out' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setResponseFilter(f.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  responseFilter === f.key ? 'text-white' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                }`}
                style={responseFilter === f.key ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
              >
                {f.label}
              </button>
            ))}
            <div className="flex items-center gap-1.5 ml-3 text-xs text-gray-500 font-medium">
              <ArrowUpDown size={13} /> Sort:
            </div>
            <select
              value={responseSort}
              onChange={e => setResponseSort(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs bg-white text-gray-700 focus:border-purple-400 focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Expert name (A–Z)</option>
            </select>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Expert</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Submitted</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Annotation</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Build unified rows: submitted responses + non-responded email entries
                    const nonRespondedEmails = survey.emailStatus.filter(e => !survey.responses.find(r => r.expertId === e.expertId));

                    // Filter responses
                    let filteredResponses = survey.responses;
                    if (responseFilter === 'responded') filteredResponses = survey.responses;
                    else if (responseFilter === 'excluded') filteredResponses = survey.responses.filter(r => r.excluded);
                    else if (responseFilter === 'awaiting') filteredResponses = [];
                    else if (responseFilter === 'bounced') filteredResponses = [];
                    else if (responseFilter === 'opted_out') filteredResponses = [];

                    // Sort responses
                    const sortedResponses = [...filteredResponses].sort((a, b) => {
                      if (responseSort === 'newest') return (b.submittedAt || '').localeCompare(a.submittedAt || '');
                      if (responseSort === 'oldest') return (a.submittedAt || '').localeCompare(b.submittedAt || '');
                      if (responseSort === 'name') return a.expertName.localeCompare(b.expertName);
                      return 0;
                    });

                    // Filter non-responded by email status filter
                    let filteredEmails = nonRespondedEmails;
                    if (responseFilter === 'responded') filteredEmails = [];
                    else if (responseFilter === 'excluded') filteredEmails = [];
                    else if (responseFilter === 'awaiting') filteredEmails = nonRespondedEmails.filter(e => !['bounced', 'opted_out'].includes(e.status));
                    else if (responseFilter === 'bounced') filteredEmails = nonRespondedEmails.filter(e => e.status === 'bounced');
                    else if (responseFilter === 'opted_out') filteredEmails = nonRespondedEmails.filter(e => e.status === 'opted_out');

                    const sortedEmails = [...filteredEmails].sort((a, b) =>
                      responseSort === 'name' ? a.expertName.localeCompare(b.expertName) : 0
                    );

                    return (
                      <>
                        {sortedResponses.map(r => (
                          <ResponseRow
                            key={r.expertId}
                            response={r}
                            survey={survey}
                            onToggleExclusion={(expertId) => toggleExclusion(surveyId, expertId)}
                            onAnnotationChange={(expertId, ann) => updateAnnotation(surveyId, expertId, ann)}
                            orgTimezone={orgTimezone}
                          />
                        ))}
                        {sortedEmails.map(e => (
                          <tr key={e.expertId} className="border-b border-gray-50 opacity-60">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                                  {e.expertName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-500">{e.expertName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">—</td>
                            <td className="px-4 py-3"><EmailStatusIcon status={e.status} /></td>
                            <td className="px-4 py-3 text-xs text-gray-300 italic">—</td>
                            <td className="px-4 py-3 text-xs text-gray-400">
                              {e.status === 'bounced' ? <Badge color="amber" size="xs">Email bounced</Badge> :
                               e.status === 'opted_out' ? <Badge color="orange" size="xs">Opted out</Badge> :
                               'Awaiting response'}
                            </td>
                          </tr>
                        ))}
                        {sortedResponses.length === 0 && sortedEmails.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                              No responses match the current filter
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Email delivery panel */}
          <Card className="overflow-hidden">
            <button
              onClick={() => setEmailCollapsed(!emailCollapsed)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Email Delivery Status</span>
                <Badge color="gray" size="xs">{survey.emailStatus.length} recipients</Badge>
              </div>
              {emailCollapsed ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronUp size={15} className="text-gray-400" />}
            </button>
            {!emailCollapsed && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {survey.emailStatus.map(e => (
                    <div key={e.expertId} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                      <div>
                        <p className="text-xs font-medium text-gray-700">{e.expertName}</p>
                        <p className="text-xs text-gray-400">{e.lastEvent}</p>
                      </div>
                      <EmailStatusIcon status={e.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Summary tab */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {excludedCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <AlertTriangle size={15} className="text-amber-500" />
              <p className="text-sm text-amber-700">{excludedCount} response excluded from summary</p>
            </div>
          )}
          {survey.questions.map(q => (
            <QuestionSummaryCard
              key={q.id}
              question={q}
              responses={survey.responses}
              excluded={excludedCount}
            />
          ))}
        </div>
      )}

      {/* Distribution tab */}
      {activeTab === 'distribution' && <DistributionTab survey={survey} />}
    </div>
  );
}
