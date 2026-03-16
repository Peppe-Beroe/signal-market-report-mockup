import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, X, MoreVertical, UserCheck,
  ChevronLeft, ChevronRight, Users, FileText, PlusCircle
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

function ProfileDrawer({ user, onClose, onProposeAccess }) {
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

          {/* Projects */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Projects
            </h4>
            {user.projects.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                <Users size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">Not assigned to any projects yet</p>
                <Button size="sm" onClick={() => onProposeAccess(user)}>
                  <PlusCircle size={14} />
                  Propose project access
                </Button>
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
      </div>
    </>
  );
}

// ─── Kebab menu ─────────────────────────────────────────────────────────────

function KebabMenu({ user, isSuperAdmin, onViewProfile, onChangeRole, onDeactivate, totalSuperAdmins }) {
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
          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg border border-gray-200 shadow-lg z-20 py-1">
            <button
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => { setOpen(false); onViewProfile(); }}
            >
              View profile
            </button>
            {isSuperAdmin && (
              <>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => { setOpen(false); onChangeRole(); }}
                >
                  Change org role
                </button>
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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PeoplePage() {
  const { currentUser, internalUsers, proposals, addToast } = useApp();
  const navigate = useNavigate();

  const isSuperAdmin = currentUser.role === 'Super Admin';
  const totalSuperAdmins = internalUsers.filter(u => u.role === 'Super Admin').length;

  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  const roleOptions = ['All', 'Super Admin', 'Admin', 'Standard User'];

  const filtered = useMemo(() => {
    let list = internalUsers.filter(u => {
      if (!showDeactivated && u.status === 'Deactivated') return false;
      if (roleFilter !== 'All' && u.role !== roleFilter) return false;
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
  }, [internalUsers, search, roleFilter, showDeactivated]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filtered.length);
  const paginated = filtered.slice(pageStart, pageEnd);

  const handlePageChange = (newPage) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handleChangeRole = (user) => {
    addToast(`Role change flow for ${user.firstName} ${user.lastName} — coming soon`, 'info');
  };

  const handleDeactivate = (user) => {
    addToast(`Deactivation confirmation for ${user.firstName} ${user.lastName} — coming soon`, 'warning');
  };

  const handleProposeAccess = (user) => {
    navigate('/people');
    addToast(`Propose access flow for ${user.firstName} ${user.lastName} — coming soon`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">People</h1>
        <p className="text-sm text-gray-500 mt-1">Internal team members</p>
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

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none">
                      Name ↕
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Org Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <UserCheck size={28} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No users match your filters</p>
                      </td>
                    </tr>
                  )}
                  {paginated.map(user => (
                    <tr
                      key={user.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${user.status === 'Deactivated' ? 'opacity-50' : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-gray-600">{user.projects.length}</td>
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
        />
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
