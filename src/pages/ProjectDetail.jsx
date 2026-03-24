import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Play, BarChart2, Eye, ExternalLink, Users, Calendar, ChevronRight, Mail, Shield, UserCheck, Archive, ArchiveRestore, StopCircle, X, AlertTriangle, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { USERS } from '../data/mockData';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

const ROLE_COLORS = {
  'Super Admin': 'purple',
  'Admin': 'blue',
  'Researcher': 'green',
};

// Modal used in Team tab — "Invite Member" (Owner/SA) or "Propose Member" (Editor/Viewer)
function TeamMemberModal({ project, internalUsers, currentUser, canDirectAdd, onConfirm, onClose }) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('Editor');
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');

  const candidates = internalUsers.filter(u => u.status === 'Active');
  const selectedUser = candidates.find(u => u.id === userId);
  const isStandardUserTarget = selectedUser?.role === 'Standard User' || selectedUser?.role === 'Researcher';

  const handleSubmit = () => {
    if (!userId) { setError('Please select a user.'); return; }
    if (!canDirectAdd && !justification.trim()) { setError('Please provide a justification.'); return; }
    onConfirm({ userId, selectedUser, role, justification: justification.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus size={16} className="text-purple-600" />
            {canDirectAdd ? 'Invite member' : 'Propose member access'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!canDirectAdd && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700">
              <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
              As a Project Editor, your request will be sent to the Project Owner for approval.
            </div>
          )}

          {/* User picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">User</label>
            <select
              value={userId}
              onChange={e => { setUserId(e.target.value); setError(''); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none transition-colors"
            >
              <option value="">Select a user…</option>
              {candidates.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.role}</option>
              ))}
            </select>
          </div>

          {/* Role radio group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project role</label>
            <div className="space-y-2">
              {['Owner', 'Editor', 'Viewer'].map(r => {
                const disabled = r === 'Owner' && isStandardUserTarget;
                return (
                  <label
                    key={r}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                      disabled ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-100' :
                      role === r ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="team-role"
                      value={r}
                      checked={role === r}
                      disabled={disabled}
                      onChange={() => !disabled && setRole(r)}
                      className="mt-0.5 accent-purple-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r}</p>
                      {disabled && <p className="text-xs text-gray-400 mt-0.5">Owner requires Admin org role</p>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Justification — only for proposal flow */}
          {!canDirectAdd && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Justification</label>
              <textarea
                value={justification}
                onChange={e => { setJustification(e.target.value); setError(''); }}
                rows={3}
                placeholder="Why does this person need access to this project?"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:border-purple-400 focus:outline-none transition-colors"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertTriangle size={13} /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit}>
            {canDirectAdd ? 'Add member' : 'Submit proposal'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const MOCK_TEAM = [
  { ...USERS.superadmin, projectRole: 'Owner' },
  { ...USERS.admin, projectRole: 'Editor' },
  { ...USERS.researcher, projectRole: 'Editor' },
];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, surveys, currentUser, internalUsers, createProposal, addUserToProject, deleteSurvey, archiveSurvey, unarchiveSurvey, closeSurvey, launchSurveyWithConfig, addToast } = useApp();
  const [activeTab, setActiveTab] = useState('surveys');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showArchivedSurveys, setShowArchivedSurveys] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const project = projects.find(p => p.id === projectId);
  if (!project) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Project not found.</p>
      <Button variant="link" onClick={() => navigate('/projects')} className="mt-2">Back to Projects</Button>
    </div>
  );

  const allProjectSurveys = surveys.filter(s => s.projectId === projectId);
  const projectSurveys = allProjectSurveys.filter(s => showArchivedSurveys ? s.archived : !s.archived);
  const archivedSurveyCount = allProjectSurveys.filter(s => s.archived).length;
  const isAdminOrAbove = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';

  // Per P1-F-70: Super Admin or Project Owner → direct invite; everyone else → propose
  const canDirectAdd =
    currentUser.role === 'Super Admin' ||
    MOCK_TEAM.some(m => m.id === currentUser.id && m.projectRole === 'Owner');

  const handleMemberModalConfirm = ({ userId, selectedUser, role, justification }) => {
    if (canDirectAdd) {
      addUserToProject(userId, project.id, project.name, role);
    } else {
      createProposal({
        type: 'membership',
        targetUser: userId,
        targetUserName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        project: project.id,
        projectName: project.name,
        proposedRole: role,
        justification,
      });
    }
    setShowMemberModal(false);
  };

  const handleDelete = (surveyId) => {
    deleteSurvey(surveyId);
    setConfirmDeleteId(null);
  };

  const getActions = (survey) => {
    const actions = [];
    switch (survey.status) {
      case 'Draft':
        actions.push(
          <Button key="edit" size="xs" variant="secondary" onClick={() => navigate(`/projects/${projectId}/surveys/${survey.id}/builder`)}>
            <Edit2 size={12} /> Edit
          </Button>
        );
        if (confirmDeleteId === survey.id) {
          actions.push(
            <span key="confirm" className="flex items-center gap-1">
              <button
                onClick={() => handleDelete(survey.id)}
                className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors"
              >
                Delete?
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="text-xs text-gray-400 hover:text-gray-600 px-1"
              >
                Cancel
              </button>
            </span>
          );
        } else {
          actions.push(
            <Button key="del" size="xs" variant="ghost" onClick={() => setConfirmDeleteId(survey.id)} className="text-red-400 hover:text-red-600">
              <Trash2 size={12} />
            </Button>
          );
        }
        break;
      case 'Submitted':
        if (isAdminOrAbove) {
          actions.push(
            <Button key="review" size="xs" onClick={() => navigate(`/projects/${projectId}/surveys/${survey.id}/approve`)}>
              Review
            </Button>
          );
        } else {
          actions.push(
            <span key="pending" className="text-xs text-amber-600 font-medium">Awaiting approval</span>,
            <Button key="view" size="xs" variant="secondary" onClick={() => navigate(`/projects/${projectId}/surveys/${survey.id}/approve`)}>
              <Eye size={12} /> View
            </Button>
          );
        }
        break;
      case 'Approved':
        actions.push(
          <Button
            key="launch"
            size="xs"
            variant="success"
            onClick={() => {
              if (survey.waveConfig) {
                launchSurveyWithConfig(survey.id, survey.waveConfig);
              } else {
                addToast('Wave setup is missing — cannot launch', 'warning');
              }
            }}
          >
            <Play size={12} /> Launch
          </Button>
        );
        break;
      case 'Running':
        actions.push(
          <Button key="results" size="xs" variant="secondary" onClick={() => navigate(`/projects/${projectId}/surveys/${survey.id}/results`)}>
            <BarChart2 size={12} /> Results
          </Button>,
          <Button key="preview" size="xs" variant="ghost" onClick={() => navigate(`/survey/demo-token-s1`)} title="Open expert survey preview">
            <ExternalLink size={12} />
          </Button>
        );
        if (isAdminOrAbove) {
          actions.push(
            <Button key="close" size="xs" variant="ghost" onClick={() => closeSurvey(survey.id)} title="Close survey and enter Review" className="text-amber-500 hover:text-amber-700">
              <StopCircle size={12} /> Close
            </Button>
          );
        }
        break;
      case 'Closed':
        actions.push(
          <Button key="enter-review" size="xs" onClick={() => { closeSurvey(survey.id); navigate(`/projects/${projectId}/surveys/${survey.id}/review`); }}>
            <Eye size={12} /> Enter Review
          </Button>
        );
        break;
      case 'Review':
        actions.push(
          <Button key="review" size="xs" onClick={() => navigate(`/projects/${projectId}/surveys/${survey.id}/review`)}>
            <Eye size={12} /> Review Results
          </Button>
        );
        break;
      case 'Transferred':
        actions.push(
          <Button key="view" size="xs" variant="secondary" onClick={() => navigate(`/projects/${projectId}/surveys/${survey.id}/results`)}>
            <BarChart2 size={12} /> View Results
          </Button>
        );
        break;
      default:
        break;
    }
    if (isAdminOrAbove && !survey.archived) {
      actions.push(
        <Button key="archive" size="xs" variant="ghost" onClick={() => archiveSurvey(survey.id)} title="Archive survey" className="text-gray-400 hover:text-gray-600">
          <Archive size={12} />
        </Button>
      );
    } else if (isAdminOrAbove && survey.archived) {
      actions.push(
        <Button key="unarchive" size="xs" variant="ghost" onClick={() => unarchiveSurvey(survey.id)} title="Restore survey" className="text-gray-400 hover:text-gray-600">
          <ArchiveRestore size={12} />
        </Button>
      );
    }
    return actions;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      {/* Project header */}
      <Card className="p-6 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={project.status} size="xs" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{project.name}</h1>
            <div className="flex items-center gap-5 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                {project.owner}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                Created {project.created}
              </span>
              <span className="flex items-center gap-1.5">
                <ChevronRight size={14} />
                Last activity {project.lastActivity}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-xl border border-gray-100 p-1 w-fit shadow-sm">
        {['surveys', 'team'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-150 ${
              activeTab === tab ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
            style={activeTab === tab ? { backgroundColor: '#4A00F8' } : {}}
          >
            {tab === 'surveys' ? `Surveys (${projectSurveys.length})` : `Team (${MOCK_TEAM.length})`}
          </button>
        ))}
      </div>

      {/* Surveys tab */}
      {activeTab === 'surveys' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500">{projectSurveys.length} survey{projectSurveys.length !== 1 ? 's' : ''}{showArchivedSurveys ? ' (archived)' : ' in this project'}</p>
              {archivedSurveyCount > 0 && (
                <button
                  onClick={() => setShowArchivedSurveys(!showArchivedSurveys)}
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border transition-colors ${
                    showArchivedSurveys ? 'text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                  style={showArchivedSurveys ? { backgroundColor: '#6B7280', borderColor: '#6B7280' } : {}}
                >
                  <Archive size={11} /> Archived ({archivedSurveyCount})
                </button>
              )}
            </div>
            {!showArchivedSurveys && (
              <Button onClick={() => navigate(`/projects/${projectId}/surveys/new`)}>
                <Plus size={16} />
                New Survey
              </Button>
            )}
          </div>

          {projectSurveys.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-400 font-medium">No surveys yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first survey to start collecting expert insights</p>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Name</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Category</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Wave</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Responses</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Send Date</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Close Date</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {projectSurveys.map(survey => (
                      <tr key={survey.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-800">{survey.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">By {survey.createdBy}</p>
                        </td>
                        <td className="px-4 py-4">
                          {survey.category ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">{survey.category}</span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={survey.status} size="xs" />
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600">Wave {survey.wave}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 min-w-24">
                            <span className="text-sm font-medium text-gray-800">
                              {survey.responsesReceived}/{survey.expertsTargeted}
                            </span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-12">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${survey.expertsTargeted > 0 ? (survey.responsesReceived / survey.expertsTargeted) * 100 : 0}%`,
                                  backgroundColor: '#10B981'
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">{survey.sendDate || '—'}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{survey.closeDate || '—'}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            {getActions(survey)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Team tab */}
      {activeTab === 'team' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{MOCK_TEAM.length} members with access to this project</p>
            <Button onClick={() => setShowMemberModal(true)}>
              <Plus size={16} />
              {canDirectAdd ? 'Invite Member' : 'Propose Member'}
            </Button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Member</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Platform Role</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Project Role</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_TEAM.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: '#4A00F8' }}
                          >
                            {member.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Mail size={10} />
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge color={ROLE_COLORS[member.role] || 'gray'} size="xs">{member.role}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className="flex items-center gap-1.5 text-sm text-gray-700">
                          {member.projectRole === 'Owner'
                            ? <><Shield size={13} className="text-purple-500" /> Owner</>
                            : <><UserCheck size={13} className="text-blue-500" /> Editor</>
                          }
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-100 px-2 py-0.5 rounded">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Team member modal — Invite (Owner/SA) or Propose (Editor/Viewer) */}
      {showMemberModal && (
        <TeamMemberModal
          project={project}
          internalUsers={internalUsers}
          currentUser={currentUser}
          canDirectAdd={canDirectAdd}
          onConfirm={handleMemberModalConfirm}
          onClose={() => setShowMemberModal(false)}
        />
      )}
    </div>
  );
}
