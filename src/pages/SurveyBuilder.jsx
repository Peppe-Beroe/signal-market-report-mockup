import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Save,
  Send, Eye, EyeOff, X, Check, Smartphone, Monitor,
  AlignLeft, List, CheckSquare, Star, Type, AlignJustify,
  BarChart2, Calendar, Hash, Copy, BookTemplate, ChevronUp as Up, ChevronDown as Down
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Single Choice', icon: List, description: 'One answer from options' },
  { value: 'multi_choice', label: 'Multiple Choice', icon: CheckSquare, description: 'Multiple answers allowed' },
  { value: 'rating_scale', label: 'Rating Scale', icon: Star, description: 'Numeric rating 1–5 or 1–7' },
  { value: 'open_text', label: 'Open Text', icon: AlignLeft, description: 'Free-form text response' },
  { value: 'short_text', label: 'Short Text', icon: Type, description: 'Single-line text input' },
  { value: 'long_text', label: 'Long Text', icon: AlignJustify, description: 'Multi-line textarea' },
  { value: 'ranking', label: 'Ranking', icon: BarChart2, description: 'Order options by preference' },
  { value: 'date_picker', label: 'Date Picker', icon: Calendar, description: 'Select a date' },
  { value: 'number', label: 'Number', icon: Hash, description: 'Numeric input with optional range' },
];

const newQuestion = (type = 'single_choice') => ({
  id: `q${Date.now()}`,
  type,
  text: '',
  required: true,
  options: (type === 'single_choice' || type === 'multi_choice' || type === 'ranking') ? ['Option A', 'Option B', 'Option C'] : [],
  scale: 5,
  labels: ['Very low', 'Very high'],
  addOther: false,
  minValue: '',
  maxValue: '',
});

function QuestionTypeIcon({ type }) {
  const t = QUESTION_TYPES.find(t => t.value === type);
  const Icon = t?.icon || List;
  const colors = {
    single_choice: 'bg-purple-50 text-purple-600',
    multi_choice: 'bg-blue-50 text-blue-600',
    rating_scale: 'bg-amber-50 text-amber-600',
    open_text: 'bg-green-50 text-green-600',
    short_text: 'bg-teal-50 text-teal-600',
    long_text: 'bg-emerald-50 text-emerald-600',
    ranking: 'bg-indigo-50 text-indigo-600',
    date_picker: 'bg-pink-50 text-pink-600',
    number: 'bg-orange-50 text-orange-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors[type] || 'bg-gray-50 text-gray-600'}`}>
      <Icon size={11} />
      {t?.label || type}
    </span>
  );
}

