import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle, X, ChevronDown, ChevronUp, Edit2, Eye, EyeOff, Paperclip, Share2, FileWarning, MessageSquare, ExternalLink } from 'lucide-react';
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

function getMimeLabel(mimeType) {
  if (!mimeType) return 'File';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.endsWith('.xlsx')) return 'Excel';
  if (mimeType.includes('word')) return 'Word';
  return 'File';
}

function AttachmentValidationCard({ questions, surveyId, onUpdateSummary }) {
  const resolvedCount = questions.filter(q =>
    q.attachment.summaryStatus === 'validated' || q.attachment.summaryStatus === 'ai_complete'
  ).length;

  // Per-question UI state
  const [editStates, setEditStates] = useState(() =>
    Object.fromEntries(questions.map(q => [q.id, { editing: false, text: q.attachment.attachmentSummary || '' }]))
  );

  const startEdit = (qId, prefill) => {
    setEditStates(prev => ({ ...prev, [qId]: { editing: true, text: prefill || '' } }));
  };

  const cancelEdit = (qId) => {
    setEditStates(prev => ({ ...prev, [qId]: { ...prev[qId], editing: false } }));
  };

  const handleSave = (qId) => {
    const text = editStates[qId]?.text || '';
    onUpdateSummary(surveyId, qId, text, 'researcher');
    setEditStates(prev => ({ ...prev, [qId]: { editing: false, text } }));
  };

  return (
    <Card className="mb-5">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Paperclip size={14} style={{ color: '#4A00F8' }} />
          Attachment Validation
        </h2>
        <Badge color={resolvedCount === questions.length ? 'green' : 'amber'} size="xs">
          {resolvedCount} / {questions.length} resolved
        </Badge>
      </div>
      <div className="divide-y divide-gray-50">
        {questions.map(q => {
          const att = q.attachment;
          const state = editStates[q.id] || { editing: false, text: att.attachmentSummary || '' };
          const mimeLabel = getMimeLabel(att.mimeType);

          return (
            <div key={q.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm text-gray-700 font-medium truncate flex-1">{q.text}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge color="gray" size="xs">{mimeLabel}</Badge>
                  {att.summaryStatus === 'needs_review' && <Badge color="red" size="xs">Needs review</Badge>}
                  {att.summaryStatus === 'ai_complete' && <Badge color="green" size="xs">AI validated</Badge>}
                  {att.summaryStatus === 'validated' && <Badge color="green" size="xs">Validated</Badge>}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                <Paperclip size={10} /> {att.fileName}
              </p>

              {att.summaryStatus === 'needs_review' && (
                <div>
                  {state.editing ? (
                    <div>
                      <textarea
                        className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-purple-400"
                        rows={3}
                        value={state.text}
                        onChange={e => setEditStates(prev => ({ ...prev, [q.id]: { ...prev[q.id], text: e.target.value } }))}
                        placeholder="Enter a summary of this attachment's content…"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <Button variant="primary" size="xs" onClick={() => handleSave(q.id)}>Save & validate</Button>
                        <Button variant="secondary" size="xs" onClick={() => cancelEdit(q.id)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="secondary" size="xs" onClick={() => startEdit(q.id, '')}>
                      <FileWarning size={11} /> Add summary & validate
                    </Button>
                  )}
                </div>
              )}

              {(att.summaryStatus === 'ai_complete' || att.summaryStatus === 'validated') && (
                <div>
                  {state.editing ? (
                    <div>
                      <textarea
                        className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-purple-400"
                        rows={3}
                        value={state.text}
                        onChange={e => setEditStates(prev => ({ ...prev, [q.id]: { ...prev[q.id], text: e.target.value } }))}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <Button variant="primary" size="xs" onClick={() => handleSave(q.id)}>Save & validate</Button>
                        <Button variant="secondary" size="xs" onClick={() => cancelEdit(q.id)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">{att.attachmentSummary}</p>
                      <button
                        onClick={() => startEdit(q.id, att.attachmentSummary || '')}
                        className="text-xs text-purple-600 hover:text-purple-800 mt-1"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ResponseRow({ response, survey, canExclude, onToggleExclusion, expertKpis, onSetNote, surveyId }) {
  const [expanded, setExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(null); // questionId being edited
  const [noteText, setNoteText] = useState('');

  const handleEditNote = (qId) => {
    setNoteText((response.notes || {})[qId] || '');
    setEditingNote(qId);
  };

  const handleSaveNote = (qId) => {
    onSetNote(surveyId, response.expertId, qId, noteText);
    setEditingNote(null);
    setNoteText('');
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
          <td colSpan={4} className="px-5 py-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
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
            <div className="border-t border-purple-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <MessageSquare size={11} /> Researcher Notes
              </p>
              <div className="space-y-2">
                {survey.questions.map(q => {
                  const existingNote = (response.notes || {})[q.id];
                  const isEditing = editingNote === q.id;
                  return (
                    <div key={q.id} className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 truncate mb-1">{q.text}</p>
                      {isEditing ? (
                        <div className="mt-1">
                          <textarea
                            className="w-full text-xs border border-gray-200 rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-purple-400"
                            rows={2}
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="Add a researcher note…"
                            autoFocus
                          />
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleSaveNote(q.id)}
                              className="text-xs font-medium text-white px-2 py-1 rounded"
                              style={{ backgroundColor: '#4A00F8' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNote(null)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : existingNote ? (
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-gray-700 italic">"{existingNote}"</p>
                          <button
                            onClick={() => handleEditNote(q.id)}
                            className="text-xs text-purple-600 hover:text-purple-800 flex-shrink-0"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditNote(q.id)}
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                          <MessageSquare size={10} /> + Add note
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
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
  const { surveys, projects, currentUser, toggleExclusion, addToast, experts, updateAttachmentSummary, setResearcherNote } = useApp();

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
  const questionsWithAttachments = survey.questions.filter(q => q.attachment);

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

          {/* Attachment Validation */}
          {questionsWithAttachments.length > 0 && (
            <AttachmentValidationCard
              questions={questionsWithAttachments}
              surveyId={survey.id}
              onUpdateSummary={updateAttachmentSummary}
            />
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
                    <ResponseRow key={r.expertId} response={r} survey={survey} canExclude={canExclude} onToggleExclusion={(expertId) => toggleExclusion(survey.id, expertId)} expertKpis={getExpertKpis(r.expertId)} onSetNote={setResearcherNote} surveyId={survey.id} />
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

          <Button
            variant="primary"
            size="sm"
            className="w-full mb-3"
            onClick={() => navigate(`/projects/${projectId}/surveys/${surveyId}/datahub-preview`)}
          >
            Preview Intelligence Export →
          </Button>

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
              { label: 'Attachments validated', ok: questionsWithAttachments.every(q => q.attachment.summaryStatus === 'validated' || q.attachment.summaryStatus === 'ai_complete') || questionsWithAttachments.length === 0 },
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
