import { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, Filter, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const EVENT_TYPES = [
  'All',
  'User logged in',
  'Survey created',
  'Survey submitted for approval',
  'Survey approved',
  'Survey rejected',
  'Survey launched',
  'Survey deleted',
  'Survey cloned',
  'Dataset transferred to DataHub',
  'Reminder email sent',
  'Response submitted',
  'Expert added',
  'Expert record updated',
  'Expert deactivated',
  'Expert opted out',
  'User role changed',
  'Annotation added',
  'Project created',
];

const TARGET_TYPE_COLORS = {
  survey: 'purple',
  expert: 'navy',
  user: 'green',
  project: 'amber',
};

const PAGE_SIZE = 10;

export default function AuditLog() {
  const { auditEvents, addToast, currentUser } = useApp();

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('All');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return auditEvents.filter(ev => {
      const matchSearch = !search || [ev.user, ev.action, ev.target, ev.details || '']
        .some(field => field.toLowerCase().includes(search.toLowerCase()));
      const matchType = eventTypeFilter === 'All' || ev.action === eventTypeFilter;
      const evDate = ev.timestamp.split(' ')[0];
      const matchFrom = !dateFrom || evDate >= dateFrom;
      const matchTo = !dateTo || evDate <= dateTo;
      return matchSearch && matchType && matchFrom && matchTo;
    });
  }, [auditEvents, search, eventTypeFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleTypeFilter = (v) => { setEventTypeFilter(v); setPage(1); };
  const handleDateFrom = (v) => { setDateFrom(v); setPage(1); };
  const handleDateTo = (v) => { setDateTo(v); setPage(1); };

  const exportCSV = () => {
    addToast('Audit log exported');
  };

  // Only Admin and Super Admin can see this page
  if (currentUser.role === 'Researcher') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">You do not have permission to view the audit log.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''} · Full platform activity history
          </p>
        </div>
        <Button variant="secondary" onClick={exportCSV}>
          <Download size={15} /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, event, record..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => handleDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none"
              placeholder="From"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => handleDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none"
              placeholder="To"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={eventTypeFilter}
              onChange={e => handleTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none min-w-48"
            >
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {(search || dateFrom || dateTo || eventTypeFilter !== 'All') && (
            <button
              onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setEventTypeFilter('All'); setPage(1); }}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3 w-36">Timestamp</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 w-32">Actor</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Event Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Affected Record</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No events match the current filters
                  </td>
                </tr>
              ) : (
                pageItems.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-gray-500">{ev.timestamp}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: '#4A00F8' }}
                        >
                          {ev.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">{ev.user.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-800">{ev.action}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {ev.targetType && (
                          <Badge color={TARGET_TYPE_COLORS[ev.targetType] || 'gray'} size="xs">
                            {ev.targetType}
                          </Badge>
                        )}
                        <span className="text-sm text-gray-700 truncate max-w-48" title={ev.target}>{ev.target}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-500">{ev.details || '—'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} events
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} className="text-gray-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    currentPage === p ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={currentPage === p ? { backgroundColor: '#4A00F8' } : {}}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
