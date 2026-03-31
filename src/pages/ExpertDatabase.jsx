import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Mail, Building2, Tag, X, Upload, FileText, Check, AlertTriangle, ChevronRight, Bell, Clock, CheckCircle2, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';

const EMPTY_FORM = { name: '', email: '', company: '', title: '', expertise: '', tags: '' };

const MOCK_PREFLIGHT = [
  { row: 2, name: 'Chen Wei', email: 'c.wei@baosteel.com', company: 'Baosteel', title: 'Procurement Lead', status: 'ok', error: null },
  { row: 3, name: 'Fatima Al-Hassan', email: 'f.alhassan@sabic.com', company: 'SABIC', title: 'Supply Chain Manager', status: 'ok', error: null },
  { row: 4, name: 'Erik Johansson', email: 'e.johansson@ssab.com', company: 'SSAB', title: 'Category Director', status: 'ok', error: null },
  { row: 5, name: 'Dr. James Wright', email: 'j.wright@steelcorp.com', company: 'SteelCorp', title: 'VP Procurement', status: 'error', error: 'Duplicate email: j.wright@steelcorp.com' },
];

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFileName(file.name);
  };

  const downloadTemplate = () => addToast('Template CSV downloaded');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
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
                {['Upload file', 'Pre-flight check', 'Confirm import'][i]}
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
                <span className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#4A00F8' }}>
                  Choose file
                </span>
              </label>
              {fileName && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <FileText size={14} className="text-green-500" />
                  <span className="text-sm text-gray-700 font-medium">{fileName}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={downloadTemplate} className="text-sm font-medium underline underline-offset-2" style={{ color: '#4A00F8' }}>
                Download template
              </button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={() => setStep(2)} disabled={!fileName}>
                  Validate file
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pre-flight check */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <AlertTriangle size={14} className="text-amber-500" />
              <p className="text-sm text-amber-700">1 row has an error and will be skipped. Review before importing.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Row', 'Name', 'Email', 'Company', 'Title', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_PREFLIGHT.map(row => {
                    const formulaFields = ['name', 'email', 'company', 'title'].filter(
                      f => row[f] && /^[=+\-@]/.test(String(row[f]))
                    );
                    return (
                    <tr key={row.row} className={row.status === 'error' ? 'bg-red-50' : 'bg-green-50/30'}>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{row.row}</td>
                      <td className="px-3 py-2.5 text-sm text-gray-800">
                        <span>{row.name}</span>
                        {/^[=+\-@]/.test(String(row.name || '')) && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                            <AlertTriangle size={10} /> Formula
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">
                        <span>{row.email}</span>
                        {/^[=+\-@]/.test(String(row.email || '')) && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                            <AlertTriangle size={10} /> Formula
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-600">
                        <span>{row.company}</span>
                        {/^[=+\-@]/.test(String(row.company || '')) && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                            <AlertTriangle size={10} /> Formula
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-gray-600">
                        <span>{row.title}</span>
                        {/^[=+\-@]/.test(String(row.title || '')) && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                            <AlertTriangle size={10} /> Formula
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.status === 'ok' ? (
                          <div className="space-y-1">
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                              <Check size={12} /> Valid
                            </span>
                            {formulaFields.length > 0 && (
                              <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                <AlertTriangle size={10} /> Possible formula injection
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                            <AlertTriangle size={12} /> {row.error}
                          </span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Continue to import</Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New records to add</span>
                <span className="text-sm font-bold text-green-600">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Records to update</span>
                <span className="text-sm font-bold text-gray-800">0</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm text-gray-600">Rows to skip (errors)</span>
                <span className="text-sm font-bold text-amber-600">1</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Skipped row: Row 5 — Duplicate email j.wright@steelcorp.com
            </p>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => {
                const validRows = MOCK_PREFLIGHT.filter(r => r.status === 'ok');
                validRows.forEach(row => {
                  createExpert({ name: row.name, email: row.email, company: row.company, title: row.title, expertise: '', tags: '' });
                });
                const newCount = validRows.length;
                const skipCount = MOCK_PREFLIGHT.filter(r => r.status !== 'ok').length;
                addToast(`Import complete: ${newCount} added, ${skipCount} skipped`);
                onClose();
              }}>
                <Upload size={14} /> Import {MOCK_PREFLIGHT.filter(r => r.status === 'ok').length} experts
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
  const { experts, currentUser, changeRequests, createExpert, addToast, submitChangeRequest, resolveChangeRequest } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const isSuperAdmin = currentUser.role === 'Super Admin';
  const isAdminOrResearcher = currentUser.role !== 'Super Admin';
  const pendingRequestCount = isSuperAdmin ? changeRequests.filter(r => r.status === 'Pending').length : 0;

  const filtered = experts.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.company.toLowerCase().includes(search.toLowerCase()) ||
      e.expertise.some(x => x.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

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

      <div className="flex items-center gap-3 mb-5">
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

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Spending Pool</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Company</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Designation</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Geography</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
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
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail size={10} className="text-gray-400 flex-shrink-0" />
                        {expert.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{expert.geography || '—'}</span>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expertise areas</label>
                <input
                  type="text"
                  value={form.expertise}
                  onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))}
                  placeholder="Steel, Metals (comma-separated)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple values with commas</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="Tier 1, EU Region (comma-separated)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple values with commas</p>
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
