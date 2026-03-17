import { useState } from 'react';
import { User, Users, Bell, Sliders, Link2, Save, CheckCircle, Clock, Globe, List, Mail, Plus, X, Edit2, Trash2, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { USERS } from '../data/mockData';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const ROLE_COLORS = { 'Super Admin': 'purple', 'Admin': 'navy', 'Researcher': 'green' };

const TIMEZONES = [
  { value: 'IST', label: 'IST — India Standard Time (UTC+5:30)' },
  { value: 'UTC', label: 'UTC — Coordinated Universal Time (UTC+0)' },
  { value: 'EST', label: 'EST — Eastern Standard Time (UTC-5)' },
  { value: 'CET', label: 'CET — Central European Time (UTC+1)' },
  { value: 'PST', label: 'PST — Pacific Standard Time (UTC-8)' },
  { value: 'SGT', label: 'SGT — Singapore Standard Time (UTC+8)' },
];

const DEFAULT_CATEGORIES = [
  { id: 'cat1', name: 'Metals & Mining', active: true },
  { id: 'cat2', name: 'Chemicals', active: true },
  { id: 'cat3', name: 'Packaging', active: true },
  { id: 'cat4', name: 'Energy', active: true },
  { id: 'cat5', name: 'Agriculture', active: false },
];

const MERGE_TAGS_EMAIL = ['expert_name', 'survey_name', 'survey_link', 'close_date'];

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EDE9FE' }}>
        <Icon size={18} style={{ color: '#4A00F8' }} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 mt-0.5 ${checked ? '' : 'bg-gray-200'}`}
        style={checked ? { backgroundColor: '#4A00F8' } : {}}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function InviteUserModal({ onClose, addToast }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Researcher' });
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    addToast(`Invitation sent to ${form.email}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Invite User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
              placeholder="Jane Smith"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors.name ? 'border-red-300' : 'border-gray-200 focus:border-purple-400'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address <span className="text-red-400">*</span></label>
            <input type="email" value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })); }}
              placeholder="jane@beroe.com"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors.email ? 'border-red-300' : 'border-gray-200 focus:border-purple-400'}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none">
              <option>Researcher</option>
              <option>Admin</option>
              <option>Super Admin</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit}>Send Invitation</Button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_EMAIL_BODY = `Dear {{expert_name}},

We are conducting a research survey and would value your expert perspective.

Survey: {{survey_name}}
Close date: {{close_date}}
Link: {{survey_link}}

Thank you,
Beroe Research Team`;

