import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paperclip, Eye, EyeOff, FileWarning, MessageSquare, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

function getMimeLabel(mimeType) {
  if (!mimeType) return 'File';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.endsWith('.xlsx')) return 'Excel';
  if (mimeType.includes('word')) return 'Word';
  return 'File';
}

function getTypeLabel(type) {
  if (type === 'single_choice') return 'Choice';
  if (type === 'rating_scale') return 'Rating';
  if (type === 'open_text') return 'Open text';
  if (type === 'multi_choice') return 'Multi-choice';
  return type;
}

function formatAnswer(ans, type) {
  if (ans === null || ans === undefined) return '—';
  if (type === 'rating_scale') return `${ans} / 5`;
  if (type === 'open_text') return ans;
  if (Array.isArray(ans)) return ans.join(', ');
  return String(ans);
}

function NoteCell({ note, onEdit }) {
  if (note) {
    return (
      <div className="flex items-start gap-1">
        <p className="text-xs text-gray-600 italic flex-1">"{note}"</p>
        <button onClick={onEdit} className="text-xs text-purple-600 hover:text-purple-800 flex-shrink-0">Edit</button>
      </div>
    );
  }
  return (
    <button onClick={onEdit} className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
      <MessageSquare size={10} /> + Add note
    </button>
  );
}

