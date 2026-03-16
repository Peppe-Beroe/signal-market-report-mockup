import { useState } from 'react';
import { User, Users, Bell, Sliders, Link2, Save, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { USERS } from '../data/mockData';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const ROLE_COLORS = { 'Super Admin': 'purple', 'Admin': 'blue', 'Researcher': 'green' };

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
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { currentUser, addToast } = useApp();

  const [profile, setProfile] = useState({ name: currentUser.name, email: currentUser.email });
  const [notifications, setNotifications] = useState({
    surveySubmitted: true,
    approvalRequired: true,
    surveyLaunched: true,
    responseMilestone: true,
    bounceAlert: true,
    autoTransfer: false,
  });
  const [surveyDefaults, setSurveyDefaults] = useState({
    requireApproval: true,
    autoCloseEnabled: false,
    defaultCloseDays: 14,
    autoTransferDays: 7,
  });

  const saveProfile = () => addToast('Profile updated successfully');
  const saveDefaults = () => addToast('Survey defaults saved');

  const allUsers = Object.values(USERS);

  return (
    <div className="p-6 max-w-4xl mx-auto fade-in space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Platform configuration and administration</p>
      </div>

      {/* My Profile */}
      <Card className="p-6">
        <SectionHeader icon={User} title="My Profile" description="Your account details and display name" />
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
          <Button size="sm" onClick={saveProfile}>
            <Save size={14} /> Save Profile
          </Button>
        </div>
      </Card>

      {/* Team Members */}
      <Card className="p-6">
        <SectionHeader icon={Users} title="Team Members" description="All users with access to the platform" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Member</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#4A00F8' }}>
                        {u.avatar}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{u.name}</span>
                      {u.id === currentUser.id && (
                        <span className="text-xs text-gray-400 italic">you</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge color={ROLE_COLORS[u.role] || 'gray'} size="xs">{u.role}</Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="py-3">
                    <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-100 px-2 py-0.5 rounded">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <SectionHeader icon={Bell} title="Notifications" description="Choose which events trigger email alerts for you" />
        <div className="space-y-0">
          <Toggle checked={notifications.approvalRequired} onChange={v => setNotifications(n => ({ ...n, approvalRequired: v }))} label="Survey submitted for approval" description="Notify admins when a researcher submits a survey" />
          <Toggle checked={notifications.surveyLaunched} onChange={v => setNotifications(n => ({ ...n, surveyLaunched: v }))} label="Survey launched" description="Notify team when a survey goes live" />
          <Toggle checked={notifications.responseMilestone} onChange={v => setNotifications(n => ({ ...n, responseMilestone: v }))} label="Response milestones" description="Alert at 25%, 50%, 75% response rate" />
          <Toggle checked={notifications.bounceAlert} onChange={v => setNotifications(n => ({ ...n, bounceAlert: v }))} label="Email bounce alerts" description="Immediate alert when an expert email bounces" />
          <Toggle checked={notifications.autoTransfer} onChange={v => setNotifications(n => ({ ...n, autoTransfer: v }))} label="Auto-transfer reminder" description="Reminder before scheduled DataHub transfer" />
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
              type="number"
              min={1}
              max={90}
              value={surveyDefaults.defaultCloseDays}
              onChange={e => setSurveyDefaults(d => ({ ...d, defaultCloseDays: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Auto-transfer delay after close (days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={surveyDefaults.autoTransferDays}
              onChange={e => setSurveyDefaults(d => ({ ...d, autoTransferDays: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>
        <Button size="sm" onClick={saveDefaults}>
          <Save size={14} /> Save Defaults
        </Button>
      </Card>

      {/* Integrations */}
      <Card className="p-6">
        <SectionHeader icon={Link2} title="Integrations" description="External systems connected to this platform" />
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">DH</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">DataHub</p>
                <p className="text-xs text-gray-400">Survey response export — Phase 2</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <Clock size={12} />
              Phase 2
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">@</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Email Provider</p>
                <p className="text-xs text-gray-400">Transactional email for survey delivery</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <Clock size={12} />
              Pending selection
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-green-100 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">GH</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">GitHub</p>
                <p className="text-xs text-gray-400">Source code and deployment pipeline</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle size={12} />
              Connected
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
