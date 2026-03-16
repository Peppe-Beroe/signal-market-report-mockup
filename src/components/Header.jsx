import { Bell, ChevronRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import RoleSwitcher from './RoleSwitcher';

function useBreadcrumbs(surveys, projects) {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = [];

  if (segments[0] === 'dashboard') {
    crumbs.push({ label: 'Dashboard', path: '/dashboard' });
  } else if (segments[0] === 'projects') {
    crumbs.push({ label: 'Projects', path: '/projects' });
    if (segments[1]) {
      const project = projects.find(p => p.id === segments[1]);
      if (project) {
        crumbs.push({ label: project.name, path: `/projects/${segments[1]}` });
      }
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
          }
        }
      }
    }
  } else if (segments[0] === 'experts') {
    crumbs.push({ label: 'Expert Database', path: '/experts' });
  } else if (segments[0] === 'settings') {
    crumbs.push({ label: 'Settings', path: '/settings' });
  }

  return crumbs;
}

export default function Header() {
  const { surveys, projects } = useApp();
  const crumbs = useBreadcrumbs(surveys, projects);
  const pendingCount = surveys.filter(s => s.status === 'Submitted').length;

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
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-500" />
          {pendingCount > 0 && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: '#F59E0B' }}
            />
          )}
        </button>
        <RoleSwitcher />
      </div>
    </header>
  );
}
