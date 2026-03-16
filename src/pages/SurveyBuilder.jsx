import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Save,
  Send, Eye, EyeOff, X, Check, Smartphone, Monitor,
  AlignLeft, List, CheckSquare, Star
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Single Choice', icon: List, description: 'One answer from options' },
  { value: 'multi_choice', label: 'Multiple Choice', icon: CheckSquare, description: 'Multiple answers allowed' },
  { value: 'rating_scale', label: 'Rating Scale', icon: Star, description: 'Numeric rating 1–5 or 1–7' },
  { value: 'open_text', label: 'Open Text', icon: AlignLeft, description: 'Free-form text response' },
];

const newQuestion = (type = 'single_choice') => ({
  id: `q${Date.now()}`,
  type,
  text: '',
  required: true,
  options: type === 'single_choice' || type === 'multi_choice' ? ['Option A', 'Option B', 'Option C'] : [],
  scale: 5,
  labels: ['Very low', 'Very high'],
});

function QuestionTypeIcon({ type }) {
  const t = QUESTION_TYPES.find(t => t.value === type);
  const Icon = t?.icon || List;
  const colors = {
    single_choice: 'bg-purple-50 text-purple-600',
    multi_choice: 'bg-blue-50 text-blue-600',
    rating_scale: 'bg-amber-50 text-amber-600',
    open_text: 'bg-green-50 text-green-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors[type] || 'bg-gray-50 text-gray-600'}`}>
      <Icon size={11} />
      {t?.label || type}
    </span>
  );
}