export default function Settings() {
  const { currentUser, addToast, orgTimezone, setOrgTimezone, notificationPrefs, setNotificationPrefs } = useApp();
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isAdmin = currentUser.role === 'Admin';
  const isStandardUser = currentUser.role === 'Researcher' || currentUser.role === 'Standard User';
  const canEdit = !isStandardUser; // Admins and SAs can edit org-level settings

  const [profile, setProfile] = useState({ name: currentUser.name, email: currentUser.email });
  const ALL_NOTIFICATION_EVENTS = [
    { key: 'survey_approved', label: 'Survey approved' },
    { key: 'survey_rejected', label: 'Survey rejected' },
    { key: 'proposal_approved', label: 'Proposal approved' },
    { key: 'proposal_rejected', label: 'Proposal rejected' },
    { key: 'proposal_auto_cancelled', label: 'Proposal auto-cancelled' },
    { key: 'new_proposal_received', label: 'New proposal received', adminOnly: true },
    { key: 'invite_approved', label: 'Invite approved' },
    { key: 'invite_rejected', label: 'Invite rejected' },
    { key: 'response_rate_alert', label: 'Response rate threshold alert' },
    { key: 'expert_change_resolved', label: 'Expert change request resolved' },
    { key: 'wave_closed', label: 'Wave closed' },
  ];
  const NOTIFICATION_EVENTS = ALL_NOTIFICATION_EVENTS.filter(e => !e.adminOnly || !isStandardUser);
  const [surveyDefaults, setSurveyDefaults] = useState({
    requireApproval: true,
    autoCloseEnabled: false,
    defaultCloseDays: 14,
    autoTransferDays: 7,
  });
  // orgTimezone is wired to AppContext; local alias removed
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [defaultEmailSubject, setDefaultEmailSubject] = useState(`You're invited: {{survey_name}}`);
  const [defaultEmailBody, setDefaultEmailBody] = useState(DEFAULT_EMAIL_BODY);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [deactivateConfirmId, setDeactivateConfirmId] = useState(null);
  const [editRoleId, setEditRoleId] = useState(null);
  const [editRoleValue, setEditRoleValue] = useState('');
  const [users, setUsers] = useState(Object.values(USERS));

  const saveProfile = () => addToast('Profile updated successfully');
  const saveDefaults = () => addToast('Survey defaults saved');
  const saveTimezone = () => addToast(`Timezone updated to ${orgTimezone}`);
  const saveDefaultEmail = () => addToast('Default email template saved');

  const handleDeactivateUser = (userId) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Deactivated' } : u));
    setDeactivateConfirmId(null);
    addToast('User deactivated', 'warning');
  };

  const startEditRole = (user) => {
    setEditRoleId(user.id);
    setEditRoleValue(user.role);
  };

  const saveRole = (userId) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: editRoleValue } : u));
    setEditRoleId(null);
    addToast('User role updated');
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategories(prev => [...prev, { id: `cat${Date.now()}`, name: newCategoryName.trim(), active: true }]);
    setNewCategoryName('');
    setAddingCategory(false);
    addToast(`Category "${newCategoryName}" added`);
  };

  const toggleCategory = (id) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const startRename = (cat) => {
    setRenamingId(cat.id);
    setRenameValue(cat.name);
  };

  const saveRename = (id) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: renameValue } : c));
    setRenamingId(null);
    addToast('Category renamed');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto fade-in space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">{isStandardUser ? 'Your profile and personal preferences' : 'Platform configuration and administration'}</p>
      </div>

      {/* My Profile */}
      <Card className="p-6">
        <SectionHeader icon={User} title="My Profile" description="Your account details and display name" />
        {isStandardUser ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
                <div className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">{profile.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <div className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">{profile.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Platform role:</span>
              <Badge color={ROLE_COLORS[currentUser.role] || 'gray'} size="sm">{currentUser.role}</Badge>
            </div>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">Need to update your profile details? Reach out to your platform administrator to request a change.</p>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Platform role:</span>
                <Badge color={ROLE_COLORS[currentUser.role] || 'gray'} size="sm">{currentUser.role}</Badge>
              </div>
              <Button size="sm" onClick={saveProfile}><Save size={14} /> Save Profile</Button>
            </div>
          </>
        )}
      </Card>

      {/* User Management — hidden for Standard Users */}
      {!isStandardUser && <Card className="p-6">
        <div className="flex items-start justify-between mb-5">
          <SectionHeader icon={Users} title="User Management" description="Manage platform access and roles" />
          {isSuperAdmin && (
            <Button size="sm" onClick={() => setShowInviteModal(true)}>
              <Plus size={14} /> Invite User
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Member</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Status</th>
                {isSuperAdmin && <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#4A00F8' }}>
                        {u.avatar}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{u.name}</span>
                      {u.id === currentUser.id && <span className="text-xs text-gray-400 italic">you</span>}
                    </div>
                  </td>
                  <td className="py-3">
                    {editRoleId === u.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={editRoleValue}
                          onChange={e => setEditRoleValue(e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
                        >
                          <option>Researcher</option>
                          <option>Admin</option>
                          <option>Super Admin</option>
                        </select>
                        <button onClick={() => saveRole(u.id)} className="text-green-500 p-1"><CheckCircle size={13} /></button>
                        <button onClick={() => setEditRoleId(null)} className="text-gray-400 p-1"><X size={13} /></button>
                      </div>
                    ) : (
                      <Badge color={ROLE_COLORS[u.role] || 'gray'} size="xs">{u.role}</Badge>
                    )}
                  </td>
                  <td className="py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${u.status === 'Deactivated' ? 'text-red-600 bg-red-50 border-red-100' : 'text-green-600 bg-green-50 border-green-100'}`}>
                      {u.status === 'Deactivated' ? 'Deactivated' : 'Active'}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="py-3">
                      {u.id !== currentUser.id && u.status !== 'Deactivated' && (
                        <div className="flex items-center gap-1.5">
                          {editRoleId !== u.id && (
                            <Button variant="ghost" size="xs" onClick={() => startEditRole(u)}>
                              <Edit2 size={11} /> Edit Role
                            </Button>
                          )}
                          {deactivateConfirmId === u.id ? (
                            <span className="flex items-center gap-1">
                              <button onClick={() => handleDeactivateUser(u.id)} className="text-xs text-white bg-red-500 px-2 py-1 rounded-lg font-medium hover:bg-red-600">Confirm</button>
                              <button onClick={() => setDeactivateConfirmId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-1">Cancel</button>
                            </span>
                          ) : (
                            <Button variant="ghost" size="xs" className="text-red-400 hover:text-red-600" onClick={() => setDeactivateConfirmId(u.id)}>
                              Deactivate
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>}

      {/* Org Timezone */}
      <Card className="p-6">
        <SectionHeader icon={Globe} title="Organisation Timezone" description="Default timezone for survey schedules and reports" />
        <div className="flex items-center gap-3">
          <select
            value={orgTimezone}
            onChange={e => setOrgTimezone(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none flex-1 max-w-sm"
          >
            {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
          </select>
          <Button size="sm" onClick={saveTimezone}><Save size={14} /> Save</Button>
        </div>
      </Card>

      {/* Category Taxonomy — Super Admin only */}
      {isSuperAdmin && (
        <Card className="p-6">
          <SectionHeader icon={List} title="Category Taxonomy" description="Manage the categories used to classify projects" />
          <div className="space-y-2 mb-4">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                {renamingId === cat.id ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveRename(cat.id)}
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1 text-sm focus:border-purple-400 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span className={`flex-1 text-sm font-medium ${cat.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                    {cat.name}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  {renamingId === cat.id ? (
                    <>
                      <button onClick={() => saveRename(cat.id)} className="text-green-500 p-1"><CheckCircle size={14} /></button>
                      <button onClick={() => setRenamingId(null)} className="text-gray-400 p-1"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="xs" onClick={() => startRename(cat)}><Edit2 size={11} /> Rename</Button>
                      <Button variant="ghost" size="xs" className={cat.active ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'} onClick={() => toggleCategory(cat.id)}>
                        {cat.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {addingCategory ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="New category name..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
                autoFocus
              />
              <Button size="sm" onClick={addCategory} disabled={!newCategoryName.trim()}>Add</Button>
              <Button variant="ghost" size="sm" onClick={() => { setAddingCategory(false); setNewCategoryName(''); }}>Cancel</Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setAddingCategory(true)}>
              <Plus size={13} /> Add category
            </Button>
          )}
        </Card>
      )}

      {/* Default Email Template */}
      <Card className="p-6">
        <SectionHeader icon={Mail} title="Default Email Template" description="Pre-fill template used when setting up new survey waves" />
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Default subject line</label>
            </div>
            <input
              type="text"
              value={defaultEmailSubject}
              onChange={e => setDefaultEmailSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Default email body</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Merge tags:</span>
                {MERGE_TAGS_EMAIL.map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-xs font-mono bg-purple-50 border border-purple-100 text-purple-700">{`{{${t}}}`}</span>
                ))}
              </div>
            </div>
            <textarea
              value={defaultEmailBody}
              onChange={e => setDefaultEmailBody(e.target.value)}
              rows={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono resize-none focus:border-purple-400 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <Button size="sm" onClick={saveDefaultEmail}><Save size={14} /> Save Template</Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <SectionHeader icon={Bell} title="Notifications" description="Choose which events trigger alerts for you" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Email</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">In-platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {NOTIFICATION_EVENTS.map(({ key, label }) => {
                const prefs = notificationPrefs?.[key] || { email: false, inPlatform: false };
                const toggle = (channel) => setNotificationPrefs(prev => ({
                  ...prev,
                  [key]: { ...prefs, [channel]: !prefs[channel] },
                }));
                return (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 text-sm text-gray-700">{label}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggle('email')}
                        className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${prefs.email ? '' : 'bg-gray-200'}`}
                        style={prefs.email ? { backgroundColor: '#4A00F8' } : {}}
                        role="switch"
                        aria-checked={prefs.email}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${prefs.email ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggle('inPlatform')}
                        className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${prefs.inPlatform ? '' : 'bg-gray-200'}`}
                        style={prefs.inPlatform ? { backgroundColor: '#4A00F8' } : {}}
                        role="switch"
                        aria-checked={prefs.inPlatform}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${prefs.inPlatform ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Survey Defaults */}
      <Card className="p-6">
        <SectionHeader icon={Sliders} title="Survey Defaults" description="Default settings applied to all new surveys" />
        <div className="space-y-4 mb-5">
          <Toggle checked={surveyDefaults.requireApproval} onChange={v => setSurveyDefaults(d => ({ ...d, requireApproval: v }))} label="Require approval before launch" description="Surveys must be approved by an Admin before sending to experts" />
          <Toggle checked={surveyDefaults.autoCloseEnabled} onChange={v => setSurveyDefaults(d => ({ ...d, autoCloseEnabled: v }))} label="Auto-close surveys" description="Automatically close surveys when the close date is reached" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default close window (days)</label>
            <input
              type="number" min={1} max={90}
              value={surveyDefaults.defaultCloseDays}
              onChange={e => setSurveyDefaults(d => ({ ...d, defaultCloseDays: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Auto-transfer delay after close (days)</label>
            <input
              type="number" min={1} max={30}
              value={surveyDefaults.autoTransferDays}
              onChange={e => setSurveyDefaults(d => ({ ...d, autoTransferDays: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>
        <Button size="sm" onClick={saveDefaults}><Save size={14} /> Save Defaults</Button>
      </Card>

      {/* Integrations — hidden for Standard Users */}
      {!isStandardUser && <Card className="p-6">
        <SectionHeader icon={Link2} title="Integrations" description="External systems connected to this platform" />
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center"><span className="text-xs font-bold text-gray-600">DH</span></div>
              <div>
                <p className="text-sm font-semibold text-gray-800">DataHub</p>
                <p className="text-xs text-gray-400">Survey response export — Phase 2</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium"><Clock size={12} /> Phase 2</div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center"><span className="text-xs font-bold text-gray-600">@</span></div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Email Provider</p>
                <p className="text-xs text-gray-400">Transactional email for survey delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium"><Clock size={12} /> Pending selection</div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-green-100 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center"><span className="text-xs font-bold text-gray-600">GH</span></div>
              <div>
                <p className="text-sm font-semibold text-gray-800">GitHub</p>
                <p className="text-xs text-gray-400">Source code and deployment pipeline</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium"><CheckCircle size={12} /> Connected</div>
          </div>
        </div>
      </Card>}

      {showInviteModal && (
        <InviteUserModal onClose={() => setShowInviteModal(false)} addToast={addToast} />
      )}
    </div>
  );
}
