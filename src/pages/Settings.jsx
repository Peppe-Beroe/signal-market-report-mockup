import { useState } from 'react';
import { User, Bell, Sliders, Save, CheckCircle, Globe, List, Mail, Plus, X, Edit2, Info, BookTemplate, Trash2, Lock, Users, Eye, ThumbsUp, ThumbsDown, Paperclip, ToggleLeft, ToggleRight, ArrowUpRight, History, FileText, ChevronRight, ChevronDown, Download } from 'lucide-react';

const MOCK_TAXONOMY_LOG = [
  { id: 'tl1', ts: '31 Mar 2026, 14:22', actor: 'Maria Santos', level: 'Category',     action: 'Added',       name: 'Rigid Packaging',     before: null,        after: null,       parent: 'Packaging' },
  { id: 'tl2', ts: '30 Mar 2026, 10:15', actor: 'Maria Santos', level: 'Spending Pool',action: 'Renamed',     name: null,                  before: 'Chemicals', after: 'Specialty Chemicals', parent: 'Process' },
  { id: 'tl3', ts: '29 Mar 2026, 09:05', actor: 'Maria Santos', level: 'Category',     action: 'Deactivated', name: 'Long Steel',          before: null,        after: null,       parent: 'Metals & Mining' },
  { id: 'tl4', ts: '28 Mar 2026, 16:45', actor: 'Maria Santos', level: 'Domain',       action: 'Added',       name: 'Indirect',            before: null,        after: null,       parent: null },
  { id: 'tl5', ts: '27 Mar 2026, 11:30', actor: 'Maria Santos', level: 'Category',     action: 'Renamed',     name: null,                  before: 'Feedstocks',after: 'Chemical Feedstocks', parent: 'Chemicals' },
  { id: 'tl6', ts: '25 Mar 2026, 15:00', actor: 'Maria Santos', level: 'Category',     action: 'Activated',   name: 'Agriculture',         before: null,        after: null,       parent: 'Indirect' },
];
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const ROLE_COLORS = { 'Super Admin': 'purple', 'Admin': 'navy', 'Standard User': 'green' };

const TIMEZONES = [
  { value: 'IST', label: 'IST — India Standard Time (UTC+5:30)' },
  { value: 'UTC', label: 'UTC — Coordinated Universal Time (UTC+0)' },
  { value: 'EST', label: 'EST — Eastern Standard Time (UTC-5)' },
  { value: 'CET', label: 'CET — Central European Time (UTC+1)' },
  { value: 'PST', label: 'PST — Pacific Standard Time (UTC-8)' },
  { value: 'SGT', label: 'SGT — Singapore Standard Time (UTC+8)' },
];

const MERGE_TAGS_EMAIL = ['expert_name', 'survey_name', 'survey_link', 'close_date'];

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EDE9FE' }}>
        <Icon size={18} style={{ color: '#4A00F8' }} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 mt-0.5 ${checked ? '' : 'bg-gray-200'}`}
        style={checked ? { backgroundColor: '#4A00F8' } : {}}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

const DEFAULT_EMAIL_BODY = `Dear {{expert_name}},

We are conducting a research survey and would value your expert perspective.

Survey: {{survey_name}}
Close date: {{close_date}}
Link: {{survey_link}}

