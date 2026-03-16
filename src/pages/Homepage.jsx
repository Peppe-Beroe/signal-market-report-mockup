import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Clock, TrendingUp, Users, AlertCircle, ArrowRight,
  Activity, Database, PlusCircle, X, AlertTriangle, FileText,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

function KpiCard({ icon: Icon, label, value, sub, color = '#4A00F8' }) {
  return (
    <Card className="p-5">
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
    </Card>
  );
}

function AuditTimeline({ events }) {
  return (
    <div className="space-y-3">
      {events.map((ev, i) => (
        <div key={ev.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#4A00F8' }} />
            {i < events.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
          </div>
          <div className="pb-3 flex-1 min-w-0">
            <p className="text-sm text-gray-800">
              <span className="font-medium">{ev.user}</span>
              <span className="text-gray-500"> — {ev.action}</span>
            </p>
            <p className="text-xs text-purple-600 font-medium truncate">{ev.target}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ev.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function OnboardingChecklist({ surveys, experts }) {
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (dismissed) return null;

  const steps = [
    { label: 'Create a project', done: true },
    { label: 'Invite a team member', done: experts.length > 1 || Object.keys({ u1: 1, u2: 2, u3: 3 }).length > 1 },
    { label: 'Configure org timezone', done: false },
  ];

  const completedCount = steps.filter(s => s.done).length;
  if (completedCount === steps.length) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
        >
          {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          Getting started ({completedCount}/{steps.length})
        </button>
        <button onClick={() => setDismissed(true)} className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
          Dismiss
        </button>
      </div>
      {!collapsed && (
        <div className="space-y-1.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : 'border-2 border-gray-300'}`}>
                {step.done && <CheckCircle size={12} className="text-white" />}
              </div>
              <span className={`text-xs ${step.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{step.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Response rate alert: surveys below threshold with few days remaining
function isAlertSurvey(s) {
  if (s.status !== 'Running' || !s.closeDate) return false;
  const daysLeft = Math.ceil((new Date(s.closeDate) - new Date()) / (1000*60*60*24));
  return s.responseRate < 60 && daysLeft < 7;
}

function isClosingThisWeek(s) {
  if (s.status !== 'Running' || !s.closeDate) return false;
  const daysLeft = Math.ceil((new Date(s.closeDate) - new Date()) / (1000*60*60*24));
  return daysLeft >= 0 && daysLeft <= 7;
}

const MOCK_EXPERT_REQUEST = {
  id: 'REQ-001',
  type: 'Add',
  expertName: 'Dr. Wei Chen',
  requestedBy: 'Sarah Chen',
  submitted: '2026-03-15',
};

export default function Homepage() {
  const { currentUser, surveys, projects, experts, auditEvents } = useApp();
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser.name.split(' ')[0];

  const pendingSurveys = surveys.filter(s => s.status === 'Submitted');
  const runningSurveys = surveys.filter(s => s.status === 'Running');
  const alertSurveys = surveys.filter(isAlertSurvey);
  const closingThisWeek = surveys.filter(isClosingThisWeek);

  // ── SUPER ADMIN VIEW ──────────────────────────────────────────────────────────
  if (currentUser.role === 'Super Admin') {
    const totalSurveys = surveys.length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;

    return (
      <div className="p-6 max-w-6xl mx-auto fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}.</h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview — all teams</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard icon={Activity} label="Active Projects" value={activeProjects} sub="Across all teams" />
          <KpiCard icon={Database} label="Total Surveys" value={totalSurveys} sub="All statuses" color="#10B981" />
          <KpiCard icon={Users} label="Experts in DB" value={experts.length} sub={`${experts.filter(e => e.status === 'Active').length} active, ${experts.filter(e => e.status === 'Opted-out').length} opted-out`} color="#F59E0B" />
          <KpiCard icon={AlertCircle} label="Pending Approvals" value={pendingSurveys.length} sub="Needs your action" color="#EF4444" />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Pending approvals */}
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
              <div className="space-y-3">
                {pendingSurveys.map(s => {
                  const project = projects.find(p => p.id === s.projectId);
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{project?.name} · Created by {s.createdBy}</p>
                      </div>
                      <Button size="sm" onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/approve`)}>
                        Review & Approve
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Audit log */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Activity</h2>
              <button onClick={() => navigate('/audit')} className="text-xs font-medium hover:underline" style={{ color: '#4A00F8' }}>
                View all →
              </button>
            </div>
            <AuditTimeline events={auditEvents.slice(0, 3)} />
          </Card>
        </div>

        {/* Pending expert requests */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={15} className="text-gray-400" />
              Pending Expert Requests
            </h2>
            <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">1 pending</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
            <div>
              <p className="text-sm font-semibold text-gray-800">#{MOCK_EXPERT_REQUEST.id} — {MOCK_EXPERT_REQUEST.type}: {MOCK_EXPERT_REQUEST.expertName}</p>
              <p className="text-xs text-gray-500 mt-0.5">Requested by {MOCK_EXPERT_REQUEST.requestedBy} · {MOCK_EXPERT_REQUEST.submitted}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate('/experts')}>Review</Button>
            </div>
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

        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard icon={Activity} label="My Projects" value={myProjects.length} sub="You own these" />
          <KpiCard icon={TrendingUp} label="Surveys Running" value={runningSurveys.length} sub="Collecting responses" color="#10B981" />
          <KpiCard icon={AlertCircle} label="Awaiting My Approval" value={pendingSurveys.length} sub="Action required" color="#F59E0B" />
          <KpiCard icon={Clock} label="Closing This Week" value={closingThisWeek.length} sub="Within 7 days" color="#EF4444" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Approval required */}
          <div className="space-y-4">
            {pendingSurveys.length > 0 && (
              <Card className="p-5">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-500" />
                  Approval Required
                </h2>
                <div className="space-y-3">
                  {pendingSurveys.map(s => (
                    <div key={s.id} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-sm font-medium text-gray-800">{s.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">Submitted by {s.createdBy}</span>
                        <Button size="sm" onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/approve`)}>
                          Review & Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Closing this week */}
            {closingThisWeek.length > 0 && (
              <Card className="p-5">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-red-500" />
                  Closing This Week
                </h2>
                <div className="space-y-3">
                  {closingThisWeek.map(s => {
                    const daysLeft = Math.ceil((new Date(s.closeDate) - new Date()) / (1000*60*60*24));
                    return (
                      <div key={s.id} className="p-3 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-red-600 font-medium">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</span>
                          <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/results`)}>
                            View Results
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Response rate alerts */}
            {alertSurveys.length > 0 && (
              <Card className="p-5">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  Response Rate Alerts
                </h2>
                <div className="space-y-3">
                  {alertSurveys.map(s => (
                    <div key={s.id} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-sm font-medium text-gray-800">{s.name}</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {s.responseRate}% response rate — below 60% threshold
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex-1 mr-4">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.responseRate}%`, backgroundColor: '#F59E0B' }} />
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/results`)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right column: Recent activity + running surveys */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                <button onClick={() => navigate('/audit')} className="text-xs font-medium hover:underline" style={{ color: '#4A00F8' }}>View all →</button>
              </div>
              <AuditTimeline events={auditEvents.slice(0, 3)} />
            </Card>

            <Card className="p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Active Surveys</h2>
              <div className="space-y-3">
                {surveys.filter(s => ['Running', 'Submitted'].includes(s.status)).map(s => {
                  const project = projects.find(p => p.id === s.projectId);
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
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
  const myDrafts = mySurveys.filter(s => s.status === 'Draft');
  const rejectedSurveys = mySurveys.filter(s => s.status === 'Draft' && s.rejectionReason);
  const myClosingThisWeek = mySurveys.filter(isClosingThisWeek);
  const avgResponseRate = Math.round(
    mySurveys.filter(s => s.responsesReceived > 0).reduce((acc, s) => acc + s.responseRate, 0) /
    (mySurveys.filter(s => s.responsesReceived > 0).length || 1)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}.</h1>
        <p className="text-sm text-gray-500 mt-1">Your surveys and submissions</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard icon={Database} label="My Surveys" value={mySurveys.length} sub="All statuses" />
        <KpiCard icon={Clock} label="Awaiting Feedback" value={pendingSurveys.filter(s => s.createdBy === currentUser.name).length} sub="Submitted for approval" color="#F59E0B" />
        <KpiCard icon={TrendingUp} label="Avg Response Rate" value={`${avgResponseRate}%`} sub="Running surveys" color="#10B981" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* My Drafts */}
          {myDrafts.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={15} className="text-gray-400" />
                My Drafts
              </h2>
              <div className="space-y-2">
                {myDrafts.map(s => {
                  const project = projects.find(p => p.id === s.projectId);
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{project?.name}</p>
                      </div>
                      <Button variant="secondary" size="xs" onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/builder`)}>
                        Edit
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Rejected surveys */}
          {rejectedSurveys.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle size={15} className="text-red-500" />
                Rejected Surveys
              </h2>
              <div className="space-y-2">
                {rejectedSurveys.map(s => (
                  <div key={s.id} className="p-3 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-red-600 mt-0.5">Feedback: {s.rejectionReason}</p>
                    <div className="flex justify-end mt-2">
                      <Button size="xs" variant="secondary" onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/builder`)}>
                        Revise
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Upcoming deadlines */}
          {myClosingThisWeek.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={15} className="text-amber-500" />
                Upcoming Deadlines
              </h2>
              <div className="space-y-2">
                {myClosingThisWeek.map(s => {
                  const daysLeft = Math.ceil((new Date(s.closeDate) - new Date()) / (1000*60*60*24));
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-amber-600">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</p>
                      </div>
                      <Button variant="secondary" size="xs" onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/results`)}>
                        View
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 mb-4">My Surveys</h2>
            <div className="space-y-3">
              {mySurveys.map(s => {
                const project = projects.find(p => p.id === s.projectId);
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400">{project?.name}</p>
                      {s.status === 'Submitted' && <p className="text-xs text-amber-600 mt-0.5">Awaiting approval</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.status} size="xs" />
                      {s.status === 'Running' && (
                        <Button variant="ghost" size="xs" onClick={() => navigate(`/projects/${s.projectId}/surveys/${s.id}/results`)}>
                          <ArrowRight size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* CTA */}
          <Card
            className="p-5 border-dashed border-2 border-purple-200 bg-purple-50 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-400 hover:bg-purple-100 transition-all duration-150"
            onClick={() => navigate('/projects/p1/surveys/new')}
          >
            <div className="p-3 rounded-full bg-white shadow-sm mb-3">
              <PlusCircle size={24} style={{ color: '#4A00F8' }} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Start a new survey</h3>
            <p className="text-sm text-gray-500">Design and launch your next wave</p>
            <button
              className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#4A00F8' }}
            >
              New Survey
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
