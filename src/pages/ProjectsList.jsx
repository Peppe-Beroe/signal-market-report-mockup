import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FolderOpen, Calendar, User, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

const categoryColors = {
  'Metals & Mining': 'purple',
  'Chemicals': 'amber',
  'Packaging': 'green',
};

export default function ProjectsList() {
  const { projects, surveys, addToast } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const categories = ['All', ...new Set(projects.map(p => p.category))];

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.category === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} projects · {surveys.length} total surveys</p>
        </div>
        <Button
          onClick={() => addToast('Project creation is not available in this demo preview.', 'info')}
          title="Not available in demo"
        >
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
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === cat
                  ? 'border-purple-300 text-white'
                  : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
              }`}
              style={filter === cat ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
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
                  <Badge color={categoryColors[p.category] || 'gray'} size="sm">
                    {p.category}
                  </Badge>
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
                  <span className="text-xs font-medium" style={{ color: '#4A00F8' }}>View →</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
