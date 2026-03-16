import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { USERS } from '../data/mockData';

const roleColors = {
  'Super Admin': 'bg-purple-100 text-purple-800',
  'Admin': 'bg-blue-100 text-blue-800',
  'Researcher': 'bg-green-100 text-green-700',
};

export default function RoleSwitcher() {
  const { currentUser, switchRole } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const roleEntries = [
    { key: 'superadmin', user: USERS.superadmin },
    { key: 'admin', user: USERS.admin },
    { key: 'researcher', user: USERS.researcher },
  ];

  return (
    <div className="relative" ref={ref}>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs text-gray-400 font-medium">Demo: viewing as</span>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors duration-150"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: '#4A00F8' }}
          >
            {currentUser.avatar}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-gray-800 leading-tight">{currentUser.name}</div>
            <div className="text-xs text-gray-500 leading-tight">{currentUser.role}</div>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="fade-in absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Switch demo role</p>
          </div>
          {roleEntries.map(({ key, user }) => (
            <button
              key={key}
              onClick={() => { switchRole(key); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 transition-colors duration-100 text-left"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: '#4A00F8' }}
              >
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColors[user.role]}`}>
                  {user.role}
                </span>
                {currentUser.id === user.id && (
                  <Check size={14} className="text-purple-600 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
