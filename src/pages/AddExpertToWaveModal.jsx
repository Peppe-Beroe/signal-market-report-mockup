import { useState, useMemo } from 'react';
import { X, Search, UserPlus, AlertTriangle, Check, Users, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

// Mid-Running expert addition modal (P1-F-110 / P1-F-111)
// Two tabs:
//   - "Existing expert" → multi-select filtered picker (suppresses opted-out + already-targeted)
//   - "New expert" → invite form mirroring ExpertDatabase's ChangeExpertListModal "Invite new expert" tab
// Submit button label flips between direct add and propose based on authority.

function ExistingExpertTab({ survey, onClose }) {
  const { experts, currentUser, resolveExpertAddAuthority, directAddExpertToWave, proposeAddExpertToWave, addToast } = useApp();

  const targetedIds = useMemo(
    () => new Set((survey.waveConfig?.selectedExperts || []).map(e => e.id)),
    [survey.waveConfig?.selectedExperts]
  );

  const pendingExistingIds = useMemo(
    () => new Set(
      (survey.pendingExpertAdditions || [])
        .filter(p => p.status === 'pending' && p.mode === 'existing')
        .map(p => p.expertPayload?.expertId)
    ),
    [survey.pendingExpertAdditions]
  );

  // Eligible = Active (not opted-out) AND not already targeted AND not pending
  const eligibleExperts = useMemo(
    () => experts.filter(e =>
      e.status === 'Active' && !targetedIds.has(e.id) && !pendingExistingIds.has(e.id)
    ),
    [experts, targetedIds, pendingExistingIds]
  );

  // Filter controls
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterSpendingPool, setFilterSpendingPool] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterGeography, setFilterGeography] = useState('');

  const domains = useMemo(() => Array.from(new Set(eligibleExperts.map(e => e.domain).filter(Boolean))).sort(), [eligibleExperts]);
  const spendingPools = useMemo(() => Array.from(new Set(eligibleExperts.filter(e => !filterDomain || e.domain === filterDomain).map(e => e.spendingPool).filter(Boolean))).sort(), [eligibleExperts, filterDomain]);
  const categories = useMemo(() => Array.from(new Set(eligibleExperts.filter(e => (!filterDomain || e.domain === filterDomain) && (!filterSpendingPool || e.spendingPool === filterSpendingPool)).map(e => e.category).filter(Boolean))).sort(), [eligibleExperts, filterDomain, filterSpendingPool]);
  const geographies = useMemo(() => Array.from(new Set(eligibleExperts.map(e => e.geography).filter(Boolean))).sort(), [eligibleExperts]);

  const filteredExperts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return eligibleExperts.filter(e => {
      if (q && !e.name.toLowerCase().includes(q) && !e.company.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q)) return false;
      if (filterDomain && e.domain !== filterDomain) return false;
      if (filterSpendingPool && e.spendingPool !== filterSpendingPool) return false;
      if (filterCategory && e.category !== filterCategory) return false;
      if (filterGeography && e.geography !== filterGeography) return false;
      return true;
    });
  }, [eligibleExperts, search, filterDomain, filterSpendingPool, filterCategory, filterGeography]);

  const [selected, setSelected] = useState(new Set());
  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const selectAllFiltered = () => setSelected(new Set(filteredExperts.map(e => e.id)));
  const clearSelection = () => setSelected(new Set());

  // Determine if every selected expert can be direct-added by current user
  const selectedExperts = useMemo(
    () => Array.from(selected).map(id => eligibleExperts.find(e => e.id === id)).filter(Boolean),
    [selected, eligibleExperts]
  );

  const allDirect = selectedExperts.length > 0 && selectedExperts.every(e => resolveExpertAddAuthority(currentUser, e.category).canDirectAdd);
  const someOutOfPerimeter = selectedExperts.some(e => !resolveExpertAddAuthority(currentUser, e.category).canDirectAdd);

  const handleSubmit = () => {
    if (selectedExperts.length === 0) {
      addToast('Select at least one expert', 'warning');
      return;
    }
    selectedExperts.forEach(e => {
      const auth = resolveExpertAddAuthority(currentUser, e.category);
      if (auth.canDirectAdd) {
        directAddExpertToWave(survey.id, e.id);
      } else {
        proposeAddExpertToWave(survey.id, 'existing', { expertId: e.id });
      }
    });
    onClose();
  };

  if (eligibleExperts.length === 0) {
    return (
      <div className="py-10 text-center">
        <Users size={28} className="text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-600">No experts available to add</p>
        <p className="text-xs text-gray-400 mt-1">All Active experts are already in this wave or pending approval.</p>
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, company, or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-purple-400 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Domain</label>
          <select value={filterDomain}
            onChange={e => { setFilterDomain(e.target.value); setFilterSpendingPool(''); setFilterCategory(''); }}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none">
            <option value="">All domains</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Spending Pool</label>
          <select value={filterSpendingPool}
            onChange={e => { setFilterSpendingPool(e.target.value); setFilterCategory(''); }}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none">
            <option value="">All pools</option>
            {spendingPools.map(sp => <option key={sp} value={sp}>{sp}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none">
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Geography</label>
          <select value={filterGeography}
            onChange={e => setFilterGeography(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none">
            <option value="">All geographies</option>
            {geographies.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Counts */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-800">{selected.size}</span> selected · {filteredExperts.length} match{filteredExperts.length !== 1 ? 'es' : ''}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={selectAllFiltered} className="text-xs font-medium text-purple-700 hover:underline">Select all filtered</button>
          <span className="text-gray-300">·</span>
          <button onClick={clearSelection} className="text-xs font-medium text-gray-500 hover:underline">Clear</button>
        </div>
      </div>

      {/* List */}
      <div className="border border-gray-100 rounded-xl max-h-64 overflow-y-auto">
        {filteredExperts.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No experts match your filters</div>
        ) : (
          filteredExperts.map((expert, idx) => {
            const isSelected = selected.has(expert.id);
            const auth = resolveExpertAddAuthority(currentUser, expert.category);
            return (
              <label
                key={expert.id}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${idx > 0 ? 'border-t border-gray-50' : ''} hover:bg-purple-50/40 transition-colors`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(expert.id)}
                  className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                />
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: '#4A00F8' }}
                >
                  {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{expert.name}</p>
                  <p className="text-xs text-gray-400 truncate">{expert.title} · {expert.company} · {expert.geography || '—'}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge color="gray" size="xs">{expert.category || '—'}</Badge>
                  {!auth.canDirectAdd && (
                    <span className="text-[10px] font-medium text-amber-600">approval needed</span>
                  )}
                </div>
              </label>
            );
          })
        )}
      </div>

      {/* Authority banner */}
      {selectedExperts.length > 0 && someOutOfPerimeter && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Some selected experts are outside your category perimeter. Those will be submitted for approval to the category Admin or Super Admin. In-perimeter selections will be added directly with an invitation email.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        {allDirect && (
          <Button onClick={handleSubmit} disabled={selectedExperts.length === 0}>
            <UserPlus size={13} /> Add {selectedExperts.length || ''} to wave
          </Button>
        )}
        {!allDirect && (
          <button
            onClick={handleSubmit}
            disabled={selectedExperts.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-colors"
            style={{ backgroundColor: '#D97706' }}
          >
            <span className="inline-flex items-center gap-1.5"><FileText size={13} /> Submit {selectedExperts.length || ''} for approval</span>
          </button>
        )}
      </div>
    </div>
  );
}

function NewExpertField({ keyName, label, placeholder, required, form, setForm, errors, setErrors }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={keyName === 'email' ? 'email' : 'text'}
        value={form[keyName]}
        placeholder={placeholder}
        onChange={e => { setForm(f => ({ ...f, [keyName]: e.target.value })); setErrors(er => ({ ...er, [keyName]: '' })); }}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors[keyName] ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-purple-400'}`}
      />
      {errors[keyName] && <p className="text-xs text-red-500 mt-0.5">{errors[keyName]}</p>}
    </div>
  );
}

function NewExpertTab({ survey, onClose }) {
  const { taxonomy, currentUser, resolveExpertAddAuthority, directAddNewExpertToWave, proposeAddExpertToWave } = useApp();

  const adminPerimeter = currentUser.responsibleCategories || [];
  const firstRC = adminPerimeter[0] || {};
  const [form, setForm] = useState({
    name: '', email: '', company: '', title: '',
    domain: firstRC.domain || '',
    spendingPool: firstRC.spendingPool || '',
    category: firstRC.category || '',
    geography: '',
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const activeTaxDomains = useMemo(() => (taxonomy || []).filter(d => d.active), [taxonomy]);
  const pools = activeTaxDomains.find(d => d.name === form.domain)?.spendingPools.filter(sp => sp.active) || [];
  const cats = pools.find(sp => sp.name === form.spendingPool)?.categories.filter(c => c.active) || [];

  const handleDomain = (val) => setForm(f => ({ ...f, domain: val, spendingPool: '', category: '' }));
  const handlePool = (val) => setForm(f => ({ ...f, spendingPool: val, category: '' }));

  const authority = resolveExpertAddAuthority(currentUser, form.category);
  const canDirect = authority.canDirectAdd;

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.company.trim()) errs.company = 'Company is required';
    if (!form.title.trim()) errs.title = 'Designation is required';
    if (!form.geography.trim()) errs.geography = 'Geography is required';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const payload = {
      name: form.name.trim(), email: form.email.trim(),
      company: form.company.trim(), title: form.title.trim(),
      domain: form.domain, spendingPool: form.spendingPool, category: form.category,
      geography: form.geography.trim(),
    };
    if (canDirect) {
      directAddNewExpertToWave(survey.id, payload);
    } else {
      proposeAddExpertToWave(survey.id, 'new', payload);
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <Check size={22} className="text-green-600" />
        </div>
        <p className="font-semibold text-gray-800 mb-1">
          {canDirect ? 'Expert added — invitation sent!' : 'Approval request submitted!'}
        </p>
        <p className="text-xs text-gray-400">
          {canDirect ? 'The new expert has been added to the wave.' : 'A category Admin or Super Admin will review your request.'}
        </p>
        <button onClick={onClose} className="mt-4 px-5 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#4A00F8' }}>Close</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {currentUser.role === 'Standard User' && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <FileText size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">Your submission will be routed as an approval request to the category Admin or Super Admin.</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <NewExpertField keyName="name" label="Full name" placeholder="Dr. Jane Smith" required form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
        <NewExpertField keyName="email" label="Email address" placeholder="jane@company.com" required form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
        <NewExpertField keyName="company" label="Company" placeholder="Acme Corp" required form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
        <NewExpertField keyName="title" label="Designation" placeholder="VP Procurement" required form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Domain</label>
          <select value={form.domain} onChange={e => handleDomain(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none">
            <option value="">Select…</option>
            {activeTaxDomains.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Spending Pool</label>
          <select value={form.spendingPool} onChange={e => handlePool(e.target.value)}
            disabled={!form.domain}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none disabled:opacity-40">
            <option value="">Select…</option>
            {pools.map(sp => <option key={sp.id} value={sp.name}>{sp.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            disabled={!form.spendingPool}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:border-purple-400 focus:outline-none disabled:opacity-40">
            <option value="">Select…</option>
            {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <NewExpertField keyName="geography" label="Geography" placeholder="North America, Europe…" required form={form} setForm={setForm} errors={errors} setErrors={setErrors} />

      {form.category && !canDirect && currentUser.role === 'Admin' && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>{form.category}</strong> is outside your category perimeter. This will be submitted as an approval request to the relevant Admin or Super Admin.
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        {canDirect ? (
          <Button className="flex-1" onClick={handleSubmit}>
            <UserPlus size={13} /> Add to wave
          </Button>
        ) : (
          <button onClick={handleSubmit}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#D97706' }}>
            <span className="inline-flex items-center gap-1.5"><FileText size={13} /> Submit for approval</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function AddExpertToWaveModal({ survey, onClose }) {
  const [activeTab, setActiveTab] = useState('existing');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <UserPlus size={18} style={{ color: '#4A00F8' }} />
            <h2 className="font-semibold text-gray-900">Add expert to wave</h2>
            <span className="text-xs text-gray-400">· {survey.name}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {[
            { key: 'existing', label: 'Existing expert' },
            { key: 'new', label: 'New expert' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 mr-6 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key ? 'text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === tab.key ? { borderColor: '#4A00F8', color: '#4A00F8' } : { borderColor: 'transparent' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5">
          {activeTab === 'existing' && <ExistingExpertTab survey={survey} onClose={onClose} />}
          {activeTab === 'new' && <NewExpertTab survey={survey} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}