function QuestionGroup({
  question,
  responses,
  surveyId,
  onToggleExclusion,
  onUpdateSummary,
  onSetNote,
}) {
  const [attEditing, setAttEditing] = useState(false);
  const [attText, setAttText] = useState(question.attachment?.attachmentSummary || '');
  const [editingNote, setEditingNote] = useState(null); // expertId
  const [noteText, setNoteText] = useState('');

  const handleValidate = () => {
    onUpdateSummary(surveyId, question.id, attText, 'researcher');
    setAttEditing(false);
  };

  const handleStartEditAtt = () => {
    setAttText(question.attachment?.attachmentSummary || '');
    setAttEditing(true);
  };

  const handleEditNote = (expertId) => {
    const resp = responses.find(r => r.expertId === expertId);
    setNoteText((resp?.notes || {})[question.id] || '');
    setEditingNote(expertId);
  };

  const handleSaveNote = (expertId) => {
    onSetNote(surveyId, expertId, question.id, noteText);
    setEditingNote(null);
    setNoteText('');
  };

  const att = question.attachment;

  return (
    <div className="mb-6">
      {/* Question header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">{question.text}</p>
        </div>
        <Badge color="gray" size="xs">{getTypeLabel(question.type)}</Badge>
      </div>

      {/* Attachment card */}
      {att && (
        <div className="border border-gray-200 rounded-xl p-4 mb-3 bg-gray-50">
          <div className="flex items-center gap-3 mb-2">
            <Paperclip size={14} className="text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-medium flex-1 truncate">{att.fileName}</span>
            <Badge color="gray" size="xs">{getMimeLabel(att.mimeType)}</Badge>
            {att.summaryStatus === 'needs_review' && <Badge color="red" size="xs">Needs review</Badge>}
            {att.summaryStatus === 'ai_complete' && <Badge color="green" size="xs">AI validated</Badge>}
            {att.summaryStatus === 'validated' && <Badge color="green" size="xs">Validated</Badge>}
          </div>

          {attEditing ? (
            <div>
              <textarea
                className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
                rows={3}
                value={attText}
                onChange={e => setAttText(e.target.value)}
                placeholder="Enter attachment summary…"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <Button variant="primary" size="xs" onClick={handleValidate}>Validate</Button>
                <Button variant="secondary" size="xs" onClick={() => setAttEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div>
              {att.attachmentSummary ? (
                <p className="text-sm text-gray-600 mb-1">{att.attachmentSummary}</p>
              ) : (
                <p className="text-xs text-gray-400 italic mb-1">No summary yet.</p>
              )}
              <button
                onClick={handleStartEditAtt}
                className="text-xs text-purple-600 hover:text-purple-800"
              >
                {att.summaryStatus === 'needs_review' ? '+ Add summary & validate' : 'Edit'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Answers table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5">Expert</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5">Answer</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5">Researcher Note</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {responses.map(r => {
              const ans = r.answers[question.id];
              const note = (r.notes || {})[question.id];
              const isEditingThisNote = editingNote === r.expertId;
              return (
                <tr
                  key={r.expertId}
                  className={`border-b border-gray-50 last:border-0 ${r.excluded ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{r.expertName}</p>
                    <p className="text-xs text-gray-400">{r.company}</p>
                  </td>
                  <td className="px-4 py-3">
                    {question.type === 'open_text' ? (
                      <p className="text-sm text-gray-700 italic">&ldquo;{ans || '—'}&rdquo;</p>
                    ) : (
                      <p className="text-sm text-gray-700">{formatAnswer(ans, question.type)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditingThisNote ? (
                      <div>
                        <textarea
                          className="w-full text-xs border border-gray-200 rounded p-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-purple-400"
                          rows={2}
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          placeholder="Add a researcher note…"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handleSaveNote(r.expertId)}
                            className="text-xs font-medium text-white px-2 py-0.5 rounded"
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
                    ) : (
                      <NoteCell note={note} onEdit={() => handleEditNote(r.expertId)} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onToggleExclusion(surveyId, r.expertId)}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border transition-colors ${
                        r.excluded
                          ? 'border-green-200 text-green-600 hover:bg-green-50'
                          : 'border-red-200 text-red-500 hover:bg-red-50'
                      }`}
                    >
                      {r.excluded ? <><Eye size={10} /> Include</> : <><EyeOff size={10} /> Exclude</>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DataHubPreview() {
  const { projectId, surveyId } = useParams();
  const navigate = useNavigate();
  const {
    surveys, projects, currentUser,
    toggleExclusion, updateAttachmentSummary, setResearcherNote, addToast,
  } = useApp();

  const survey = surveys.find(s => s.id === surveyId);
  const project = projects.find(p => p.id === projectId);

  if (!survey) return <div className="p-6 text-center text-gray-500">Survey not found.</div>;

  const questionsWithAttachments = survey.questions.filter(q => q.attachment);
  const needsReviewAttachments = questionsWithAttachments.filter(q => q.attachment.summaryStatus === 'needs_review');
  const resolvedAttachments = questionsWithAttachments.filter(q =>
    q.attachment.summaryStatus === 'validated' || q.attachment.summaryStatus === 'ai_complete'
  );

  const includedResponses = survey.responses.filter(r => !r.excluded);
  const excludedResponses = survey.responses.filter(r => r.excluded);

  const totalNotes = survey.responses.reduce((acc, r) => {
    return acc + Object.keys(r.notes || {}).filter(k => (r.notes || {})[k]).length;
  }, 0);

  const attachmentsAllResolved = needsReviewAttachments.length === 0;

  const handleConfirm = () => {
    addToast('Intelligence data confirmed. Ready for DataHub transfer in Phase 2.');
    navigate(`/projects/${projectId}/surveys/${surveyId}/review`);
  };

  const handleToggleExclusion = (sid, expertId) => {
    toggleExclusion(sid, expertId);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Main area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl">
          {/* Header */}
          <div className="mb-5">
            <button
              onClick={() => navigate(`/projects/${projectId}/surveys/${surveyId}/review`)}
              className="text-sm text-purple-600 hover:text-purple-800 mb-3 inline-flex items-center gap-1"
            >
              ← Back to Review
            </button>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Intelligence Export Preview</h1>
            <p className="text-sm text-gray-500">{survey.name} · {project?.name} · Wave {survey.wave}</p>
          </div>

          {/* Needs-review warning banner */}
          {needsReviewAttachments.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 mb-5">
              <FileWarning size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">Attachments requiring review</p>
                <ul className="text-sm text-red-600 list-disc list-inside space-y-0.5">
                  {needsReviewAttachments.map(q => (
                    <li key={q.id}>{q.attachment.fileName} — {q.text.slice(0, 60)}{q.text.length > 60 ? '…' : ''}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Question groups */}
          {survey.questions.map(q => (
            <QuestionGroup
              key={q.id}
              question={q}
              responses={survey.responses}
              surveyId={survey.id}
              onToggleExclusion={handleToggleExclusion}
              onUpdateSummary={updateAttachmentSummary}
              onSetNote={setResearcherNote}
            />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 flex-shrink-0 border-l border-gray-100 bg-white flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Export Summary</h2>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total answers</span>
              <span className="font-semibold text-gray-800">{survey.responses.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Included</span>
              <span className="font-semibold text-green-600">{includedResponses.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Excluded</span>
              <span className="font-semibold text-gray-800">{excludedResponses.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Attachments resolved</span>
              <span className={`font-semibold ${attachmentsAllResolved ? 'text-green-600' : 'text-amber-600'}`}>
                {resolvedAttachments.length}/{questionsWithAttachments.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Notes added</span>
              <span className="font-semibold text-gray-800">{totalNotes}</span>
            </div>
          </div>
        </div>

        <div className="p-5 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Checklist</h3>
          <div className="space-y-2">
            {[
              {
                label: 'Attachments validated',
                ok: attachmentsAllResolved || questionsWithAttachments.length === 0,
                blocking: true,
              },
              {
                label: 'Exclusions reviewed',
                ok: true,
                blocking: false,
              },
              {
                label: `Notes added (${totalNotes})`,
                ok: totalNotes > 0,
                blocking: false,
              },
            ].map(({ label, ok, blocking }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-green-100' : blocking ? 'bg-red-100' : 'bg-gray-100'}`}>
                  {ok ? (
                    <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#10B981" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : blocking ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  )}
                </div>
                <span className={!ok && blocking ? 'text-red-600' : ''}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5">
          {!attachmentsAllResolved && (
            <p className="text-xs text-red-500 mb-2">
              Resolve all attachment summaries before confirming.
            </p>
          )}
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            disabled={!attachmentsAllResolved}
            onClick={handleConfirm}
            title={!attachmentsAllResolved ? 'All attachment summaries must be validated first' : undefined}
          >
            Confirm &amp; Store
          </Button>
          <p className="text-xs text-gray-400 mt-2 text-center">Phase 2: button becomes &ldquo;Transfer to DataHub&rdquo;</p>
        </div>
      </div>
    </div>
  );
}
