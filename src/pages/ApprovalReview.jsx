import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Check, List, CheckSquare, Star, AlignLeft, Info, GitCompare, Plus, Minus, Edit3, Calendar, Users, Mail, Bell, Send, RotateCcw, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';

const typeLabels = {
  single_choice: { label: 'Single Choice', icon: List, color: 'bg-purple-50 text-purple-600' },
  multi_choice: { label: 'Multiple Choice', icon: CheckSquare, color: 'bg-blue-50 text-blue-600' },
  rating_scale: { label: 'Rating Scale', icon: Star, color: 'bg-amber-50 text-amber-600' },
  open_text: { label: 'Open Text', icon: AlignLeft, color: 'bg-green-50 text-green-600' },
};

function QuestionPreview({ question, index }) {
  const t = typeLabels[question.type] || typeLabels.open_text;
  const Icon = t.icon;

  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-400 font-semibold">Q{index + 1}</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${t.color}`}>
          <Icon size={11} />
          {t.label}
        </span>
        {question.required && (
          <span className="text-xs text-red-500 font-medium">Required</span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-800 mb-3">{question.text}</p>

      {(question.type === 'single_choice' || question.type === 'multi_choice') && (
        <div className="space-y-1.5">
          {question.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <div className={`w-4 h-4 border-2 border-gray-300 flex-shrink-0 ${question.type === 'single_choice' ? 'rounded-full' : 'rounded'}`} />
              {opt}
            </div>
          ))}
        </div>
      )}

      {question.type === 'rating_scale' && (
        <div>
          <div className="flex gap-2">
            {Array.from({ length: question.scale }, (_, i) => (
              <div key={i} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-sm text-gray-500">{i + 1}</div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{question.labels[0]}</span>
            <span>{question.labels[1]}</span>
          </div>
        </div>
      )}

      {question.type === 'open_text' && (
        <div className="h-16 border border-gray-200 rounded-lg bg-white flex items-center justify-center">
          <span className="text-xs text-gray-300 italic">Free-text response area</span>
        </div>
      )}
    </div>
  );
}

export default function ApprovalReview() {
  const { projectId, surveyId } = useParams();
  const navigate = useNavigate();
  const { surveys, projects, experts, approveSurvey, rejectSurvey, internalUsers, currentUser, addToast, proposeAmendments, respondToEditorFeedback } = useApp();

  const survey = surveys.find(s => s.id === surveyId);
  const project = projects.find(p => p.id === projectId);

  const projectOwners = internalUsers.filter(u =>
    u.status === 'Active' &&
    u.projects.some(p => p.id === projectId && p.projectRole === 'Owner')
  );
  const currentUserIsOwner = internalUsers.find(u => u.email === currentUser.email)
    ?.projects.some(p => p.id === projectId && p.projectRole === 'Owner') ?? true;

  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approved, setApproved] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  // Amend mode state
  const [amendMode, setAmendMode] = useState(false);
  const [amendedQuestions, setAmendedQuestions] = useState(null);
  const [amendedWaveConfig, setAmendedWaveConfig] = useState(null);
  const [amendedExperts, setAmendedExperts] = useState(null);
  const [amendNotes, setAmendNotes] = useState({ questions: '', wave: '', experts: '' });
  const [expertSearch, setExpertSearch] = useState('');

  // PO responses to editor feedback (rejected/overridden amendments)
  const [poFeedback, setPoFeedback] = useState({}); // { [amendId]: { decision, newAfter, note } }
  const [poFeedbackNote, setPoFeedbackNote] = useState({});
  const [showSettled, setShowSettled] = useState(false);

  if (!survey) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Survey not found.</p>
    </div>
  );

  const handleApprove = () => {
    approveSurvey(surveyId);
    setApproved(true);
    setTimeout(() => navigate(`/projects/${projectId}`), 1500);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectSurvey(surveyId, rejectReason);
    navigate(`/projects/${projectId}`);
  };

  const enterAmendMode = () => {
    setAmendedQuestions(survey.questions.map(q => ({ ...q, options: q.options ? [...q.options] : [] })));
    setAmendedWaveConfig(survey.waveConfig ? {
      ...survey.waveConfig,
      selectedExperts: [...(survey.waveConfig.selectedExperts || [])],
    } : { sendDate: '', closeDate: '', emailSubject: '', senderName: '', selectedExperts: [] });
    setAmendedExperts([...(survey.waveConfig?.selectedExperts || [])]);
    setAmendMode(true);
    setRejectMode(false);
  };

  const computeDiff = () => {
    const amendments = [];
    const origQs = survey.questions;
    const newQs = amendedQuestions || origQs;

    origQs.forEach((origQ, idx) => {
      const newQ = newQs.find(q => q.id === origQ.id);
      if (!newQ) {
        amendments.push({ type: 'question_remove', target: origQ.id, label: `Q${idx+1} removed — "${origQ.text.slice(0,50)}"`, before: origQ, after: null, note: amendNotes.questions });
      } else if (newQ.text !== origQ.text || JSON.stringify(newQ.options) !== JSON.stringify(origQ.options)) {
        amendments.push({ type: 'question_edit', target: origQ.id, label: `Q${idx+1} edited — "${origQ.text.slice(0,40)}"`, before: origQ, after: newQ, note: amendNotes.questions });
      }
    });
    newQs.forEach(newQ => {
      if (!origQs.find(q => q.id === newQ.id)) {
        amendments.push({ type: 'question_add', target: newQ.id, label: `New question added — "${newQ.text.slice(0,50)}"`, before: null, after: newQ, note: amendNotes.questions });
      }
    });

    if (survey.waveConfig && amendedWaveConfig) {
      [['sendDate','Send date'],['closeDate','Close date'],['emailSubject','Email subject'],['senderName','Sender name']].forEach(([key, label]) => {
        if ((survey.waveConfig[key] || '') !== (amendedWaveConfig[key] || '')) {
          amendments.push({ type: 'wave_setting', target: key, label, before: survey.waveConfig[key] || '—', after: amendedWaveConfig[key] || '—', note: amendNotes.wave });
        }
      });
    }

    const origExperts = survey.waveConfig?.selectedExperts || [];
    const newExperts = amendedExperts || [];
    origExperts.forEach(e => {
      if (!newExperts.find(ne => ne.id === e.id)) {
        amendments.push({ type: 'expert_remove', target: e.id, label: `Remove expert — ${e.name} (${e.company})`, before: e, after: null, note: amendNotes.experts });
      }
    });
    newExperts.forEach(e => {
      if (!origExperts.find(oe => oe.id === e.id)) {
        amendments.push({ type: 'expert_add', target: e.id, label: `Add expert — ${e.name} (${e.company})`, before: null, after: e, note: amendNotes.experts });
      }
    });
    return amendments;
  };

  const handleSendBackWithChanges = () => {
    const amendments = computeDiff();
    if (amendments.length === 0) {
      addToast('No changes detected — edit something before sending back', 'warning');
      return;
    }
    proposeAmendments(surveyId, amendments, true);
    navigate(`/projects/${projectId}`);
  };

  const handleApproveWithAmendments = () => {
    const amendments = computeDiff();
    if (amendments.length === 0) {
      handleApprove();
      return;
    }
    proposeAmendments(surveyId, amendments, false);
    setApproved(true);
    setTimeout(() => navigate(`/projects/${projectId}`), 1500);
  };

  const handlePoFeedbackSubmit = () => {
    const responses = Object.entries(poFeedback).map(([id, val]) => ({ id, ...val }));
    if (responses.length === 0) return;
    respondToEditorFeedback(surveyId, responses);
    setPoFeedback({});
    setPoFeedbackNote({});
    addToast('Responses recorded');
  };

  const addAmendQuestion = () => {
    const q = { id: `q${Date.now()}`, type: 'single_choice', text: '', required: true, options: ['Option A', 'Option B', 'Option C'] };
    setAmendedQuestions(prev => [...(prev || []), q]);
  };

  // Diff computation
  const isResubmission = Boolean(survey.rejectionReason);
  const prevQuestions = survey.previousSnapshot?.questions || [];
  const currQuestions = survey.questions;
  const addedIds = currQuestions.filter(q => !prevQuestions.find(pq => pq.id === q.id)).map(q => q.id);
  const removedQuestions = prevQuestions.filter(pq => !currQuestions.find(q => q.id === pq.id));
  const modifiedIds = currQuestions
    .filter(q => {
      const prev = prevQuestions.find(pq => pq.id === q.id);
      return prev && (prev.text !== q.text || JSON.stringify(prev.options) !== JSON.stringify(q.options));
    })
    .map(q => q.id);

  const tabs = [
    { id: 'content', label: 'Survey Content' },
    { id: 'wave', label: 'Schedule Settings' },
    { id: 'experts', label: 'Expert List' },
  ];

  // Amendment helpers
  const allAmendments = survey.amendments || [];
  const pendingAmendments = allAmendments.filter(a => a.status === 'pending');
  const settledAmendments = allAmendments.filter(a => a.status === 'settled' || a.status === 'po_override');
  const rejectedAmendments = allAmendments.filter(a => a.status === 'rejected');
  const overriddenAmendments = allAmendments.filter(a => a.status === 'overridden');
  const hasPriorAmendments = allAmendments.length > 0;
  const unresolvedByEditor = rejectedAmendments.length + overriddenAmendments.length;

  const renderAmendValue = (val, type) => {
    if (val === null || val === undefined) return <span className="italic text-gray-400">(none)</span>;
    if (type === 'question_edit' || type === 'question_add' || type === 'question_remove') {
      if (typeof val === 'object' && val.text) return <span>{val.text}</span>;
    }
    if (type === 'expert_add' || type === 'expert_remove') {
      if (typeof val === 'object' && val.name) return <span>{val.name} · {val.company}</span>;
    }
    return <span>{String(val)}</span>;
  };

  const typeLabel = { question_edit: 'Question edited', question_add: 'Question added', question_remove: 'Question removed', expert_add: 'Expert added', expert_remove: 'Expert removed', wave_setting: 'Schedule setting changed' };
  const typeColor = { question_edit: 'amber', question_add: 'green', question_remove: 'red', expert_add: 'green', expert_remove: 'red', wave_setting: 'blue' };
  const colorMap = { amber: 'bg-amber-50 border-amber-200 text-amber-800', green: 'bg-green-50 border-green-200 text-green-800', red: 'bg-red-50 border-red-200 text-red-800', blue: 'bg-blue-50 border-blue-200 text-blue-800' };

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Approval Review</h1>
          <p className="text-sm text-gray-500">{survey.name} · {project?.name}</p>
        </div>
        <StatusBadge status={survey.status} />
      </div>

      {/* Approval routing */}
      <Card className="p-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800 mb-1">Approval authority</p>
            {projectOwners.length > 0 ? (
              <p className="text-sm text-gray-600">
                This survey requires approval from:{' '}
                <span className="font-semibold text-gray-800">
                  {projectOwners.map(u => `${u.firstName} ${u.lastName}`).join(', ')}
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-500">No Project Owners configured for this project.</p>
            )}
          </div>
          {!currentUserIsOwner && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg flex-shrink-0">
              <span>View only</span>
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-6 items-start">
        {/* Left: tabbed review content */}
        <div className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Prior amendment responses from editor */}
          {hasPriorAmendments && !amendMode && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <GitCompare size={15} className="text-purple-500" />
                  Amendment history ({allAmendments.length} change{allAmendments.length !== 1 ? 's' : ''})
                </p>
                <div className="flex items-center gap-2 text-xs">
                  {settledAmendments.length > 0 && <span className="text-green-600 font-medium">{settledAmendments.length} settled</span>}
                  {rejectedAmendments.length > 0 && <span className="text-red-600 font-medium">{rejectedAmendments.length} rejected by editor</span>}
                  {overriddenAmendments.length > 0 && <span className="text-amber-600 font-medium">{overriddenAmendments.length} overridden by editor</span>}
                  {pendingAmendments.length > 0 && <span className="text-gray-500 font-medium">{pendingAmendments.length} pending</span>}
                </div>
              </div>

              {/* Settled — collapsed */}
              {settledAmendments.length > 0 && (
                <div className="border border-green-200 rounded-xl overflow-hidden">
                  <button onClick={() => setShowSettled(s => !s)} className="w-full flex items-center justify-between px-4 py-2.5 bg-green-50 text-left">
                    <span className="text-xs font-semibold text-green-800">✓ {settledAmendments.length} settled (both sides agreed)</span>
                    {showSettled ? <ChevronUp size={14} className="text-green-600" /> : <ChevronDown size={14} className="text-green-600" />}
                  </button>
                  {showSettled && (
                    <div className="divide-y divide-green-100">
                      {settledAmendments.map(a => (
                        <div key={a.id} className="px-4 py-2 flex items-center gap-2">
                          <Check size={12} className="text-green-500 flex-shrink-0" />
                          <span className="text-xs text-gray-600">{a.label}</span>
                          <span className="text-xs text-gray-400 ml-auto">by {a.proposedBy}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rejected by editor */}
              {rejectedAmendments.map(a => (
                <div key={a.id} className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 flex items-center gap-2">
                    <XCircle size={13} className="text-red-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-red-800">Editor rejected: {a.label}</span>
                    <span className="text-xs text-red-500 ml-auto">Cycle {a.cycle}</span>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold mb-1">Your proposed change</p>
                      <p className="text-xs text-gray-700">{renderAmendValue(a.after, a.type)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                      <p className="text-xs text-red-500 font-semibold mb-1">Editor's reason</p>
                      <p className="text-xs text-gray-700">{a.resolution?.reason || '(no reason given)'}</p>
                    </div>
                  </div>
                  {poFeedback[a.id] ? (
                    <div className="px-3 pb-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                        <Check size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {poFeedback[a.id].decision === 'accept_rejection' ? 'You accepted the rejection — change will be dropped' : 'You are re-proposing this change'}
                        </span>
                        <button onClick={() => setPoFeedback(p => { const n={...p}; delete n[a.id]; return n; })} className="ml-auto text-xs text-gray-400 hover:text-gray-600">Undo</button>
                      </div>
                      {poFeedback[a.id].decision === 'repropose' && (
                        <input value={poFeedback[a.id].note || ''} onChange={e => setPoFeedback(p => ({...p, [a.id]: {...p[a.id], note: e.target.value}}))} placeholder="Add a note explaining your re-proposal..." className="w-full mt-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
                      )}
                    </div>
                  ) : (
                    <div className="px-3 pb-3 flex gap-2">
                      <button onClick={() => setPoFeedback(p => ({...p, [a.id]: { decision: 'accept_rejection' }}))} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50">Accept rejection — drop change</button>
                      <button onClick={() => setPoFeedback(p => ({...p, [a.id]: { decision: 'repropose', newAfter: a.after, note: '' }}))} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-amber-700 border border-amber-200 hover:bg-amber-50">Re-propose</button>
                    </div>
                  )}
                </div>
              ))}

              {/* Overridden by editor */}
              {overriddenAmendments.map(a => (
                <div key={a.id} className="border border-amber-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                    <Edit3 size={13} className="text-amber-600 flex-shrink-0" />
                    <span className="text-xs font-semibold text-amber-800">Editor overrode: {a.label}</span>
                    <span className="text-xs text-amber-500 ml-auto">Cycle {a.cycle}</span>
                  </div>
                  <div className="p-3 grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold mb-1">Original</p>
                      <p className="text-xs text-gray-500 line-through">{renderAmendValue(a.before, a.type)}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 border border-purple-100">
                      <p className="text-xs text-purple-500 font-semibold mb-1">Your proposed</p>
                      <p className="text-xs text-gray-700">{renderAmendValue(a.after, a.type)}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                      <p className="text-xs text-amber-600 font-semibold mb-1">Editor's version</p>
                      <p className="text-xs text-gray-800 font-medium">{renderAmendValue(a.resolution?.counterValue, a.type)}</p>
                    </div>
                  </div>
                  {poFeedback[a.id] ? (
                    <div className="px-3 pb-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                        <Check size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {poFeedback[a.id].decision === 'accept_override' ? "You accepted the editor's version" : 'You are re-proposing your original change'}
                        </span>
                        <button onClick={() => setPoFeedback(p => { const n={...p}; delete n[a.id]; return n; })} className="ml-auto text-xs text-gray-400 hover:text-gray-600">Undo</button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 pb-3 flex gap-2">
                      <button onClick={() => setPoFeedback(p => ({...p, [a.id]: { decision: 'accept_override' }}))} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50">Accept editor's version</button>
                      <button onClick={() => setPoFeedback(p => ({...p, [a.id]: { decision: 'repropose', newAfter: a.after }}))} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-amber-700 border border-amber-200 hover:bg-amber-50">Re-propose mine</button>
                    </div>
                  )}
                </div>
              ))}

              {unresolvedByEditor > 0 && Object.keys(poFeedback).length > 0 && (
                <button onClick={handlePoFeedbackSubmit} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: '#4A00F8' }}>
                  <Send size={14} /> Submit my responses ({Object.keys(poFeedback).length})
                </button>
              )}
            </div>
          )}

          {/* Amend mode — Questions */}
          {amendMode && activeTab === 'content' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <Edit3 size={14} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700"><strong>Amend mode:</strong> Edit questions below. Changes will be tracked and sent to the editor.</p>
              </div>
              {(amendedQuestions || []).map((q, i) => (
                <div key={q.id} className="border border-gray-200 rounded-xl p-4 space-y-2 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-400">Q{i+1}</span>
                    <button onClick={() => setAmendedQuestions(prev => prev.filter((item, idx) => idx !== i))} className="text-gray-300 hover:text-red-400 p-1"><Trash2 size={13} /></button>
                  </div>
                  <textarea value={q.text} onChange={e => setAmendedQuestions(prev => prev.map((qq, idx) => idx === i ? { ...qq, text: e.target.value } : qq))} rows={2} placeholder="Question text..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:border-amber-400 focus:outline-none" />
                  {(q.options || []).length > 0 && (
                    <div className="space-y-1">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input value={opt} onChange={e => {
                            const opts = [...q.options]; opts[oi] = e.target.value;
                            setAmendedQuestions(prev => prev.map((qq, idx) => idx === i ? { ...qq, options: opts } : qq));
                          }} className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs" />
                          <button onClick={() => {
                            const opts = q.options.filter((_, idx) => idx !== oi);
                            setAmendedQuestions(prev => prev.map((qq, idx) => idx === i ? { ...qq, options: opts } : qq));
                          }} className="text-gray-300 hover:text-red-400"><XCircle size={13} /></button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const opts = [...q.options, `Option ${q.options.length + 1}`];
                        setAmendedQuestions(prev => prev.map((qq, idx) => idx === i ? { ...qq, options: opts } : qq));
                      }} className="text-xs text-purple-600 hover:text-purple-800">+ Add option</button>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addAmendQuestion} className="w-full py-2 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-purple-300 hover:text-purple-500 transition-colors flex items-center justify-center gap-1">
                <Plus size={14} /> Add question
              </button>
            </div>
          )}

          {/* Amend mode — Schedule settings */}
          {amendMode && activeTab === 'wave' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <Edit3 size={14} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700"><strong>Amend mode:</strong> Edit schedule settings. Changes will be tracked.</p>
              </div>
              <Card className="p-5 space-y-4">
                {[
                  { label: 'Send date', key: 'sendDate', type: 'date' },
                  { label: 'Close date', key: 'closeDate', type: 'date' },
                  { label: 'Email subject', key: 'emailSubject', type: 'text' },
                  { label: 'Sender name', key: 'senderName', type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 line-through w-40 truncate">{(survey.waveConfig?.[key] || '—').slice(0, 20)}</span>
                      <span className="text-gray-300">→</span>
                      <input
                        type={type}
                        value={amendedWaveConfig?.[key] || ''}
                        onChange={e => setAmendedWaveConfig(prev => ({ ...prev, [key]: e.target.value }))}
                        className="flex-1 border border-amber-200 rounded-lg px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none bg-amber-50"
                      />
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* Amend mode — Expert list */}
          {amendMode && activeTab === 'experts' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <Edit3 size={14} className="text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700"><strong>Amend mode:</strong> Add or remove experts. Changes will be tracked.</p>
              </div>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Current expert list</h3>
                <div className="divide-y divide-gray-50">
                  {(amendedExperts || []).map(e => (
                    <div key={e.id} className="flex items-center gap-3 py-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700 flex-shrink-0">
                        {e.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{e.name}</p>
                        <p className="text-xs text-gray-400">{e.company}</p>
                      </div>
                      <button onClick={() => setAmendedExperts(prev => prev.filter(ae => ae.id !== e.id))} className="text-xs text-red-400 hover:text-red-600 border border-red-200 rounded px-2 py-0.5">Remove</button>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Add experts</h3>
                <input value={expertSearch} onChange={e => setExpertSearch(e.target.value)} placeholder="Search experts..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:border-amber-400 focus:outline-none" />
                <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                  {experts.filter(e =>
                    !(amendedExperts || []).find(ae => ae.id === e.id) &&
                    (!expertSearch || e.name.toLowerCase().includes(expertSearch.toLowerCase()) || e.company.toLowerCase().includes(expertSearch.toLowerCase()))
                  ).map(e => (
                    <div key={e.id} className="flex items-center gap-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{e.name}</p>
                        <p className="text-xs text-gray-400">{e.company} · {e.status}</p>
                      </div>
                      <button
                        onClick={() => setAmendedExperts(prev => [...(prev || []), { id: e.id, name: e.name, email: e.email, company: e.company, status: e.status }])}
                        disabled={e.status === 'Opted-out'}
                        className="text-xs text-purple-600 hover:text-purple-800 border border-purple-200 rounded px-2 py-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {e.status === 'Opted-out' ? 'Opted-out' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Tab: Survey Content */}
          {!amendMode && activeTab === 'content' && (
            <div className="space-y-4">
              {/* Diff view banner */}
              {isResubmission ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <GitCompare size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-800 mb-1">Resubmission — changes highlighted below</p>
                      <p className="text-xs text-blue-600">
                        {addedIds.length > 0 && <span className="mr-3"><span className="font-semibold">{addedIds.length} added</span></span>}
                        {removedQuestions.length > 0 && <span className="mr-3"><span className="font-semibold">{removedQuestions.length} removed</span></span>}
                        {modifiedIds.length > 0 && <span><span className="font-semibold">{modifiedIds.length} modified</span></span>}
                        {addedIds.length === 0 && removedQuestions.length === 0 && modifiedIds.length === 0 && 'No structural changes to questions'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                    <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-700 mb-0.5">Previous rejection reason</p>
                      <p className="text-xs text-red-600">{survey.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    This is a first submission — no previous version to compare against.
                  </p>
                </div>
              )}

              {/* Survey metadata */}
              <Card className="p-5">
                <h2 className="font-semibold text-gray-900 mb-3 text-sm">Survey Details</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Created by', value: survey.createdBy },
                    { label: 'Project', value: project?.name },
                    { label: 'Category', value: survey.category },
                    { label: 'Questions', value: survey.questions.length },
                    { label: 'Experts targeted', value: survey.expertsTargeted },
                    { label: 'Submitted', value: '2026-03-10 16:42' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-xs text-gray-400 font-medium">{label}</span>
                      <span className="text-gray-800 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Questions with diff annotations */}
              <Card className="p-5">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
                  <span>Survey Questions</span>
                  <Badge color="gray">{survey.questions.length} questions</Badge>
                </h2>

                {isResubmission && removedQuestions.map((q, i) => (
                  <div key={q.id} className="mb-3 rounded-xl border border-red-200 bg-red-50 overflow-hidden opacity-80">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 border-b border-red-200">
                      <Minus size={12} className="text-red-500" />
                      <span className="text-xs font-semibold text-red-700">Removed question</span>
                    </div>
                    <div className="p-3 line-through text-gray-400">
                      <p className="text-xs text-gray-400 font-medium mb-1">Previous Q{i + 1}</p>
                      <p className="text-sm">{q.text}</p>
                    </div>
                  </div>
                ))}

                <div className="space-y-3">
                  {survey.questions.map((q, i) => {
                    const isAdded = isResubmission && addedIds.includes(q.id);
                    const isModified = isResubmission && modifiedIds.includes(q.id);
                    const prevQ = prevQuestions.find(pq => pq.id === q.id);
                    return (
                      <div key={q.id} className={isAdded ? 'rounded-xl border border-green-200 overflow-hidden' : isModified ? 'rounded-xl border border-amber-200 overflow-hidden' : ''}>
                        {isAdded && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border-b border-green-200">
                            <Plus size={12} className="text-green-600" />
                            <span className="text-xs font-semibold text-green-700">New question added</span>
                          </div>
                        )}
                        {isModified && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border-b border-amber-200">
                            <Edit3 size={12} className="text-amber-600" />
                            <span className="text-xs font-semibold text-amber-700">Question modified</span>
                          </div>
                        )}
                        {isModified && prevQ && (
                          <div className="px-3 py-2 bg-red-50 border-b border-amber-100 text-xs text-gray-500 line-through">
                            Previous: {prevQ.text}
                          </div>
                        )}
                        <QuestionPreview key={q.id} question={q} index={i} />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* Tab: Schedule Settings */}
          {!amendMode && activeTab === 'wave' && (
            <div className="space-y-4">
              {survey.waveConfig ? (
                <Card className="p-5">
                  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar size={15} className="text-gray-400" />
                    Schedule
                  </h2>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                    {[
                      { label: 'Send date', value: survey.waveConfig.sendDate ? new Date(survey.waveConfig.sendDate).toLocaleDateString() : '—' },
                      { label: 'Close date', value: survey.waveConfig.closeDate ? new Date(survey.waveConfig.closeDate).toLocaleDateString() : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span className="text-xs text-gray-400 font-medium">{label}</span>
                        <span className="text-gray-800 font-medium">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">Email Template</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">Subject</span>
                        <span className="text-gray-700 text-xs">{survey.waveConfig.emailSubject || '—'}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">Sender</span>
                        <span className="text-gray-700 text-xs">{survey.waveConfig.senderName || '—'}</span>
                      </div>
                      {survey.waveConfig.emailBody && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-400 block mb-1">Body preview</span>
                          <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {survey.waveConfig.emailBody}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {survey.waveConfig.reminders?.length > 0 && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Bell size={14} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Reminders ({survey.waveConfig.reminders.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {survey.waveConfig.reminders.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                            <Bell size={11} className="text-gray-400 flex-shrink-0" />
                            Reminder {i + 1}: {new Date(r).toLocaleDateString()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {survey.waveConfig.alertEnabled && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <AlertTriangle size={12} className="flex-shrink-0" />
                        Response rate alert: below {survey.waveConfig.alertThreshold}% with {survey.waveConfig.alertDaysRemaining} days remaining
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-5 border-gray-200 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <Info size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">No schedule settings configured</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Schedule settings (send date, email template, reminders) should be configured in Draft before submission.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Tab: Expert List */}
          {!amendMode && activeTab === 'experts' && (
            <div className="space-y-4">
              {survey.waveConfig?.selectedExperts?.length > 0 ? (
                <Card className="p-5">
                  <h2 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-gray-400" />
                      <span>Expert Target List</span>
                    </div>
                    <Badge color="gray">{survey.waveConfig.selectedExperts.length} experts</Badge>
                  </h2>
                  {survey.waveConfig.selectedExperts.some(e => e.status === 'Opted-out') && (
                    <p className="text-xs text-amber-600 mb-3">Includes opted-out expert(s) — will be suppressed at send time.</p>
                  )}
                  <div className="divide-y divide-gray-50">
                    {survey.waveConfig.selectedExperts.map(e => (
                      <div key={e.id} className="flex items-center gap-3 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-semibold text-purple-700 flex-shrink-0">
                          {e.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{e.name}</p>
                          <p className="text-xs text-gray-400">{e.company} · {e.email}</p>
                        </div>
                        {e.status === 'Opted-out' && (
                          <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded flex-shrink-0">Opted-out</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card className="p-5 border-gray-200 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <Info size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">No experts configured</p>
                      <p className="text-xs text-gray-500 mt-1">
                        The expert list should be configured in Draft before submission.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Right: Review panel */}
        <div className="w-80 flex-shrink-0 space-y-4 sticky top-6">
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Review Decision</h2>

            {approved ? (
              <div className="text-center py-4">
                <CheckCircle size={36} className="text-green-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-green-700">Survey Approved!</p>
                <p className="text-xs text-gray-400 mt-1">Redirecting to project...</p>
              </div>
            ) : (
              <>
                {amendMode ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                      <Edit3 size={14} className="text-amber-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-amber-700">Amendment mode — track changes to send back</span>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-500">Note to editor (optional)</label>
                      <textarea
                        value={amendNotes.questions}
                        onChange={e => setAmendNotes(n => ({ ...n, questions: e.target.value }))}
                        placeholder="Explain your amendments..."
                        rows={3}
                        className="w-full border border-amber-200 rounded-xl px-3 py-2 text-xs resize-none focus:border-amber-400 focus:outline-none bg-amber-50"
                      />
                    </div>
                    <button
                      onClick={handleSendBackWithChanges}
                      disabled={!currentUserIsOwner}
                      className="w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#4A00F8' }}
                    >
                      <RotateCcw size={15} />
                      Send back with changes
                    </button>
                    <button
                      onClick={handleApproveWithAmendments}
                      disabled={!currentUserIsOwner}
                      className="w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      <CheckCircle size={15} />
                      Approve with amendments
                    </button>
                    <button
                      onClick={() => { setAmendMode(false); setAmendedQuestions(null); setAmendedWaveConfig(null); setAmendedExperts(null); }}
                      className="w-full py-2 rounded-xl text-gray-500 font-medium text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Cancel amend
                    </button>
                  </div>
                ) : !rejectMode ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleApprove}
                      disabled={!currentUserIsOwner}
                      className="w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      <CheckCircle size={16} />
                      Approve Survey + Wave
                    </button>
                    <button
                      onClick={enterAmendMode}
                      disabled={!currentUserIsOwner}
                      className="w-full py-2.5 rounded-xl font-semibold text-sm border-2 flex items-center justify-center gap-2 hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ borderColor: '#4A00F8', color: '#4A00F8' }}
                    >
                      <Edit3 size={16} />
                      Amend &amp; Return / Approve
                    </button>
                    <button
                      onClick={() => setRejectMode(true)}
                      className="w-full py-2.5 rounded-xl text-red-600 font-semibold text-sm border-2 border-red-200 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                    >
                      <XCircle size={16} />
                      Reject with Feedback
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50">
                      <XCircle size={14} className="text-red-500" />
                      <span className="text-xs font-medium text-red-700">Rejection mode</span>
                    </div>
                    <label className="block text-xs font-medium text-gray-600">Feedback for standard user</label>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Explain what needs to be revised..."
                      rows={4}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:border-red-300 transition-colors"
                    />
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => setRejectMode(false)}>Cancel</Button>
                      <Button variant="danger" size="sm" className="flex-1" onClick={handleReject} disabled={!rejectReason.trim()}>
                        Submit Rejection
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Checklist */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Info size={14} className="text-gray-400" />
              Approval Checklist
            </h3>
            <div className="space-y-2">
              {[
                { label: `Has questions (${survey.questions.length})`, ok: survey.questions.length > 0 },
                { label: 'All questions have text', ok: survey.questions.every(q => q.text) },
                { label: 'Schedule configured', ok: Boolean(survey.waveConfig) },
                { label: `Expert list set (${survey.waveConfig?.selectedExperts?.length || 0} experts)`, ok: Boolean(survey.waveConfig?.selectedExperts?.length) },
                { label: 'Send & close dates set', ok: Boolean(survey.waveConfig?.sendDate && survey.waveConfig?.closeDate) },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-green-100' : 'bg-red-100'}`}>
                    {ok
                      ? <Check size={10} className="text-green-600" />
                      : <XCircle size={10} className="text-red-500" />}
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </Card>

          {/* Submission notes */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Submission Notes</h3>
            <p className="text-xs text-gray-400 italic">No notes added by the standard user.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
