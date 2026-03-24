import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FolderOpen, Calendar, User, FileText, X, Archive, ArchiveRestore } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

export default function ProjectsList() {
  const { projects, surveys, currentUser, internalUsers, createProject, archiveProject, unarchiveProject } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', ownerName: '' });
  const [errors, setErrors] = useState({});

  const isAdminOrAbove = currentUser.role === 'Admin' || currentUser.role === 'Super Admin';
  const isStandardUser = currentUser.role === 'Standard User' || currentUser.role === 'Researcher';
  // Per P1-F-68: Standard Users must assign an Admin as Project Owner at creation time.
  const adminUsers = internalUsers
    ? internalUsers.filter(u => (u.role === 'Admin' || u.role === 'Super Admin') && u.status === 'Active')
    : [];

  const filtered = projects.filter(p => {
    const matchArchive = showArchived ? p.archived : !p.archived;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchArchive && matchSearch;
  });

  const archivedCount = projects.filter(p => p.archived).length;

  const handleCreate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Project name is required';
    if (isStandardUser && !form.ownerName) errs.ownerName = 'You must assign a Project Owner';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const project = createProject(form);
    setShowModal(false);
    setForm({ name: '', ownerName: '' });
    setErrors({});
    navigate(`/projects/${project.id}`);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ name: '', ownerName: '' });
    setErrors({});
  };

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.filter(p => !p.archived).length} active projects · {surveys.length} total surveys</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} />
          New Project
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:border-purple-400 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            showArchived ? 'text-white' : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
          }`}
          style={showArchived ? { backgroundColor: '#6B7280', borderColor: '#6B7280' } : {}}
        >
          <Archive size={13} />
          Archived{archivedCount > 0 && ` (${archivedCount})`}
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No projects found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(p => {
            const projectSurveys = surveys.filter(s => s.projectId === p.id);
            const runningSurveys = projectSurveys.filter(s => s.status === 'Running');
            return (
              <Card
                key={p.id}
                hover
                onClick={() => navigate(`/projects/${p.id}`)}
                className="p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <StatusBadge status={p.status} size="xs" />
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 text-base leading-snug">{p.name}</h3>

                <div className="space-y-1.5 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <User size={11} />
                    <span>{p.owner}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText size={11} />
                    <span>{projectSurveys.length} survey{projectSurveys.length !== 1 ? 's' : ''}</span>
                    {runningSurveys.length > 0 && (
                      <span className="text-green-600 font-medium">· {runningSurveys.length} running</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} />
                    <span>Last activity {p.lastActivity}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Created {p.created}</span>
                  <div className="flex items-center gap-2">
                    {isAdminOrAbove && (
                      <button
                        onClick={e => { e.stopPropagation(); p.archived ? unarchiveProject(p.id) : archiveProject(p.id); }}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                        title={p.archived ? 'Restore project' : 'Archive project'}
                      >
                        {p.archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                      </button>
                    )}
                    {!p.archived && <span className="text-xs font-medium" style={{ color: '#4A00F8' }}>View →</span>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Project</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
                  placeholder="e.g. Q3 2026 Packaging Trends"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors.name ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-purple-400'}`}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Per P1-F-68: Standard Users must assign an Admin as Project Owner */}
              {isStandardUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Project Owner <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-2">You cannot own projects. Assign an Admin who will oversee this project.</p>
                  {adminUsers.length === 0 ? (
                    <p className="text-xs text-red-500">No active Admins available. Contact a Super Admin to create an Admin account first.</p>
                  ) : (
                    <select
                      value={form.ownerName}
                      onChange={e => { setForm(f => ({ ...f, ownerName: e.target.value })); setErrors(er => ({ ...er, ownerName: '' })); }}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors.ownerName ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-purple-400'}`}
                    >
                      <option value="">— Select a Project Owner —</option>
                      {adminUsers.map(u => (
                        <option key={u.id} value={`${u.firstName} ${u.lastName}`}>
                          {u.firstName} {u.lastName} ({u.role})
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName}</p>}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreate}>Create Project</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
