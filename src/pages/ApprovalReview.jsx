import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Check, List, CheckSquare, Star, AlignLeft, Info } from 'lucide-react';
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
  const { surveys, projects, approveSurvey, rejectSurvey } = useApp();

  const survey = surveys.find(s => s.id === surveyId);
  const project = projects.find(p => p.id === projectId);

  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approved, setApproved] = useState(false);

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

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Approval Review</h1>
          <p className="text-sm text-gray-500">{survey.name} · {project?.name}</p>
        </div>
        <StatusBadge status={survey.status} />
      </div>

      <div className="flex gap-6 items-start">
        {/* Left: Survey content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Diff view banner */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              This is a first submission — no previous version to compare against.
            </p>
          </div>

          {/* Survey metadata */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Survey Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Created by', value: survey.createdBy },
                { label: 'Project', value: project?.name },
                { label: 'Wave', value: `Wave ${survey.wave}` },
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

          {/* Questions */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span>Survey Questions</span>
              <Badge color="gray">{survey.questions.length} questions</Badge>
            </h2>
            <div className="space-y-3">
              {survey.questions.map((q, i) => (
                <QuestionPreview key={q.id} question={q} index={i} />
              ))}
            </div>
          </Card>
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
                {!rejectMode ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleApprove}
                      className="w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      <CheckCircle size={16} />
                      Approve Survey
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
                    <label className="block text-xs font-medium text-gray-600">Feedback for researcher</label>
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
              Survey Checklist
            </h3>
            <div className="space-y-2">
              {[
                { label: `Has questions (${survey.questions.length})`, ok: survey.questions.length > 0 },
                { label: 'All required fields set', ok: survey.questions.every(q => q.text) },
                { label: 'Expert panel not yet assigned', ok: true, neutral: true },
                { label: 'Send date not yet configured', ok: true, neutral: true },
              ].map(({ label, ok, neutral }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? (neutral ? 'bg-gray-100' : 'bg-green-100') : 'bg-red-100'}`}>
                    {ok ? (
                      neutral
                        ? <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        : <Check size={10} className="text-green-600" />
                    ) : (
                      <XCircle size={10} className="text-red-500" />
                    )}
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </Card>

          {/* Submission notes */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Submission Notes</h3>
            <p className="text-xs text-gray-400 italic">No notes added by the researcher.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