Thank you,
Beroe Research Team`;

function TemplateTable({
  templates, showOwner, showMakePrivate, showProposeOrgWide, pendingProposalTemplateIds,
  renamingTplId, renameTplValue, onStartRename, onSaveRename, onCancelRename, onRenameChange,
  expandedTplId, onToggleExpand,
  onEditQuestions, onDelete, onMakePrivate, onProposeOrgWide, getProjectName, categories,
  restrictToOwner = false, currentUserId = null, onViewDetail = null,
}) {
  const getCatNames = (tpl) => (tpl.categories || []).map(cid => categories.find(c => c.id === cid)?.name).filter(Boolean);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Visibility</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">Qs</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">Vers.</th>
            {showOwner && <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>}
            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {templates.map(tpl => {
            const isExpanded = expandedTplId === tpl.id;
            const isRenaming = renamingTplId === tpl.id;
            const createdDate = tpl.createdAt ? new Date(tpl.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
            const isOwner = !restrictToOwner || tpl.ownerId === currentUserId;
            return (
              <tr key={tpl.id} className="hover:bg-gray-50 transition-colors align-top">
                {/* Name */}
                <td className="py-3 px-3">
                  {isRenaming ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={renameTplValue}
                        onChange={e => onRenameChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') onSaveRename(tpl.id); if (e.key === 'Escape') onCancelRename(); }}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-purple-400 focus:outline-none w-40"
                        autoFocus
                      />
                      <button onClick={() => onSaveRename(tpl.id)} className="text-green-500 p-1"><CheckCircle size={13} /></button>
                      <button onClick={onCancelRename} className="text-gray-400 p-1"><X size={13} /></button>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={() => onToggleExpand(tpl.id)}
                        className="font-medium text-gray-800 hover:text-purple-700 text-left transition-colors"
                      >
                        {tpl.name}
                      </button>
                      {isExpanded && tpl.questions?.length > 0 && (
                        <ol className="mt-2 space-y-1 pl-1">
                          {tpl.questions.map((q, i) => (
                            <li key={q.id} className="text-xs text-gray-500 flex gap-1.5">
                              <span className="text-gray-300 w-4 shrink-0">{i + 1}.</span>
                              <span>{q.text}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </td>
                {/* Visibility */}
                <td className="py-3 px-3"><VisibilityBadge visibility={tpl.visibility} /></td>
                {/* Categories */}
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1">
                    {getCatNames(tpl).length > 0
                      ? getCatNames(tpl).map(n => <span key={n} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{n}</span>)
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </div>
                </td>
                {/* Questions count */}
                <td className="py-3 px-3 text-xs text-gray-500">{tpl.questions?.length ?? 0}</td>
                {/* Version count */}
                <td className="py-3 px-3 text-xs text-gray-400">v{tpl.versionCount || 1}</td>
                {/* Owner (conditional) */}
                {showOwner && <td className="py-3 px-3 text-xs text-gray-500">{tpl.ownerName || tpl.ownerId || '—'}</td>}
                {/* Created */}
                <td className="py-3 px-3 text-xs text-gray-400 whitespace-nowrap">{createdDate}</td>
                {/* Actions */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1 justify-end flex-wrap">
                    {onViewDetail && (
                      <Button variant="ghost" size="xs" onClick={() => onViewDetail(tpl)}><Eye size={11} /> Details</Button>
                    )}
                    {isOwner && <Button variant="ghost" size="xs" onClick={() => onStartRename(tpl)}><Edit2 size={11} /> Rename</Button>}
                    {isOwner && <Button variant="ghost" size="xs" onClick={() => onEditQuestions(tpl)}><Eye size={11} /> Edit</Button>}
                    {isOwner && <Button variant="ghost" size="xs" className="text-red-400 hover:text-red-600" onClick={() => onDelete(tpl.id)}><Trash2 size={11} /> Delete</Button>}
                    {isOwner && showMakePrivate && (tpl.visibility === 'project' || tpl.visibility === 'org_wide') && (
                      <Button variant="ghost" size="xs" className="text-amber-600 hover:text-amber-800" onClick={() => onMakePrivate(tpl.id)}><Lock size={11} /> Make private</Button>
                    )}
                    {isOwner && showProposeOrgWide && tpl.visibility !== 'org_wide' && (
                      pendingProposalTemplateIds?.includes(tpl.id)
                        ? <span className="text-xs text-violet-500 font-medium px-1">Pending…</span>
                        : <Button variant="ghost" size="xs" className="text-violet-600 hover:text-violet-800" onClick={() => onProposeOrgWide(tpl.id)}><ArrowUpRight size={11} /> Propose Org-Wide</Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EditQuestionsModal({ template, onSave, onClose }) {
  const [questions, setQuestions] = useState((template.questions || []).map(q => ({ ...q })));
  const updateText = (idx, text) => setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, text } : q));
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="fade-in bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-900">Edit template questions</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-400 mb-4">{template.name}</p>
        <div className="overflow-y-auto flex-1 space-y-3 mb-4">
          {questions.map((q, i) => (
            <div key={q.id} className="p-3 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{q.type}</span>
                {q.required === false && <span className="text-xs text-gray-400">Optional</span>}
              </div>
              <input
                type="text"
                value={q.text || ''}
                onChange={e => updateText(i, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(questions)}><Save size={14} /> Save changes</Button>
        </div>
      </div>
    </div>
  );
}

function VisibilityBadge({ visibility }) {
  if (visibility === 'org_wide') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100"><Globe size={10} /> Org-Wide</span>;
  if (visibility === 'project') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"><Users size={10} /> Project</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><Lock size={10} /> Private</span>;
}

function TemplateDetailModal({ template, onClose, onRevert, categories, internalUsers, getProjectName }) {
  const getCatNames = (tpl) => (tpl.categories || []).map(cid => categories.find(c => c.id === cid)?.name).filter(Boolean);
  const owner = internalUsers.find(u => u.id === template.ownerId);
  const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : (template.ownerName || '—');

  // Build version history: use stored versionHistory if available, otherwise generate from versionCount
  const count = template.versionCount || 1;
  const baseDate = new Date(template.createdAt || '2026-01-15');
  const history = template.versionHistory || Array.from({ length: count }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i * 18);
    return {
      v: i + 1,
      date: d.toISOString().split('T')[0],
      changedBy: ownerName,
      summary: i === 0 ? 'Template created' : `Questions updated — v${i + 1}`,
    };
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="fade-in bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-lg font-bold text-gray-900 truncate">{template.name}</h2>
              <VisibilityBadge visibility={template.visibility} />
              <span className="text-xs font-semibold text-purple-500">v{template.versionCount || 1}</span>
            </div>
            {getCatNames(template).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {getCatNames(template).map(n => <span key={n} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{n}</span>)}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Owner</p>
              <p className="text-sm font-medium text-gray-700">{ownerName}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Created</p>
              <p className="text-sm font-medium text-gray-700">
                {template.createdAt ? new Date(template.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5">Questions</p>
              <p className="text-sm font-medium text-gray-700">{template.questions?.length ?? 0}</p>
            </div>
            {template.projectId && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 col-span-3">
                <p className="text-xs text-gray-400 mb-0.5">Linked project</p>
                <p className="text-sm font-medium text-gray-700">{getProjectName(template.projectId)}</p>
              </div>
            )}
          </div>

          {/* Current questions list */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Current questions (v{template.versionCount || 1})</p>
            {(template.questions || []).length === 0 ? (
              <p className="text-xs text-gray-400 italic">No questions in this template.</p>
            ) : (
              <div className="space-y-1.5">
                {template.questions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-2 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50">
                    <span className="text-xs text-gray-300 w-5 shrink-0 mt-0.5">{i + 1}.</span>
                    <p className="text-xs text-gray-600 flex-1">{q.text || <span className="italic text-gray-300">No text</span>}</p>
                    <span className="text-xs text-gray-400 shrink-0">{q.type?.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Version history */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <History size={14} className="text-gray-400" />
              Version history
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Ver.</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Changed by</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...history].reverse().map((entry) => {
                    const isCurrent = entry.v === (template.versionCount || 1);
                    return (
                      <tr key={entry.v} className={`transition-colors ${isCurrent ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                        <td className="py-2.5 px-3">
                          <span className={`text-xs font-bold ${isCurrent ? 'text-purple-600' : 'text-gray-500'}`}>v{entry.v}</span>
                          {isCurrent && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-purple-100 text-purple-600">current</span>}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap">
                          {entry.date ? new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-600">{entry.changedBy}</td>
                        <td className="py-2.5 px-3 text-xs text-gray-500">{entry.summary}</td>
                        <td className="py-2.5 px-3 text-right">
                          {!isCurrent && (
                            <Button variant="ghost" size="xs" className="text-purple-600 hover:text-purple-800" onClick={() => onRevert(entry.v)}>
                              ↩ Revert to v{entry.v}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">Reverting creates a new version — no history is ever deleted.</p>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-100">
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { currentUser, addToast, orgTimezone, setOrgTimezone, notificationPrefs, setNotificationPrefs, categories, setCategories, taxonomy, setTaxonomy, templates, deleteTemplate, renameTemplate, updateTemplateQuestions, revertTemplateToPrivate, revertTemplateVersion, proposeOrgWide, approveOrgWide, rejectOrgWide, orgWideProposals, typologyConfig, updateTypologyConfig, projects, internalUsers } = useApp();
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isStandardUser = currentUser.role === 'Standard User';
  const profileReadOnly = !isSuperAdmin; // Admin and Standard User see read-only profile

  const [profile] = useState({ name: currentUser.name, email: currentUser.email });
  const [editProfile, setEditProfile] = useState({ name: currentUser.name, email: currentUser.email });

  const ALL_NOTIFICATION_EVENTS = [
    { key: 'survey_approved', label: 'Survey approved' },
    { key: 'survey_rejected', label: 'Survey rejected' },
    { key: 'proposal_approved', label: 'Proposal approved' },
    { key: 'proposal_rejected', label: 'Proposal rejected' },
    { key: 'proposal_auto_cancelled', label: 'Proposal auto-cancelled' },
    { key: 'new_proposal_received', label: 'New proposal received', adminOnly: true },
    { key: 'invite_approved', label: 'Invite approved' },
    { key: 'invite_rejected', label: 'Invite rejected' },
    { key: 'response_rate_alert', label: 'Response rate threshold alert' },
    { key: 'expert_change_resolved', label: 'Expert change request resolved' },
    { key: 'wave_closed', label: 'Wave closed' },
  ];
  const NOTIFICATION_EVENTS = ALL_NOTIFICATION_EVENTS.filter(e => !e.adminOnly || !isStandardUser);

  const [surveyDefaults, setSurveyDefaults] = useState({
    autoCloseEnabled: false,
    defaultCloseDays: 14,
    autoTransferDays: 7,
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Taxonomy tree state
  const [showTaxLog, setShowTaxLog] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState(() => new Set(['dom1', 'dom2', 'dom3']));
  const [expandedSpendingPools, setExpandedSpendingPools] = useState(() => new Set());
  const [taxRenaming, setTaxRenaming] = useState(null); // { level, domId, spId?, catId?, value }
  const [taxAdding, setTaxAdding] = useState(null);     // { level: 'domain'|'sp'|'cat', domId?, spId? }
  const [taxAddValue, setTaxAddValue] = useState('');

  const toggleDomain = (id) => setExpandedDomains(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSP = (id) => setExpandedSpendingPools(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const taxToggleActive = (domId, spId, catId) => {
    setTaxonomy(prev => prev.map(dom => {
      if (dom.id !== domId) return dom;
      if (!spId) return { ...dom, active: !dom.active };
      return {
        ...dom,
        spendingPools: dom.spendingPools.map(sp => {
          if (sp.id !== spId) return sp;
          if (!catId) return { ...sp, active: !sp.active };
          return { ...sp, categories: sp.categories.map(c => c.id === catId ? { ...c, active: !c.active } : c) };
        }),
      };
    }));
  };

  const _getTaxSiblings = (level, domId, spId) => {
    if (level === 'domain') return taxonomy.map(d => d.name);
    if (level === 'sp') return taxonomy.find(d => d.id === domId)?.spendingPools.map(s => s.name) || [];
    if (level === 'cat') return taxonomy.find(d => d.id === domId)?.spendingPools.find(s => s.id === spId)?.categories.map(c => c.name) || [];
    return [];
  };

  const taxSaveRename = () => {
    if (!taxRenaming || !taxAddValue.trim()) { setTaxRenaming(null); setTaxAddValue(''); return; }
    const val = taxAddValue.trim();
    const { level, domId, spId, catId } = taxRenaming;
    const siblings = _getTaxSiblings(level, domId, spId);
    const currentName = level === 'domain'
      ? taxonomy.find(d => d.id === domId)?.name || ''
      : level === 'sp'
      ? taxonomy.find(d => d.id === domId)?.spendingPools.find(s => s.id === spId)?.name || ''
      : taxonomy.find(d => d.id === domId)?.spendingPools.find(s => s.id === spId)?.categories.find(c => c.id === catId)?.name || '';
    if (siblings.some(s => s.toLowerCase() === val.toLowerCase() && s.toLowerCase() !== currentName.toLowerCase())) return;
    setTaxonomy(prev => prev.map(dom => {
      if (dom.id !== taxRenaming.domId) return dom;
      if (taxRenaming.level === 'domain') return { ...dom, name: val };
      return {
        ...dom,
        spendingPools: dom.spendingPools.map(sp => {
          if (sp.id !== taxRenaming.spId) return sp;
          if (taxRenaming.level === 'sp') return { ...sp, name: val };
          return { ...sp, categories: sp.categories.map(c => c.id === taxRenaming.catId ? { ...c, name: val } : c) };
        }),
      };
    }));
    setTaxRenaming(null);
    setTaxAddValue('');
    addToast('Renamed successfully');
  };

  const taxStartRename = (level, domId, spId, catId, currentName) => {
    setTaxRenaming({ level, domId, spId, catId });
    setTaxAddValue(currentName);
  };

  const taxAdd = () => {
    if (!taxAdding || !taxAddValue.trim()) { setTaxAdding(null); setTaxAddValue(''); return; }
    const val = taxAddValue.trim();
    const siblings = _getTaxSiblings(taxAdding.level, taxAdding.domId, taxAdding.spId);
    if (siblings.some(s => s.toLowerCase() === val.toLowerCase())) return; // blocked — UI shows the error
    const newId = `${taxAdding.level}${Date.now()}`;
    if (taxAdding.level === 'domain') {
      setTaxonomy(prev => [...prev, { id: newId, name: val, active: true, spendingPools: [] }]);
    } else if (taxAdding.level === 'sp') {
      setTaxonomy(prev => prev.map(dom => dom.id === taxAdding.domId
        ? { ...dom, spendingPools: [...dom.spendingPools, { id: newId, name: val, active: true, categories: [] }] }
        : dom));
    } else if (taxAdding.level === 'cat') {
      setTaxonomy(prev => prev.map(dom => dom.id === taxAdding.domId
        ? { ...dom, spendingPools: dom.spendingPools.map(sp => sp.id === taxAdding.spId
            ? { ...sp, categories: [...sp.categories, { id: newId, name: val, active: true }] }
            : sp) }
        : dom));
    }
    setTaxAdding(null);
    setTaxAddValue('');
    addToast(`"${val}" added`);
  };

  // Derived: validation state for the currently active taxonomy input
  const _taxActiveCtx = taxAdding || taxRenaming;
  const _taxSiblings = _taxActiveCtx ? _getTaxSiblings(_taxActiveCtx.level, _taxActiveCtx.domId, _taxActiveCtx.spId) : [];
  const _taxCurrentName = taxRenaming ? (() => {
    const { level, domId, spId, catId } = taxRenaming;
    if (level === 'domain') return taxonomy.find(d => d.id === domId)?.name || '';
    if (level === 'sp') return taxonomy.find(d => d.id === domId)?.spendingPools.find(s => s.id === spId)?.name || '';
    return taxonomy.find(d => d.id === domId)?.spendingPools.find(s => s.id === spId)?.categories.find(c => c.id === catId)?.name || '';
  })() : '';
  const taxInputTrimmed = taxAddValue.trim();
  const taxIsDupe = taxInputTrimmed.length > 0 && _taxSiblings.some(
    s => s.toLowerCase() === taxInputTrimmed.toLowerCase() && s.toLowerCase() !== _taxCurrentName.toLowerCase()
  );
  const taxSuggestions = taxInputTrimmed.length >= 2
    ? _taxSiblings.filter(s => s.toLowerCase().includes(taxInputTrimmed.toLowerCase()) && s.toLowerCase() !== taxInputTrimmed.toLowerCase()).slice(0, 3)
    : [];

  const renderTaxInput = (onConfirm, onCancel, placeholder = '') => (
    <div className="flex-1 min-w-0">
      <input
        autoFocus
        value={taxAddValue}
        onChange={e => setTaxAddValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !taxIsDupe && taxAddValue.trim()) onConfirm(); if (e.key === 'Escape') onCancel(); }}
        placeholder={placeholder}
        className={`w-full border rounded px-2 py-0.5 text-sm focus:outline-none ${taxIsDupe ? 'border-red-400 bg-red-50' : 'border-purple-300 bg-white'}`}
      />
      {taxIsDupe && <p className="text-xs text-red-500 mt-0.5 leading-tight">"{taxInputTrimmed}" already exists at this level</p>}
      {!taxIsDupe && taxSuggestions.length > 0 && (
        <p className="text-xs text-amber-600 mt-0.5 leading-tight">Similar: {taxSuggestions.join(', ')}</p>
      )}
    </div>
  );
  const [defaultEmailSubject, setDefaultEmailSubject] = useState(`You're invited: {{survey_name}}`);
  const [defaultEmailBody, setDefaultEmailBody] = useState(DEFAULT_EMAIL_BODY);

  // Template management state
  const [renamingTplId, setRenamingTplId] = useState(null);
  const [renameTplValue, setRenameTplValue] = useState('');
  const [expandedTplId, setExpandedTplId] = useState(null);
  const [editingTpl, setEditingTpl] = useState(null); // template being edited (questions)
  const [viewingTpl, setViewingTpl] = useState(null); // template being viewed in detail modal

  const allTemplates = templates; // Super Admin view

  const myProjectIds = (internalUsers.find(u => u.id === currentUser.id)?.projects || []).map(p => p.id);
  const visibleTemplates = templates.filter(t =>
    t.ownerId === currentUser.id ||
    (t.visibility === 'project' && myProjectIds.includes(t.projectId)) ||
    t.visibility === 'org_wide'
  );

  const startRenameTpl = (tpl) => { setRenamingTplId(tpl.id); setRenameTplValue(tpl.name); };
  const saveRenameTpl = (id) => { renameTemplate(id, renameTplValue); setRenamingTplId(null); };
  const getProjectName = (projectId) => projects.find(p => p.id === projectId)?.name || projectId;

  const saveProfile = () => addToast('Profile updated successfully');
  const saveDefaults = () => addToast('Survey defaults saved');
  const saveTimezone = () => addToast(`Timezone updated to ${orgTimezone}`);
  const saveDefaultEmail = () => addToast('Default email template saved');

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategories(prev => [...prev, { id: `cat${Date.now()}`, name: newCategoryName.trim(), active: true }]);
    setNewCategoryName('');
    setAddingCategory(false);
    addToast(`Category "${newCategoryName}" added`);
  };

  const toggleCategory = (id) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const startRename = (cat) => {
    setRenamingId(cat.id);
    setRenameValue(cat.name);
  };

  const saveRename = (id) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: renameValue } : c));
    setRenamingId(null);
    addToast('Category renamed');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto fade-in space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">{isSuperAdmin ? 'Platform configuration and administration' : 'Your profile and personal preferences'}</p>
      </div>

      {/* My Profile */}
      <Card className="p-6">
        <SectionHeader icon={User} title="My Profile" description="Your account details and display name" />
        {profileReadOnly ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
                <div className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">{profile.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <div className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">{profile.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Platform role:</span>
              <Badge color={ROLE_COLORS[currentUser.role] || 'gray'} size="sm">{currentUser.role}</Badge>
            </div>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">Need to update your profile details? Reach out to your platform administrator to request a change.</p>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
                <input
                  type="text"
                  value={editProfile.name}
                  onChange={e => setEditProfile(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={editProfile.email}
                  onChange={e => setEditProfile(p => ({ ...p, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Platform role:</span>
                <Badge color={ROLE_COLORS[currentUser.role] || 'gray'} size="sm">{currentUser.role}</Badge>
              </div>
              <Button size="sm" onClick={saveProfile}><Save size={14} /> Save Profile</Button>
            </div>
          </>
        )}
      </Card>

      {/* Organisation Timezone */}
      <Card className="p-6">
        <SectionHeader icon={Globe} title="Organisation Timezone" description="Default timezone for survey schedules and reports" />
        <div className="flex items-center gap-3">
          <select
            value={orgTimezone}
            onChange={e => setOrgTimezone(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none flex-1 max-w-sm"
          >
            {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
          </select>
          <Button size="sm" onClick={saveTimezone}><Save size={14} /> Save</Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <SectionHeader icon={Bell} title="Notifications" description="Choose which events trigger alerts for you" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Email</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">In-platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {NOTIFICATION_EVENTS.map(({ key, label }) => {
                const prefs = notificationPrefs?.[key] || { email: false, inPlatform: false };
                const toggle = (channel) => setNotificationPrefs(prev => ({
                  ...prev,
                  [key]: { ...prefs, [channel]: !prefs[channel] },
                }));
                return (
                  <tr key={key} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 text-sm text-gray-700">{label}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggle('email')}
                        className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${prefs.email ? '' : 'bg-gray-200'}`}
                        style={prefs.email ? { backgroundColor: '#4A00F8' } : {}}
                        role="switch"
                        aria-checked={prefs.email}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${prefs.email ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggle('inPlatform')}
                        className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${prefs.inPlatform ? '' : 'bg-gray-200'}`}
                        style={prefs.inPlatform ? { backgroundColor: '#4A00F8' } : {}}
                        role="switch"
                        aria-checked={prefs.inPlatform}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${prefs.inPlatform ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Category Taxonomy — Super Admin only */}
      {isSuperAdmin && (
        <Card className="p-6">
          <SectionHeader icon={List} title="Category Taxonomy" description="Manage the domain, spending pool, and category hierarchy used to classify surveys and experts" />

          {/* Column header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-0 mb-2 px-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Domain</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Spending Pool</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</span>
            <span />
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
            {taxonomy.map(dom => (
              <div key={dom.id}>
                {/* Domain row */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors group">
                  <button onClick={() => toggleDomain(dom.id)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    {expandedDomains.has(dom.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {taxRenaming?.level === 'domain' && taxRenaming.domId === dom.id
                    ? renderTaxInput(taxSaveRename, () => { setTaxRenaming(null); setTaxAddValue(''); })
                    : <span className={`flex-1 text-sm font-semibold ${dom.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{dom.name}</span>
                  }
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {taxRenaming?.level === 'domain' && taxRenaming.domId === dom.id ? (
                      <>
                        <button onClick={taxSaveRename} disabled={taxIsDupe} className={`p-1 flex-shrink-0 ${taxIsDupe ? 'text-gray-300 cursor-not-allowed' : 'text-green-500'}`}><CheckCircle size={13} /></button>
                        <button onClick={() => { setTaxRenaming(null); setTaxAddValue(''); }} className="text-gray-400 p-1 flex-shrink-0"><X size={13} /></button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="xs" onClick={() => taxStartRename('domain', dom.id, null, null, dom.name)}><Edit2 size={11} /> Rename</Button>
                        <Button variant="ghost" size="xs" className={dom.active ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'} onClick={() => taxToggleActive(dom.id, null, null)}>
                          {dom.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => { setTaxAdding({ level: 'sp', domId: dom.id }); setTaxAddValue(''); setExpandedDomains(prev => new Set([...prev, dom.id])); }}>
                          <Plus size={11} /> Add spending pool
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Spending pools */}
                {expandedDomains.has(dom.id) && (
                  <div className="divide-y divide-gray-50">
                    {dom.spendingPools.map(sp => (
                      <div key={sp.id}>
                        {/* Spending pool row */}
                        <div className="flex items-center gap-2 px-3 py-2.5 pl-8 hover:bg-gray-50 transition-colors group">
                          <button onClick={() => toggleSP(sp.id)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                            {expandedSpendingPools.has(sp.id) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </button>
                          {taxRenaming?.level === 'sp' && taxRenaming.spId === sp.id
                            ? renderTaxInput(taxSaveRename, () => { setTaxRenaming(null); setTaxAddValue(''); })
                            : <span className={`flex-1 text-sm font-medium ${sp.active ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{sp.name}</span>
                          }
                          <span className="text-xs text-gray-400 mr-2 flex-shrink-0">{sp.categories.length} {sp.categories.length === 1 ? 'category' : 'categories'}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {taxRenaming?.level === 'sp' && taxRenaming.spId === sp.id ? (
                              <>
                                <button onClick={taxSaveRename} disabled={taxIsDupe} className={`p-1 flex-shrink-0 ${taxIsDupe ? 'text-gray-300 cursor-not-allowed' : 'text-green-500'}`}><CheckCircle size={13} /></button>
                                <button onClick={() => { setTaxRenaming(null); setTaxAddValue(''); }} className="text-gray-400 p-1 flex-shrink-0"><X size={13} /></button>
                              </>
                            ) : (
                              <>
                                <Button variant="ghost" size="xs" onClick={() => taxStartRename('sp', dom.id, sp.id, null, sp.name)}><Edit2 size={11} /> Rename</Button>
                                <Button variant="ghost" size="xs" className={sp.active ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'} onClick={() => taxToggleActive(dom.id, sp.id, null)}>
                                  {sp.active ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button variant="ghost" size="xs" onClick={() => { setTaxAdding({ level: 'cat', domId: dom.id, spId: sp.id }); setTaxAddValue(''); setExpandedSpendingPools(prev => new Set([...prev, sp.id])); }}>
                                  <Plus size={11} /> Add category
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Categories */}
                        {expandedSpendingPools.has(sp.id) && (
                          <div className="divide-y divide-gray-50 bg-white">
                            {sp.categories.map(cat => (
                              <div key={cat.id} className="flex items-center gap-2 px-3 py-2 pl-16 hover:bg-gray-50 transition-colors group">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                                {taxRenaming?.level === 'cat' && taxRenaming.catId === cat.id
                                  ? renderTaxInput(taxSaveRename, () => { setTaxRenaming(null); setTaxAddValue(''); })
                                  : <span className={`flex-1 text-sm ${cat.active ? 'text-gray-600' : 'text-gray-400 line-through'}`}>{cat.name}</span>
                                }
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {taxRenaming?.level === 'cat' && taxRenaming.catId === cat.id ? (
                                    <>
                                      <button onClick={taxSaveRename} disabled={taxIsDupe} className={`p-1 flex-shrink-0 ${taxIsDupe ? 'text-gray-300 cursor-not-allowed' : 'text-green-500'}`}><CheckCircle size={13} /></button>
                                      <button onClick={() => { setTaxRenaming(null); setTaxAddValue(''); }} className="text-gray-400 p-1 flex-shrink-0"><X size={13} /></button>
                                    </>
                                  ) : (
                                    <>
                                      <Button variant="ghost" size="xs" onClick={() => taxStartRename('cat', dom.id, sp.id, cat.id, cat.name)}><Edit2 size={11} /> Rename</Button>
                                      <Button variant="ghost" size="xs" className={cat.active ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'} onClick={() => taxToggleActive(dom.id, sp.id, cat.id)}>
                                        {cat.active ? 'Deactivate' : 'Activate'}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                            {/* Add category inline */}
                            {taxAdding?.level === 'cat' && taxAdding.domId === dom.id && taxAdding.spId === sp.id && (
                              <div className="flex items-center gap-2 px-3 py-2 pl-16 bg-purple-50">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-300 flex-shrink-0" />
                                {renderTaxInput(taxAdd, () => { setTaxAdding(null); setTaxAddValue(''); }, 'New category name…')}
                                <button onClick={taxAdd} disabled={taxIsDupe} className={`p-1 flex-shrink-0 ${taxIsDupe ? 'text-gray-300 cursor-not-allowed' : 'text-green-500'}`}><CheckCircle size={13} /></button>
                                <button onClick={() => { setTaxAdding(null); setTaxAddValue(''); }} className="text-gray-400 p-1 flex-shrink-0"><X size={13} /></button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Add spending pool inline */}
                    {taxAdding?.level === 'sp' && taxAdding.domId === dom.id && (
                      <div className="flex items-center gap-2 px-3 py-2.5 pl-8 bg-purple-50">
                        <div className="w-3 flex-shrink-0" />
                        {renderTaxInput(taxAdd, () => { setTaxAdding(null); setTaxAddValue(''); }, 'New spending pool name…')}
                        <button onClick={taxAdd} disabled={taxIsDupe} className={`p-1 flex-shrink-0 ${taxIsDupe ? 'text-gray-300 cursor-not-allowed' : 'text-green-500'}`}><CheckCircle size={13} /></button>
                        <button onClick={() => { setTaxAdding(null); setTaxAddValue(''); }} className="text-gray-400 p-1 flex-shrink-0"><X size={13} /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add domain inline */}
            {taxAdding?.level === 'domain' && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-purple-50">
                <div className="w-3 flex-shrink-0" />
                {renderTaxInput(taxAdd, () => { setTaxAdding(null); setTaxAddValue(''); }, 'New domain name…')}
                <button onClick={taxAdd} disabled={taxIsDupe} className={`p-1 flex-shrink-0 ${taxIsDupe ? 'text-gray-300 cursor-not-allowed' : 'text-green-500'}`}><CheckCircle size={13} /></button>
                <button onClick={() => { setTaxAdding(null); setTaxAddValue(''); }} className="text-gray-400 p-1 flex-shrink-0"><X size={13} /></button>
              </div>
            )}
          </div>

          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={() => { setTaxAdding({ level: 'domain' }); setTaxAddValue(''); }}>
              <Plus size={13} /> Add domain
            </Button>
          </div>
        </Card>
      )}

      {/* Taxonomy Change Log — Super Admin only */}
      {isSuperAdmin && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-1">
            <SectionHeader icon={History} title="Taxonomy Change Log" description="Read-only record of all taxonomy mutations — no revert" />
            <Button variant="ghost" size="sm" onClick={() => setShowTaxLog(p => !p)} className="flex-shrink-0 self-start mt-0.5">
              {showTaxLog ? 'Hide' : 'View log'}
            </Button>
          </div>
          {showTaxLog && (
            <div className="border border-gray-100 rounded-xl overflow-hidden mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Date & time', 'Actor', 'Level', 'Action', 'Detail'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_TAXONOMY_LOG.map(entry => {
                    const actionColor = entry.action === 'Added' ? 'text-green-600' : entry.action === 'Renamed' ? 'text-blue-600' : entry.action === 'Deactivated' ? 'text-red-500' : 'text-green-500';
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap">{entry.ts}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">{entry.actor}</td>
                        <td className="px-3 py-2.5"><span className="text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{entry.level}</span></td>
                        <td className="px-3 py-2.5"><span className={`text-xs font-semibold ${actionColor}`}>{entry.action}</span></td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">
                          {entry.action === 'Renamed'
                            ? <span>"{entry.before}" → "{entry.after}" {entry.parent && <span className="text-gray-400 ml-1">in {entry.parent}</span>}</span>
                            : <span>"{entry.name}" {entry.parent && <span className="text-gray-400 ml-1">in {entry.parent}</span>}</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Default Email Template */}
      <Card className="p-6">
        <SectionHeader icon={Mail} title="Default Email Template" description="Pre-fill template used when setting up new survey waves" />
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Default subject line</label>
            </div>
            <input
              type="text"
              value={defaultEmailSubject}
              onChange={e => setDefaultEmailSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Default email body</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Merge tags:</span>
                {MERGE_TAGS_EMAIL.map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-xs font-mono bg-purple-50 border border-purple-100 text-purple-700">{`{{${t}}}`}</span>
                ))}
              </div>
            </div>
            <textarea
              value={defaultEmailBody}
              onChange={e => setDefaultEmailBody(e.target.value)}
              rows={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono resize-none focus:border-purple-400 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <Button size="sm" onClick={saveDefaultEmail}><Save size={14} /> Save Template</Button>
        </div>
      </Card>

      {/* ── TEMPLATES ─────────────────────────────────────────────────────── */}

      {/* Survey Templates — unified section for Admin / Standard User */}
      {!isSuperAdmin && (
        <Card className="p-6">
          <SectionHeader icon={BookTemplate} title="Survey Templates" description="All templates visible to you — your private templates and project-shared templates from your projects." />
          {visibleTemplates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No templates yet. Save a survey as a template from the survey builder.</p>
          ) : (
            <TemplateTable
              templates={visibleTemplates}
              showOwner={true}
              showMakePrivate={false}
              showProposeOrgWide={true}
              pendingProposalTemplateIds={(orgWideProposals || []).map(p => p.templateId)}
              renamingTplId={renamingTplId} renameTplValue={renameTplValue}
              onStartRename={startRenameTpl} onSaveRename={saveRenameTpl}
              onCancelRename={() => setRenamingTplId(null)}
              onRenameChange={v => setRenameTplValue(v)}
              expandedTplId={expandedTplId} onToggleExpand={id => setExpandedTplId(expandedTplId === id ? null : id)}
              onEditQuestions={tpl => setEditingTpl(tpl)}
              onDelete={deleteTemplate}
              onMakePrivate={null}
              onProposeOrgWide={proposeOrgWide}
              getProjectName={getProjectName}
              categories={categories}
              restrictToOwner={true}
              currentUserId={currentUser.id}
              onViewDetail={null}
            />
          )}
        </Card>
      )}

      {/* All Templates — Super Admin only */}
      {isSuperAdmin && (
        <Card className="p-6">
          <SectionHeader icon={Eye} title="All Templates" description="Org-wide view of every template. Approve or reject Org-Wide proposals, revert any template to Private." />
          {/* Pending Org-Wide proposals */}
          {(orgWideProposals || []).length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ArrowUpRight size={15} className="text-violet-500" />
                Pending Org-Wide Proposals ({orgWideProposals.length})
              </p>
              <div className="space-y-2">
                {orgWideProposals.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-violet-200 bg-violet-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.templateName}</p>
                      <p className="text-xs text-gray-500">Proposed by {p.proposedBy} · {p.proposedAt}</p>
                    </div>
                    <Button variant="ghost" size="xs" className="text-green-600 hover:text-green-800 border border-green-200" onClick={() => approveOrgWide(p.id)}>
                      <ThumbsUp size={11} /> Approve
                    </Button>
                    <Button variant="ghost" size="xs" className="text-red-400 hover:text-red-600 border border-red-100" onClick={() => rejectOrgWide(p.id)}>
                      <ThumbsDown size={11} /> Reject
                    </Button>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-4 mb-4" />
            </div>
          )}
          {allTemplates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No templates have been created in the organisation yet.</p>
          ) : (
            <TemplateTable
              templates={allTemplates}
              showOwner={true}
              showMakePrivate={true}
              showProposeOrgWide={false}
              pendingProposalTemplateIds={[]}
              renamingTplId={renamingTplId} renameTplValue={renameTplValue}
              onStartRename={startRenameTpl} onSaveRename={saveRenameTpl}
              onCancelRename={() => setRenamingTplId(null)}
              onRenameChange={v => setRenameTplValue(v)}
              expandedTplId={expandedTplId} onToggleExpand={id => setExpandedTplId(expandedTplId === id ? null : id)}
              onEditQuestions={tpl => setEditingTpl(tpl)}
              onDelete={deleteTemplate}
              onMakePrivate={revertTemplateToPrivate}
              onProposeOrgWide={null}
              getProjectName={getProjectName}
              categories={categories}
              onViewDetail={tpl => setViewingTpl(tpl)}
            />
          )}
        </Card>
      )}

      {/* Edit questions modal */}
      {editingTpl && (
        <EditQuestionsModal
          template={editingTpl}
          onSave={(qs) => { updateTemplateQuestions(editingTpl.id, qs); setEditingTpl(null); }}
          onClose={() => setEditingTpl(null)}
        />
      )}

      {/* Template detail modal (SA) */}
      {viewingTpl && (
        <TemplateDetailModal
          template={viewingTpl}
          onClose={() => setViewingTpl(null)}
          onRevert={(v) => {
            revertTemplateVersion(viewingTpl.id, v);
            setViewingTpl(prev => ({ ...prev, versionCount: (prev.versionCount || 1) + 1 }));
          }}
          categories={categories}
          internalUsers={internalUsers}
          getProjectName={getProjectName}
        />
      )}

      {/* Survey Configuration — Super Admin only */}
      {isSuperAdmin && typologyConfig && (
        <Card className="p-6">
          <SectionHeader icon={Sliders} title="Survey Configuration" description="Configure which question types are available per survey typology. Changes apply to all new surveys immediately." />
          {(() => {
            const TYPOLOGIES = [
              { key: 'market_signal_report', label: 'Market Signal Report' },
              { key: 'other_survey', label: 'Other Survey' },
            ];
            const QT_LABELS = {
              single_choice: 'Single Choice', multi_choice: 'Multiple Choice', rating_scale: 'Rating Scale',
              open_text: 'Open Text', short_text: 'Short Text', long_text: 'Long Text',
              ranking: 'Ranking', date_picker: 'Date Picker', number: 'Number', file_attachment: 'File Attachment',
            };
            const allQTypes = Object.keys(QT_LABELS);
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Question Type</th>
                      {TYPOLOGIES.map(t => (
                        <th key={t.key} className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allQTypes.map(qt => (
                      <tr key={qt} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 text-sm font-medium text-gray-700 flex items-center gap-2">
                          {qt === 'file_attachment' && <Paperclip size={13} className="text-violet-500" />}
                          {QT_LABELS[qt]}
                        </td>
                        {TYPOLOGIES.map(t => {
                          const enabled = typologyConfig[t.key]?.[qt] !== false;
                          // Count enabled types for this typology — must keep at least 1
                          const enabledCount = Object.values(typologyConfig[t.key] || {}).filter(Boolean).length;
                          const canDisable = enabled ? enabledCount > 1 : true;
                          return (
                            <td key={t.key} className="py-3 px-3 text-center">
                              <button
                                onClick={() => canDisable && updateTypologyConfig(t.key, qt, !enabled)}
                                className={`transition-colors ${canDisable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                title={!canDisable ? 'At least one question type must remain enabled' : (enabled ? 'Click to disable' : 'Click to enable')}
                              >
                                {enabled
                                  ? <ToggleRight size={22} style={{ color: '#4A00F8' }} />
                                  : <ToggleLeft size={22} className="text-gray-300" />
                                }
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-3">Changes take effect immediately for all new surveys. Existing surveys in any lifecycle state are unaffected.</p>
              </div>
            );
          })()}
        </Card>
      )}

      {/* Survey Defaults */}
      <Card className="p-6">
        <SectionHeader icon={Sliders} title="Survey Defaults" description="Default settings applied to all new surveys" />
        <div className="space-y-4 mb-5">
          <Toggle checked={surveyDefaults.autoCloseEnabled} onChange={v => setSurveyDefaults(d => ({ ...d, autoCloseEnabled: v }))} label="Auto-close surveys" description="Automatically close surveys when the close date is reached" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default close window (days)</label>
            <input
              type="number" min={1} max={90}
              value={surveyDefaults.defaultCloseDays}
              onChange={e => setSurveyDefaults(d => ({ ...d, defaultCloseDays: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Auto-transfer delay after close (days)</label>
            <input
              type="number" min={1} max={30}
              value={surveyDefaults.autoTransferDays}
              onChange={e => setSurveyDefaults(d => ({ ...d, autoTransferDays: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>
        <Button size="sm" onClick={saveDefaults}><Save size={14} /> Save Defaults</Button>
      </Card>
    </div>
  );
}
