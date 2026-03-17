import { useState, useMemo } from 'react';
import { Search, Download, Lock, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const EVENT_TYPE_LABELS = {
  SURVEY_SUBMITTED:      'Survey Submitted',
  SURVEY_APPROVED:       'Survey Approved',
  SURVEY_REJECTED:       'Survey Rejected',
  SURVEY_LAUNCHED:       'Survey Launched',
  SURVEY_CLOSED:         'Survey Closed',
  EXPERT_ADDED:          'Expert Added',
  EXPERT_UPDATED:        'Expert Updated',
  EXPERT_CHANGE_RESOLVED:'Expert Change Resolved',
  USER_LOGIN:            'User Login',
  USER_INVITED:          'User Invited',
  USER_DEACTIVATED:      'User Deactivated',
  INVITE_APPROVED:       'Invite Approved',
  MEMBERSHIP_PROPOSED:   'Membership Proposed',
  PROJECT_CREATED:       'Project Created',
  TAXONOMY_UPDATED:      'Taxonomy Updated',
  REMINDER_SENT:         'Reminder Sent',
  SETTINGS_UPDATED:      'Settings Updated',
};

const EVENT_TYPE_CATEGORIES = {
  SURVEY_SUBMITTED:       'Survey',
  SURVEY_APPROVED:        'Survey',
  SURVEY_REJECTED:        'Survey',
  SURVEY_LAUNCHED:        'Survey',
  SURVEY_CLOSED:          'Survey',
  REMINDER_SENT:          'Survey',
  EXPERT_ADDED:           'Expert',
  EXPERT_UPDATED:         'Expert',
  EXPERT_CHANGE_RESOLVED: 'Expert',
  USER_LOGIN:             'Authentication',
  USER_INVITED:           'User',
  USER_DEACTIVATED:       'User',
  INVITE_APPROVED:        'User',
  MEMBERSHIP_PROPOSED:    'User',
  PROJECT_CREATED:        'Project',
  TAXONOMY_UPDATED:       'Taxonomy',
  SETTINGS_UPDATED:       'Settings',
};

function eventTypeBadgeColor(type) {
  const cat = EVENT_TYPE_CATEGORIES[type];
  const map = {
    Survey:         'navy',
    Expert:         'green',
    Authentication: 'gray',
    User:           'purple',
    Project:        'amber',
    Taxonomy:       'amber',
    Settings:       'gray',
  };
  return map[cat] || 'gray';
}

const CATEGORY_OPTIONS = ['All', 'Authentication', 'Survey', 'Expert', 'User', 'Project', 'Taxonomy'];

export default function AuditLogPage() {
  const { currentUser, auditEvents, addToast } = useApp();
  const isSuperAdmin = currentUser.role === 'Super Admin';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const filtered = useMemo(() => {
    return auditEvents.filter(ev => {
      if (categoryFilter !== 'All' && EVENT_TYPE_CATEGORIES[ev.eventType] !== categoryFilter) return false;
      const q = search.toLowerCase();
      if (q && !ev.user.toLowerCase().includes(q) && !ev.target.toLowerCase().includes(q)) return false;
      if (dateFrom && ev.timestamp < dateFrom) return false;
      if (dateTo && ev.timestamp > dateTo + ' Z') return false;
      return true;
    });
  }, [auditEvents, search, categoryFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const paginated = filtered.slice(pageStart, pageStart + pageSize);

  const handleExport = () => {
    addToast('Audit log exported to CSV');
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        </div>
        <Card className="p-12 text-center">
          <Lock size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 text-base mb-1">Access restricted</p>
          <p className="text-sm text-gray-500">
            The Audit Log is only accessible to Super Admins. Switch your role to continue.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">Complete, immutable record of platform events</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport}>
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      {/* Immutability notice */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-5">
        <Lock size={14} className="text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-700 font-medium">
          Audit records are immutable — no modification is permitted
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            placeholder="Search by user or target…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none cursor-pointer"
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
        >
          {CATEGORY_OPTIONS.map(c => (
            <option key={c} value={c}>{c === 'All' ? 'All event types' : c}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-medium">From</label>
          <input
            type="date"
            className="px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          />
          <label className="text-xs text-gray-500 font-medium">To</label>
          <input
            type="date"
            className="px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action Description</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <FileText size={28} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No events match your filters</p>
                  </td>
                </tr>
              )}
              {paginated.map(ev => (
                <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <Badge color={eventTypeBadgeColor(ev.eventType)} size="xs">
                      {EVENT_TYPE_LABELS[ev.eventType] || ev.eventType}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800">{ev.user}</td>
                  <td className="py-3 px-4 text-gray-600">{ev.action}</td>
                  <td className="py-3 px-4 text-gray-600">{ev.target}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-xs">{ev.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <span className="text-sm text-gray-500">
            Showing {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + pageSize, filtered.length)} of {filtered.length} events
          </span>
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm text-gray-600 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
