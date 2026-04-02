import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Mail, Bell, AlertTriangle, ChevronRight, Check,
  Search, Tag, X, Plus, Trash2, Send, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

function SectionCard({ number, title, icon: Icon, children }) {
  return (
    <Card className="p-6 mb-5">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: '#4A00F8' }}
        >
          {number}
        </div>
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
      </div>
      {children}
    </Card>
  );
}

function MergeTagChip({ tag, onInsert }) {
  return (
    <button
      onClick={() => onInsert(tag)}
      className="px-2 py-0.5 rounded text-xs font-mono border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
    >
      {`{{${tag}}}`}
    </button>
  );
}

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

export default function WaveSetup() {
  const { projectId, surveyId } = useParams();
  const navigate = useNavigate();
  const { surveys, projects, experts, currentUser, launchSurveyWithConfig, saveWaveSetup, addToast, orgTimezone, getUserEmailTemplates } = useApp();
  const userTpls = getUserEmailTemplates(currentUser.id);

  const survey = surveys.find(s => s.id === surveyId);
  const project = projects.find(p => p.id === projectId);

  // In the new flow, WaveSetup is accessed from Submitted state.
  // If the survey already has a saved waveConfig, pre-populate from it.
  const existingConfig = survey?.waveConfig;

  // Section 1 — Schedule
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 16);
  const closeDefault = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const closeDefaultStr = closeDefault.toISOString().slice(0, 16);

  const [sendDate, setSendDate] = useState(existingConfig?.sendDate || todayStr);
  const [closeDate, setCloseDate] = useState(existingConfig?.closeDate || closeDefaultStr);
  const [dateError, setDateError] = useState('');

  // Section 2 — Expert Target List
  const activeExperts = experts.filter(e => e.status === 'Active');
  const [selectedExperts, setSelectedExperts] = useState(
    existingConfig?.selectedExperts
      ? new Set(existingConfig.selectedExperts.map(e => e.id))
      : new Set(activeExperts.map(e => e.id))
  );
  const [expertSearch, setExpertSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const allTags = [...new Set(experts.flatMap(e => e.tags))];
  const filteredExperts = experts.filter(e => {
    const matchSearch = !expertSearch ||
      e.name.toLowerCase().includes(expertSearch.toLowerCase()) ||
      e.company.toLowerCase().includes(expertSearch.toLowerCase());
    const matchTag = !tagFilter || e.tags.includes(tagFilter);
    return matchSearch && matchTag;
  });

  const toggleExpert = (id) => {
    setSelectedExperts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedExperts(new Set(experts.filter(e => e.status !== 'Opted-out').map(e => e.id)));
  const deselectAll = () => setSelectedExperts(new Set());

  // Section 3 — Email Template (pre-fills from user's personal default; falls back to system default)
  const [emailSubject, setEmailSubject] = useState(existingConfig?.emailSubject || userTpls.invitation.subject);
  const [senderName, setSenderName] = useState(existingConfig?.senderName || 'Beroe Research Team');
  const [emailBody, setEmailBody] = useState(existingConfig?.emailBody || userTpls.invitation.body);
  const bodyRef = useRef(null);

  const insertMergeTag = (tag) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const merged = `{{${tag}}}`;
    const newBody = emailBody.slice(0, start) + merged + emailBody.slice(end);
    setEmailBody(newBody);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + merged.length, start + merged.length);
    }, 0);
  };

  const sendTestEmail = () => {
    addToast(`Test email sent to ${currentUser.email}`);
  };

  // Section 4 — Reminders
  const [reminders, setReminders] = useState([]);

  const addReminder = () => {
    if (reminders.length >= 3) return;
    setReminders(prev => [...prev, { id: Date.now(), datetime: '', error: '' }]);
  };

  const removeReminder = (id) => setReminders(prev => prev.filter(r => r.id !== id));

  const updateReminder = (id, datetime) => {
    setReminders(prev => prev.map(r => {
      if (r.id !== id) return r;
      const error = closeDate && datetime && datetime >= closeDate
        ? 'Reminder must be before the close date'
        : '';
      return { ...r, datetime, error };
    }));
  };

  // Section 5 — Response Rate Alert
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(50);
  const [alertDaysRemaining, setAlertDaysRemaining] = useState(7);

  // Validation & Launch
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!sendDate) errs.sendDate = 'Send date is required';
    if (!closeDate) errs.closeDate = 'Close date is required';
    if (sendDate && closeDate && closeDate <= sendDate) {
      errs.closeDate = 'Close date must be after send date';
    }
    if (selectedExperts.size === 0) errs.experts = 'Select at least one expert';
    if (!emailSubject.trim()) errs.emailSubject = 'Subject line is required';
    const reminderErrors = reminders.filter(r => r.error);
    if (reminderErrors.length > 0) errs.reminders = 'Fix reminder date errors before launching';
    return errs;
  };

  const isSubmittedState = survey?.status === 'Submitted';

  const handleSaveOrLaunch = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      addToast(`Please fix validation errors before ${isSubmittedState ? 'saving' : 'launching'}`, 'warning');
      return;
    }
    const config = {
      sendDate,
      closeDate,
      selectedExperts: experts.filter(e => selectedExperts.has(e.id)),
      emailSubject,
      senderName,
      emailBody,
      reminders: reminders.map(r => r.datetime).filter(Boolean),
      responseRateAlert: alertEnabled ? { threshold: alertThreshold, daysRemaining: alertDaysRemaining } : null,
    };
    if (isSubmittedState) {
      saveWaveSetup(surveyId, config);
    } else {
      launchSurveyWithConfig(surveyId, config);
    }
    navigate(`/projects/${projectId}`);
  };

  if (!survey) return <div className="p-6 text-center text-gray-500">Survey not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <button onClick={() => navigate(`/projects/${projectId}`)} className="hover:text-gray-800 transition-colors">
              {project?.name}
            </button>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">{survey.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Wave Setup</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSubmittedState
              ? 'Configure the wave before approval — settings are reviewed by the approver before the survey launches'
              : 'Configure before launching — all settings are applied when you click Launch'}
          </p>
        </div>
        <StatusBadge status={survey.status} />
      </div>

      {/* Section 1 — Schedule */}
      <SectionCard number="1" title="Schedule" icon={Calendar}>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Send date & time <span className="text-gray-400 font-normal">({orgTimezone})</span>
            </label>
            <input
              type="datetime-local"
              value={sendDate}
              onChange={e => { setSendDate(e.target.value); setErrors(er => ({ ...er, sendDate: '', closeDate: '' })); }}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors.sendDate ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-purple-400'}`}
            />
            {errors.sendDate && <p className="text-xs text-red-500 mt-1">{errors.sendDate}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Close date & time <span className="text-gray-400 font-normal">({orgTimezone})</span>
            </label>
            <input
              type="datetime-local"
              value={closeDate}
              onChange={e => { setCloseDate(e.target.value); setErrors(er => ({ ...er, closeDate: '' })); }}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors.closeDate ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-purple-400'}`}
            />
            {errors.closeDate && <p className="text-xs text-red-500 mt-1">{errors.closeDate}</p>}
          </div>
        </div>
        {sendDate && closeDate && (
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <Check size={12} className="text-green-500" />
            Survey window: {new Date(sendDate).toLocaleDateString()} — {new Date(closeDate).toLocaleDateString()}
            {' '}({Math.round((new Date(closeDate) - new Date(sendDate)) / (24*60*60*1000))} days)
          </p>
        )}
      </SectionCard>

      {/* Section 2 — Expert Target List */}
      <SectionCard number="2" title="Expert Target List" icon={Tag}>
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or company..."
              value={expertSearch}
              onChange={e => setExpertSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-purple-400 focus:outline-none transition-colors"
            />
          </div>
          <select
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none"
          >
            <option value="">All tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button variant="secondary" size="sm" onClick={selectAll}>Select all</Button>
          <Button variant="ghost" size="sm" onClick={deselectAll}>Deselect all</Button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600 font-medium">
            <span style={{ color: '#4A00F8' }}>{selectedExperts.size}</span> of {experts.length} experts selected
          </span>
          {errors.experts && <p className="text-xs text-red-500">{errors.experts}</p>}
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {filteredExperts.map((expert, idx) => {
            const isOptedOut = expert.status === 'Opted-out';
            const isSelected = selectedExperts.has(expert.id);
            return (
              <div
                key={expert.id}
                className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-gray-50' : ''} ${isOptedOut ? 'bg-gray-50 opacity-60' : 'hover:bg-purple-50/40'} transition-colors`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isOptedOut}
                  onChange={() => !isOptedOut && toggleExpert(expert.id)}
                  className="w-4 h-4 rounded accent-purple-600 cursor-pointer disabled:cursor-not-allowed"
                />
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: isOptedOut ? '#9CA3AF' : '#4A00F8' }}
                >
                  {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800">{expert.name}</p>
                    {isOptedOut && <Badge color="red" size="xs">Opted-out</Badge>}
                  </div>
                  <p className="text-xs text-gray-400">{expert.title} · {expert.company}</p>
                </div>
                <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                  {expert.expertise.slice(0, 2).map(ex => (
                    <Badge key={ex} color="purple" size="xs">{ex}</Badge>
                  ))}
                  {expert.tags.slice(0, 1).map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Section 3 — Email Template */}
      <SectionCard number="3" title="Email Template" icon={Mail}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sender display name</label>
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject line</label>
              <input
                type="text"
                value={emailSubject}
                onChange={e => { setEmailSubject(e.target.value); setErrors(er => ({ ...er, emailSubject: '' })); }}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors.emailSubject ? 'border-red-300' : 'border-gray-200 focus:border-purple-400'}`}
              />
              {errors.emailSubject && <p className="text-xs text-red-500 mt-1">{errors.emailSubject}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Email body</label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Insert merge tag:</span>
                {MERGE_TAGS.map(t => <MergeTagChip key={t} tag={t} onInsert={insertMergeTag} />)}
              </div>
            </div>
            <textarea
              ref={bodyRef}
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              rows={10}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono resize-none focus:border-purple-400 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">Merge tags are replaced with real values when emails are sent</p>
            <Button variant="secondary" size="sm" onClick={sendTestEmail}>
              <Send size={13} /> Send me a test email
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Section 4 — Reminders */}
      <SectionCard number="4" title="Reminders" icon={Bell}>
        <div className="space-y-3 mb-4">
          {reminders.length === 0 && (
            <p className="text-sm text-gray-400 italic">No reminders configured. Add up to 3 reminder emails.</p>
          )}
          {reminders.map((reminder, idx) => (
            <div key={reminder.id} className="flex items-start gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Reminder {idx + 1}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={reminder.datetime}
                    onChange={e => updateReminder(reminder.id, e.target.value)}
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${reminder.error ? 'border-red-300' : 'border-gray-200 focus:border-purple-400'}`}
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeReminder(reminder.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </Button>
                </div>
                {reminder.error && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle size={11} /> {reminder.error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        {errors.reminders && (
          <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
            <AlertTriangle size={11} /> {errors.reminders}
          </p>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={addReminder}
          disabled={reminders.length >= 3}
        >
          <Plus size={14} /> Add reminder
          {reminders.length >= 3 && <span className="text-gray-400 ml-1">(max 3)</span>}
        </Button>
      </SectionCard>

      {/* Section 5 — Response Rate Alert */}
      <SectionCard number="5" title="Response Rate Alert" icon={AlertTriangle}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-800">Enable response rate alert</p>
            <p className="text-xs text-gray-400 mt-0.5">Get notified if response rate drops below threshold</p>
          </div>
          <button
            onClick={() => setAlertEnabled(!alertEnabled)}
            className="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
            style={{ backgroundColor: alertEnabled ? '#4A00F8' : '#D1D5DB' }}
            role="switch"
            aria-checked={alertEnabled}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${alertEnabled ? 'translate-x-5' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {alertEnabled && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3 fade-in">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 flex-shrink-0">Alert me if response rate is below</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={alertThreshold}
                  onChange={e => setAlertThreshold(Number(e.target.value))}
                  className="w-16 border border-purple-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-purple-400"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 flex-shrink-0">...with</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={alertDaysRemaining}
                  onChange={e => setAlertDaysRemaining(Number(e.target.value))}
                  className="w-16 border border-purple-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-purple-400"
                />
                <span className="text-sm text-gray-600">days remaining before close</span>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Launch button */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" onClick={() => navigate(`/projects/${projectId}`)}>
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-400">
            {selectedExperts.size} expert{selectedExperts.size !== 1 ? 's' : ''} {isSubmittedState ? 'in target list' : 'will receive invitations'}
          </p>
          <Button size="lg" onClick={handleSaveOrLaunch}>
            <Send size={16} /> {isSubmittedState ? 'Save Wave Setup' : 'Launch Survey'}
          </Button>
        </div>
      </div>
    </div>
  );
}
