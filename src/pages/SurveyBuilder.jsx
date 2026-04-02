import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Save,
  Send, Eye, EyeOff, X, Check, Smartphone, Monitor,
  AlignLeft, List, CheckSquare, Star, Type, AlignJustify,
  BarChart2, Calendar, Hash, BookTemplate, ChevronUp as Up, ChevronDown as Down,
  Mail, Bell, AlertTriangle, Search, Tag, Users, Edit3, GitCompare, XCircle,
  Paperclip, FileText, Globe, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const DEFAULT_EMAIL_BODY = `Dear {{expert_name}},

We are conducting a research survey as part of the Beroe Signal intelligence programme and would value your expert perspective.

Survey: {{survey_name}}
Close date: {{close_date}}

Please click the link below to participate (estimated time: 5–8 minutes):
{{survey_link}}

Your responses are completely confidential and will only be used in aggregate for research purposes.

Thank you for your continued support.

Best regards,
Beroe Research Team`;

const MERGE_TAGS = ['expert_name', 'survey_name', 'survey_link', 'close_date'];

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
  { value: 'file_attachment', label: 'File Attachment', icon: Paperclip, description: 'Attach a reference file for experts' },
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
  attachedFile: null,       // for file_attachment type: { name, size }
  responseType: 'open_text', // for file_attachment: how the expert responds
  responseOptions: ['Option A', 'Option B', 'Option C'], // for file_attachment + single/multi choice response
  responseScale: 5,          // for file_attachment + rating_scale response
  responseLabels: ['Very low', 'Very high'], // for file_attachment + rating_scale response
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
    file_attachment: 'bg-violet-50 text-violet-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors[type] || 'bg-gray-50 text-gray-600'}`}>
      <Icon size={11} />
      {t?.label || type}
    </span>
  );
}

