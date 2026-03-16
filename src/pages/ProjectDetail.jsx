import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Play, BarChart2, Eye, ExternalLink, Users, Calendar, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, surveys, currentUser, launchSurvey, addToast } = useApp();
  const [activeTab, setActiveTab] = useState('surveys');

  const project = projects.find(p => p.id === projectId);
  if (!project) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Project not found.</p>
      <Button variant="link" onClick={() => navigate('/projects')} className="mt-2">Back to Projects</Button>
    </div>
  );

  const projectSurveys = surveys.filter(s => s.projectId === projectId);
  const isAdminOrAbove = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';

  const getActions = (survey) => {
    const actions = [];
    switch (survey.status) {
      case 'Draft':
        actions.push(
          <Button key="edit" size="xs" variant="secondary" onClick={() => navigate(`/projects/${projectId}/surveys/${survey.id}/builder`)}>
            <Edit2 size={12} /> Edit
          </Button>,
          <Button key="del" size="xs" variant="ghost" onClick={() => addToast('Delete is not available in this demo preview.', 'info')} className="text-red-400 hover:text-red-600">
            <Trash2 size={12} />
          </Button>
        );
        break;
      case 'Submitted':
        if (isAdminOrAbove) {
          actions.push(
            <Button key="review" size="xs" onClick={() => navigate(`/projects/${projectId}/surveys/${survey.id}/approve`)}>
              Review
            </Button>
          );
        } else {
          actions.push(<span key="pending" className="text-xs text-amber-600 font-medium">Awaiting approval</span>);
        }
        break;
      case 'Approved':
        if (isAdminOrAbove) {
          actions.push(
            <Button key="launch" size="xs" variant="success" onClick={() => { launchSurvey(survey.id); }}>
              <Play size={12} /> Launch
            </Button>
          );
        }
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
    return actions;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      {/* Project header */}
      <Card className="p-6 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge color="purple">{project.category}</Badge>
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
            {tab === 'surveys' ? `Surveys (${projectSurveys.length})` : 'Team'}
          </button>
        ))}
      </div>

      {/* Surveys tab */}
      {activeTab === 'surveys' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{projectSurveys.length} survey{projectSurveys.length !== 1 ? 's' : ''} in this project</p>
            <Button onClick={() => navigate(`/projects/${projectId}/surveys/new`)}>
              <Plus size={16} />
              New Survey
            </Button>
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
        <Card className="p-10 text-center">
          <Users size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Team management</p>
          <p className="text-sm text-gray-400 mt-1">Coming soon — invite collaborators and set permissions per project</p>
        </Card>
      )}
    </div>
  );
}
