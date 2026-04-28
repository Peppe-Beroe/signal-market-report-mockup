import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, AlertTriangle, ArrowLeft, Mail, MessageSquare, Phone, Users, MoreHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const CHANNELS = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

function ChannelSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {CHANNELS.map(c => {
        const Icon = c.icon;
        const selected = value === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border-2 text-xs font-medium transition-colors ${
              selected ? 'text-white' : 'border-gray-200 text-gray-600 bg-white hover:border-purple-300'
            }`}
            style={selected ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
          >
            <Icon size={16} />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function QuestionInput({ question, value, onChange }) {
  if (question.type === 'single_choice') {
    return (
      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const selected = value === opt;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(opt)}
              className={`w-full text-left px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                selected ? 'text-white' : 'border-gray-200 text-gray-700 hover:border-purple-300 bg-white'
              }`}
              style={selected ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-white' : 'border-gray-300'}`}>
                  {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                {opt}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'multi_choice') {
    const arr = Array.isArray(value) ? value : [];
    const toggle = (opt) => {
      if (arr.includes(opt)) onChange(arr.filter(v => v !== opt));
      else onChange([...arr, opt]);
    };
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-400 mb-1">Select all that apply</p>
        {question.options.map((opt, i) => {
          const selected = arr.includes(opt);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(opt)}
              className={`w-full text-left px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                selected ? 'text-white' : 'border-gray-200 text-gray-700 hover:border-purple-300 bg-white'
              }`}
              style={selected ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-white bg-white/20' : 'border-gray-300'}`}>
                  {selected && <Check size={10} className="text-white" />}
                </div>
                {opt}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'rating_scale') {
    return (
      <div>
        <div className="flex gap-2 justify-between">
          {Array.from({ length: question.scale }, (_, i) => i + 1).map(n => {
            const selected = value === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`flex-1 h-12 rounded-lg border-2 text-sm font-bold transition-colors ${
                  selected ? 'text-white' : 'border-gray-200 text-gray-600 bg-white hover:border-purple-400'
                }`}
                style={selected ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
              >
                {n}
              </button>
            );
          })}
        </div>
        {question.labels && (
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{question.labels[0]}</span>
            <span>{question.labels[1]}</span>
          </div>
        )}
      </div>
    );
  }

  if (question.type === 'open_text' || question.type === 'long_text') {
    return (
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Enter the expert's response..."
        rows={4}
        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:border-purple-400 transition-colors focus:outline-none"
      />
    );
  }

  if (question.type === 'short_text') {
    return (
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Enter the expert's response..."
        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-purple-400 transition-colors focus:outline-none"
      />
    );
  }

  if (question.type === 'number') {
    return (
      <input
        type="number"
        value={value === undefined || value === null ? '' : value}
        onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder="0"
        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-purple-400 transition-colors focus:outline-none"
      />
    );
  }

  if (question.type === 'yes_no') {
    return (
      <div className="flex gap-2">
        {['Yes', 'No'].map(opt => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                selected ? 'text-white' : 'border-gray-200 text-gray-700 hover:border-purple-300 bg-white'
              }`}
              style={selected ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder="Enter response..."
      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-purple-400 transition-colors focus:outline-none"
    />
  );
}

export default function ProxyResponseForm() {
  const { projectId, surveyId, expertId } = useParams();
  const navigate = useNavigate();
  const { surveys, projects, experts, upsertResearcherResponse, addToast } = useApp();

  const survey = surveys.find(s => s.id === surveyId);
  const project = projects.find(p => p.id === projectId);
  const expert = experts.find(e => e.id === expertId);
  const existingResponse = survey?.responses.find(r => r.expertId === expertId);

  const isRunning = survey?.status === 'Running';

  const mode = useMemo(() => {
    if (!existingResponse) return 'proxy';
    if (existingResponse.source === 'direct') return 'override';
    return 'edit';
  }, [existingResponse]);

  const [answers, setAnswers] = useState(() => existingResponse?.answers || {});
  const [channel, setChannel] = useState(existingResponse?.channel || '');
  const [channelNote, setChannelNote] = useState(existingResponse?.channelNote || '');
  const [showValidation, setShowValidation] = useState(false);

  if (!survey) {
    return <div className="p-6 text-center text-gray-500">Survey not found.</div>;
  }
  if (!expert) {
    return <div className="p-6 text-center text-gray-500">Expert not found.</div>;
  }

  if (!isRunning) {
    return (
      <div className="p-6 max-w-2xl mx-auto fade-in">
        <Card className="p-8 text-center">
          <AlertTriangle size={28} className="text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Survey is not Running</h2>
          <p className="text-sm text-gray-500 mb-6">
            Offline responses can only be entered or edited while the survey is in <strong>Running</strong> state. This survey is currently <strong>{survey.status}</strong>.
          </p>
          <Button variant="secondary" onClick={() => navigate(`/projects/${projectId}/surveys/${surveyId}/results`)}>
            ← Back to Results Hub
          </Button>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    setShowValidation(true);
    if (!channel) return;
    const missingRequired = survey.questions.some(q => {
      if (!q.required) return false;
      const a = answers[q.id];
      if (a === undefined || a === null || a === '') return true;
      if (Array.isArray(a) && a.length === 0) return true;
      return false;
    });
    if (missingRequired) return;

    upsertResearcherResponse(surveyId, expertId, {
      answers,
      channel,
      channelNote,
      expertName: expert.name,
      company: expert.company,
    });
    navigate(`/projects/${projectId}/surveys/${surveyId}/results`);
  };

  const headerCopy = {
    proxy: { title: 'Log offline response', subtitle: 'Enter a response received from this expert outside the survey link.', cta: 'Log response' },
    override: { title: 'Override response', subtitle: 'You are about to override the response submitted directly by this expert. The previous answers are pre-filled — edit only what changed.', cta: 'Save override' },
    edit: { title: 'Edit response', subtitle: existingResponse?.source === 'overridden' ? 'Editing a previously overridden response. The latest version will be saved.' : 'Editing a previously logged offline response.', cta: 'Save changes' },
  }[mode];

  const channelMissing = showValidation && !channel;

  return (
    <div className="p-6 max-w-3xl mx-auto fade-in">
      {/* Header */}
      <div className="mb-5">
        <button
          onClick={() => navigate(`/projects/${projectId}/surveys/${surveyId}/results`)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3"
        >
          <ArrowLeft size={12} /> Back to Results Hub
        </button>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-gray-900">{headerCopy.title}</h1>
          {mode === 'override' && <Badge color="amber" size="sm">Overriding direct response</Badge>}
          {mode === 'edit' && <Badge color="purple" size="sm">Editing {existingResponse?.source} response</Badge>}
        </div>
        <p className="text-sm text-gray-500">{headerCopy.subtitle}</p>
      </div>

      {/* Expert + survey context */}
      <Card className="p-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#4A00F8' }}>
            {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{expert.name}</p>
            <p className="text-xs text-gray-500">{expert.title} · {expert.company}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Survey</p>
            <p className="text-sm font-medium text-gray-700">{survey.name}</p>
            <p className="text-xs text-gray-400">{project?.name} · Wave {survey.wave}</p>
          </div>
        </div>
      </Card>

      {/* Channel + note */}
      <Card className="p-5 mb-5">
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-800 mb-1">How did you receive this response? <span className="text-red-500">*</span></p>
          <p className="text-xs text-gray-400 mb-3">For audit traceability — required.</p>
          <ChannelSelector value={channel} onChange={setChannel} />
          {channelMissing && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertTriangle size={11} /> Select the channel you received the response from
            </p>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-800 mb-1">Notes <span className="text-xs text-gray-400 font-normal">(optional)</span></p>
          <input
            type="text"
            value={channelNote}
            onChange={e => setChannelNote(e.target.value)}
            placeholder="e.g. From email thread on 2026-04-22 — clarified Q3 follow-up"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-purple-400 transition-colors focus:outline-none"
          />
        </div>
      </Card>

      {/* Questions */}
      <div className="space-y-4 mb-6">
        {survey.questions.map((q, idx) => {
          const a = answers[q.id];
          const missing = showValidation && q.required && (a === undefined || a === null || a === '' || (Array.isArray(a) && a.length === 0));
          return (
            <Card key={q.id} className="p-5">
              <div className="flex items-start gap-2 mb-3">
                <Badge color="gray" size="xs">Q{idx + 1}</Badge>
                <p className="text-sm font-semibold text-gray-800 flex-1">
                  {q.text}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </p>
              </div>
              <QuestionInput
                question={q}
                value={a}
                onChange={(v) => setAnswers(prev => ({ ...prev, [q.id]: v }))}
              />
              {missing && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <AlertTriangle size={11} /> Required
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between bg-white border-t border-gray-100 -mx-6 px-6 py-4 sticky bottom-0">
        <Button variant="secondary" onClick={() => navigate(`/projects/${projectId}/surveys/${surveyId}/results`)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {headerCopy.cta}
        </Button>
      </div>
    </div>
  );
}
