import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mail, Building2, Tag, ArrowLeft, Edit2, Save, X,
  CheckCircle, MousePointerClick, Truck, XCircle, MessageSquare,
  AlertTriangle, Send, History
} from 'lucide-react';

const MOCK_RECORD_HISTORY = [
  { id: 'rh1', ts: '31 Mar 2026, 14:46', actor: 'Maria Santos', field: 'Category',     before: 'Flat Steel',           after: 'Steel',                            via: 'CSV Import (steel_experts_march2026.csv)' },
  { id: 'rh2', ts: '15 Mar 2026, 11:22', actor: 'Sarah Chen',   field: 'Tags',         before: 'Tier 1',               after: 'Tier 1, NA Region',                via: 'Manual edit' },
  { id: 'rh3', ts: '10 Mar 2026, 09:15', actor: 'Maria Santos', field: 'Email',        before: 'j.wright.old@co.com',  after: 'j.wright@steelcorp.com',            via: 'Manual edit (from communication log)' },
  { id: 'rh4', ts: '01 Mar 2026, 08:00', actor: 'System',       field: 'Status',       before: '—',                    after: 'Active',                            via: 'CSV Import (initial_expert_panel.csv)' },
];
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

function EmailStatusBadge({ status }) {
  const config = {
    opened: { icon: CheckCircle, color: 'text-green-500 bg-green-50', label: 'Opened' },
    clicked: { icon: MousePointerClick, color: 'text-purple-600 bg-purple-50', label: 'Clicked link' },
    delivered: { icon: Truck, color: 'text-blue-500 bg-blue-50', label: 'Delivered' },
    bounced: { icon: XCircle, color: 'text-red-500 bg-red-50', label: 'Bounced' },
  };
  const c = config[status] || config.delivered;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${c.color}`}>
      <Icon size={11} />
      {c.label}
    </span>
  );
}

function TimelineEvent({ event, isLast, isSuperAdmin, onUpdateEmail }) {
  const [showUpdateEmail, setShowUpdateEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const iconConfig = {
    invitation: { icon: Mail, color: 'bg-blue-100 text-blue-600' },
    reminder: { icon: Send, color: 'bg-amber-100 text-amber-600' },
    response: { icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    optout: { icon: XCircle, color: 'bg-red-100 text-red-600' },
  };
  const ic = iconConfig[event.type] || iconConfig.invitation;
  const Icon = ic.icon;

  const handleUpdateEmail = () => {
    if (!newEmail.trim()) return;
    onUpdateEmail(newEmail);
    setShowUpdateEmail(false);
    setNewEmail('');
  };

  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${ic.color}`}>
          <Icon size={16} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-100 mt-2 mb-0 min-h-6" />}
      </div>

      {/* Content */}
      <div className={`pb-6 flex-1 min-w-0 ${isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">{event.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{event.surveyName}</p>
            {event.waveNumber && (
              <p className="text-xs text-gray-400">Wave {event.waveNumber}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {event.deliveryStatus && <EmailStatusBadge status={event.deliveryStatus} />}
            <span className="text-xs text-gray-400">{event.timestamp}</span>
          </div>
        </div>

        {/* Bounced — super admin can update email */}
        {event.deliveryStatus === 'bounced' && isSuperAdmin && (
          <div className="mt-2">
            {!showUpdateEmail ? (
              <button
                onClick={() => setShowUpdateEmail(true)}
                className="text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors underline underline-offset-2"
              >
                Update email address
              </button>
            ) : (
              <div className="flex items-center gap-2 mt-1 fade-in">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="new@email.com"
                  className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-purple-400 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleUpdateEmail}
                  className="text-xs font-medium text-white px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: '#4A00F8' }}
                >
                  Update
                </button>
                <button onClick={() => setShowUpdateEmail(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExpertDetail() {
  const { expertId } = useParams();
  const navigate = useNavigate();
  const { experts, surveys, currentUser, updateExpert, deactivateExpert, addToast, submitChangeRequest, taxonomy } = useApp();

  const expert = experts.find(e => e.id === expertId);
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isAdmin = currentUser.role === 'Admin';

  // Can this user directly edit this expert (within perimeter)?
  const canDirectEdit = isSuperAdmin || (
    isAdmin &&
    (currentUser.responsibleCategories || []).some(rc => rc.category === expert?.category)
  );

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [errors, setErrors] = useState({});
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqForm, setReqForm] = useState({ changeType: 'Edit data', details: '', justification: '' });
  const [reqSubmitted, setReqSubmitted] = useState(false);

  if (!expert) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Expert not found.</p>
      <Button variant="link" onClick={() => navigate('/experts')} className="mt-2">Back to Expert Database</Button>
    </div>
  );

  const startEdit = () => {
    setForm({
      name: expert.name,
      email: expert.email,
      company: expert.company,
      title: expert.title,
      geography: expert.geography || '',
      tags: expert.tags.join(', '),
    });
    setEditing(true);
    setErrors({});
  };

  const cancelEdit = () => { setEditing(false); setForm(null); setErrors({}); };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.company.trim()) errs.company = 'Company is required';
    if (!form.title.trim()) errs.title = 'Title is required';
    return errs;
  };

  const saveEdit = () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    updateExpert(expertId, {
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      title: form.title.trim(),
      geography: form.geography.trim(),
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
    });
    setEditing(false);
    setForm(null);
  };

  const handleDeactivate = () => {
    deactivateExpert(expertId);
    setConfirmDeactivate(false);
  };

  const handleUpdateEmail = (newEmail) => {
    updateExpert(expertId, { ...expert, email: newEmail });
    addToast(`Email updated to ${newEmail}`);
  };

  // Build communication timeline
  const buildTimeline = () => {
    const events = [];

    surveys.forEach(survey => {
      // Check if this expert has email status in this survey
      const emailEntry = survey.emailStatus.find(e => e.expertId === expertId);
      if (emailEntry) {
        events.push({
          id: `inv-${survey.id}`,
          type: 'invitation',
          title: 'Invitation sent',
          surveyName: survey.name,
          waveNumber: survey.wave,
          deliveryStatus: emailEntry.status,
          timestamp: emailEntry.lastEvent || survey.sendDate || '',
          _sort: emailEntry.lastEvent || survey.sendDate || '',
        });
      }

      // Check if this expert has a reminder sent
      if (survey.reminders?.length > 0 && emailEntry) {
        survey.reminders.forEach((rem, idx) => {
          events.push({
            id: `rem-${survey.id}-${idx}`,
            type: 'reminder',
            title: `${rem.type || `Reminder ${idx + 1}`} sent`,
            surveyName: survey.name,
            waveNumber: survey.wave,
            deliveryStatus: 'delivered',
            timestamp: rem.sent || '',
            _sort: rem.sent || '',
          });
        });
      }

      // Check if this expert submitted a response
      const response = survey.responses.find(r => r.expertId === expertId);
      if (response) {
        events.push({
          id: `resp-${survey.id}`,
          type: 'response',
          title: 'Response submitted',
          surveyName: survey.name,
          waveNumber: survey.wave,
          deliveryStatus: null,
          timestamp: response.submittedAt || '',
          _sort: response.submittedAt || '',
        });
      }
    });

    // Opt-out event if applicable
    if (expert.status === 'Opted-out') {
      events.push({
        id: 'optout',
        type: 'optout',
        title: 'Expert opted out',
        surveyName: 'All future surveys',
        waveNumber: null,
        deliveryStatus: null,
        timestamp: '2026-03-01',
        _sort: '2026-03-01',
      });
    }

    return events.sort((a, b) => b._sort.localeCompare(a._sort));
  };

  const timeline = buildTimeline();

  const inputClass = (key) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors[key] ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-purple-400'}`;

  return (
    <div className="p-6 max-w-4xl mx-auto fade-in">
      {/* Back nav */}
      <button
        onClick={() => navigate('/experts')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5"
      >
        <ArrowLeft size={15} /> Back to Expert Database
      </button>

      {/* Profile Card */}
      <Card className="p-6 mb-5">
        {!editing ? (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: expert.status === 'Opted-out' ? '#9CA3AF' : '#4A00F8' }}
                >
                  {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold text-gray-900">{expert.name}</h1>
                    <StatusBadge status={expert.status} />
                  </div>
                  <p className="text-sm text-gray-600">{expert.title}</p>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                    <Building2 size={13} />
                    {expert.company}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                    <Mail size={13} />
                    {expert.email}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {expert.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        <Tag size={10} /> {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Participated in <span className="font-semibold text-gray-700">{expert.waves}</span> wave{expert.waves !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canDirectEdit && (
                  <Button variant="secondary" size="sm" onClick={startEdit}>
                    <Edit2 size={13} /> Edit
                  </Button>
                )}
                {(isAdmin && !canDirectEdit) || currentUser.role === 'Standard User' ? (
                  <button
                    onClick={() => { setReqForm({ changeType: 'Edit data', details: '', justification: '' }); setReqSubmitted(false); setShowReqModal(true); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors"
                    style={{ borderColor: '#D97706', color: '#D97706', backgroundColor: '#FFFBEB' }}
                  >
                    <AlertTriangle size={12} /> Request Change
                  </button>
                ) : null}
                {isSuperAdmin && expert.status !== 'Deactivated' && (
                  !confirmDeactivate ? (
                    <Button variant="danger-outline" size="sm" onClick={() => setConfirmDeactivate(true)}>
                      Deactivate
                    </Button>
                  ) : (
                    <span className="flex items-center gap-1">
                      <button
                        onClick={handleDeactivate}
                        className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Confirm deactivate
                      </button>
                      <button
                        onClick={() => setConfirmDeactivate(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2"
                      >
                        Cancel
                      </button>
                    </span>
                  )
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Edit Expert Profile</h2>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={cancelEdit}><X size={13} /> Cancel</Button>
                <Button size="sm" onClick={saveEdit}><Save size={13} /> Save Changes</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[['name', 'Full name', true], ['email', 'Email address', true], ['company', 'Company', true], ['title', 'Job title', true]].map(([key, label, req]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label} {req && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type={key === 'email' ? 'email' : 'text'}
                    value={form[key]}
                    onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); }}
                    className={inputClass(key)}
                  />
                  {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Geography</label>
                <input
                  type="text"
                  value={form.geography}
                  onChange={e => setForm(f => ({ ...f, geography: e.target.value }))}
                  placeholder="North America, Europe…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="Tier 1, EU Region (comma-separated)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Communication Log */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare size={16} className="text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Communication Log</h2>
          <Badge color="gray">{timeline.length} events</Badge>
        </div>

        {timeline.length === 0 ? (
          <div className="text-center py-10">
            <Mail size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No communication history yet</p>
          </div>
        ) : (
          <div className="ml-1">
            {timeline.map((event, idx) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isLast={idx === timeline.length - 1}
                isSuperAdmin={isSuperAdmin}
                onUpdateEmail={handleUpdateEmail}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Record History — Super Admin only, read-only */}
      {isSuperAdmin && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <History size={16} className="text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Record History</h2>
            <Badge color="gray">{MOCK_RECORD_HISTORY.length} changes</Badge>
            <span className="ml-auto text-xs text-gray-400 italic">Read-only — no revert</span>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Date & time', 'Actor', 'Field', 'Before', 'After', 'Source'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK_RECORD_HISTORY.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{entry.ts}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-700">{entry.actor}</td>
                    <td className="px-3 py-2.5"><span className="text-xs font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{entry.field}</span></td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[140px] truncate" title={entry.before}>{entry.before}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-800 font-medium max-w-[140px] truncate" title={entry.after}>{entry.after}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400 max-w-[180px] truncate" title={entry.via}>{entry.via}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Request Change Modal */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            {!reqSubmitted ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">Request Change</h2>
                  <button onClick={() => setShowReqModal(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>

                {/* Expert info — read-only context */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 mb-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: '#4A00F8' }}>
                    {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{expert.name}</p>
                    <p className="text-xs text-gray-500">{expert.category}{expert.spendingPool ? ` · ${expert.spendingPool}` : ''}</p>
                  </div>
                </div>

                {isAdmin && !canDirectEdit && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4">
                    <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">This expert is outside your category perimeter. Your request will be routed to the relevant category Admin or Super Admin for approval.</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Change type</label>
                    <div className="flex gap-2">
                      {['Edit data', 'Change category', 'Other'].map(t => (
                        <button
                          key={t}
                          onClick={() => setReqForm(f => ({ ...f, changeType: t }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${reqForm.changeType === t ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'}`}
                          style={reqForm.changeType === t ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Details <span className="text-red-400">*</span></label>
                    <textarea
                      rows={3}
                      value={reqForm.details}
                      onChange={e => setReqForm(f => ({ ...f, details: e.target.value }))}
                      placeholder="Describe exactly what should change…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Justification</label>
                    <textarea
                      rows={2}
                      value={reqForm.justification}
                      onChange={e => setReqForm(f => ({ ...f, justification: e.target.value }))}
                      placeholder="Why is this change needed?"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button onClick={() => setShowReqModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={() => {
                      if (!reqForm.details.trim()) { addToast('Please describe the change needed.', 'warning'); return; }
                      submitChangeRequest({
                        requestType: reqForm.changeType,
                        expertName: expert.name,
                        details: reqForm.details.trim(),
                        justification: reqForm.justification.trim(),
                      });
                      setReqSubmitted(true);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: '#4A00F8' }}
                  >
                    Submit Request
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Request submitted</h3>
                <p className="text-sm text-gray-500 mb-4">Your change request for <strong>{expert.name}</strong> has been routed for approval.</p>
                <button onClick={() => setShowReqModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: '#4A00F8' }}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
