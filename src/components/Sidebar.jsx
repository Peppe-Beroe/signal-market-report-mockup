import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, UserCheck, Settings, ClipboardList, CheckCircle, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const roleColors = {
  'Super Admin': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Admin': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Researcher': { bg: 'bg-green-100', text: 'text-green-700' },
};

function OnboardingChecklist({ surveys, experts }) {
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (dismissed) return null;

  const steps = [
    { label: 'Create a project', done: true },
    { label: 'Invite a team member', done: true },
    { label: 'Configure org timezone', done: false },
  ];

  const completedCount = steps.filter(s => s.done).length;
  if (completedCount === steps.length) return null;

  return (
    <div className="mx-3 mb-3 rounded-xl border border-purple-100 bg-purple-50/60 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors"
        >
          {collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          Getting started ({completedCount}/{steps.length})
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-purple-300 hover:text-purple-500 transition-colors"
        >
          <X size={12} />
        </button>
      </div>
      {!collapsed && (
        <div className="space-y-1.5 mt-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : 'border-2 border-purple-300'}`}>
                {step.done && <CheckCircle size={10} className="text-white" />}
              </div>
              <span className={`text-xs ${step.done ? 'text-gray-400 line-through' : 'text-purple-800'}`}>{step.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { currentUser, projects, surveys, experts } = useApp();
  const isAdminOrAbove = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const activeProjectCount = projects.filter(p => p.status === 'Active').length;
  const submittedCount = surveys.filter(s => s.status === 'Submitted').length;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/projects', icon: FolderKanban, label: 'Projects', badge: activeProjectCount },
    { to: '/experts', icon: Users, label: 'Experts' },
    { to: '/people', icon: UserCheck, label: 'People' },
    ...(isAdminOrAbove ? [{ to: '/settings', icon: Settings, label: 'Settings' }] : []),
    ...(isSuperAdmin ? [{ to: '/audit', icon: ClipboardList, label: 'Audit Log' }] : []),
  ];

  const rc = roleColors[currentUser.role] || roleColors['Researcher'];

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src="/BeroeLogo.svg" alt="Beroe" style={{ height: '22px', width: 'auto' }} />
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: '#EDE9FF', color: '#4A00F8', fontSize: '10px', letterSpacing: '0.06em' }}
          >
            Signal
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
              }`
            }
            style={({ isActive }) => isActive ? { backgroundColor: '#4A00F8' } : {}}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-purple-600'} />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-5 text-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {submittedCount > 0 && isAdminOrAbove && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
              <span className="w-2 h-2 rounded-full bg-amber-500 pulse-dot flex-shrink-0" />
              <span className="text-xs text-amber-700 font-medium">
                {submittedCount} pending approval{submittedCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </nav>

      {/* Onboarding checklist */}
      <OnboardingChecklist surveys={surveys} experts={experts} />

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: '#4A00F8' }}
          >
            {currentUser.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</div>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${rc.bg} ${rc.text}`}>
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
