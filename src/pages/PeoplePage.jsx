import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, X, MoreVertical, UserCheck,
  ChevronLeft, ChevronRight, Users, FileText, PlusCircle,
  AlertTriangle, UserPlus, Send, Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// ─── helpers ────────────────────────────────────────────────────────────────

function roleBadgeColor(role) {
  if (role === 'Super Admin') return 'purple';
  if (role === 'Admin') return 'navy';
  return 'green';
}

function projectRoleBadgeColor(role) {
  if (role === 'Owner') return 'purple';
  if (role === 'Editor') return 'navy';
  return 'gray';
}

function statusBadgeColor(status) {
  return status === 'Active' ? 'green' : 'gray';
}

function getInitials(firstName, lastName) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

// ─── Profile Drawer ─────────────────────────────────────────────────────────

function ProfileDrawer({ user, onClose, onProposeAccess, onAddToProject, onChangeCategory, isSuperAdmin }) {
  if (!user) return null;
  return (
    <>
      {/* overlay (non-blocking — list still visible) */}
      <div className="fixed inset-0 z-30 pointer-events-none" />
      <div
        className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col"
        style={{ animation: 'slideInRight 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">User Profile</h2>
          <button
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={onClose}
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center mb-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3"
              style={{ backgroundColor: '#4A00F8' }}
            >
              {getInitials(user.firstName, user.lastName)}
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-500 mb-2">{user.email}</p>
            <Badge color={roleBadgeColor(user.role)}>{user.role}</Badge>
            {user.status === 'Deactivated' && (
              <Badge color="gray" className="mt-1">Deactivated</Badge>
            )}
          </div>

          {/* Team assignment */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team assignment</h4>
              {isSuperAdmin && user.role !== 'Super Admin' && (
                <button
                  onClick={() => onChangeCategory(user)}
                  className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
                >
                  <Tag size={11} /> Change
                </button>
              )}
            </div>
            {user.role === 'Super Admin' ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-100">
                <span className="text-sm">🌐</span>
                <div>
                  <p className="text-sm font-medium text-purple-800">Worldwide permissions</p>
                  <p className="text-xs text-purple-500 mt-0.5">Access to all domains, spending pools, and categories</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {(user.responsibleCategories && user.responsibleCategories.length > 1) ? (
                  user.responsibleCategories.map((rc, i) => (
                    <div key={i} className="p-2 rounded-lg bg-purple-50 border border-purple-100">
                      <p className="text-xs text-purple-400">{rc.domain} / {rc.spendingPool}</p>
                      <p className="text-sm font-medium text-purple-800">{rc.category}</p>
                    </div>
                  ))
                ) : (
                  [
                    { label: 'Domain', value: user.domain },
                    { label: 'Spending Pool', value: user.spendingPool },
                    { label: 'Category', value: user.category },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="text-sm text-gray-700 font-medium">{value || '—'}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Projects */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Projects
            </h4>
            {user.projects.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                <Users size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Not assigned to any projects yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {user.projects.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    </div>
                    <Badge color={projectRoleBadgeColor(p.projectRole)} size="xs">
                      {p.projectRole}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer action */}
        <div className="px-5 py-4 border-t border-gray-100">
          {isSuperAdmin ? (
            <Button className="w-full" size="sm" onClick={() => onAddToProject(user)}>
              <PlusCircle size={14} />
              Add to project
            </Button>
          ) : (
            <Button className="w-full" size="sm" onClick={() => onProposeAccess(user)}>
              <PlusCircle size={14} />
              Propose project access
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Propose Access Modal ────────────────────────────────────────────────────

function ProposeAccessModal({ targetUser, projects, currentUser, onConfirm, onClose }) {
  const [projectId, setProjectId] = useState('');
  const [role, setRole] = useState('Editor');
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');

  const activeProjects = projects.filter(p => !p.archived);
  const isStandardUserTarget = targetUser.role === 'Standard User';

  const selectedProject = activeProjects.find(p => p.id === projectId);

  const handleSubmit = () => {
    if (!projectId) { setError('Please select a project.'); return; }
    if (!justification.trim()) { setError('Please provide a justification.'); return; }
    onConfirm({
      type: 'membership',
      targetUser: targetUser.id,
      targetUserName: `${targetUser.firstName} ${targetUser.lastName}`,
      project: projectId,
      projectName: selectedProject?.name || '',
      proposedRole: role,
      justification: justification.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Propose project access</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Target user */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ backgroundColor: '#4A00F8' }}
            >
              {targetUser.firstName[0]}{targetUser.lastName[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{targetUser.firstName} {targetUser.lastName}</p>
              <p className="text-xs text-gray-400">{targetUser.email} · {targetUser.role}</p>
            </div>
          </div>

          {/* Project picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project</label>
            <select
              value={projectId}
              onChange={e => { setProjectId(e.target.value); setError(''); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none transition-colors"
            >
              <option value="">Select a project…</option>
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Role radio group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Proposed role</label>
            <div className="space-y-2">
              {['Owner', 'Editor', 'Viewer'].map(r => {
                const disabled = r === 'Owner' && isStandardUserTarget;
                return (
                  <label
                    key={r}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                      disabled ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-100' :
                      role === r ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="proposed-role"
                      value={r}
                      checked={role === r}
                      disabled={disabled}
                      onChange={() => !disabled && setRole(r)}
                      className="mt-0.5 accent-purple-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r}</p>
                      {disabled && (
                        <p className="text-xs text-gray-400 mt-0.5">Owner requires Admin org role</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Justification</label>
            <textarea
              value={justification}
              onChange={e => { setJustification(e.target.value); setError(''); }}
              rows={3}
              placeholder="Why does this person need access to this project?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:border-purple-400 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertTriangle size={13} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit proposal</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite User Modal (Super Admin — direct invite) ────────────────────────

function InviteUserModal({ onClose, addToast }) {
  const { taxonomy } = useApp();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'Standard User', domain: '', spendingPool: '', category: '' });
  const [errors, setErrors] = useState({});

  const activeTaxDomains = (taxonomy || []).filter(d => d.active);
  const inviteAvailablePools = activeTaxDomains.find(d => d.name === form.domain)?.spendingPools.filter(sp => sp.active) || [];
  const inviteAvailableCats = inviteAvailablePools.find(sp => sp.name === form.spendingPool)?.categories.filter(c => c.active) || [];
  const handleInviteDomainChange = (val) => setForm(f => ({ ...f, domain: val, spendingPool: '', category: '' }));
  const handleInvitePoolChange = (val) => setForm(f => ({ ...f, spendingPool: val, category: '' }));
  const isSuperAdminInvite = form.role === 'Super Admin';

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    addToast(`Invitation sent to ${form.email}`);
    onClose();
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label} <span className="text-red-400">*</span></label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); }}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors[key] ? 'border-red-300' : 'border-gray-200 focus:border-purple-400'}`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus size={18} style={{ color: '#4A00F8' }} />
            <h2 className="font-semibold text-gray-900">Invite user</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {field('firstName', 'First name', 'text', 'Jane')}
            {field('lastName', 'Last name', 'text', 'Smith')}
          </div>
          {field('email', 'Email address', 'email', 'jane@beroe.com')}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value, domain: '', spendingPool: '', category: '' }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none">
              <option value="Standard User">Standard User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Team assignment — not applicable to Super Admin */}
          {!isSuperAdminInvite && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Team assignment</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Domain</label>
                  <select
                    value={form.domain}
                    onChange={e => handleInviteDomainChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">Select…</option>
                    {activeTaxDomains.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Spending Pool</label>
                  <select
                    value={form.spendingPool}
                    onChange={e => handleInvitePoolChange(e.target.value)}
                    disabled={!form.domain}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none disabled:opacity-40"
                  >
                    <option value="">Select…</option>
                    {inviteAvailablePools.map(sp => <option key={sp.id} value={sp.name}>{sp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    disabled={!form.spendingPool}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none disabled:opacity-40"
                  >
                    <option value="">Select…</option>
                    {inviteAvailableCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
          {isSuperAdminInvite && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-100">
              <span className="text-sm">🌐</span>
              <p className="text-xs text-purple-700 font-medium">Super Admins have worldwide permissions — no team assignment needed.</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit}><Send size={14} /> Send invitation</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Platform Invite Request Modal (Admin + Standard User — routed to SA) ────

function PlatformInviteRequestModal({ onClose, onConfirm }) {
  const { taxonomy } = useApp();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', requestedRole: 'Standard User', domain: '', spendingPool: '', category: '', justification: '' });
  const [errors, setErrors] = useState({});

  const activeTaxDomains = (taxonomy || []).filter(d => d.active);
  const reqAvailablePools = activeTaxDomains.find(d => d.name === form.domain)?.spendingPools.filter(sp => sp.active) || [];
  const reqAvailableCats = reqAvailablePools.find(sp => sp.name === form.spendingPool)?.categories.filter(c => c.active) || [];
  const handleReqDomainChange = (val) => setForm(f => ({ ...f, domain: val, spendingPool: '', category: '' }));
  const handleReqPoolChange = (val) => setForm(f => ({ ...f, spendingPool: val, category: '' }));

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.justification.trim()) errs.justification = 'Required';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onConfirm({
      type: 'platform_invite',
      inviteFirstName: form.firstName.trim(),
      inviteLastName: form.lastName.trim(),
      inviteEmail: form.email.trim(),
      requestedRole: form.requestedRole,
      domain: form.domain,
      spendingPool: form.spendingPool,
      category: form.category,
      justification: form.justification.trim(),
    });
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label} <span className="text-red-400">*</span></label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); }}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors[key] ? 'border-red-300' : 'border-gray-200 focus:border-purple-400'}`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserPlus size={18} style={{ color: '#4A00F8' }} />
            <h2 className="font-semibold text-gray-900">Request team invite</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-500" /></button>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs text-gray-500 mb-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
            Your request will be sent to a Super Admin for approval. You'll be notified when it's reviewed.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {field('firstName', 'First name', 'text', 'Jane')}
              {field('lastName', 'Last name', 'text', 'Smith')}
            </div>
            {field('email', 'Email address', 'email', 'jane@beroe.com')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Requested role</label>
              <select value={form.requestedRole} onChange={e => setForm(f => ({ ...f, requestedRole: e.target.value, domain: '', spendingPool: '', category: '' }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none">
                <option value="Standard User">Standard User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {/* Team assignment */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Team assignment</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Domain</label>
                  <select
                    value={form.domain}
                    onChange={e => handleReqDomainChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">Select…</option>
                    {activeTaxDomains.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Spending Pool</label>
                  <select
                    value={form.spendingPool}
                    onChange={e => handleReqPoolChange(e.target.value)}
                    disabled={!form.domain}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none disabled:opacity-40"
                  >
                    <option value="">Select…</option>
                    {reqAvailablePools.map(sp => <option key={sp.id} value={sp.name}>{sp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    disabled={!form.spendingPool}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none disabled:opacity-40"
                  >
                    <option value="">Select…</option>
                    {reqAvailableCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Justification <span className="text-red-400">*</span></label>
              <textarea
                value={form.justification}
                onChange={e => { setForm(f => ({ ...f, justification: e.target.value })); setErrors(er => ({ ...er, justification: '' })); }}
                rows={3}
                placeholder="Why does this person need access to the platform?"
                className={`w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none transition-colors ${errors.justification ? 'border-red-300' : 'border-gray-200 focus:border-purple-400'}`}
              />
              {errors.justification && <p className="text-xs text-red-500 mt-1">{errors.justification}</p>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit}><Send size={14} /> Submit request</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Add to Project Modal (Super Admin — direct action) ──────────────────────

function AddToProjectModal({ targetUser, projects, onConfirm, onClose }) {
  const [projectId, setProjectId] = useState('');
  const [role, setRole] = useState('Editor');
  const [error, setError] = useState('');

  const activeProjects = projects.filter(p => !p.archived);
  const isStandardUserTarget = targetUser.role === 'Standard User';
  const selectedProject = activeProjects.find(p => p.id === projectId);

  const handleSubmit = () => {
    if (!projectId) { setError('Please select a project.'); return; }
    onConfirm({ projectId, projectName: selectedProject?.name || '', role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add to project</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Target user */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ backgroundColor: '#4A00F8' }}
            >
              {targetUser.firstName[0]}{targetUser.lastName[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{targetUser.firstName} {targetUser.lastName}</p>
              <p className="text-xs text-gray-400">{targetUser.email} · {targetUser.role}</p>
            </div>
          </div>

          {/* Project picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project</label>
            <select
              value={projectId}
              onChange={e => { setProjectId(e.target.value); setError(''); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none transition-colors"
            >
              <option value="">Select a project…</option>
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Role radio group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="space-y-2">
              {['Owner', 'Editor', 'Viewer'].map(r => {
                const disabled = r === 'Owner' && isStandardUserTarget;
                return (
                  <label
                    key={r}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                      disabled ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-100' :
                      role === r ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="add-role"
                      value={r}
                      checked={role === r}
                      disabled={disabled}
                      onChange={() => !disabled && setRole(r)}
                      className="mt-0.5 accent-purple-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r}</p>
                      {disabled && (
                        <p className="text-xs text-gray-400 mt-0.5">Owner requires Admin org role</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertTriangle size={13} /> {error}
            </div>
          )}
        </div>
        <div className="flex justify-between px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add to project</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Change Category Modal (Super Admin only) ────────────────────────────────

function ChangeCategoryModal({ targetUser, internalUsers, onConfirm, onClose }) {
  const { taxonomy } = useApp();

  // initialise from user's current responsibleCategories (or single category fields)
  const initCats = () => {
    if (targetUser.responsibleCategories && targetUser.responsibleCategories.length > 0) {
      return targetUser.responsibleCategories;
    }
    if (targetUser.domain && targetUser.category) {
      return [{ domain: targetUser.domain, spendingPool: targetUser.spendingPool || '', category: targetUser.category }];
    }
    return [];
  };

  const [selectedCats, setSelectedCats] = useState(initCats);
  const [pickerDomain, setPickerDomain] = useState('');
  const [pickerPool, setPickerPool] = useState('');
  const [pickerCat, setPickerCat] = useState('');

  const activeDomains = (taxonomy || []).filter(d => d.active);
  const pickerPools = activeDomains.find(d => d.name === pickerDomain)?.spendingPools.filter(sp => sp.active) || [];
  const pickerCats = pickerPools.find(sp => sp.name === pickerPool)?.categories.filter(c => c.active) || [];

  const handlePickerDomain = (val) => { setPickerDomain(val); setPickerPool(''); setPickerCat(''); };
  const handlePickerPool = (val) => { setPickerPool(val); setPickerCat(''); };

  const addCategory = () => {
    if (!pickerDomain || !pickerPool || !pickerCat) return;
    const already = selectedCats.some(c => c.category === pickerCat && c.domain === pickerDomain);
    if (already) return;
    setSelectedCats(prev => [...prev, { domain: pickerDomain, spendingPool: pickerPool, category: pickerCat }]);
    setPickerDomain(''); setPickerPool(''); setPickerCat('');
  };

  const removeCategory = (catName) => {
    setSelectedCats(prev => prev.filter(c => c.category !== catName));
  };

  // Orphaned category check: if target is Admin, find categories they currently cover
  // that would have no other Admin after the change
  const orphanedCategories = useMemo(() => {
    if (targetUser.role !== 'Admin') return [];
    const currentCatNames = (targetUser.responsibleCategories || []).map(c => c.category);
    const newCatNames = selectedCats.map(c => c.category);
    const removedCats = currentCatNames.filter(c => !newCatNames.includes(c));

    return removedCats.filter(catName => {
      // Any other active Admin covering this category?
      const otherAdmins = internalUsers.filter(u =>
        u.id !== targetUser.id &&
        u.role === 'Admin' &&
        u.status === 'Active' &&
        (u.responsibleCategories || []).some(rc => rc.category === catName)
      );
      return otherAdmins.length === 0;
    });
  }, [selectedCats, targetUser, internalUsers]);

  const hasOrphans = orphanedCategories.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Tag size={18} style={{ color: '#4A00F8' }} />
            <h2 className="font-semibold text-gray-900">Change category assignment</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Target user card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ backgroundColor: '#4A00F8' }}
            >
              {targetUser.firstName[0]}{targetUser.lastName[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{targetUser.firstName} {targetUser.lastName}</p>
              <p className="text-xs text-gray-400">{targetUser.email} · {targetUser.role}</p>
            </div>
          </div>

          {/* Orphaned category warning */}
          {hasOrphans && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-1">Orphaned category warning</p>
                  <p className="text-xs text-amber-700 mb-1">
                    Removing this Admin from the following {orphanedCategories.length === 1 ? 'category' : 'categories'} will leave
                    {orphanedCategories.length === 1 ? ' it ' : ' them '}with no assigned Admin:
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {orphanedCategories.map(c => (
                      <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">{c}</span>
                    ))}
                  </div>
                  <p className="text-xs text-amber-700 mt-2">
                    <span className="font-semibold">Super Admin will be auto-assigned</span> as fallback Admin for these categories.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected categories — pills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned categories</label>
            {selectedCats.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No categories assigned</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedCats.map(c => (
                  <span
                    key={c.category}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
                  >
                    <span className="text-purple-400 text-xs">{c.domain} / {c.spendingPool} /</span> {c.category}
                    <button
                      onClick={() => removeCategory(c.category)}
                      className="ml-0.5 hover:text-red-500 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cascade picker */}
          <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-2">Add a category</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Domain</label>
                <select
                  value={pickerDomain}
                  onChange={e => handlePickerDomain(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none"
                >
                  <option value="">Select…</option>
                  {activeDomains.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Spending Pool</label>
                <select
                  value={pickerPool}
                  onChange={e => handlePickerPool(e.target.value)}
                  disabled={!pickerDomain}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none disabled:opacity-40"
                >
                  <option value="">Select…</option>
                  {pickerPools.map(sp => <option key={sp.id} value={sp.name}>{sp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Category</label>
                <select
                  value={pickerCat}
                  onChange={e => setPickerCat(e.target.value)}
                  disabled={!pickerPool}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none disabled:opacity-40"
                >
                  <option value="">Select…</option>
                  {pickerCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={addCategory}
              disabled={!pickerDomain || !pickerPool || !pickerCat}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              + Add category
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onConfirm(selectedCats)}
            disabled={selectedCats.length === 0}
          >
            Save assignment
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Kebab menu ─────────────────────────────────────────────────────────────

function KebabMenu({ user, isSuperAdmin, isAdmin, onViewProfile, onChangeRole, onDeactivate, onProposeAccess, onAddToProject, onChangeCategory, totalSuperAdmins }) {
  const [open, setOpen] = useState(false);
  const isLastSA = user.role === 'Super Admin' && totalSuperAdmins <= 1;

  return (
    <div className="relative">
      <button
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
      >
        <MoreVertical size={15} className="text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1">
            <button
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => { setOpen(false); onViewProfile(); }}
            >
              View profile
            </button>
            {isSuperAdmin ? (
              <button
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => { setOpen(false); onAddToProject(); }}
              >
                Add to project
              </button>
            ) : (
              <button
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => { setOpen(false); onProposeAccess(); }}
              >
                Propose project access
              </button>
            )}
            {isSuperAdmin && (
              <>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => { setOpen(false); onChangeRole(); }}
                >
                  Change org role
                </button>
                {user.role !== 'Super Admin' && (
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => { setOpen(false); onChangeCategory(); }}
                  >
                    Change category
                  </button>
                )}
                <button
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    isLastSA
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  disabled={isLastSA}
                  onClick={() => { if (!isLastSA) { setOpen(false); onDeactivate(); } }}
                  title={isLastSA ? 'Cannot deactivate the last Super Admin' : undefined}
                >
                  Deactivate
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Proposals tab ──────────────────────────────────────────────────────────

function ProposalStatusBadge({ status }) {
  const map = { Pending: 'amber', Approved: 'green', Rejected: 'red', 'Auto-cancelled': 'gray' };
  return <Badge color={map[status] || 'gray'}>{status}</Badge>;
}

function MyRequestsTab({ proposals, currentUser, navigate }) {
  const myProposals = proposals.filter(p => p.submittedBy === currentUser.id);

  if (myProposals.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-600 mb-1">No requests submitted yet</p>
        <p className="text-sm text-gray-400 mb-4">
          Proposals you submit for project access or platform invites will appear here.
        </p>
        <Button size="sm" onClick={() => navigate('/people')}>
          Go to User List
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target / Details</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposed Role</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Decision By</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Decision Date</th>
          </tr>
        </thead>
        <tbody>
          {myProposals.map(p => (
            <>
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <Badge color={p.type === 'membership' ? 'navy' : 'purple'} size="xs">
                    {p.type === 'membership' ? 'Membership' : 'Platform Invite'}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-gray-800">
                  {p.type === 'membership' ? p.targetUserName : `${p.inviteFirstName} ${p.inviteLastName} (${p.inviteEmail})`}
                </td>
                <td className="py-3 px-4 text-gray-600">{p.projectName || '—'}</td>
                <td className="py-3 px-4 text-gray-600">{p.proposedRole || p.requestedRole || '—'}</td>
                <td className="py-3 px-4 text-gray-500">{p.submittedDate}</td>
                <td className="py-3 px-4"><ProposalStatusBadge status={p.status} /></td>
                <td className="py-3 px-4 text-gray-500">{p.actedByName || '—'}</td>
                <td className="py-3 px-4 text-gray-500">{p.actionDate || '—'}</td>
              </tr>
              {p.status === 'Rejected' && p.rejectionReason && (
                <tr key={`${p.id}-reason`} className="border-b border-gray-50 bg-red-50">
                  <td colSpan={8} className="py-2 px-4">
                    <p className="text-xs text-red-700">
                      <span className="font-semibold">Rejection reason:</span> {p.rejectionReason}
                    </p>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Deactivate Wizard ──────────────────────────────────────────────────────

function DeactivateWizard({ user, internalUsers, projects, onConfirm, onClose }) {
  const violations = (user.projects || []).filter(p => {
    if (p.projectRole !== 'Owner') return false;
    const otherOwners = internalUsers.filter(u =>
      u.id !== user.id &&
      u.status === 'Active' &&
      u.projects.some(up => up.id === p.id && up.projectRole === 'Owner')
    );
    return otherOwners.length === 0;
  });

  const [step, setStep] = useState(violations.length > 0 ? 1 : 3);
  const [assignments, setAssignments] = useState({});

  const activeAdmins = internalUsers.filter(u =>
    u.id !== user.id &&
    u.status === 'Active' &&
    (u.role === 'Admin' || u.role === 'Super Admin')
  );

  const handleConfirm = () => {
    onConfirm(assignments);
  };

  if (violations.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Deactivate user?</h2>
          <p className="text-sm text-gray-500 mb-5">
            {user.firstName} {user.lastName} will lose access to the platform immediately.
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">Deactivate</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Ownership reassignment required</h2>
            <p className="text-sm text-gray-500 mb-4">
              {user.firstName} {user.lastName} is the sole Owner of {violations.length} active project{violations.length > 1 ? 's' : ''}. You must reassign ownership before deactivating.
            </p>
            <div className="space-y-2 mb-5">
              {violations.map(p => (
                <div key={p.id} className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                  <span className="font-medium">{p.name}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setStep(2)} className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{backgroundColor:'#4A00F8'}}>Reassign Ownership</button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Reassign project ownership</h2>
            <p className="text-sm text-gray-500 mb-4">Select a new Owner for each project:</p>
            <div className="space-y-3 mb-5">
              {violations.map(p => (
                <div key={p.id} className="p-3 rounded-xl border border-gray-200">
                  <p className="text-sm font-medium text-gray-800 mb-2">{p.name}</p>
                  <select
                    value={assignments[p.id] || ''}
                    onChange={e => setAssignments(prev => ({...prev, [p.id]: e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">Select new owner…</option>
                    {activeAdmins.map(u => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={violations.some(p => !assignments[p.id])}
                className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
                style={{backgroundColor:'#4A00F8'}}
              >Continue</button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Confirm deactivation</h2>
            <p className="text-sm text-gray-500 mb-4">
              {violations.length > 0 ? `Ownership will be transferred and ${user.firstName} ${user.lastName} will be deactivated.` : `${user.firstName} ${user.lastName} will lose access immediately.`}
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">Confirm Deactivation</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChangeRoleModal({ user, internalUsers, projects, onConfirm, onClose }) {
  const [newRole, setNewRole] = useState(user.role);

  const wouldViolate = (targetRole) => {
    if (targetRole === 'Super Admin' || targetRole === 'Admin') return false;
    if (user.role !== 'Admin' && user.role !== 'Super Admin') return false;
    return (user.projects || []).some(p => {
      if (p.projectRole !== 'Owner') return false;
      const otherOwners = internalUsers.filter(u =>
        u.id !== user.id &&
        u.status === 'Active' &&
        (u.role === 'Admin' || u.role === 'Super Admin') &&
        u.projects.some(up => up.id === p.id && up.projectRole === 'Owner')
      );
      return otherOwners.length === 0;
    });
  };

  const hasViolation = wouldViolate(newRole);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Change org role</h2>
        <p className="text-sm text-gray-500 mb-1">{user.firstName} {user.lastName}</p>
        <select
          value={newRole}
          onChange={e => setNewRole(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none mb-3"
        >
          {['Standard User', 'Admin', 'Super Admin'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {hasViolation && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 mb-3">
            <p className="text-xs text-red-700">Cannot downgrade: {user.firstName} is the sole project Owner on one or more active projects. Reassign ownership first.</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={() => onConfirm(newRole)}
            disabled={hasViolation || newRole === user.role}
            className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
            style={{backgroundColor:'#4A00F8'}}
          >Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PeoplePage() {
  const { currentUser, internalUsers, projects, proposals, addToast, createProposal, addUserToProject, deactivateUser, updateUserRole, updateUserCategory } = useApp();
  const navigate = useNavigate();

  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isAdmin = currentUser.role === 'Admin';
  const isStandardUser = currentUser.role === 'Standard User';
  const totalSuperAdmins = internalUsers.filter(u => u.role === 'Super Admin').length;

  const [activeTab, setActiveTab] = useState('users');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInviteRequestModal, setShowInviteRequestModal] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [domainFilter, setDomainFilter] = useState('All');
  const [spendingPoolFilter, setSpendingPoolFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [changeRoleTarget, setChangeRoleTarget] = useState(null);
  const [proposeTarget, setProposeTarget] = useState(null);
  const [addTarget, setAddTarget] = useState(null);
  const [changeCategoryTarget, setChangeCategoryTarget] = useState(null);

  const roleOptions = ['All', 'Super Admin', 'Admin', 'Standard User'];

  // Cascading taxonomy options
  const allDomains = useMemo(() => [...new Set(internalUsers.map(u => u.domain).filter(Boolean))].sort(), [internalUsers]);
  const availableSpendingPools = useMemo(() => {
    const base = domainFilter === 'All' ? internalUsers : internalUsers.filter(u => u.domain === domainFilter);
    return [...new Set(base.map(u => u.spendingPool).filter(Boolean))].sort();
  }, [internalUsers, domainFilter]);
  const availableCategories = useMemo(() => {
    let base = internalUsers;
    if (domainFilter !== 'All') base = base.filter(u => u.domain === domainFilter);
    if (spendingPoolFilter !== 'All') base = base.filter(u => u.spendingPool === spendingPoolFilter);
    return [...new Set(base.map(u => u.category).filter(Boolean))].sort();
  }, [internalUsers, domainFilter, spendingPoolFilter]);

  const handleDomainChange = (val) => { setDomainFilter(val); setSpendingPoolFilter('All'); setCategoryFilter('All'); setPage(1); };
  const handleSpendingPoolChange = (val) => { setSpendingPoolFilter(val); setCategoryFilter('All'); setPage(1); };

  const filtered = useMemo(() => {
    let list = internalUsers.filter(u => {
      if (!showDeactivated && u.status === 'Deactivated') return false;
      if (roleFilter !== 'All' && u.role !== roleFilter) return false;
      if (domainFilter !== 'All' && u.domain !== domainFilter) return false;
      if (spendingPoolFilter !== 'All' && u.spendingPool !== spendingPoolFilter) return false;
      if (categoryFilter !== 'All' && u.category !== categoryFilter) return false;
      const q = search.toLowerCase();
      if (q && !`${u.firstName} ${u.lastName}`.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      return true;
    });

    // Sort: active first alphabetically by last name, deactivated at bottom
    list = [...list].sort((a, b) => {
      if (a.status === 'Deactivated' && b.status !== 'Deactivated') return 1;
      if (a.status !== 'Deactivated' && b.status === 'Deactivated') return -1;
      return a.lastName.localeCompare(b.lastName);
    });

    return list;
  }, [internalUsers, search, roleFilter, showDeactivated, domainFilter, spendingPoolFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const paginated = filtered.slice(pageStart, pageEnd);

  const handlePageChange = (newPage) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handleChangeRole = (user) => {
    setChangeRoleTarget(user);
  };

  const handleDeactivate = (user) => {
    setDeactivateTarget(user);
  };

  const handleConfirmDeactivate = (assignments) => {
    deactivateUser(deactivateTarget.id);
    setDeactivateTarget(null);
  };

  const handleConfirmRoleChange = (newRole) => {
    updateUserRole(changeRoleTarget.id, newRole);
    setChangeRoleTarget(null);
  };

  const handleProposeAccess = (user) => {
    setProposeTarget(user);
  };

  const handleConfirmProposal = (data) => {
    createProposal(data);
    setProposeTarget(null);
  };

  const handleAddToProject = (user) => {
    setAddTarget(user);
  };

  const handleConfirmAddToProject = ({ projectId, projectName, role }) => {
    addUserToProject(addTarget.id, projectId, projectName, role);
    setAddTarget(null);
    if (selectedUser?.id === addTarget.id) setSelectedUser(null);
  };

  const handleConfirmInviteRequest = (data) => {
    createProposal(data);
    setShowInviteRequestModal(false);
  };

  const handleChangeCategory = (user) => {
    setChangeCategoryTarget(user);
  };

  const handleConfirmChangeCategory = (responsibleCategories) => {
    updateUserCategory(changeCategoryTarget.id, responsibleCategories);
    // If drawer is open for this user, refresh its data
    if (selectedUser?.id === changeCategoryTarget.id) {
      const first = responsibleCategories[0] || {};
      setSelectedUser(prev => ({
        ...prev,
        responsibleCategories,
        domain: first.domain || '',
        spendingPool: first.spendingPool || '',
        category: first.category || '',
      }));
    }
    setChangeCategoryTarget(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-sm text-gray-500 mt-1">Internal team members</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus size={15} /> Invite user
          </Button>
        )}
        {(isAdmin || isStandardUser) && (
          <Button variant="secondary" onClick={() => setShowInviteRequestModal(true)}>
            <UserPlus size={15} /> Request team invite
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-100">
        {[
          { key: 'users', label: 'User List' },
          { key: 'requests', label: 'My Requests' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === tab.key ? { borderColor: '#4A00F8', color: '#4A00F8' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'requests' ? (
        <Card className="overflow-hidden">
          <MyRequestsTab proposals={proposals} currentUser={currentUser} navigate={navigate} />
        </Card>
      ) : (
        <>
          {/* Filters row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-48 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#4A00F8' }}
                placeholder="Search by name or email…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Role filter */}
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer"
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              >
                {roleOptions.map(r => (
                  <option key={r} value={r}>{r === 'All' ? 'All roles' : r}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Show deactivated toggle */}
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <div
                className={`w-9 h-5 rounded-full transition-colors relative ${showDeactivated ? 'bg-purple-600' : 'bg-gray-200'}`}
                style={showDeactivated ? { backgroundColor: '#4A00F8' } : {}}
                onClick={() => { setShowDeactivated(v => !v); setPage(1); }}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showDeactivated ? 'translate-x-4' : ''}`}
                />
              </div>
              Show deactivated
            </label>
          </div>

          {/* Taxonomy filters row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {[
              { label: 'Domain', value: domainFilter, options: allDomains, onChange: handleDomainChange },
              { label: 'Spending Pool', value: spendingPoolFilter, options: availableSpendingPools, onChange: handleSpendingPoolChange },
              { label: 'Category', value: categoryFilter, options: availableCategories, onChange: (val) => { setCategoryFilter(val); setPage(1); } },
            ].map(({ label, value, options, onChange }) => (
              <div key={label} className="relative">
                <select
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-purple-400 transition-colors cursor-pointer"
                >
                  <option value="All">All {label}s</option>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Domain</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Spending Pool</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none">
                      Name ↕
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <Users size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No users match your search</p>
                      </td>
                    </tr>
                  )}
                  {paginated.map(user => (
                    <tr
                      key={user.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${user.status === 'Deactivated' ? 'opacity-50' : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      {user.role === 'Super Admin' ? (
                        <td colSpan={3} className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                            🌐 Worldwide
                          </span>
                        </td>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-sm text-gray-600">{user.domain || '—'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{user.spendingPool || '—'}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{user.category || '—'}</td>
                        </>
                      )}
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: user.status === 'Deactivated' ? '#9CA3AF' : '#4A00F8' }}
                          >
                            {getInitials(user.firstName, user.lastName)}
                          </div>
                          <span className="font-medium text-gray-800">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge color={roleBadgeColor(user.role)} size="xs">{user.role}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={statusBadgeColor(user.status)} size="xs">{user.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <KebabMenu
                          user={user}
                          isSuperAdmin={isSuperAdmin}
                          totalSuperAdmins={totalSuperAdmins}
                          onViewProfile={() => setSelectedUser(user)}
                          onChangeRole={() => handleChangeRole(user)}
                          onDeactivate={() => handleDeactivate(user)}
                          onProposeAccess={() => handleProposeAccess(user)}
                          onAddToProject={() => handleAddToProject(user)}
                          onChangeCategory={() => handleChangeCategory(user)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>
                  Showing {filtered.length === 0 ? 0 : pageStart + 1}–{pageEnd} of {filtered.length} users
                </span>
                <span className="text-gray-300">|</span>
                <label className="flex items-center gap-1.5">
                  <span>Per page:</span>
                  <select
                    className="border border-gray-200 rounded text-sm px-1.5 py-0.5 bg-white focus:outline-none"
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  >
                    {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-sm text-gray-600 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Profile drawer */}
      {selectedUser && (
        <ProfileDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onProposeAccess={handleProposeAccess}
          onAddToProject={handleAddToProject}
          onChangeCategory={handleChangeCategory}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {deactivateTarget && (
        <DeactivateWizard
          user={deactivateTarget}
          internalUsers={internalUsers}
          projects={projects}
          onConfirm={handleConfirmDeactivate}
          onClose={() => setDeactivateTarget(null)}
        />
      )}
      {changeRoleTarget && (
        <ChangeRoleModal
          user={changeRoleTarget}
          internalUsers={internalUsers}
          projects={projects}
          onConfirm={handleConfirmRoleChange}
          onClose={() => setChangeRoleTarget(null)}
        />
      )}
      {proposeTarget && (
        <ProposeAccessModal
          targetUser={proposeTarget}
          projects={projects}
          currentUser={currentUser}
          onConfirm={handleConfirmProposal}
          onClose={() => setProposeTarget(null)}
        />
      )}
      {addTarget && (
        <AddToProjectModal
          targetUser={addTarget}
          projects={projects}
          onConfirm={handleConfirmAddToProject}
          onClose={() => setAddTarget(null)}
        />
      )}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          addToast={addToast}
        />
      )}
      {showInviteRequestModal && (
        <PlatformInviteRequestModal
          onClose={() => setShowInviteRequestModal(false)}
          onConfirm={handleConfirmInviteRequest}
        />
      )}
      {changeCategoryTarget && (
        <ChangeCategoryModal
          targetUser={changeCategoryTarget}
          internalUsers={internalUsers}
          onConfirm={handleConfirmChangeCategory}
          onClose={() => setChangeCategoryTarget(null)}
        />
      )}
    </div>
  );
}