function QuestionCard({ question, index, total, onChange, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);

  const updateOption = (i, value) => {
    const opts = [...question.options];
    opts[i] = value;
    onChange({ ...question, options: opts });
  };

  const removeOption = (i) => {
    onChange({ ...question, options: question.options.filter((_, idx) => idx !== i) });
  };

  const addOption = () => {
    onChange({ ...question, options: [...question.options, `Option ${question.options.length + 1}`] });
  };

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <GripVertical size={16} className="text-gray-300 cursor-grab" />
        <span className="text-xs font-semibold text-gray-400 w-5">Q{index + 1}</span>
        <QuestionTypeIcon type={question.type} />
        {question.required && (
          <span className="text-xs text-red-500 font-medium">Required</span>
        )}
        <div className="flex-1" />
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-400">
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400">
          <Trash2 size={15} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Question type</label>
            <select
              value={question.type}
              onChange={e => onChange({ ...question, type: e.target.value, options: (e.target.value === 'single_choice' || e.target.value === 'multi_choice') ? (question.options.length > 0 ? question.options : ['Option A', 'Option B']) : [] })}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 w-full"
            >
              {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Question text */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Question text</label>
            <textarea
              value={question.text}
              onChange={e => onChange({ ...question, text: e.target.value })}
              placeholder="Enter your question here..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none bg-gray-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Options for choice types */}
          {(question.type === 'single_choice' || question.type === 'multi_choice') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Options</label>
              <div className="space-y-1.5">
                {question.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-4 h-4 flex-shrink-0 border-2 border-gray-300 ${question.type === 'single_choice' ? 'rounded-full' : 'rounded'}`} />
                    <input
                      type="text"
                      value={opt}
                      onChange={e => updateOption(i, e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-gray-50 focus:bg-white transition-colors"
                    />
                    {question.options.length > 2 && (
                      <button onClick={() => removeOption(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="flex items-center gap-1.5 text-xs font-medium mt-1 hover:opacity-80 transition-opacity"
                  style={{ color: '#4A00F8' }}
                >
                  <Plus size={13} /> Add option
                </button>
              </div>
            </div>
          )}

          {/* Rating scale */}
          {question.type === 'rating_scale' && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 w-20">Scale</label>
                <select
                  value={question.scale}
                  onChange={e => onChange({ ...question, scale: Number(e.target.value) })}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700"
                >
                  <option value={5}>1 – 5</option>
                  <option value={7}>1 – 7</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 w-20">Min label</label>
                <input
                  type="text"
                  value={question.labels[0]}
                  onChange={e => onChange({ ...question, labels: [e.target.value, question.labels[1]] })}
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-gray-50"
                  placeholder="e.g. Very low"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 w-20">Max label</label>
                <input
                  type="text"
                  value={question.labels[1]}
                  onChange={e => onChange({ ...question, labels: [question.labels[0], e.target.value] })}
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-gray-50"
                  placeholder="e.g. Very high"
                />
              </div>
            </div>
          )}

          {/* Required toggle */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onChange({ ...question, required: !question.required })}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${question.required ? '' : 'bg-gray-200'}`}
              style={question.required ? { backgroundColor: '#4A00F8' } : {}}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${question.required ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </button>
            <span className="text-xs text-gray-500">Required</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpertPreview({ surveyName, questions, currentQIndex, setCurrentQIndex, previewAnswers, setPreviewAnswers, mobile }) {
  const question = questions[currentQIndex];
  const progress = questions.length > 0 ? ((currentQIndex + 1) / questions.length) * 100 : 0;

  const handleAnswer = (value) => {
    setPreviewAnswers(prev => ({ ...prev, [currentQIndex]: value }));
  };

  const handleMultiAnswer = (value) => {
    const current = previewAnswers[currentQIndex] || [];
    if (current.includes(value)) {
      setPreviewAnswers(prev => ({ ...prev, [currentQIndex]: current.filter(v => v !== value) }));
    } else {
      setPreviewAnswers(prev => ({ ...prev, [currentQIndex]: [...current, value] }));
    }
  };

  return (
    <div className={`${mobile ? 'max-w-sm mx-auto border-4 border-gray-800 rounded-3xl shadow-xl overflow-hidden' : ''} flex flex-col h-full`}>
      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: '#4A00F8' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4A00F8' }}>
            {surveyName || 'Survey Preview'}
          </p>

          {questions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">Add questions to see the expert view</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-4">Question {currentQIndex + 1} of {questions.length}</p>

              <div className="space-y-4">
                <p className="text-base font-semibold text-gray-900 leading-snug">
                  {question?.text || <span className="text-gray-300 italic">Question text not entered yet</span>}
                  {question?.required && <span className="text-red-500 ml-1">*</span>}
                </p>

                {/* Single choice */}
                {question?.type === 'single_choice' && (
                  <div className="space-y-2">
                    {question.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all ${
                          previewAnswers[currentQIndex] === opt
                            ? 'border-purple-500 bg-purple-50 text-purple-900'
                            : 'border-gray-200 hover:border-purple-300 text-gray-700'
                        }`}
                        style={previewAnswers[currentQIndex] === opt ? { borderColor: '#4A00F8', backgroundColor: '#EDE9FF' } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              previewAnswers[currentQIndex] === opt ? 'border-purple-500' : 'border-gray-300'
                            }`}
                            style={previewAnswers[currentQIndex] === opt ? { borderColor: '#4A00F8' } : {}}
                          >
                            {previewAnswers[currentQIndex] === opt && (
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4A00F8' }} />
                            )}
                          </div>
                          {opt || <span className="text-gray-300 italic">Empty option</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Multi choice */}
                {question?.type === 'multi_choice' && (
                  <div className="space-y-2">
                    {question.options.map((opt, i) => {
                      const selected = (previewAnswers[currentQIndex] || []).includes(opt);
                      return (
                        <button
                          key={i}
                          onClick={() => handleMultiAnswer(opt)}
                          className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all ${selected ? '' : 'border-gray-200 hover:border-purple-300 text-gray-700'}`}
                          style={selected ? { borderColor: '#4A00F8', backgroundColor: '#EDE9FF', color: '#0F0A2E' } : {}}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? '' : 'border-gray-300'}`}
                              style={selected ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
                            >
                              {selected && <Check size={10} className="text-white" />}
                            </div>
                            {opt || <span className="text-gray-300 italic">Empty option</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Rating scale */}
                {question?.type === 'rating_scale' && (
                  <div>
                    <div className="flex gap-2 justify-center my-2">
                      {Array.from({ length: question.scale }, (_, i) => i + 1).map(n => (
                        <button
                          key={n}
                          onClick={() => handleAnswer(n)}
                          className={`w-11 h-11 rounded-xl border-2 text-sm font-bold transition-all ${
                            previewAnswers[currentQIndex] === n ? 'text-white' : 'border-gray-200 text-gray-600 hover:border-purple-400'
                          }`}
                          style={previewAnswers[currentQIndex] === n ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{question.labels[0]}</span>
                      <span>{question.labels[1]}</span>
                    </div>
                  </div>
                )}

                {/* Open text */}
                {question?.type === 'open_text' && (
                  <textarea
                    value={previewAnswers[currentQIndex] || ''}
                    onChange={e => handleAnswer(e.target.value)}
                    placeholder="Type your response here..."
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:border-purple-400 transition-colors"
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Nav */}
        {questions.length > 0 && (
          <div className="border-t border-gray-100 p-4 flex items-center justify-between gap-3 bg-white">
            <button
              onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
              disabled={currentQIndex === 0}
              className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            {currentQIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQIndex(Math.min(questions.length - 1, currentQIndex + 1))}
                className="flex-1 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                style={{ backgroundColor: '#4A00F8' }}
              >
                Next →
              </button>
            ) : (
              <button
                className="flex-1 py-2 text-sm font-medium text-white rounded-lg shadow-sm"
                style={{ backgroundColor: '#10B981' }}
              >
                Submit Survey
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SurveyBuilder({ mode = 'create' }) {
  const { projectId, surveyId } = useParams();
  const navigate = useNavigate();
  const { surveys, projects, addToast } = useApp();

  const project = projects.find(p => p.id === projectId);
  const existingSurvey = surveys.find(s => s.id === surveyId);

  const [surveyName, setSurveyName] = useState(
    mode === 'edit' && existingSurvey ? existingSurvey.name : ''
  );
  const [questions, setQuestions] = useState(
    mode === 'edit' && existingSurvey ? existingSurvey.questions : [newQuestion()]
  );
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [mobilePreview, setMobilePreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [autoSaveToast, setAutoSaveToast] = useState(false);
  const autoSaveTimerRef = useRef(null);

  const triggerAutoSave = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveToast(true);
    autoSaveTimerRef.current = setTimeout(() => setAutoSaveToast(false), 2000);
  };

  const handleNameChange = (v) => { setSurveyName(v); triggerAutoSave(); };
  const handleQuestionChange = (index, updated) => {
    const newQ = [...questions];
    newQ[index] = updated;
    setQuestions(newQ);
    triggerAutoSave();
  };

  const addQuestion = (type) => {
    const q = newQuestion(type);
    setQuestions([...questions, q]);
    setCurrentQIndex(questions.length);
    setShowTypeMenu(false);
    triggerAutoSave();
  };

  const deleteQuestion = (index) => {
    if (questions.length <= 1) { addToast('A survey must have at least one question.', 'warning'); return; }
    const newQ = questions.filter((_, i) => i !== index);
    setQuestions(newQ);
    if (currentQIndex >= newQ.length) setCurrentQIndex(newQ.length - 1);
    triggerAutoSave();
  };

  const handleSaveDraft = () => {
    addToast('Draft saved successfully');
  };

  const handleSubmitForApproval = () => {
    if (!surveyName.trim()) { addToast('Please enter a survey name.', 'warning'); return; }
    if (questions.some(q => !q.text.trim())) { addToast('All questions must have text.', 'warning'); return; }
    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    setShowConfirmModal(false);
    addToast('Survey submitted for approval');
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Builder top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <span className="text-gray-200">|</span>
          <span className="text-sm font-medium text-gray-600">{project?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {autoSaveToast && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1 fade-in">
              <Check size={12} /> Progress saved
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={handleSaveDraft}>
            <Save size={14} /> Save Draft
          </Button>
          <Button size="sm" onClick={handleSubmitForApproval}>
            <Send size={14} /> Submit for Approval
          </Button>
        </div>
      </div>

      {/* Main dual-panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="flex-1 overflow-y-auto p-6" style={{ minWidth: 0 }}>
          {/* Survey name */}
          <div className="mb-5">
            <input
              type="text"
              value={surveyName}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Enter survey name..."
              className="w-full text-xl font-bold text-gray-900 border-0 border-b-2 border-gray-100 pb-2 bg-transparent focus:border-purple-400 focus:outline-none transition-colors placeholder-gray-300"
            />
          </div>

          {/* Questions */}
          <div className="space-y-3 mb-4">
            {questions.map((q, i) => (
              <div key={q.id} onClick={() => setCurrentQIndex(i)} className={`rounded-xl transition-all ${currentQIndex === i ? 'ring-2' : ''}`} style={currentQIndex === i ? { ringColor: '#4A00F8' } : {}}>
                <div style={currentQIndex === i ? { boxShadow: `0 0 0 2px #4A00F8` } : {}} className="rounded-xl">
                  <QuestionCard
                    question={q}
                    index={i}
                    total={questions.length}
                    onChange={(updated) => handleQuestionChange(i, updated)}
                    onDelete={() => deleteQuestion(i)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add question */}
          <div className="relative">
            <button
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border-2 border-dashed border-purple-200 w-full justify-center transition-colors hover:border-purple-400 hover:bg-purple-50"
              style={{ color: '#4A00F8' }}
            >
              <Plus size={16} /> Add Question
            </button>

            {showTypeMenu && (
              <div className="fade-in absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-2">
                <div className="grid grid-cols-2 gap-1">
                  {QUESTION_TYPES.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        onClick={() => addQuestion(t.value)}
                        className="flex items-start gap-2.5 p-3 rounded-lg hover:bg-purple-50 text-left transition-colors"
                      >
                        <Icon size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-800">{t.label}</div>
                          <div className="text-xs text-gray-400">{t.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="w-96 flex-shrink-0 border-l border-gray-100 flex flex-col bg-gray-50">
          {/* Preview header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expert view — preview</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMobilePreview(false)}
                className={`p-1.5 rounded transition-colors ${!mobilePreview ? 'text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                style={!mobilePreview ? { backgroundColor: '#4A00F8' } : {}}
              >
                <Monitor size={13} />
              </button>
              <button
                onClick={() => setMobilePreview(true)}
                className={`p-1.5 rounded transition-colors ${mobilePreview ? 'text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                style={mobilePreview ? { backgroundColor: '#4A00F8' } : {}}
              >
                <Smartphone size={13} />
              </button>
            </div>
          </div>

          {/* Preview content */}
          <div className={`flex-1 overflow-y-auto ${mobilePreview ? 'p-6 flex items-start justify-center' : 'p-0'}`}>
            <div className={mobilePreview ? 'w-full' : 'h-full'}>
              <ExpertPreview
                surveyName={surveyName}
                questions={questions}
                currentQIndex={currentQIndex}
                setCurrentQIndex={setCurrentQIndex}
                previewAnswers={previewAnswers}
                setPreviewAnswers={setPreviewAnswers}
                mobile={mobilePreview}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirm submission modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="fade-in bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Submit for approval?</h2>
            <p className="text-sm text-gray-600 mb-1">
              You are about to submit <strong>"{surveyName}"</strong> for approval.
            </p>
            <p className="text-sm text-gray-500 mb-5">
              The survey will be locked for editing until reviewed by an Admin. You will be notified of the decision.
            </p>
            <div className="bg-gray-50 rounded-xl p-3 mb-5 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Check size={12} className="text-green-500" />
                {questions.length} question{questions.length !== 1 ? 's' : ''} added
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Check size={12} className="text-green-500" />
                {questions.filter(q => q.required).length} required field{questions.filter(q => q.required).length !== 1 ? 's' : ''} set
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
              <Button onClick={confirmSubmit}>
                <Send size={14} /> Submit Survey
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
