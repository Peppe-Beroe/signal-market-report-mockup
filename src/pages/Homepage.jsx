import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Clock, TrendingUp, Users, AlertCircle, ArrowRight,
  Activity, Database, PlusCircle, AlertTriangle, FileText,
  FolderOpen, FolderPlus, X, Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';

// Modal for Standard User "new survey" CTA — asks where the survey should go before navigating.
function NewSurveyModal({ projects, onClose, onSelectProject, onGoToProjects }) {
  const [path, setPath] = useState('existing'); // 'existing' | 'new'
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const activeProjects = projects.filter(p => !p.archived && p.status === 'Active');

  function handleStart() {
    if (path === 'existing' && selectedProjectId) {
      onSelectProject(selectedProjectId);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Where should this survey go?</h2>
        <p className="text-sm text-gray-500 mb-5">Surveys always live inside a project. Choose the destination before you start building.</p>

        {/* Option A — existing project */}
        <button
          onClick={() => setPath('existing')}
          className={`w-full text-left rounded-xl border-2 p-4 mb-3 transition-all ${path === 'existing' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${path === 'existing' ? 'bg-purple-100' : 'bg-gray-100'}`}>
              <FolderOpen size={18} style={{ color: path === 'existing' ? '#4A00F8' : '#9CA3AF' }} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Add to an existing project</p>
              <p className="text-xs text-gray-500 mt-0.5">Select the project this survey belongs to</p>
            </div>
          </div>

          {path === 'existing' && (
            <div className="mt-4">
              {activeProjects.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No active projects available.</p>
              ) : (
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  onClick={e => e.stopPropagation()}
                >
                  <option value="">— Select a project —</option>
                  {activeProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </button>

        {/* Option B — new project needed */}
        <button
          onClick={() => setPath('new')}
          className={`w-full text-left rounded-xl border-2 p-4 transition-all ${path === 'new' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${path === 'new' ? 'bg-purple-100' : 'bg-gray-100'}`}>
              <FolderPlus size={18} style={{ color: path === 'new' ? '#4A00F8' : '#9CA3AF' }} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">A new project is needed first</p>
              <p className="text-xs text-gray-500 mt-0.5">This survey topic doesn't fit any existing project</p>
            </div>
          </div>

          {path === 'new' && (
            <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                You can create a new project from the Projects page. You'll need to assign an <strong>Admin</strong> as the Project Owner — you cannot own projects directly.
              </p>
            </div>
          )}
        </button>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            Cancel
          </button>
          {path === 'existing' ? (
            <button
              onClick={handleStart}
              disabled={!selectedProjectId}
              className="px-5 py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#4A00F8' }}
            >
              Start Survey
            </button>
          ) : (
            <button
              onClick={onGoToProjects}
              className="px-5 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Go to Projects →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Design rule: every KPI card is always clickable — no static numbers.
function KpiCard({ icon: Icon, label, value, sub, color = '#4A00F8', onClick }) {
  return (
    <Card
      className="p-5 cursor-pointer select-none transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: color + '18' }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <p className="text-xs mt-2 font-medium" style={{ color }}>View →</p>
    </Card>
  );
}

// AuditTimeline: each entry navigates to the most relevant destination based on targetType.
function AuditTimeline({ events, surveys, projects, onNavigate }) {
  function resolveLink(ev) {
    if (ev.targetType === 'survey') {
      const s = surveys.find(x => x.name === ev.target);
      if (s) {
        if (s.status === 'Running') return `/projects/${s.projectId}/surveys/${s.id}/results`;
        if (s.status === 'Submitted') return `/projects/${s.projectId}/surveys/${s.id}/approve`;
        if (['Closed', 'Review'].includes(s.status)) return `/projects/${s.projectId}/surveys/${s.id}/review`;
        return `/projects/${s.projectId}`;
      }
      return '/projects';
    }
    if (ev.targetType === 'expert') return '/experts';
    if (ev.targetType === 'project') {
      const p = projects.find(x => x.name === ev.target);
      return p ? `/projects/${p.id}` : '/projects';
    }
    if (ev.targetType === 'user') return '/people';
    return '/audit';
  }

  return (
    <div className="space-y-1">
      {events.map((ev, i) => (
        <div
          key={ev.id}
          className="flex gap-3 cursor-pointer group rounded-lg hover:bg-gray-50 -mx-2 px-2 py-2 transition-colors"
          onClick={() => onNavigate(resolveLink(ev))}
        >
          <div className="flex flex-col items-center pt-0.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#4A00F8' }} />
            {i < events.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-sm text-gray-800">
              <span className="font-medium">{ev.user}</span>
              <span className="text-gray-500"> — {ev.action}</span>
            </p>
            <p className="text-xs font-medium truncate group-hover:underline" style={{ color: '#4A00F8' }}>{ev.target}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ev.timestamp}</p>
          </div>
          <ArrowRight size={12} className="text-gray-300 group-hover:text-purple-500 mt-1 flex-shrink-0 transition-colors" />
        </div>
      ))}
    </div>
  );
}

// Navigate to the right survey page based on its current status.
function surveyPath(s) {
  if (s.status === 'Running') return `/projects/${s.projectId}/surveys/${s.id}/results`;
  if (s.status === 'Submitted') return `/projects/${s.projectId}/surveys/${s.id}/approve`;
  if (s.status === 'Draft') return `/projects/${s.projectId}/surveys/${s.id}/builder`;
  if (['Closed', 'Review'].includes(s.status)) return `/projects/${s.projectId}/surveys/${s.id}/review`;
  return `/projects/${s.projectId}`;
}

// Smart KPI target: 1 item → go directly to that page; multiple → go to list page.
function smartTarget(items, directPath, fallback) {
  return items.length === 1 ? directPath(items[0]) : fallback;
}

function isAlertSurvey(s) {
  if (s.status !== 'Running' || !s.closeDate) return false;
  const daysLeft = Math.ceil((new Date(s.closeDate) - new Date()) / (1000 * 60 * 60 * 24));
  return s.responseRate < 60 && daysLeft < 7;
}

function isClosingThisWeek(s) {
  if (s.status !== 'Running' || !s.closeDate) return false;
  const daysLeft = Math.ceil((new Date(s.closeDate) - new Date()) / (1000 * 60 * 60 * 24));
  return daysLeft >= 0 && daysLeft <= 7;
}

const MOCK_EXPERT_REQUEST = {
  id: 'REQ-001', type: 'Add', expertName: 'Dr. Wei Chen',
  requestedBy: 'Sarah Chen', submitted: '2026-03-15',
};

export default function Homepage() {
  const { currentUser, surveys, projects, experts, auditEvents } = useApp();
  const navigate = useNavigate();
  // Must be declared here (top of component) — hooks cannot be called after early returns.
  const [showNewSurveyModal, setShowNewSurveyModal] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser.name.split(' ')[0];

  const pendingSurveys = surveys.filter(s => s.status === 'Submitted');
  const runningSurveys = surveys.filter(s => s.status === 'Running');
  const alertSurveys = surveys.filter(isAlertSurvey);
  const closingThisWeek = surveys.filter(isClosingThisWeek);

  // ── SUPER ADMIN VIEW ──────────────────────────────────────────────────────────
  if (currentUser.role === 'Super Admin') {
    const activeProjects = projects.filter(p => p.status === 'Active');

    return (
      <div className="p-6 max-w-6xl mx-auto fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}.</h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview — all teams</p>
        </div>

        {/* KPI row — every card navigates */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard icon={Activity} label="Active Projects" value={activeProjects.length} sub="Across all teams"
            onClick={() => navigate('/projects')} />
          <KpiCard icon={Database} label="Total Surveys" value={surveys.length} sub="All statuses" color="#10B981"
            onClick={() => navigate('/projects')} />
          <KpiCard icon={Users} label="Experts in DB" value={experts.length}
            sub={`${experts.filter(e => e.status === 'Active').length} active · ${experts.filter(e => e.status === 'Opted-out').length} opted-out`}
            color="#F59E0B"
            onClick={() => navigate('/experts')} />
          <KpiCard icon={AlertCircle} label="Pending Approvals" value={pendingSurveys.length} sub="Needs your action" color="#EF4444"
            onClick={() => navigate(smartTarget(pendingSurveys, s => `/projects/${s.projectId}/surveys/${s.id}/approve`, '/projects'))} />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Pending approvals — every row navigates to the approval page */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Pending Approvals</h2>
              <StatusBadge status="Submitted" size="xs" />
            </div>
            {pendingSurveys.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle size={28} className="text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">All surveys reviewed</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingSurveys.map(s => {
                  const project = projects.find(p => p.id === s.projectId);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center p-3 rounded-lg bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors group"
                      onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/approve`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 group-hover:underline truncate">{s.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <button
                            className="text-xs text-purple-600 hover:underline"
                            onClick={e => { e.stopPropagation(); navigate(`/projects/${s.projectId}`); }}
                          >
                            {project?.name}
                          </button>
                          <span className="text-xs text-gray-400">· by {s.createdBy}</span>
                        </div>
                      </div>
                      <ArrowRight size={15} className="text-amber-400 flex-shrink-0 ml-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent Activity — every entry navigates based on targetType */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Activity</h2>
              <button onClick={() => navigate('/audit')} className="text-xs font-medium hover:underline" style={{ color: '#4A00F8' }}>
                View all →
              </button>
            </div>
            <AuditTimeline events={auditEvents.slice(0, 4)} surveys={surveys} projects={projects} onNavigate={navigate} />
          </Card>
        </div>

        {/* Pending expert requests — row navigates to expert database */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={15} className="text-gray-400" />
              Pending Expert Requests
            </h2>
            <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">1 pending</span>
          </div>
          <div
            className="flex items-center p-3 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors group"
            onClick={() => navigate('/experts')}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 group-hover:underline">
                #{MOCK_EXPERT_REQUEST.id} — {MOCK_EXPERT_REQUEST.type}: {MOCK_EXPERT_REQUEST.expertName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Requested by {MOCK_EXPERT_REQUEST.requestedBy} · {MOCK_EXPERT_REQUEST.submitted}
              </p>
            </div>
            <ArrowRight size={15} className="text-amber-400 flex-shrink-0 ml-2" />
          </div>
        </Card>
      </div>
    );
  }

  // ── ADMIN VIEW ────────────────────────────────────────────────────────────────
  if (currentUser.role === 'Admin') {
    const myProjects = projects.filter(p => p.owner === currentUser.name);

    return (
      <div className="p-6 max-w-6xl mx-auto fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}.</h1>
          <p className="text-sm text-gray-500 mt-1">Your projects and surveys</p>
        </div>

        {/* KPI row — every card navigates */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard icon={Activity} label="My Projects" value={myProjects.length} sub="You own these"
            onClick={() => navigate('/projects')} />
          <KpiCard icon={TrendingUp} label="Surveys Running" value={runningSurveys.length} sub="Collecting responses" color="#10B981"
            onClick={() => navigate(smartTarget(runningSurveys, s => surveyPath(s), '/projects'))} />
          <KpiCard icon={AlertCircle} label="Awaiting My Approval" value={pendingSurveys.length} sub="Action required" color="#F59E0B"
            onClick={() => navigate(smartTarget(pendingSurveys, s => `/projects/${s.projectId}/surveys/${s.id}/approve`, '/projects'))} />
          <KpiCard icon={Clock} label="Closing This Week" value={closingThisWeek.length} sub="Within 7 days" color="#EF4444"
            onClick={() => navigate(smartTarget(closingThisWeek, s => `/projects/${s.projectId}/surveys/${s.id}/results`, '/projects'))} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left column: action items */}
          <div className="space-y-4">
            {pendingSurveys.length > 0 && (
              <Card className="p-5">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-500" />
                  Approval Required
                </h2>
                <div className="space-y-2">
                  {pendingSurveys.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center p-3 rounded-lg bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors group"
                      onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/approve`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:underline truncate">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">by {s.createdBy}</p>
                      </div>
                      <ArrowRight size={14} className="text-amber-400 flex-shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {closingThisWeek.length > 0 && (
              <Card className="p-5">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-red-500" />
                  Closing This Week
                </h2>
                <div className="space-y-2">
                  {closingThisWeek.map(s => {
                    const daysLeft = Math.ceil((new Date(s.closeDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <div
                        key={s.id}
                        className="flex items-center p-3 rounded-lg bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors group"
                        onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/results`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 group-hover:underline truncate">{s.name}</p>
                          <p className="text-xs text-red-600 font-medium mt-0.5">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</p>
                        </div>
                        <ArrowRight size={14} className="text-red-400 flex-shrink-0 ml-2" />
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {alertSurveys.length > 0 && (
              <Card className="p-5">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  Response Rate Alerts
                </h2>
                <div className="space-y-2">
                  {alertSurveys.map(s => (
                    <div
                      key={s.id}
                      className="p-3 rounded-lg bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors group"
                      onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/results`)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-gray-800 group-hover:underline truncate mr-2">{s.name}</p>
                        <ArrowRight size={14} className="text-amber-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-amber-700 mb-1.5">{s.responseRate}% response rate — below 60%</p>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.responseRate}%`, backgroundColor: '#F59E0B' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right column: recent activity + active surveys */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                <button onClick={() => navigate('/audit')} className="text-xs font-medium hover:underline" style={{ color: '#4A00F8' }}>
                  View all →
                </button>
              </div>
              <AuditTimeline events={auditEvents.slice(0, 3)} surveys={surveys} projects={projects} onNavigate={navigate} />
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Active Surveys</h2>
                <button onClick={() => navigate('/projects')} className="text-xs font-medium hover:underline" style={{ color: '#4A00F8' }}>
                  All projects →
                </button>
              </div>
              <div className="space-y-2">
                {surveys.filter(s => ['Running', 'Submitted'].includes(s.status)).map(s => {
                  const project = projects.find(p => p.id === s.projectId);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group"
                      onClick={() => navigate(surveyPath(s))}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:underline">{s.name}</p>
                        <p className="text-xs text-gray-400">{project?.name}</p>
                        {s.status === 'Running' && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${s.responseRate}%`, backgroundColor: '#10B981' }} />
                            </div>
                            <span className="text-xs text-gray-500">{s.responseRate}%</span>
                          </div>
                        )}
                      </div>
                      <StatusBadge status={s.status} size="xs" />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ── RESEARCHER VIEW ───────────────────────────────────────────────────────────
  const mySurveys = surveys.filter(s => s.createdBy === currentUser.name);
  const myDrafts = mySurveys.filter(s => s.status === 'Draft' && !s.rejectionReason);
  const rejectedSurveys = mySurveys.filter(s => s.status === 'Draft' && s.rejectionReason);
  const myClosingThisWeek = mySurveys.filter(isClosingThisWeek);
  const myPending = mySurveys.filter(s => s.status === 'Submitted');
  const myRunning = mySurveys.filter(s => s.status === 'Running');
  const avgResponseRate = Math.round(
    myRunning.reduce((acc, s) => acc + s.responseRate, 0) / (myRunning.length || 1)
  );

  const hasActionItems = myDrafts.length > 0 || rejectedSurveys.length > 0 || myClosingThisWeek.length > 0;

  const actionColumn = (
    <div className="space-y-4">
      {myDrafts.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText size={15} className="text-gray-400" />
            My Drafts
          </h2>
          <div className="space-y-2">
            {myDrafts.map(s => {
              const project = projects.find(p => p.id === s.projectId);
              return (
                <div
                  key={s.id}
                  className="flex items-center p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group"
                  onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/builder`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 group-hover:underline truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{project?.name}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-400 flex-shrink-0 ml-2" />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {rejectedSurveys.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle size={15} className="text-red-500" />
            Rejected — Needs Revision
          </h2>
          <div className="space-y-2">
            {rejectedSurveys.map(s => (
              <div
                key={s.id}
                className="p-3 rounded-lg bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors group"
                onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/builder`)}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-medium text-gray-800 group-hover:underline truncate mr-2">{s.name}</p>
                  <ArrowRight size={14} className="text-red-400 flex-shrink-0" />
                </div>
                <p className="text-xs text-red-600">Feedback: {s.rejectionReason}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {myClosingThisWeek.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={15} className="text-amber-500" />
            Upcoming Deadlines
          </h2>
          <div className="space-y-2">
            {myClosingThisWeek.map(s => {
              const daysLeft = Math.ceil((new Date(s.closeDate) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={s.id}
                  className="flex items-center p-3 rounded-lg bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors group"
                  onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/results`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 group-hover:underline truncate">{s.name}</p>
                    <p className="text-xs text-amber-600">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</p>
                  </div>
                  <ArrowRight size={14} className="text-amber-400 flex-shrink-0 ml-2" />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );

  const surveysColumn = (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">My Surveys</h2>
          <button onClick={() => navigate('/projects')} className="text-xs font-medium hover:underline" style={{ color: '#4A00F8' }}>
            All projects →
          </button>
        </div>
        {mySurveys.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No surveys yet</p>
        ) : (
          <div className="space-y-2">
            {mySurveys.map(s => {
              const project = projects.find(p => p.id === s.projectId);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group"
                  onClick={() => navigate(surveyPath(s))}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:underline">{s.name}</p>
                    <p className="text-xs text-gray-400">{project?.name}</p>
                    {s.status === 'Submitted' && <p className="text-xs text-amber-600 mt-0.5">Awaiting approval</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={s.status} size="xs" />
                    <ArrowRight size={12} className="text-gray-300 group-hover:text-purple-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* CTA — opens destination modal before creating a survey */}
      <Card
        className="p-5 border-dashed border-2 border-purple-200 bg-purple-50 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-400 hover:bg-purple-100 transition-all duration-150"
        onClick={() => setShowNewSurveyModal(true)}
      >
        <div className="p-3 rounded-full bg-white shadow-sm mb-3">
          <PlusCircle size={24} style={{ color: '#4A00F8' }} />
        </div>
        <h3 className="font-semibold text-gray-800 mb-1">Start a new survey</h3>
        <p className="text-sm text-gray-500">You'll choose which project it belongs to</p>
        <div className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm" style={{ backgroundColor: '#4A00F8' }}>
          New Survey
        </div>
      </Card>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}.</h1>
        <p className="text-sm text-gray-500 mt-1">Your surveys and submissions</p>
      </div>

      {/* KPI row — every card navigates */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard icon={Database} label="My Surveys" value={mySurveys.length} sub="All statuses"
          onClick={() => navigate('/projects')} />
        <KpiCard icon={Clock} label="Awaiting Approval" value={myPending.length} sub="Submitted for review" color="#F59E0B"
          onClick={() => navigate(smartTarget(myPending, s => `/projects/${s.projectId}/surveys/${s.id}/approve`, '/projects'))} />
        <KpiCard icon={TrendingUp} label="Running Surveys" value={myRunning.length}
          sub={myRunning.length > 0 ? `Avg ${avgResponseRate}% response rate` : 'None active'}
          color="#10B981"
          onClick={() => navigate(smartTarget(myRunning, s => surveyPath(s), '/projects'))} />
      </div>

      {hasActionItems ? (
        <div className="grid grid-cols-2 gap-6">
          {actionColumn}
          {surveysColumn}
        </div>
      ) : (
        surveysColumn
      )}

      {showNewSurveyModal && (
        <NewSurveyModal
          projects={projects}
          onClose={() => setShowNewSurveyModal(false)}
          onSelectProject={projectId => {
            setShowNewSurveyModal(false);
            navigate(`/projects/${projectId}/surveys/new`);
          }}
          onGoToProjects={() => {
            setShowNewSurveyModal(false);
            navigate('/projects');
          }}
        />
      )}
    </div>
  );
}