function QuestionCard({ question, index, total, onChange, onDelete, dragHandlers, isDragOver, allowedTypes }) {
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
      options: hasOpts ? ((question.options || []).length > 0 ? question.options : ['Option A', 'Option B', 'Option C']) : [],
      addOther: hasOpts ? question.addOther : false,
      scale: question.scale || 5,
      labels: question.labels || ['Very low', 'Very high'],
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
              {(allowedTypes
                ? QUESTION_TYPES.filter(t => allowedTypes.includes(t.value))
                : QUESTION_TYPES
              ).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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

          {/* File Attachment type */}
          {question.type === 'file_attachment' && (
            <div className="space-y-3">
              {/* Persistent data quality warning */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-0.5">Data quality notice</p>
                  <p>The attached file is <strong>not exported to DataHub</strong>. Only the expert's text response travels to DataHub. The attachment is reference material for the expert only and is retained in the platform record for audit purposes.</p>
                </div>
              </div>
              {/* File upload simulation */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Reference file</label>
                {question.attachedFile ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <FileText size={14} className="text-purple-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 flex-1 truncate">{question.attachedFile.name}</span>
                    <span className="text-xs text-gray-400">{question.attachedFile.size}</span>
                    <button
                      onClick={() => onChange({ ...question, attachedFile: null })}
                      className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onChange({ ...question, attachedFile: { name: 'reference_document.pdf', size: '1.2 MB' } })}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-200 w-full justify-center text-sm text-gray-400 hover:border-purple-300 hover:text-purple-500 transition-colors"
                  >
                    <Paperclip size={14} /> Upload reference file (max 50 MB — PDF, DOCX, XLSX, PNG)
                  </button>
                )}
              </div>
              {/* Answer input type for the expert response */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Expert response type</label>
                <select
                  value={question.responseType || 'open_text'}
                  onChange={e => onChange({ ...question, responseType: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 w-full"
                >
                  <option value="open_text">Open Text</option>
                  <option value="single_choice">Single Choice</option>
                  <option value="multi_choice">Multiple Choice</option>
                  <option value="rating_scale">Rating Scale</option>
                </select>
              </div>

              {/* Options editor — appears when responseType is single or multi choice */}
              {(question.responseType === 'single_choice' || question.responseType === 'multi_choice') && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Response options</label>
                  <div className="space-y-1.5">
                    {(question.responseOptions || ['Option A', 'Option B', 'Option C']).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-4 h-4 flex-shrink-0 border-2 border-gray-300 ${question.responseType === 'single_choice' ? 'rounded-full' : 'rounded'}`} />
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const opts = [...(question.responseOptions || [])];
                            opts[i] = e.target.value;
                            onChange({ ...question, responseOptions: opts });
                          }}
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-gray-50 focus:bg-white transition-colors"
                        />
                        {(question.responseOptions || []).length > 2 && (
                          <button
                            onClick={() => onChange({ ...question, responseOptions: (question.responseOptions || []).filter((_, idx) => idx !== i) })}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => onChange({ ...question, responseOptions: [...(question.responseOptions || []), `Option ${(question.responseOptions || []).length + 1}`] })}
                      className="flex items-center gap-1.5 text-xs font-medium mt-1 hover:opacity-80 transition-opacity"
                      style={{ color: '#4A00F8' }}
                    >
                      <Plus size={13} /> Add option
                    </button>
                  </div>
                </div>
              )}

              {/* Rating scale config — appears when responseType is rating_scale */}
              {question.responseType === 'rating_scale' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-500 w-20">Scale</label>
                    <select
                      value={question.responseScale || 5}
                      onChange={e => onChange({ ...question, responseScale: Number(e.target.value) })}
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
                      value={(question.responseLabels || ['Very low', 'Very high'])[0]}
                      onChange={e => onChange({ ...question, responseLabels: [e.target.value, (question.responseLabels || ['Very low', 'Very high'])[1]] })}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-gray-50"
                      placeholder="e.g. Very low"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-500 w-20">Max label</label>
                    <input
                      type="text"
                      value={(question.responseLabels || ['Very low', 'Very high'])[1]}
                      onChange={e => onChange({ ...question, responseLabels: [(question.responseLabels || ['Very low', 'Very high'])[0], e.target.value] })}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-gray-50"
                      placeholder="e.g. Very high"
                    />
                  </div>
                </div>
              )}
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
                      <span>{(question.labels || ['', ''])[0]}</span>
                      <span>{(question.labels || ['', ''])[1]}</span>
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

                {/* File Attachment — expert view: downloadable reference + configured answer input */}
                {question?.type === 'file_attachment' && (
                  <div className="space-y-3">
                    {question.attachedFile && (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-violet-200 bg-violet-50">
                        <FileText size={16} className="text-violet-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-violet-800 mb-0.5">Reference file attached</p>
                          <p className="text-xs text-violet-600 truncate">{question.attachedFile.name}</p>
                        </div>
                        <button className="text-xs font-medium text-violet-700 border border-violet-300 rounded-lg px-2.5 py-1 hover:bg-violet-100 transition-colors flex-shrink-0">
                          Download
                        </button>
                      </div>
                    )}
                    {/* Open text (default) */}
                    {(!question.responseType || question.responseType === 'open_text') && (
                      <textarea
                        value={previewAnswers[currentQIndex] || ''}
                        onChange={e => handleAnswer(e.target.value)}
                        placeholder="Your response..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:border-purple-400 transition-colors"
                      />
                    )}
                    {/* Single choice */}
                    {question.responseType === 'single_choice' && (
                      <div className="space-y-2">
                        {(question.responseOptions || []).map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleAnswer(opt)}
                            className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all ${previewAnswers[currentQIndex] === opt ? '' : 'border-gray-200 hover:border-purple-300 text-gray-700'}`}
                            style={previewAnswers[currentQIndex] === opt ? { borderColor: '#4A00F8', backgroundColor: '#EDE9FF' } : {}}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${previewAnswers[currentQIndex] === opt ? '' : 'border-gray-300'}`} style={previewAnswers[currentQIndex] === opt ? { borderColor: '#4A00F8' } : {}}>
                                {previewAnswers[currentQIndex] === opt && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4A00F8' }} />}
                              </div>
                              {opt || <span className="text-gray-300 italic">Empty option</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Multiple choice */}
                    {question.responseType === 'multi_choice' && (
                      <div className="space-y-2">
                        {(question.responseOptions || []).map((opt, i) => {
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
                      </div>
                    )}
                    {/* Rating scale */}
                    {question.responseType === 'rating_scale' && (
                      <div>
                        <div className="flex gap-2 justify-center my-2">
                          {Array.from({ length: question.responseScale || 5 }, (_, i) => i + 1).map(n => (
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
                          <span>{(question.responseLabels || ['', ''])[0]}</span>
                          <span>{(question.responseLabels || ['', ''])[1]}</span>
                        </div>
                      </div>
                    )}
                  </div>
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

function SaveTemplateModal({ onSave, onClose, projectName, activeCategories = [] }) {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [selectedCats, setSelectedCats] = useState([]);
  const toggleCat = (id) => setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const canSave = name.trim() && selectedCats.length > 0;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="fade-in bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto">
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
        {/* Category labels — required */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1.5">Category labels <span className="text-red-500">*</span></p>
          <p className="text-xs text-gray-400 mb-2">Select at least one category to classify this template.</p>
          <div className="flex flex-wrap gap-2">
            {activeCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCat(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedCats.includes(cat.id)
                    ? 'border-purple-400 text-white'
                    : 'border-gray-200 text-gray-500 hover:border-purple-300'
                }`}
                style={selectedCats.includes(cat.id) ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
              >
                {cat.name}
              </button>
            ))}
            {activeCategories.length === 0 && <p className="text-xs text-gray-400 italic">No categories available — add them in Settings → Category Taxonomy.</p>}
          </div>
          {selectedCats.length === 0 && name.trim() && (
            <p className="text-xs text-red-400 mt-1.5">At least one category is required.</p>
          )}
        </div>
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">Visibility</p>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-purple-300 transition-colors" style={visibility === 'private' ? { borderColor: '#4A00F8', backgroundColor: '#f5f3ff' } : {}}>
              <input type="radio" name="visibility" value="private" checked={visibility === 'private'} onChange={() => setVisibility('private')} className="mt-0.5 accent-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Private — only me</p>
                <p className="text-xs text-gray-400">Only you can see and use this template.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-purple-300 transition-colors" style={visibility === 'project' ? { borderColor: '#4A00F8', backgroundColor: '#f5f3ff' } : {}}>
              <input type="radio" name="visibility" value="project" checked={visibility === 'project'} onChange={() => setVisibility('project')} className="mt-0.5 accent-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Project — shared with project editors</p>
                <p className="text-xs text-gray-400">All editors of <span className="font-medium text-gray-600">{projectName || 'this project'}</span> can view, apply, edit, and delete this template. To share beyond the project, propose it as Org-Wide from Settings → My Templates.</p>
              </div>
            </label>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!canSave} onClick={() => onSave(name, visibility, selectedCats)}>Save Template</Button>
        </div>
      </div>
    </div>
  );
}

function UseTemplateModal({ myTemplates, projectTemplates, orgWideTemplates, onUse, onClose, categories = [], surveyTypology, allowedTypeValues = [] }) {
  const [activeCatFilter, setActiveCatFilter] = useState(null);
  const hasAny = myTemplates.length > 0 || projectTemplates.length > 0 || orgWideTemplates.length > 0;

  const getCatNames = (tpl) => (tpl.categories || []).map(cid => categories.find(c => c.id === cid)?.name).filter(Boolean);

  const filterByCategory = (list) => {
    if (!activeCatFilter) return list;
    return list.filter(t => (t.categories || []).includes(activeCatFilter));
  };

  const getTypologyWarning = (tpl) => {
    const disallowedQs = (tpl.questions || []).filter(q => !allowedTypeValues.includes(q.type));
    return disallowedQs.length > 0
      ? `${disallowedQs.length} question(s) will be excluded (not available in this survey's typology).`
      : null;
  };

  const VisBadge = ({ v }) => {
    if (v === 'org_wide') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100 shrink-0"><Globe size={9} /> Org-Wide</span>;
    if (v === 'project') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100 shrink-0">Project</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 shrink-0">Private</span>;
  };

  const TemplateButton = ({ t }) => {
    const warning = getTypologyWarning(t);
    const catNames = getCatNames(t);
    return (
      <button
        key={t.id}
        onClick={() => onUse(t)}
        className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-800">{t.name}</p>
          <VisBadge v={t.visibility} />
        </div>
        {catNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {catNames.map(n => <span key={n} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{n}</span>)}
          </div>
        )}
        <p className="text-xs text-gray-400">{t.questions.length} questions{t.createdBy ? ` · ${t.createdBy}` : ''} · v{t.versionCount || 1}</p>
        {warning && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-200">
            <AlertTriangle size={11} className="flex-shrink-0" /> {warning}
          </div>
        )}
      </button>
    );
  };

  const allCats = categories.filter(c => c.active);
  const filtered = {
    my: filterByCategory(myTemplates),
    project: filterByCategory(projectTemplates),
    org: filterByCategory(orgWideTemplates),
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="fade-in bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Apply a Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {/* Category filter pills */}
        {allCats.length > 0 && hasAny && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => setActiveCatFilter(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${!activeCatFilter ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 hover:border-purple-300'}`}
              style={!activeCatFilter ? { backgroundColor: '#4A00F8' } : {}}
            >All</button>
            {allCats.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCatFilter(activeCatFilter === c.id ? null : c.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${activeCatFilter === c.id ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 hover:border-purple-300'}`}
                style={activeCatFilter === c.id ? { backgroundColor: '#4A00F8' } : {}}
              >{c.name}</button>
            ))}
          </div>
        )}
        {!hasAny ? (
          <p className="text-sm text-gray-400 text-center py-6">No templates available yet. Save a survey as a template to use it here.</p>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-5">
            {filtered.org.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Globe size={11} /> Org-Wide Templates</p>
                <div className="space-y-2">{filtered.org.map(t => <TemplateButton key={t.id} t={t} />)}</div>
              </div>
            )}
            {filtered.my.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Templates</p>
                <div className="space-y-2">{filtered.my.map(t => <TemplateButton key={t.id} t={t} />)}</div>
              </div>
            )}
            {filtered.project.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Project Templates</p>
                <div className="space-y-2">{filtered.project.map(t => <TemplateButton key={t.id} t={t} />)}</div>
              </div>
            )}
            {filtered.org.length === 0 && filtered.my.length === 0 && filtered.project.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No templates match the selected category.</p>
            )}
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
  const location = useLocation();
  const { currentUser, surveys, projects, experts, templates, categories, taxonomy, typologyConfig, orgTimezone, addToast, createSurvey, updateSurvey, saveTemplate, resolveAmendments, getUserEmailTemplates } = useApp();
  const userTpls = getUserEmailTemplates(currentUser.id);
  const myTemplates = templates.filter(t => t.ownerId === currentUser.id);
  const projectTemplates = templates.filter(t => t.visibility === 'project' && t.projectId === projectId && t.ownerId !== currentUser.id);
  const orgWideTemplates = templates.filter(t => t.visibility === 'org_wide');

  const project = projects.find(p => p.id === projectId);
  const existingSurvey = surveys.find(s => s.id === surveyId);
  const existingWaveConfig = mode === 'edit' ? existingSurvey?.waveConfig : null;

  const activeCategories = (categories || []).filter(c => c.active);

  // Taxonomy cascade helpers
  const activeTaxDomains = useMemo(() => (taxonomy || []).filter(d => d.active), [taxonomy]);
  const allTaxLeafCats = useMemo(() =>
    activeTaxDomains.flatMap(d =>
      d.spendingPools.filter(sp => sp.active).flatMap(sp =>
        sp.categories.filter(c => c.active).map(c => ({ id: c.id, name: c.name, domain: d.name, domainId: d.id, pool: sp.name, poolId: sp.id }))
      )
    ), [activeTaxDomains]);

  // Find domain+pool path for an existing category name
  const findTaxPath = (catName) => {
    if (!catName) return { domain: '', pool: '' };
    const match = allTaxLeafCats.find(c => c.name === catName);
    return match ? { domain: match.domain, pool: match.pool } : { domain: '', pool: '' };
  };

  const [surveyName, setSurveyName] = useState(
    mode === 'edit' && existingSurvey
      ? existingSurvey.name
      : (location.state?.surveyName || '')
  );

  // Multi-category state
  const initCategories = mode === 'edit' && existingSurvey
    ? (existingSurvey.categories?.length ? existingSurvey.categories : (existingSurvey.category ? [existingSurvey.category] : []))
    : [];
  const [surveyCategories, setSurveyCategories] = useState(initCategories); // array of category name strings

  // Picker state (for adding new categories one at a time)
  const [pickerDomain, setPickerDomain] = useState('');
  const [pickerPool, setPickerPool] = useState('');
  const [pickerCat, setPickerCat] = useState('');
  const [catSearch, setCatSearch] = useState('');

  const availablePools = useMemo(() =>
    activeTaxDomains.find(d => d.name === pickerDomain)?.spendingPools.filter(sp => sp.active) || [],
    [activeTaxDomains, pickerDomain]);
  const availableLeafCats = useMemo(() =>
    availablePools.find(sp => sp.name === pickerPool)?.categories.filter(c => c.active) || [],
    [availablePools, pickerPool]);
  const catSearchResults = useMemo(() =>
    catSearch.trim().length >= 1
      ? allTaxLeafCats.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).slice(0, 8)
      : [],
    [allTaxLeafCats, catSearch]);

  const handlePickerDomainChange = (val) => { setPickerDomain(val); setPickerPool(''); setPickerCat(''); };
  const handlePickerPoolChange = (val) => { setPickerPool(val); setPickerCat(''); };
  const handlePickerCatChange = (val) => { setPickerCat(val); };
  // Typeahead: immediately adds the category to surveyCategories if not already present
  const handleCatSearchSelect = (cat) => {
    if (!surveyCategories.includes(cat.name)) {
      setSurveyCategories(prev => [...prev, cat.name]);
      setIsDirty(true);
    }
    setCatSearch('');
    setPickerDomain(''); setPickerPool(''); setPickerCat('');
  };
  const addCategoryToSurvey = () => {
    if (pickerCat && !surveyCategories.includes(pickerCat)) {
      setSurveyCategories(prev => [...prev, pickerCat]);
      setIsDirty(true);
    }
    setPickerDomain(''); setPickerPool(''); setPickerCat('');
  };
  const removeSurveyCategory = (catName) => {
    setSurveyCategories(prev => prev.filter(c => c !== catName));
    setIsDirty(true);
  };
  const [surveyTypology, setSurveyTypology] = useState(
    mode === 'edit' && existingSurvey?.typology
      ? existingSurvey.typology
      : (location.state?.typology || 'market_signal_report')
  );
  // Compute allowed question types for this survey's typology
  const typologyTypes = typologyConfig?.[surveyTypology] || {};
  const allowedTypeValues = QUESTION_TYPES
    .filter(t => typologyTypes[t.value] !== false)
    .map(t => t.value);

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

  // Tab navigation
  const [activeTab, setActiveTab] = useState('questions');

  // Amendment resolution state (for surveys returned with tracked changes)
  const pendingEditorAmendments = (existingSurvey?.amendments || []).filter(a => a.status === 'pending');
  const hasPendingAmendments = pendingEditorAmendments.length > 0;
  const [amendResolutions, setAmendResolutions] = useState({});
  const [amendRejectReasons, setAmendRejectReasons] = useState({});
  const [amendOverrideValues, setAmendOverrideValues] = useState({});
  const [showAmendPanel, setShowAmendPanel] = useState(true);

  // Schedule Settings state — initialized from existing config (supports rejected→Draft round-trip)
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 16);
  const closeDefaultStr = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [sendDate, setSendDate] = useState(existingWaveConfig?.sendDate || todayStr);
  const [closeDate, setCloseDate] = useState(existingWaveConfig?.closeDate || closeDefaultStr);
  const [emailSubject, setEmailSubject] = useState(existingWaveConfig?.emailSubject || userTpls.invitation.subject);
  const [senderName, setSenderName] = useState(existingWaveConfig?.senderName || 'Beroe Research Team');
  const [emailBody, setEmailBody] = useState(existingWaveConfig?.emailBody || userTpls.invitation.body);
  const [reminders, setReminders] = useState(
    existingWaveConfig?.reminders?.map((r, i) => ({
      id: i,
      datetime: typeof r === 'string' ? r : (r.datetime || ''),
      error: '',
      subject: (typeof r === 'object' && r.subject) ? r.subject : userTpls.reminder.subject,
      body: (typeof r === 'object' && r.body) ? r.body : userTpls.reminder.body,
      emailExpanded: false,
    })) || []
  );
  const [alertEnabled, setAlertEnabled] = useState(Boolean(existingWaveConfig?.responseRateAlert));
  const [alertThreshold, setAlertThreshold] = useState(existingWaveConfig?.responseRateAlert?.threshold || 50);
  const [alertDaysRemaining, setAlertDaysRemaining] = useState(existingWaveConfig?.responseRateAlert?.daysRemaining || 7);
  const [waveErrors, setWaveErrors] = useState({});

  // Expert List state
  const [selectedExperts, setSelectedExperts] = useState(() =>
    existingWaveConfig?.selectedExperts
      ? new Set(existingWaveConfig.selectedExperts.map(e => e.id))
      : new Set(experts.filter(e => e.status !== 'Opted-out').map(e => e.id))
  );
  const [expertSearch, setExpertSearch] = useState('');
  const [spendingPoolFilter, setSpendingPoolFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [geographyFilter, setGeographyFilter] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const expertSearchRef = useRef(null);
  const bodyRef = useRef(null);

  const allSpendingPools = [...new Set(experts.map(e => e.spendingPool).filter(Boolean))].sort();
  const allCategories = [...new Set(
    experts.filter(e => !spendingPoolFilter || e.spendingPool === spendingPoolFilter)
      .map(e => e.category).filter(Boolean)
  )].sort();
  const allDesignations = [...new Set(experts.map(e => e.title).filter(Boolean))].sort();
  const allGeographies = [...new Set(experts.map(e => e.geography).filter(Boolean))].sort();

  const MIN_DATA_POINTS = 3;
  const reactionRate = (e) =>
    e.surveysSent >= MIN_DATA_POINTS
      ? Math.round((e.surveysResponded / e.surveysSent) * 100)
      : null;
  const acceptanceRate = (e) =>
    e.surveysResponded >= MIN_DATA_POINTS
      ? Math.round((e.responsesAccepted / e.surveysResponded) * 100)
      : null;
  const kpiColor = (pct) => {
    if (pct >= 75) return { bg: '#DCFCE7', text: '#16A34A' };
    if (pct >= 50) return { bg: '#FEF3C7', text: '#D97706' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  };

  const nameSuggestions = expertSearch.length >= 1
    ? experts.filter(e => e.name.toLowerCase().includes(expertSearch.toLowerCase())).slice(0, 6)
    : [];

  const filteredExperts = experts.filter(e => {
    const matchSearch = !expertSearch ||
      e.name.toLowerCase().includes(expertSearch.toLowerCase()) ||
      e.company.toLowerCase().includes(expertSearch.toLowerCase());
    const matchSP = !spendingPoolFilter || e.spendingPool === spendingPoolFilter;
    const matchCat = !categoryFilter || e.category === categoryFilter;
    const matchDesig = !designationFilter || e.title === designationFilter;
    const matchGeo = !geographyFilter || e.geography === geographyFilter;
    return matchSearch && matchSP && matchCat && matchDesig && matchGeo;
  });

  const buildWaveConfig = () => ({
    sendDate,
    closeDate,
    selectedExperts: experts.filter(e => selectedExperts.has(e.id)),
    emailSubject,
    senderName,
    emailBody,
    reminders: reminders.filter(r => r.datetime).map(r => ({ datetime: r.datetime, subject: r.subject, body: r.body })),
    responseRateAlert: alertEnabled ? { threshold: alertThreshold, daysRemaining: alertDaysRemaining } : null,
  });

  const insertMergeTag = (tag) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const merged = `{{${tag}}}`;
    const newBody = emailBody.slice(0, start) + merged + emailBody.slice(end);
    setEmailBody(newBody);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + merged.length, start + merged.length); }, 0);
  };

  const addReminder = () => {
    if (reminders.length >= 3) return;
    setReminders(prev => [...prev, { id: Date.now(), datetime: '', error: '', subject: userTpls.reminder.subject, body: userTpls.reminder.body, emailExpanded: false }]);
  };
  const removeReminder = (id) => setReminders(prev => prev.filter(r => r.id !== id));
  const updateReminder = (id, datetime) => {
    setReminders(prev => prev.map(r => {
      if (r.id !== id) return r;
      const error = closeDate && datetime && datetime >= closeDate ? 'Reminder must be before the close date' : '';
      return { ...r, datetime, error };
    }));
  };
  const updateReminderField = (id, field, value) =>
    setReminders(prev => prev.map(r => r.id !== id ? r : { ...r, [field]: value }));

  const toggleExpert = (id) => {
    setSelectedExperts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAllExperts = () => setSelectedExperts(new Set(experts.filter(e => e.status !== 'Opted-out').map(e => e.id)));
  const deselectAllExperts = () => setSelectedExperts(new Set());

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
    const waveConfig = buildWaveConfig();
    if (mode === 'edit' && surveyId) {
      updateSurvey({ surveyId, name: surveyName, categories: surveyCategories, questions, waveConfig });
    } else {
      const saved = createSurvey({ projectId, name: surveyName, categories: surveyCategories, typology: surveyTypology, questions, status: 'Draft', waveConfig });
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
    const waveConfig = buildWaveConfig();
    // Resolve any pending amendments before resubmitting
    if (hasPendingAmendments && Object.keys(amendResolutions).length > 0) {
      const resolutions = Object.entries(amendResolutions).map(([id, decision]) => ({
        id,
        decision,
        reason: decision === 'rejected' ? (amendRejectReasons[id] || '') : undefined,
        counterValue: decision === 'overridden' ? (amendOverrideValues[id] || '') : undefined,
      }));
      resolveAmendments(surveyId, resolutions);
    }
    if (mode === 'edit' && surveyId) {
      updateSurvey({ surveyId, name: surveyName, categories: surveyCategories, questions, status: 'Submitted', waveConfig });
    } else {
      createSurvey({ projectId, name: surveyName, categories: surveyCategories, typology: surveyTypology, questions, status: 'Submitted', waveConfig });
    }
    setIsDirty(false);
    navigate(`/projects/${projectId}`);
  };

  const handleSaveTemplate = (name, visibility, selectedCategories) => {
    saveTemplate(name, questions, visibility, projectId, selectedCategories);
    setShowSaveTemplateModal(false);
  };

  const handleUseTemplate = (template) => {
    if (questions.length > 0 && !window.confirm(`Applying this template will replace the ${questions.length} existing question${questions.length !== 1 ? 's' : ''}. Continue?`)) return;
    // Filter out question types not allowed for this survey's typology
    const compatibleQs = template.questions.filter(q => allowedTypeValues.includes(q.type));
    const excluded = template.questions.length - compatibleQs.length;
    setQuestions(compatibleQs.map(q => ({ ...q, id: `q${Date.now()}_${Math.random().toString(36).slice(2, 6)}` })));
    setShowUseTemplateModal(false);
    if (excluded > 0) {
      addToast(`Template applied — ${excluded} question(s) excluded (not available in this typology)`, 'warning');
    } else {
      addToast(`Template "${template.name}" applied`);
    }
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
          <Button variant="ghost" size="sm" onClick={() => setShowUseTemplateModal(true)}>
            <BookTemplate size={14} /> Apply template
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSaveTemplateModal(true)}>
            <Save size={14} /> Save as template
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSaveDraft}>
            <Save size={14} /> Save Draft
          </Button>
          <Button size="sm" onClick={handleSubmitForApproval}>
            <Send size={14} /> Submit for Approval
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 px-6 flex items-center gap-1 flex-shrink-0">
        {[
          { id: 'questions', label: 'Questions', count: questions.length },
          { id: 'wave', label: 'Schedule Settings' },
          { id: 'experts', label: `Expert List (${selectedExperts.size})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === tab.id ? { borderBottomColor: '#4A00F8', color: '#4A00F8' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Amendment review panel — shown when PO sent back tracked changes */}
      {hasPendingAmendments && showAmendPanel && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <GitCompare size={15} className="text-amber-600" />
              Project Owner proposed {pendingEditorAmendments.length} amendment{pendingEditorAmendments.length !== 1 ? 's' : ''} — review each one
            </p>
            <button onClick={() => setShowAmendPanel(false)} className="text-amber-400 hover:text-amber-600">
              <XCircle size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {pendingEditorAmendments.map(a => {
              const res = amendResolutions[a.id];
              const typeColors = { question_edit: 'amber', question_add: 'green', question_remove: 'red', expert_add: 'green', expert_remove: 'red', wave_setting: 'blue' };
              const typeLabels = { question_edit: 'Question edited', question_add: 'Question added', question_remove: 'Question removed', expert_add: 'Expert added', expert_remove: 'Expert removed', wave_setting: 'Schedule setting' };
              const renderVal = (val) => {
                if (!val && val !== 0) return <span className="italic text-gray-400">(none)</span>;
                if (typeof val === 'object' && val.text) return <span>{val.text}</span>;
                if (typeof val === 'object' && val.name) return <span>{val.name} · {val.company}</span>;
                return <span>{String(val)}</span>;
              };
              return (
                <div key={a.id} className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                  <div className="px-4 py-2 bg-amber-100 border-b border-amber-200 flex items-center gap-2">
                    <Edit3 size={12} className="text-amber-600" />
                    <span className="text-xs font-semibold text-amber-800">{typeLabels[a.type] || a.type}: {a.label}</span>
                    <span className="text-xs text-amber-500 ml-auto">Cycle {a.cycle} · by {a.proposedBy}</span>
                  </div>
                  {(a.before !== null || a.after !== null) && (
                    <div className="px-4 py-2 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold mb-1">Before</p>
                        <p className="text-xs text-gray-600">{renderVal(a.before)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-500 font-semibold mb-1">PO proposed</p>
                        <p className="text-xs text-gray-800">{renderVal(a.after)}</p>
                      </div>
                    </div>
                  )}
                  {a.note && <p className="px-4 pb-2 text-xs text-gray-500 italic">Note: {a.note}</p>}
                  {res ? (
                    <div className="px-4 pb-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                        <Check size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-600">
                          {res === 'accepted' ? 'Accepted — will apply this change' : res === 'rejected' ? 'Rejected — must give reason' : 'Override — you will set your own value'}
                        </span>
                        <button onClick={() => setAmendResolutions(p => { const n={...p}; delete n[a.id]; return n; })} className="ml-auto text-xs text-gray-400 hover:text-gray-600">Undo</button>
                      </div>
                      {res === 'rejected' && (
                        <input
                          value={amendRejectReasons[a.id] || ''}
                          onChange={e => setAmendRejectReasons(p => ({ ...p, [a.id]: e.target.value }))}
                          placeholder="Reason for rejection (required)..."
                          className="w-full mt-2 border border-red-200 rounded-lg px-2 py-1.5 text-xs focus:border-red-400 focus:outline-none"
                        />
                      )}
                      {res === 'overridden' && (
                        <input
                          value={amendOverrideValues[a.id] || ''}
                          onChange={e => setAmendOverrideValues(p => ({ ...p, [a.id]: e.target.value }))}
                          placeholder="Your counter-value..."
                          className="w-full mt-2 border border-amber-200 rounded-lg px-2 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="px-4 pb-3 flex gap-2">
                      <button onClick={() => setAmendResolutions(p => ({ ...p, [a.id]: 'accepted' }))} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50">Accept</button>
                      <button onClick={() => setAmendResolutions(p => ({ ...p, [a.id]: 'rejected' }))} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50">Reject</button>
                      <button onClick={() => setAmendResolutions(p => ({ ...p, [a.id]: 'overridden' }))} className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-amber-700 border border-amber-200 hover:bg-amber-50">Override</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {Object.keys(amendResolutions).length > 0 && (
            <p className="text-xs text-amber-600 mt-3 font-medium">
              {Object.keys(amendResolutions).length}/{pendingEditorAmendments.length} resolved — resolutions will be submitted with your next resubmission.
            </p>
          )}
        </div>
      )}

      {/* Questions tab — dual-panel */}
      {activeTab === 'questions' && <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="flex-1 overflow-y-auto p-6" style={{ minWidth: 0 }}>
          {/* Survey name + category + typology */}
          <div className="mb-5 space-y-3">
            <input
              type="text"
              value={surveyName}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Enter survey name..."
              className="w-full text-xl font-bold text-gray-900 border-0 border-b-2 border-gray-100 pb-2 bg-transparent focus:border-purple-400 focus:outline-none transition-colors placeholder-gray-300"
            />
            {/* Selected categories — pills with remove */}
            {surveyCategories.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="text-xs font-medium text-gray-400 flex-shrink-0">Categories:</span>
                {surveyCategories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeSurveyCategory(cat)}
                      className="ml-0.5 hover:text-red-500 transition-colors"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Category picker row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Typeahead search */}
              <div className="relative flex items-center gap-1">
                <Search size={12} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={catSearch}
                  onChange={e => setCatSearch(e.target.value)}
                  placeholder="Search category…"
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:border-purple-400 focus:outline-none transition-colors text-gray-700 w-36"
                />
                {catSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 max-h-48 overflow-y-auto">
                    {catSearchResults.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => handleCatSearchSelect(c)}
                        className="w-full text-left px-3 py-2 hover:bg-purple-50 transition-colors"
                      >
                        <span className={`text-sm font-medium ${surveyCategories.includes(c.name) ? 'text-gray-300' : 'text-gray-800'}`}>{c.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{c.domain} › {c.pool}</span>
                        {surveyCategories.includes(c.name) && <span className="text-xs text-gray-300 ml-1">— already added</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cascade selects */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <label className="text-xs font-medium text-gray-400 flex-shrink-0">Domain</label>
                <select
                  value={pickerDomain}
                  onChange={e => handlePickerDomainChange(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:border-purple-400 focus:outline-none transition-colors text-gray-700"
                >
                  <option value="">Select…</option>
                  {activeTaxDomains.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
                {pickerDomain && (
                  <>
                    <ChevronRight size={11} className="text-gray-300 flex-shrink-0" />
                    <select
                      value={pickerPool}
                      onChange={e => handlePickerPoolChange(e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:border-purple-400 focus:outline-none transition-colors text-gray-700"
                    >
                      <option value="">Select pool…</option>
                      {availablePools.map(sp => <option key={sp.id} value={sp.name}>{sp.name}</option>)}
                    </select>
                  </>
                )}
                {pickerPool && (
                  <>
                    <ChevronRight size={11} className="text-gray-300 flex-shrink-0" />
                    <select
                      value={pickerCat}
                      onChange={e => handlePickerCatChange(e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:border-purple-400 focus:outline-none transition-colors text-gray-700"
                    >
                      <option value="">Select category…</option>
                      {availableLeafCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </>
                )}
                {pickerCat && (
                  surveyCategories.includes(pickerCat) ? (
                    <span className="text-xs text-gray-400 italic">Already added</span>
                  ) : (
                    <button
                      type="button"
                      onClick={addCategoryToSurvey}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border transition-colors"
                      style={{ borderColor: '#4A00F8', color: '#4A00F8', backgroundColor: '#F5F3FF' }}
                    >
                      + Add
                    </button>
                  )
                )}
                {surveyCategories.length === 0 && !pickerCat && (
                  <span className="text-xs text-amber-500 font-medium">No category selected</span>
                )}
              </div>

              {/* Typology badge */}
              <div className="flex items-center gap-1.5 ml-2">
                <Globe size={12} className="text-gray-400 flex-shrink-0" />
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  surveyTypology === 'other_survey'
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'bg-purple-50 border border-purple-100'
                }`} style={surveyTypology === 'market_signal_report' ? { color: '#4A00F8' } : {}}>
                  {surveyTypology === 'market_signal_report' ? 'Market Signal Report' : 'Other Survey'}
                </span>
              </div>
            </div>
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
                    allowedTypes={allowedTypeValues}
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
                  {QUESTION_TYPES.filter(t => allowedTypeValues.includes(t.value)).map(t => {
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
      </div>}

      {/* Schedule Settings tab */}
      {activeTab === 'wave' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
          {/* Schedule */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Schedule</h2>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Send date & time <span className="text-gray-400 font-normal">({orgTimezone})</span>
                </label>
                <input
                  type="datetime-local"
                  value={sendDate}
                  onChange={e => { setSendDate(e.target.value); setWaveErrors(er => ({ ...er, sendDate: '', closeDate: '' })); triggerAutoSave(); }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${waveErrors.sendDate ? 'border-red-300' : 'border-gray-200 focus:border-purple-400'}`}
                />
                {waveErrors.sendDate && <p className="text-xs text-red-500 mt-1">{waveErrors.sendDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Close date & time <span className="text-gray-400 font-normal">({orgTimezone})</span>
                </label>
                <input
                  type="datetime-local"
                  value={closeDate}
                  onChange={e => { setCloseDate(e.target.value); setWaveErrors(er => ({ ...er, closeDate: '' })); triggerAutoSave(); }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${waveErrors.closeDate ? 'border-red-300' : 'border-gray-200 focus:border-purple-400'}`}
                />
                {waveErrors.closeDate && <p className="text-xs text-red-500 mt-1">{waveErrors.closeDate}</p>}
              </div>
            </div>
            {sendDate && closeDate && (
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Check size={12} className="text-green-500" />
                Survey window: {new Date(sendDate).toLocaleDateString()} — {new Date(closeDate).toLocaleDateString()}
                {' '}({Math.round((new Date(closeDate) - new Date(sendDate)) / (24*60*60*1000))} days)
              </p>
            )}
          </div>

          {/* Email Template */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Email Template</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sender display name</label>
                  <input type="text" value={senderName} onChange={e => { setSenderName(e.target.value); triggerAutoSave(); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject line</label>
                  <input type="text" value={emailSubject} onChange={e => { setEmailSubject(e.target.value); triggerAutoSave(); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Email body</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Insert merge tag:</span>
                    {MERGE_TAGS.map(t => (
                      <button key={t} onClick={() => insertMergeTag(t)}
                        className="px-2 py-0.5 rounded text-xs font-mono border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors">
                        {`{{${t}}}`}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea ref={bodyRef} value={emailBody} onChange={e => { setEmailBody(e.target.value); triggerAutoSave(); }}
                  rows={9} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono resize-none focus:border-purple-400 focus:outline-none bg-gray-50 focus:bg-white" />
              </div>
              <div className="flex justify-end">
                <button onClick={() => addToast('Test email sent to your inbox')}
                  className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                  <Send size={13} /> Send me a test email
                </button>
              </div>
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Reminders</h2>
            </div>
            <div className="space-y-3 mb-4">
              {reminders.length === 0 && (
                <p className="text-sm text-gray-400 italic">No reminders configured. Add up to 3 reminder emails.</p>
              )}
              {reminders.map((reminder, idx) => (
                <div key={reminder.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-500">Reminder {idx + 1}</span>
                    <button onClick={() => removeReminder(reminder.id)} className="ml-auto p-0.5 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                  </div>
                  <input type="datetime-local" value={reminder.datetime}
                    onChange={e => updateReminder(reminder.id, e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none bg-white ${reminder.error ? 'border-red-300' : 'border-gray-200 focus:border-purple-400'}`} />
                  {reminder.error && <p className="text-xs text-red-500 mt-1.5">{reminder.error}</p>}
                  <button
                    onClick={() => updateReminderField(reminder.id, 'emailExpanded', !reminder.emailExpanded)}
                    className={`mt-3 w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${reminder.emailExpanded ? 'border-purple-300 bg-purple-100 text-purple-700' : 'border-purple-200 bg-white text-purple-600 hover:bg-purple-50'}`}>
                    <span className="flex items-center gap-1.5"><Mail size={12} />{reminder.emailExpanded ? 'Hide email template' : 'Customise reminder email'}</span>
                    <ChevronDown size={12} className={`transition-transform ${reminder.emailExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {reminder.emailExpanded && (
                    <div className="mt-2 p-3 rounded-xl bg-purple-50/50 border border-purple-200 space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Subject line</label>
                        <input type="text" value={reminder.subject || ''} onChange={e => updateReminderField(reminder.id, 'subject', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-purple-400 focus:outline-none" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-gray-500">Email body</label>
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            {['expert_name', 'survey_name', 'survey_link', 'close_date'].map(t => (
                              <span key={t} className="px-1.5 py-0.5 rounded text-xs font-mono border border-purple-100 bg-purple-50 text-purple-700">{`{{${t}}}`}</span>
                            ))}
                          </div>
                        </div>
                        <textarea value={reminder.body || ''} onChange={e => updateReminderField(reminder.id, 'body', e.target.value)} rows={5}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono resize-none focus:border-purple-400 focus:outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addReminder} disabled={reminders.length >= 3}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Plus size={14} /> Add reminder{reminders.length >= 3 && <span className="text-gray-400 ml-1">(max 3)</span>}
            </button>
          </div>

          {/* Response Rate Alert */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Response Rate Alert</h2>
              </div>
              <button onClick={() => setAlertEnabled(!alertEnabled)}
                className="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
                style={{ backgroundColor: alertEnabled ? '#4A00F8' : '#D1D5DB' }}
                role="switch" aria-checked={alertEnabled}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${alertEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            {alertEnabled && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 flex-shrink-0">Alert me if response rate is below</span>
                  <input type="number" min={1} max={100} value={alertThreshold}
                    onChange={e => setAlertThreshold(Number(e.target.value))}
                    className="w-16 border border-purple-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-purple-400" />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 flex-shrink-0">...with</span>
                  <input type="number" min={1} max={30} value={alertDaysRemaining}
                    onChange={e => setAlertDaysRemaining(Number(e.target.value))}
                    className="w-16 border border-purple-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-purple-400" />
                  <span className="text-sm text-gray-600">days remaining before close</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expert List tab */}
      {activeTab === 'experts' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={15} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Expert Target List</h2>
            </div>

            {/* Row 1: name search with autocomplete + select/deselect */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-1" ref={expertSearchRef}>
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name or company..."
                  value={expertSearch}
                  onChange={e => { setExpertSearch(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
                />
                {showSuggestions && nameSuggestions.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {nameSuggestions.map(s => (
                      <button
                        key={s.id}
                        onMouseDown={() => { setExpertSearch(s.name); setShowSuggestions(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: s.status === 'Opted-out' ? '#9CA3AF' : '#4A00F8' }}>
                          {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium text-gray-800">{s.name}</span>
                        <span className="text-gray-400 text-xs ml-1">{s.title} · {s.company}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={selectAllExperts}
                className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                Select all
              </button>
              <button onClick={deselectAllExperts}
                className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap">
                Deselect all
              </button>
            </div>

            {/* Row 2: taxonomy + designation + geography + tags filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <select value={spendingPoolFilter}
                onChange={e => { setSpendingPoolFilter(e.target.value); setCategoryFilter(''); }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none">
                <option value="">All Spending Pools</option>
                {allSpendingPools.map(sp => <option key={sp} value={sp}>{sp}</option>)}
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none">
                <option value="">All Categories</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={designationFilter} onChange={e => setDesignationFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none">
                <option value="">All Designations</option>
                {allDesignations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={geographyFilter} onChange={e => setGeographyFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none">
                <option value="">All Geographies</option>
                {allGeographies.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {(spendingPoolFilter || categoryFilter || designationFilter || geographyFilter) && (
                <button
                  onClick={() => { setSpendingPoolFilter(''); setCategoryFilter(''); setDesignationFilter(''); setGeographyFilter(''); }}
                  className="text-xs text-purple-600 hover:text-purple-800 underline whitespace-nowrap">
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">
                <span className="font-semibold" style={{ color: '#4A00F8' }}>{selectedExperts.size}</span> of {experts.length} experts selected
                {filteredExperts.length !== experts.length && (
                  <span className="text-gray-400 ml-1">· showing {filteredExperts.length}</span>
                )}
              </span>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden">
              {filteredExperts.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-gray-400">No experts match the current filters.</div>
              )}
              {filteredExperts.map((expert, idx) => {
                const isOptedOut = expert.status === 'Opted-out';
                const isSelected = selectedExperts.has(expert.id);
                return (
                  <div key={expert.id}
                    className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-gray-50' : ''} ${isOptedOut ? 'bg-gray-50 opacity-60' : 'hover:bg-purple-50/40'} transition-colors`}>
                    <input type="checkbox" checked={isSelected} disabled={isOptedOut}
                      onChange={() => !isOptedOut && toggleExpert(expert.id)}
                      className="w-4 h-4 rounded accent-purple-600 cursor-pointer disabled:cursor-not-allowed" />
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: isOptedOut ? '#9CA3AF' : '#4A00F8' }}>
                      {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{expert.name}</p>
                        {isOptedOut && <span className="text-xs text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">Opted-out</span>}
                      </div>
                      <p className="text-xs text-gray-500">{expert.title} · {expert.company}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[expert.spendingPool, expert.category, expert.geography].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end flex-shrink-0">
                      {(() => {
                        const rr = reactionRate(expert);
                        const ar = acceptanceRate(expert);
                        return (
                          <>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400 whitespace-nowrap">RR</span>
                              {rr === null
                                ? <span className="text-xs text-gray-300 italic">N/A</span>
                                : <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: kpiColor(rr).bg, color: kpiColor(rr).text }}>{rr}%</span>
                              }
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400 whitespace-nowrap">DAR</span>
                              {ar === null
                                ? <span className="text-xs text-gray-300 italic">N/A</span>
                                : <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: kpiColor(ar).bg, color: kpiColor(ar).text }}>{ar}%</span>
                              }
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirm submission modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="fade-in bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Submit for approval?</h2>
            <p className="text-sm text-gray-600 mb-1">
              You are about to submit <strong>"{surveyName}"</strong> for approval.
            </p>
            <p className="text-sm text-gray-500 mb-5">
              The entire survey — questions, schedule settings, and expert list — will be locked. The approver reviews everything as a single snapshot. If rejected, you return to Draft with full edit access.
            </p>
            <div className="bg-gray-50 rounded-xl p-3 mb-5 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Check size={12} className="text-green-500" />
                {questions.length} question{questions.length !== 1 ? 's' : ''} added
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Check size={12} className="text-green-500" />
                {selectedExperts.size} expert{selectedExperts.size !== 1 ? 's' : ''} in target list
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                {sendDate && closeDate ? <Check size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-amber-400" />}
                {sendDate && closeDate ? `Scheduled ${new Date(sendDate).toLocaleDateString()} – ${new Date(closeDate).toLocaleDateString()}` : 'No send/close dates set'}
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
          projectName={project?.name}
          activeCategories={activeCategories}
        />
      )}

      {/* Use template modal */}
      {showUseTemplateModal && (
        <UseTemplateModal
          myTemplates={myTemplates}
          projectTemplates={projectTemplates}
          orgWideTemplates={orgWideTemplates}
          onUse={handleUseTemplate}
          onClose={() => setShowUseTemplateModal(false)}
          categories={categories}
          surveyTypology={surveyTypology}
          allowedTypeValues={allowedTypeValues}
        />
      )}
    </div>
  );
}
