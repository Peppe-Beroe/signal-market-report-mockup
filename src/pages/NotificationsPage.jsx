import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Users, UserPlus, AlertTriangle, Bell, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const NOTIF_ICONS = {
  approval:  CheckCircle,
  rejection: XCircle,
  proposal:  Users,
  invite:    UserPlus,
  alert:     AlertTriangle,
};

const NOTIF_ICON_COLORS = {
  approval:  '#10B981',
  rejection: '#EF4444',
  proposal:  '#4A00F8',
  invite:    '#3B82F6',
  alert:     '#F59E0B',
};

const TYPE_OPTIONS = ['All', 'approval', 'rejection', 'proposal', 'invite', 'alert'];
const TYPE_LABELS  = { approval: 'Approval', rejection: 'Rejection', proposal: 'Proposal', invite: 'Invite', alert: 'Alert' };

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('All');
  const [readFilter, setReadFilter] = useState('All'); // All | Unread | Read

  const filtered = notifications.filter(n => {
    if (typeFilter !== 'All' && n.type !== typeFilter) return false;
    if (readFilter === 'Unread' && n.read) return false;
    if (readFilter === 'Read' && !n.read) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = (notif) => {
    markNotificationRead(notif.id);
    navigate(notif.link);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllNotificationsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Filter:</span>
        </div>
        {/* Type */}
        <select
          className="pl-3 pr-7 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none cursor-pointer"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          {TYPE_OPTIONS.map(t => (
            <option key={t} value={t}>{t === 'All' ? 'All types' : TYPE_LABELS[t]}</option>
          ))}
        </select>
        {/* Read state */}
        <select
          className="pl-3 pr-7 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none cursor-pointer"
          value={readFilter}
          onChange={e => setReadFilter(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Unread">Unread only</option>
          <option value="Read">Read only</option>
        </select>
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600 mb-1">No notifications</p>
            <p className="text-sm text-gray-400">
              {readFilter === 'Unread' ? 'You have no unread notifications.' : 'Nothing matches your filters.'}
            </p>
          </div>
        ) : (
          <div>
            {filtered.map(notif => {
              const Icon = NOTIF_ICONS[notif.type] || Bell;
              const iconColor = NOTIF_ICON_COLORS[notif.type] || '#6B7280';
              return (
                <button
                  key={notif.id}
                  className="w-full text-left flex items-start gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                  style={!notif.read ? { backgroundColor: '#F5F3FF' } : {}}
                  onClick={() => handleClick(notif)}
                >
                  <div className="mt-0.5 flex-shrink-0 p-2 rounded-lg" style={{ backgroundColor: iconColor + '18' }}>
                    <Icon size={16} style={{ color: iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${notif.read ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{notif.timestamp}</p>
                  </div>
                  {!notif.read && (
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: '#4A00F8' }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
