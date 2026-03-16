import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronRight, CheckCircle, XCircle, Users, UserPlus, AlertTriangle } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import RoleSwitcher from './RoleSwitcher';

const typeIcon = (type) => {
  const cls = 'flex-shrink-0';
  if (type === 'approval') return <CheckCircle size={15} className={`${cls} text-green-500`} />;
  if (type === 'rejection') return <XCircle size={15} className={`${cls} text-red-500`} />;
  if (type === 'proposal') return <Users size={15} className={`${cls} text-blue-500`} />;
  if (type === 'invite') return <UserPlus size={15} className={`${cls} text-purple-500`} />;
  return <AlertTriangle size={15} className={`${cls} text-amber-500`} />;
};

function useBreadcrumbs(surveys, projects) {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = [];

  if (segments[0] === 'dashboard') {
    crumbs.push({ label: 'Home', path: '/dashboard' });
  } else if (segments[0] === 'projects') {
    crumbs.push({ label: 'Projects', path: '/projects' });
    if (segments[1]) {
      const project = projects.find(p => p.id === segments[1]);
      if (project) crumbs.push({ label: project.name, path: `/projects/${segments[1]}` });
      if (segments[2] === 'surveys') {
        if (segments[3] === 'new') {
          crumbs.push({ label: 'New Survey', path: null });
        } else if (segments[3] && segments[4]) {
          const survey = surveys.find(s => s.id === segments[3]);
          if (survey) {
            crumbs.push({ label: survey.name, path: null });
            const action = segments[4];
            if (action === 'builder') crumbs.push({ label: 'Edit Survey', path: null });
            if (action === 'approve') crumbs.push({ label: 'Approval Review', path: null });
            if (action === 'results') crumbs.push({ label: 'Results', path: null });
            if (action === 'review') crumbs.push({ label: 'Post-Close Review', path: null });
            if (action === 'wave-setup') crumbs.push({ label: 'Wave Setup', path: null });
          }
        }
      }
    }
  } else if (segments[0] === 'experts') {
    crumbs.push({ label: 'Experts', path: '/experts' });
    if (segments[1]) crumbs.push({ label: 'Expert Profile', path: null });
  } else if (segments[0] === 'people') {
    crumbs.push({ label: 'People', path: '/people' });
  } else if (segments[0] === 'audit') {
    crumbs.push({ label: 'Audit Log', path: '/audit' });
  } else if (segments[0] === 'notifications') {
    crumbs.push({ label: 'Notifications', path: '/notifications' });
  } else if (segments[0] === 'settings') {
    crumbs.push({ label: 'Settings', path: '/settings' });
  }

  return crumbs;
}

export default function Header() {
  const { surveys, projects, notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const crumbs = useBreadcrumbs(surveys, projects);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleNotificationClick = (n) => {
    markNotificationRead(n.id);
    setOpen(false);
    navigate(n.link);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 z-10">
      <nav className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-gray-300" />}
            {crumb.path && i < crumbs.length - 1 ? (
              <Link to={crumb.path} className="text-gray-500 hover:text-purple-600 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className={i === crumbs.length - 1 ? 'text-gray-800 font-medium' : 'text-gray-500'}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {/* Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} className="text-gray-500" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1"
                style={{ backgroundColor: '#EF4444' }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-purple-50/60' : ''}`}
                    >
                      <div className="mt-0.5">{typeIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{n.timestamp}</p>
                      </div>
                      {!n.read && (
                        <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#4A00F8' }} />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-100">
                <Link
                  to="/notifications"
                  onClick={() => setOpen(false)}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        <RoleSwitcher />
      </div>
    </header>
  );
}