function QuestionCard({ question, index, total, onChange, onDelete, dragHandlers, isDragOver }) {
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

  const moveOption = (i, dir) => {
    const opts = [...question.options];
    const targetIdx = i + dir;
    if (targetIdx < 0 || targetIdx >= opts.length) return;
    [opts[i], opts[targetIdx]] = [opts[targetIdx], opts[i]];
    onChange({ ...question, options: opts });
  };

  const hasChoiceOptions = question.type === 'single_choice' || question.type === 'multi_choice';
  const isRanking = question.type === 'ranking';

  const handleTypeChange = (newType) => {
    const hasOpts = newType === 'single_choice' || newType === 'multi_choice' || newType === 'ranking';
    onChange({
      ...question,
      type: newType,
      options: hasOpts ? (question.options.length > 0 ? question.options : ['Option A', 'Option B', 'Option C']) : [],
      addOther: hasOpts ? question.addOther : false,
    });
  };

  return (
    <div className={`border rounded-xl bg-white overflow-hidden transition-all ${isDragOver ? 'border-purple-400 shadow-lg ring-2 ring-purple-200' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div
          {...dragHandlers}
          draggable
          className="cursor-grab active:cursor-grabbing touch-none select-none"
          onClick={e => e.stopPropagation()}
          title="Drag to reorder"
        >
          <GripVertical size={16} className="text-gray-400 hover:text-gray-600" />
        </div>
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
              onChange={e => handleTypeChange(e.target.value)}
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

          {/* Options for choice types and ranking */}
          {(hasChoiceOptions || isRanking) && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {isRanking ? 'Items to rank' : 'Options'}
              </label>
              <div className="space-y-1.5">
                {question.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {isRanking && (
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveOption(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-30">
                          <ChevronUp size={12} />
                        </button>
                        <button onClick={() => moveOption(i, 1)} disabled={i === question.options.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-30">
                          <ChevronDown size={12} />
                        </button>
                      </div>
                    )}
                    {!isRanking && (
                      <div className={`w-4 h-4 flex-shrink-0 border-2 border-gray-300 ${question.type === 'single_choice' ? 'rounded-full' : 'rounded'}`} />
                    )}
                    {isRanking && (
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                    )}
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

              {/* "Other" toggle — only for single/multi choice */}
              {hasChoiceOptions && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onChange({ ...question, addOther: !question.addOther })}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${question.addOther ? '' : 'bg-gray-200'}`}
                    style={question.addOther ? { backgroundColor: '#4A00F8' } : {}}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${question.addOther ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-xs text-gray-500">Add "Other (please specify)" option</span>
                </div>
              )}
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

          {/* Number type — min/max */}
          {question.type === 'number' && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Min value (optional)</label>
                <input
                  type="number"
                  value={question.minValue}
                  onChange={e => onChange({ ...question, minValue: e.target.value })}
                  placeholder="No minimum"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-gray-50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Max value (optional)</label>
                <input
                  type="number"
                  value={question.maxValue}
                  onChange={e => onChange({ ...question, maxValue: e.target.value })}
                  placeholder="No maximum"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-gray-50"
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
        <div className="h-1 bg-gray-100">
          <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: '#4A00F8' }} />
        </div>

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
                          previewAnswers[currentQIndex] === opt ? '' : 'border-gray-200 hover:border-purple-300 text-gray-700'
                        }`}
                        style={previewAnswers[currentQIndex] === opt ? { borderColor: '#4A00F8', backgroundColor: '#EDE9FF' } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${previewAnswers[currentQIndex] === opt ? '' : 'border-gray-300'}`}
                            style={previewAnswers[currentQIndex] === opt ? { borderColor: '#4A00F8' } : {}}
                          >
                            {previewAnswers[currentQIndex] === opt && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4A00F8' }} />}
                          </div>
                          {opt || <span className="text-gray-300 italic">Empty option</span>}
                        </div>
                      </button>
                    ))}
                    {question.addOther && (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleAnswer('__other__')}
                          className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all ${previewAnswers[currentQIndex] === '__other__' ? '' : 'border-gray-200 hover:border-purple-300 text-gray-700'}`}
                          style={previewAnswers[currentQIndex] === '__other__' ? { borderColor: '#4A00F8', backgroundColor: '#EDE9FF' } : {}}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${previewAnswers[currentQIndex] === '__other__' ? '' : 'border-gray-300'}`} style={previewAnswers[currentQIndex] === '__other__' ? { borderColor: '#4A00F8' } : {}}>
                              {previewAnswers[currentQIndex] === '__other__' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4A00F8' }} />}
                            </div>
                            Other (please specify)
                          </div>
                        </button>
                        {previewAnswers[currentQIndex] === '__other__' && (
                          <input type="text" placeholder="Please specify..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-400" />
                        )}
                      </div>
                    )}
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
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? '' : 'border-gray-300'}`} style={selected ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}>
                              {selected && <Check size={10} className="text-white" />}
                            </div>
                            {opt || <span className="text-gray-300 italic">Empty option</span>}
                          </div>
                        </button>
                      );
                    })}
                    {question.addOther && (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleMultiAnswer('__other__')}
                          className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all ${(previewAnswers[currentQIndex] || []).includes('__other__') ? '' : 'border-gray-200 hover:border-purple-300 text-gray-700'}`}
                          style={(previewAnswers[currentQIndex] || []).includes('__other__') ? { borderColor: '#4A00F8', backgroundColor: '#EDE9FF', color: '#0F0A2E' } : {}}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0`} style={(previewAnswers[currentQIndex] || []).includes('__other__') ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : { borderColor: '#D1D5DB' }}>
                              {(previewAnswers[currentQIndex] || []).includes('__other__') && <Check size={10} className="text-white" />}
                            </div>
                            Other (please specify)
                          </div>
                        </button>
                        {(previewAnswers[currentQIndex] || []).includes('__other__') && (
                          <input type="text" placeholder="Please specify..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-purple-400" />
                        )}
                      </div>
                    )}
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
                          className={`w-11 h-11 rounded-xl border-2 text-sm font-bold transition-all ${previewAnswers[currentQIndex] === n ? 'text-white' : 'border-gray-200 text-gray-600 hover:border-purple-400'}`}
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

                {/* Short text */}
                {question?.type === 'short_text' && (
                  <input
                    type="text"
                    value={previewAnswers[currentQIndex] || ''}
                    onChange={e => handleAnswer(e.target.value)}
                    placeholder="Your answer..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-purple-400 transition-colors"
                  />
                )}

                {/* Long text */}
                {question?.type === 'long_text' && (
                  <textarea
                    value={previewAnswers[currentQIndex] || ''}
                    onChange={e => handleAnswer(e.target.value)}
                    placeholder="Type your detailed response here..."
                    rows={6}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:border-purple-400 transition-colors"
                  />
                )}

                {/* Ranking */}
                {question?.type === 'ranking' && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">Drag to reorder from most to least preferred</p>
                    {question.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <span className="text-sm text-gray-700 flex-1">{opt}</span>
                        <GripVertical size={14} className="text-gray-300" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Date picker */}
                {question?.type === 'date_picker' && (
                  <input
                    type="date"
                    value={previewAnswers[currentQIndex] || ''}
                    onChange={e => handleAnswer(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-purple-400 transition-colors"
                  />
                )}

                {/* Number */}
                {question?.type === 'number' && (
                  <input
                    type="number"
                    value={previewAnswers[currentQIndex] || ''}
                    onChange={e => handleAnswer(e.target.value)}
                    min={question.minValue || undefined}
                    max={question.maxValue || undefined}
                    placeholder={question.minValue && question.maxValue ? `${question.minValue} – ${question.maxValue}` : 'Enter a number'}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-purple-400 transition-colors"
                  />
                )}
              </div>
            </>
          )}
        </div>

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
              <button className="flex-1 py-2 text-sm font-medium text-white rounded-lg shadow-sm" style={{ backgroundColor: '#10B981' }}>
                Submit Survey
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UnsavedChangesModal({ onSave, onDiscard, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="fade-in bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Unsaved changes</h2>
        <p className="text-sm text-gray-500 mb-5">You have unsaved changes. What would you like to do?</p>
        <div className="space-y-2">
          <Button className="w-full" onClick={onSave}><Save size={14} /> Save Draft</Button>
          <Button variant="danger-outline" className="w-full" onClick={onDiscard}>Discard Changes</Button>
          <Button variant="ghost" className="w-full" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function SaveTemplateModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="fade-in bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Save as Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Give this template a name so you can reuse the questions in future surveys.</p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Standard Steel Price Survey"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none mb-4"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!name.trim()} onClick={() => onSave(name)}>Save Template</Button>
        </div>
      </div>
    </div>
  );
}

function UseTemplateModal({ templates, onUse, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="fade-in bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Use a Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {templates.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No templates saved yet. Save a survey as a template to use it here.</p>
        ) : (
          <div className="space-y-2">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => onUse(t)}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.questions.length} questions · Created by {t.createdBy} on {t.createdAt}</p>
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

export default function SurveyBuilder({ mode = 'create' }) {
  const { projectId, surveyId } = useParams();
  const navigate = useNavigate();
  const { surveys, projects, templates, addToast, createSurvey, updateSurvey, cloneSurvey, saveTemplate } = useApp();

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
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavTarget, setPendingNavTarget] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showUseTemplateModal, setShowUseTemplateModal] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragIndexRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const triggerAutoSave = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveToast(true);
    setIsDirty(true);
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
    if (!surveyName.trim()) { addToast('Please enter a survey name first.', 'warning'); return; }
    if (mode === 'edit' && surveyId) {
      updateSurvey({ surveyId, name: surveyName, questions });
    } else {
      const saved = createSurvey({ projectId, name: surveyName, questions, status: 'Draft' });
      navigate(`/projects/${projectId}/surveys/${saved.id}/builder`, { replace: true });
    }
    setIsDirty(false);
  };

  const handleSubmitForApproval = () => {
    if (!surveyName.trim()) { addToast('Please enter a survey name.', 'warning'); return; }
    if (questions.some(q => !q.text.trim())) { addToast('All questions must have text.', 'warning'); return; }
    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    setShowConfirmModal(false);
    if (mode === 'edit' && surveyId) {
      updateSurvey({ surveyId, name: surveyName, questions, status: 'Submitted' });
    } else {
      createSurvey({ projectId, name: surveyName, questions, status: 'Submitted' });
    }
    setIsDirty(false);
    navigate(`/projects/${projectId}`);
  };

  const handleClone = () => {
    if (!surveyId || mode !== 'edit') { addToast('Save the survey first before cloning.', 'warning'); return; }
    const cloned = cloneSurvey(surveyId);
    if (cloned) navigate(`/projects/${projectId}/surveys/${cloned.id}/builder`);
  };

  const handleSaveTemplate = (name) => {
    saveTemplate(name, questions);
    setShowSaveTemplateModal(false);
  };

  const handleUseTemplate = (template) => {
    setQuestions(template.questions.map(q => ({ ...q, id: `q${Date.now()}_${Math.random().toString(36).slice(2, 6)}` })));
    setShowUseTemplateModal(false);
    addToast(`Template "${template.name}" loaded`);
    triggerAutoSave();
  };

  const tryNavigate = (to) => {
    if (isDirty) {
      setPendingNavTarget(to);
      setShowUnsavedModal(true);
    } else {
      navigate(to);
    }
  };

  const handleUnsavedSave = () => {
    handleSaveDraft();
    setShowUnsavedModal(false);
    if (pendingNavTarget) { navigate(pendingNavTarget); setPendingNavTarget(null); }
  };

  const handleUnsavedDiscard = () => {
    setIsDirty(false);
    setShowUnsavedModal(false);
    if (pendingNavTarget) { navigate(pendingNavTarget); setPendingNavTarget(null); }
  };

  const handleUnsavedCancel = () => {
    setShowUnsavedModal(false);
    setPendingNavTarget(null);
  };

  const handleDragStart = (i) => {
    dragIndexRef.current = i;
  };

  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (dragIndexRef.current !== null && dragIndexRef.current !== i) {
      setDragOverIndex(i);
    }
  };

  const handleDrop = (i) => {
    if (dragIndexRef.current === null || dragIndexRef.current === i) {
      setDragOverIndex(null);
      dragIndexRef.current = null;
      return;
    }
    const newQ = [...questions];
    const [removed] = newQ.splice(dragIndexRef.current, 1);
    newQ.splice(i, 0, removed);
    setQuestions(newQ);
    setCurrentQIndex(i);
    dragIndexRef.current = null;
    setDragOverIndex(null);
    triggerAutoSave();
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Builder top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => tryNavigate(`/projects/${projectId}`)}
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
          {isDirty && !autoSaveToast && (
            <span className="text-xs text-amber-500 font-medium">Unsaved changes</span>
          )}
          {mode === 'create' && templates.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowUseTemplateModal(true)}>
              <BookTemplate size={14} /> Use template
            </Button>
          )}
          {mode === 'create' && templates.length === 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowUseTemplateModal(true)}>
              <BookTemplate size={14} /> Use template
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowSaveTemplateModal(true)}>
            <Save size={14} /> Save as template
          </Button>
          {mode === 'edit' && (
            <Button variant="secondary" size="sm" onClick={handleClone}>
              <Copy size={14} /> Clone
            </Button>
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
              <div
                key={q.id}
                onClick={() => setCurrentQIndex(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                className="rounded-xl transition-all"
              >
                <div style={currentQIndex === i && dragOverIndex !== i ? { boxShadow: `0 0 0 2px #4A00F8` } : {}} className="rounded-xl">
                  <QuestionCard
                    question={q}
                    index={i}
                    total={questions.length}
                    onChange={(updated) => handleQuestionChange(i, updated)}
                    onDelete={() => deleteQuestion(i)}
                    isDragOver={dragOverIndex === i}
                    dragHandlers={{
                      onDragStart: () => handleDragStart(i),
                      onDragEnd: handleDragEnd,
                    }}
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
                <div className="grid grid-cols-3 gap-1">
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
              The survey will be locked for editing until reviewed by an Admin.
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
              <Button onClick={confirmSubmit}><Send size={14} /> Submit Survey</Button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved changes modal */}
      {showUnsavedModal && (
        <UnsavedChangesModal
          onSave={handleUnsavedSave}
          onDiscard={handleUnsavedDiscard}
          onCancel={handleUnsavedCancel}
        />
      )}

      {/* Save as template modal */}
      {showSaveTemplateModal && (
        <SaveTemplateModal
          onSave={handleSaveTemplate}
          onClose={() => setShowSaveTemplateModal(false)}
        />
      )}

      {/* Use template modal */}
      {showUseTemplateModal && (
        <UseTemplateModal
          templates={templates}
          onUse={handleUseTemplate}
          onClose={() => setShowUseTemplateModal(false)}
        />
      )}
    </div>
  );
}
