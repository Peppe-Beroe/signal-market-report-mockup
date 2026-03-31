import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Mail, Building2, Tag, X, Upload, FileText, Check, AlertTriangle, ChevronRight, ChevronDown, Bell, Clock, CheckCircle2, Users, History, Download } from 'lucide-react';

const MOCK_IMPORT_HISTORY = [
  { id: 'imp1', ts: '31 Mar 2026, 14:45', actor: 'Maria Santos', filename: 'steel_experts_march2026.csv',  strategy: 'Skip existing',           created: 2,  updated: 0, skipped: 4, errors: 2 },
  { id: 'imp2', ts: '15 Mar 2026, 09:30', actor: 'Sarah Chen',   filename: 'chemicals_panel_q1.xlsx',      strategy: 'Update empty fields only', created: 12, updated: 5, skipped: 1, errors: 0 },
  { id: 'imp3', ts: '28 Feb 2026, 16:20', actor: 'Maria Santos', filename: 'initial_expert_panel.csv',     strategy: 'Full overwrite',           created: 47, updated: 0, skipped: 0, errors: 3 },
];
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

const EMPTY_FORM = { name: '', email: '', company: '', title: '', domain: '', spendingPool: '', category: '', geography: '', expertise: '', tags: '' };

// Mock CSV rows demonstrating all data quality scenarios
const MOCK_PREFLIGHT = [
  { row: 2, name: 'Chen Wei',          email: 'c.wei@baosteel.com',     company: 'Baosteel',    title: 'Procurement Lead',     spendingPool: 'Metals & Mining', category: 'Steel',        status: 'new',      issue: null },
  { row: 3, name: 'Fatima Al-Hassan',  email: 'f.alhassan@sabic.com',   company: 'SABIC',       title: 'Supply Chain Manager', spendingPool: 'Chemicals',       category: 'Polypropylene',status: 'new',      issue: null },
  { row: 4, name: 'Erik Johansson',    email: 'e.johansson@ssab.com',   company: 'SSAB',        title: 'Category Director',    spendingPool: 'Metals & Mining', category: 'Long Products',status: 'tax_warn', issue: 'Category "Long Products" not in active taxonomy — field will be imported blank.' },
  { row: 5, name: 'Dr. James Wright',  email: 'j.wright@steelcorp.com', company: 'SteelCorp',   title: 'VP Procurement',       spendingPool: 'Metals & Mining', category: 'Steel',        status: 'conflict', issue: 'Email matches existing expert. Conflict strategy applies.' },
  { row: 6, name: 'Linda Park',        email: 'l.park@posco.com',       company: 'POSCO',       title: 'Strategic Buyer',      spendingPool: 'Metals & Mining', category: 'Steel',        status: 'optout',   issue: 'Expert has opted out. Will always be skipped — compliance rule.' },
  { row: 7, name: 'John Doe',          email: '',                        company: 'Acme Corp',   title: 'Buyer',                spendingPool: '',                category: '',             status: 'error',    issue: 'Missing required field: email' },
  { row: 8, name: 'Chen Wei',          email: 'c.wei@baosteel.com',     company: 'Baosteel',    title: 'Procurement Lead',     spendingPool: 'Metals & Mining', category: 'Steel',        status: 'error',    issue: 'Duplicate within file — email c.wei@baosteel.com already appears in row 2' },
];

const STATUS_META = {
  new:      { label: 'New',            bg: 'bg-green-50',  border: 'border-green-100', text: 'text-green-700',  dot: 'bg-green-400' },
  tax_warn: { label: 'Taxonomy warn',  bg: 'bg-amber-50',  border: 'border-amber-100', text: 'text-amber-700',  dot: 'bg-amber-400' },
  conflict: { label: 'Conflict',       bg: 'bg-blue-50',   border: 'border-blue-100',  text: 'text-blue-700',   dot: 'bg-blue-400'  },
  optout:   { label: 'Opted out',      bg: 'bg-gray-50',   border: 'border-gray-200',  text: 'text-gray-500',   dot: 'bg-gray-400'  },
  error:    { label: 'Error',          bg: 'bg-red-50',    border: 'border-red-100',   text: 'text-red-700',    dot: 'bg-red-400'   },
};

function RequestChangeModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ requestType: 'Add', expertName: '', details: '', justification: '' });
  const [submitted, setSubmitted] = useState(false);
  const [refNum, setRefNum] = useState('');

  const handleSubmit = () => {
    if (!form.expertName.trim() || !form.details.trim()) return;
    const req = onSubmit(form);
    setRefNum(req.refNum);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Request Change</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Check size={24} className="text-green-600" />
            </div>
            <p className="font-semibold text-gray-800">Request submitted!</p>
            <p className="text-sm text-gray-500 mt-1">Reference: <span className="font-bold text-purple-700">#{refNum}</span></p>
            <p className="text-xs text-gray-400 mt-2">Super Admin has been notified. You can track this request in the Pending Requests section.</p>
            <button onClick={onClose} className="mt-4 px-4 py-1.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#4A00F8' }}>Close</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Request type</label>
              <select
                value={form.requestType}
                onChange={e => setForm(f => ({ ...f, requestType: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none"
              >
                {['Add', 'Edit', 'Change Email', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Expert name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.expertName}
                onChange={e => setForm(f => ({ ...f, expertName: e.target.value }))}
                placeholder="Name of the expert"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Details <span className="text-red-400">*</span></label>
              <textarea
                value={form.details}
                onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                placeholder="Describe the change needed..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Justification</label>
              <textarea
                value={form.justification}
                onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
                placeholder="Why is this change needed?"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={!form.expertName.trim() || !form.details.trim()}>
                Submit Request
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CSVImportModal({ onClose, onImport, addToast, createExpert }) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('');
  const [strategy, setStrategy] = useState('skip'); // 'skip' | 'update_empty' | 'overwrite'
  const [showReport, setShowReport] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFileName(file.name);
  };
  const downloadTemplate = () => addToast('Template CSV downloaded');

  const newRows      = MOCK_PREFLIGHT.filter(r => r.status === 'new');
  const taxWarnRows  = MOCK_PREFLIGHT.filter(r => r.status === 'tax_warn');
  const conflictRows = MOCK_PREFLIGHT.filter(r => r.status === 'conflict');
  const optoutRows   = MOCK_PREFLIGHT.filter(r => r.status === 'optout');
  const errorRows    = MOCK_PREFLIGHT.filter(r => r.status === 'error');

  const conflictAction = strategy === 'skip' ? 'Skipped' : strategy === 'update_empty' ? 'Partially updated' : 'Overwritten';
  const importableCount = newRows.length + taxWarnRows.length + (strategy !== 'skip' ? conflictRows.length : 0);

  const handleConfirmImport = () => {
    newRows.concat(taxWarnRows).forEach(row => {
      createExpert({ name: row.name, email: row.email, company: row.company, title: row.title, expertise: '', tags: '' });
    });
    setShowReport(true);
  };

  if (showReport) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Import Complete</h2>
            <button onClick={() => { setShowReport(false); onClose(); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-green-600" />
          </div>
          <div className="space-y-2 mb-5">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Created (new)</span>
              <span className="text-sm font-bold text-green-600">{newRows.length + taxWarnRows.length}</span>
            </div>
            {taxWarnRows.length > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-600">Taxonomy fields cleared (not in active taxonomy)</span>
                <span className="text-sm font-bold text-amber-600">{taxWarnRows.length}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Conflicts — {conflictAction.toLowerCase()}</span>
              <span className="text-sm font-bold text-blue-600">{conflictRows.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Opted-out — always skipped</span>
              <span className="text-sm font-bold text-gray-500">{optoutRows.length}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Errors — skipped</span>
              <span className="text-sm font-bold text-red-600">{errorRows.length}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => addToast('Import report downloaded')}>
              <FileText size={14} /> Download report
            </Button>
            <Button className="flex-1" onClick={() => { setShowReport(false); onClose(); }}>Done</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Import Experts from CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                style={step >= s ? { backgroundColor: '#4A00F8' } : {}}
              >
                {step > s ? <Check size={13} /> : s}
              </div>
              <span className={`text-sm ${step === s ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                {['Upload file', 'Data quality review', 'Confirm & import'][i]}
              </span>
              {i < 2 && <ChevronRight size={14} className="text-gray-300" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <Upload size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">Upload your expert CSV or Excel file</p>
              <p className="text-xs text-gray-400 mb-4">Accepted formats: .csv, .xlsx · Max file size: 5MB</p>
              <label className="cursor-pointer">
                <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} className="hidden" />
                <span className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#4A00F8' }}>Choose file</span>
              </label>
              {fileName && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <FileText size={14} className="text-green-500" />
                  <span className="text-sm text-gray-700 font-medium">{fileName}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={downloadTemplate} className="text-sm font-medium underline underline-offset-2" style={{ color: '#4A00F8' }}>Download template</button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={() => setStep(2)} disabled={!fileName}>Validate file</Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Data quality review */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'New', count: newRows.length,      color: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-100' },
                { label: 'Tax. warn', count: taxWarnRows.length,  color: 'text-amber-700', bg: 'bg-amber-50',  border: 'border-amber-100' },
                { label: 'Conflicts', count: conflictRows.length, color: 'text-blue-700',  bg: 'bg-blue-50',   border: 'border-blue-100' },
                { label: 'Opted out', count: optoutRows.length,   color: 'text-gray-500',  bg: 'bg-gray-50',   border: 'border-gray-200' },
                { label: 'Errors',    count: errorRows.length,    color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-100' },
              ].map(({ label, count, color, bg, border }) => (
                <div key={label} className={`${bg} border ${border} rounded-lg p-2 text-center`}>
                  <p className={`text-lg font-bold ${color}`}>{count}</p>
                  <p className={`text-xs ${color}`}>{label}</p>
                </div>
              ))}
            </div>

            {/* Row table */}
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Row', 'Name', 'Email', 'Spending Pool', 'Category', 'Status / Issue'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_PREFLIGHT.map(row => {
                    const meta = STATUS_META[row.status];
                    return (
                      <tr key={row.row} className={`${meta.bg}`}>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{row.row}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-800 font-medium">{row.name || <span className="text-gray-400 italic">—</span>}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">{row.email || <span className="text-red-400 italic">missing</span>}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">{row.spendingPool || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">
                          {row.status === 'tax_warn'
                            ? <span className="text-amber-600 font-medium">{row.category} ⚠</span>
                            : row.category || '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-start gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${meta.dot}`} />
                            <div>
                              <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
                              {row.issue && <p className="text-xs text-gray-500 mt-0.5">{row.issue}</p>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> New — will be created</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Taxonomy warn — field imported blank</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Conflict — email matches existing expert</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Opted-out — always skipped</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Error — will be skipped</span>
            </div>

            <div className="flex justify-between pt-1">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={errorRows.length === MOCK_PREFLIGHT.length}>Review & confirm</Button>
            </div>
          </div>
        )}

        {/* Step 3: Conflict strategy + confirm */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Conflict strategy */}
            {conflictRows.length > 0 && (
              <div className="border border-blue-100 rounded-xl p-4 bg-blue-50">
                <p className="text-sm font-semibold text-blue-800 mb-3">
                  {conflictRows.length} row{conflictRows.length > 1 ? 's' : ''} match existing experts by email — choose how to handle them:
                </p>
                <div className="space-y-2">
                  {[
                    { value: 'skip',         label: 'Skip existing',           desc: 'Leave all existing records unchanged. Safest option.' },
                    { value: 'update_empty', label: 'Update empty fields only', desc: 'Only fill blank fields on existing records — populated fields are not overwritten.' },
                    { value: 'overwrite',    label: 'Full overwrite',           desc: 'Replace all fields on existing records with CSV data. Use with caution.' },
                  ].map(opt => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${strategy === opt.value ? 'border-blue-400 bg-white' : 'border-transparent bg-white/60 hover:bg-white'}`}>
                      <input type="radio" name="strategy" value={opt.value} checked={strategy === opt.value} onChange={() => setStrategy(opt.value)} className="mt-0.5 accent-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Import summary</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New experts to create</span>
                <span className="text-sm font-bold text-green-600">{newRows.length + taxWarnRows.length}</span>
              </div>
              {taxWarnRows.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500" /> Taxonomy fields will be cleared</span>
                  <span className="text-sm font-semibold text-amber-600">{taxWarnRows.length} field{taxWarnRows.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {conflictRows.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conflicts — {conflictAction}</span>
                  <span className="text-sm font-bold text-blue-600">{conflictRows.length}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Opted-out — always skipped</span>
                <span className="text-sm font-bold text-gray-400">{optoutRows.length}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-2.5">
                <span className="text-sm text-gray-600">Errors — skipped</span>
                <span className="text-sm font-bold text-red-500">{errorRows.length}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleConfirmImport}>
                <Upload size={14} /> Import {importableCount} experts
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExpertDatabase() {
  const navigate = useNavigate();
  const { experts, currentUser, taxonomy, changeRequests, createExpert, addToast, submitChangeRequest, resolveChangeRequest } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [spendingPoolFilter, setSpendingPoolFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [designationFilter, setDesignationFilter] = useState('All');
  const [geographyFilter, setGeographyFilter] = useState('All');
  const [sortCol, setSortCol] = useState(null); // 'reactionRate' | 'acceptanceRate'
  const [sortDir, setSortDir] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportHistory, setShowImportHistory] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isAdminOrResearcher = currentUser.role !== 'Super Admin';
  const pendingRequestCount = isSuperAdmin ? changeRequests.filter(r => r.status === 'Pending').length : 0;

  // Derived filter options
  const allSpendingPools = useMemo(() => [...new Set(experts.map(e => e.spendingPool).filter(Boolean))].sort(), [experts]);
  const availableCategories = useMemo(() => {
    const base = spendingPoolFilter === 'All' ? experts : experts.filter(e => e.spendingPool === spendingPoolFilter);
    return [...new Set(base.map(e => e.category).filter(Boolean))].sort();
  }, [experts, spendingPoolFilter]);
  const allCompanies = useMemo(() => [...new Set(experts.map(e => e.company).filter(Boolean))].sort(), [experts]);
  const allDesignations = useMemo(() => [...new Set(experts.map(e => e.title).filter(Boolean))].sort(), [experts]);
  const allGeographies = useMemo(() => [...new Set(experts.map(e => e.geography).filter(Boolean))].sort(), [experts]);

  const handleSpendingPoolChange = (val) => { setSpendingPoolFilter(val); setCategoryFilter('All'); };

  // Taxonomy cascade for Add Expert form
  const activeTaxDomains = useMemo(() => (taxonomy || []).filter(d => d.active), [taxonomy]);
  const formAvailablePools = useMemo(() =>
    activeTaxDomains.find(d => d.name === form.domain)?.spendingPools.filter(sp => sp.active) || [],
    [activeTaxDomains, form.domain]);
  const formAvailableCats = useMemo(() =>
    formAvailablePools.find(sp => sp.name === form.spendingPool)?.categories.filter(c => c.active) || [],
    [formAvailablePools, form.spendingPool]);
  const handleFormDomainChange = (val) => setForm(f => ({ ...f, domain: val, spendingPool: '', category: '' }));
  const handleFormPoolChange = (val) => setForm(f => ({ ...f, spendingPool: val, category: '' }));

  const MIN_DATA_POINTS = 3;

  const reactionRate = (e) =>
    e.surveysSent >= MIN_DATA_POINTS
      ? Math.round((e.surveysResponded / e.surveysSent) * 100)
      : null;

  const acceptanceRate = (e) =>
    e.surveysResponded >= MIN_DATA_POINTS
      ? Math.round((e.responsesAccepted / e.surveysResponded) * 100)
      : null;

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const kpiColor = (pct) => {
    if (pct >= 75) return '#16A34A'; // green
    if (pct >= 50) return '#D97706'; // amber
    return '#DC2626'; // red
  };

  const filtered = useMemo(() => {
    const list = experts.filter(e => {
      if (spendingPoolFilter !== 'All' && e.spendingPool !== spendingPoolFilter) return false;
      if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
      if (companyFilter !== 'All' && e.company !== companyFilter) return false;
      if (designationFilter !== 'All' && e.title !== designationFilter) return false;
      if (geographyFilter !== 'All' && e.geography !== geographyFilter) return false;
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.company.toLowerCase().includes(search.toLowerCase()) ||
        e.expertise.some(x => x.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'All' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (!sortCol) return list;

    return [...list].sort((a, b) => {
      const valA = sortCol === 'reactionRate' ? reactionRate(a) : acceptanceRate(a);
      const valB = sortCol === 'reactionRate' ? reactionRate(b) : acceptanceRate(b);
      // N/A always to the bottom
      if (valA === null && valB === null) return 0;
      if (valA === null) return 1;
      if (valB === null) return -1;
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [experts, search, statusFilter, spendingPoolFilter, categoryFilter, companyFilter, designationFilter, geographyFilter, sortCol, sortDir]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.company.trim()) errs.company = 'Company is required';
    if (!form.title.trim()) errs.title = 'Title is required';
    return errs;
  };

  const handleCreate = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    createExpert(form);
    setShowModal(false);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleImportComplete = () => {
    addToast('Import complete: 3 experts added');
  };

  const field = (key, label, placeholder, required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={key === 'email' ? 'email' : 'text'}
        value={form[key]}
        onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); }}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${errors[key] ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-purple-400'}`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Expert Database</h1>
            {isSuperAdmin && pendingRequestCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EF4444' }}>
                <Bell size={10} /> {pendingRequestCount} pending
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{experts.length} experts · {experts.filter(e => e.status === 'Active').length} active</p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button variant="secondary" onClick={() => setShowImportModal(true)}>
              <Upload size={15} /> CSV Import
            </Button>
          )}
          {isAdminOrResearcher && (
            <Button variant="secondary" onClick={() => setShowRequestModal(true)}>
              Request Change
            </Button>
          )}
          {(isSuperAdmin || currentUser.role === 'Admin') && (
            <Button onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Expert
            </Button>
          )}
        </div>
      </div>

      {/* Row 1: search + status */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search experts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:border-purple-400 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Active', 'Opted-out'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s ? 'text-white' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
              }`}
              style={statusFilter === s ? { backgroundColor: '#4A00F8', borderColor: '#4A00F8' } : {}}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: taxonomy + attribute filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {[
          { label: 'Spending Pool', value: spendingPoolFilter, options: allSpendingPools, onChange: handleSpendingPoolChange },
          { label: 'Category', value: categoryFilter, options: availableCategories, onChange: setCategoryFilter },
          { label: 'Company', value: companyFilter, options: allCompanies, onChange: setCompanyFilter },
          { label: 'Designation', value: designationFilter, options: allDesignations, onChange: setDesignationFilter },
          { label: 'Geography', value: geographyFilter, options: allGeographies, onChange: setGeographyFilter },
        ].map(({ label, value, options, onChange }) => (
          <div key={label} className="relative">
            <select
              value={value}
              onChange={e => onChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-purple-400 transition-colors cursor-pointer"
            >
              <option value="All">All {label}s</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Spending Pool</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Category</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Company</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Designation</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Geography</th>
                {[
                  { col: 'reactionRate', label: 'Reaction Rate' },
                  { col: 'acceptanceRate', label: 'Data Acceptance Rate' },
                ].map(({ col, label }) => (
                  <th
                    key={col}
                    className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 cursor-pointer select-none hover:text-gray-700 whitespace-nowrap"
                    onClick={() => handleSort(col)}
                  >
                    {label}
                    {sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                  </th>
                ))}
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <Users size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">No experts match your search</p>
                    {isSuperAdmin && (
                      <Button size="sm" onClick={() => setShowImportModal(true)}>Import experts</Button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map(expert => (
                  <tr
                    key={expert.id}
                    className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/experts/${expert.id}`)}
                  >
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{expert.spendingPool || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{expert.category || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: expert.status === 'Opted-out' ? '#9CA3AF' : '#4A00F8' }}
                        >
                          {expert.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 hover:text-purple-700 transition-colors">{expert.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Building2 size={13} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium">{expert.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{expert.title}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{expert.geography || '—'}</span>
                    </td>
                    {[reactionRate(expert), acceptanceRate(expert)].map((pct, i) => (
                      <td key={i} className="px-4 py-4">
                        {pct === null ? (
                          <span className="text-xs text-gray-400 italic">N/A</span>
                        ) : (
                          <span
                            className="text-sm font-semibold"
                            style={{ color: kpiColor(pct) }}
                          >
                            {pct}%
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail size={10} className="text-gray-400 flex-shrink-0" />
                        {expert.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={expert.status} size="xs" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pending Requests section */}
      {(() => {
        const myRequests = isSuperAdmin
          ? changeRequests
          : changeRequests.filter(r => r.submittedBy === currentUser.name);
        const pendingCount = myRequests.filter(r => r.status === 'Pending').length;
        if (myRequests.length === 0) return null;
        return (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={15} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-800">
                {isSuperAdmin ? 'Expert Change Requests' : 'My Pending Requests'}
              </h2>
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#EF4444' }}>{pendingCount}</span>
              )}
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Ref</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Type</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Expert</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Details</th>
                      {isSuperAdmin && <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Submitted by</th>}
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Date</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                      {isSuperAdmin && <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myRequests.map(req => (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="text-xs font-bold text-purple-700">#{req.refNum}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600">{req.requestType}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-800">{req.expertName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 max-w-48 block truncate" title={req.details}>{req.details}</span>
                        </td>
                        {isSuperAdmin && <td className="px-4 py-3 text-xs text-gray-500">{req.submittedBy}</td>}
                        <td className="px-4 py-3 text-xs text-gray-400">{req.timestamp}</td>
                        <td className="px-4 py-3">
                          {req.status === 'Pending' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                              <Clock size={10} /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded">
                              <CheckCircle2 size={10} /> Resolved
                            </span>
                          )}
                        </td>
                        {isSuperAdmin && (
                          <td className="px-4 py-3">
                            {req.status === 'Pending' && (
                              <button
                                onClick={() => resolveChangeRequest(req.id)}
                                className="text-xs text-green-600 hover:text-green-800 font-medium"
                              >
                                Mark resolved
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* Import History — Super Admin only */}
      {isSuperAdmin && (
        <div className="px-6 pb-6">
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowImportHistory(p => !p)}
              className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <History size={15} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">Import History</span>
                <span className="text-xs text-gray-400 font-normal">— read-only record of all CSV imports</span>
              </div>
              <ChevronDown size={15} className={`text-gray-400 transition-transform ${showImportHistory ? 'rotate-180' : ''}`} />
            </button>
            {showImportHistory && (
              <div className="border-t border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Date & time', 'Actor', 'File', 'Strategy', 'Created', 'Updated', 'Skipped', 'Errors', ''].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MOCK_IMPORT_HISTORY.map(entry => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{entry.ts}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">{entry.actor}</td>
                        <td className="px-4 py-3 text-xs text-gray-700 font-medium">
                          <span className="flex items-center gap-1.5"><FileText size={12} className="text-gray-400" />{entry.filename}</span>
                        </td>
                        <td className="px-4 py-3"><span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{entry.strategy}</span></td>
                        <td className="px-4 py-3 text-xs font-semibold text-green-600">{entry.created}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-blue-600">{entry.updated}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-400">{entry.skipped}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-red-500">{entry.errors}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => addToast(`Downloading report for ${entry.filename}`)} className="flex items-center gap-1 text-xs font-medium hover:text-purple-700 transition-colors" style={{ color: '#4A00F8' }}>
                            <Download size={11} /> Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Expert Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Expert</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('name', 'Full name', 'Dr. Jane Smith', true)}
              {field('email', 'Email address', 'jane.smith@company.com', true)}
              {field('company', 'Company', 'Acme Corp', true)}
              {field('title', 'Job title', 'VP Procurement', true)}
            </div>

            {/* Taxonomy cascade */}
            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Category assignment</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Domain</label>
                  <select
                    value={form.domain}
                    onChange={e => handleFormDomainChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none transition-colors"
                  >
                    <option value="">Select domain…</option>
                    {activeTaxDomains.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Spending Pool</label>
                  <select
                    value={form.spendingPool}
                    onChange={e => handleFormPoolChange(e.target.value)}
                    disabled={!form.domain}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none transition-colors disabled:opacity-40"
                  >
                    <option value="">Select pool…</option>
                    {formAvailablePools.map(sp => <option key={sp.id} value={sp.name}>{sp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    disabled={!form.spendingPool}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:border-purple-400 focus:outline-none transition-colors disabled:opacity-40"
                  >
                    <option value="">Select category…</option>
                    {formAvailableCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Geography</label>
                <input
                  type="text"
                  value={form.geography}
                  onChange={e => setForm(f => ({ ...f, geography: e.target.value }))}
                  placeholder="North America, Europe…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expertise areas</label>
                <input
                  type="text"
                  value={form.expertise}
                  onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))}
                  placeholder="Steel, Metals (comma-separated)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="Tier 1, EU Region (comma-separated)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreate}>Add Expert</Button>
            </div>
          </div>
        </div>
      )}

      {/* Request Change Modal */}
      {showRequestModal && (
        <RequestChangeModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={(form) => submitChangeRequest(form)}
        />
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <CSVImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportComplete}
          addToast={addToast}
          createExpert={createExpert}
        />
      )}
    </div>
  );
}
