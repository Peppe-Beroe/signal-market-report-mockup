import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

const roleColors = {
  'Super Admin': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Admin': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Researcher': { bg: 'bg-green-100', text: 'text-green-700' },
};

export default function Sidebar() {
  const { currentUser, projects, surveys } = useApp();
  const isAdminOrAbove = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const activeProjectCount = projects.filter(p => p.status === 'Active').length;
  const submittedCount = surveys.filter(s => s.status === 'Submitted').length;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects', badge: activeProjectCount },
    ...(isAdminOrAbove ? [{ to: '/experts', icon: Users, label: 'Expert Database' }] : []),
    ...(isSuperAdmin ? [{ to: '/settings', icon: Settings, label: 'Settings' }] : []),
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
