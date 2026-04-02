import { useState, useRef } from 'react';
import { FileText, Download, Send, RefreshCcw, Check, ChevronDown, Mail, Paperclip, X, Globe, AlertTriangle, Info } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import { useApp } from '../context/AppContext';

const PRESETS = {
  expert: {
    label: 'Expert Report',
    description: 'Anonymized · aggregated · sent to respondents',
    defaults: { anonymize: true, includeExcluded: false, showOpenText: true },
  },
  research: {
    label: 'Research Report',
    description: 'Full detail · attributed · for internal use',
    defaults: { anonymize: false, includeExcluded: true, showOpenText: true },
  },
};

const TOGGLES = [
  { key: 'anonymize', label: 'Anonymize responses', hint: 'Hides expert name and company in open-text quotes' },
  { key: 'includeExcluded', label: 'Include soft-excluded responses', hint: 'Overrides your current exclusions' },
  { key: 'showOpenText', label: 'Show open-text responses', hint: 'Include verbatim answers in the report' },
];

const REPORT_MERGE_TAGS = ['{{expert_name}}', '{{report_title}}', '{{download_link}}', '{{expiry_date}}'];

// phase: 'idle' → 'config' → 'generated' → 'send_email' → 'done'
// resultHubState: null | 'updated' | 'sent'

export function GenerateReportSection({ survey, addToast }) {
  const { getUserEmailTemplates, currentUser } = useApp();
  const userTpls = getUserEmailTemplates(currentUser?.id);

  const [phase, setPhase] = useState('idle');
  const [preset, setPreset] = useState('expert');
  const [options, setOptions] = useState(PRESETS.expert.defaults);
  const [resultHubState, setResultHubState] = useState(null); // null | 'updated' | 'sent'
  const [lastActionAt, setLastActionAt] = useState(null);
  const [lastSentCount, setLastSentCount] = useState(null);
  const [emailSubject, setEmailSubject] = useState(userTpls.reportSharing.subject);
  const [emailBody, setEmailBody] = useState(userTpls.reportSharing.body);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const attachmentsRef = useRef(null);

  const handleAttachFiles = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files.map(f => ({ name: f.name, size: f.size }))]);
    e.target.value = '';
  };
  const removeAttachment = (idx) => setAttachments(prev => prev.filter((_, i) => i !== idx));
  const formatSize = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

  const handlePreset = (key) => { setPreset(key); setOptions(PRESETS[key].defaults); };
  const toggle = (key) => setOptions(o => ({ ...o, [key]: !o[key] }));

  const surveySlug = survey.name.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '');
  const reportName = `${surveySlug}_${PRESETS[preset].label.replace(/\s+/g, '_')}.pdf`;
  const now = () => new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleGenerate = () => { setPhase('generated'); };

  const handleDownload = () => { addToast('Report downloaded'); };

  const handleUpdateHub = () => {
    setResultHubState('updated');
    setLastActionAt(now());
    addToast('Result Hub updated with new PDF');
    setPhase('idle');
  };

  const handleSendToExperts = () => {
    const count = survey.responsesReceived;
    setResultHubState('sent');
    setLastActionAt(now());
    setLastSentCount(count);
    addToast(`Report sent to ${count} expert${count !== 1 ? 's' : ''}. Result Hub updated.`);
    setPhase('idle');
    setEmailExpanded(false);
  };

  const hubStatusLabel = resultHubState === null
    ? 'Active — auto-generated (Expert Report preset)'
    : `Active — edited by Beroe research team (last updated ${lastActionAt})`;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={15} className="text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-800">Report Management</h3>
      </div>

      {/* Persistent action log */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 space-y-2">
        <div className="flex items-start gap-2">
          <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600 leading-relaxed">
            <span className="font-semibold text-gray-700">Auto-report:</span> Generated on survey close · Expert Report preset
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Globe size={13} className={`flex-shrink-0 mt-0.5 ${resultHubState ? 'text-purple-500' : 'text-gray-400'}`} />
          <div className="text-xs text-gray-600 leading-relaxed">
            <span className="font-semibold text-gray-700">Result Hub:</span> {hubStatusLabel}
          </div>
        </div>
        {lastSentCount !== null && (
          <div className="flex items-start gap-2">
            <Send size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-700">Last override send:</span> Sent to {lastSentCount} experts on {lastActionAt}
            </div>
          </div>
        )}
        {lastSentCount === null && (
          <div className="flex items-start gap-2">
            <Send size={13} className="text-gray-300 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-400">No override send yet — auto-report email sent on survey close</div>
          </div>
        )}
      </div>

      {/* Auto-report notice */}
      {resultHubState === null && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-4">
          <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            An auto-generated report is already live on the Expert Results Hub. <strong>Only generate a revised version if it adds genuine value</strong> beyond what experts can already see.
          </p>
        </div>
      )}

      {/* Phase: idle — show primary CTA */}
      {phase === 'idle' && (
        <Button size="sm" className="w-full" onClick={() => setPhase('config')}>
          <RefreshCcw size={13} /> Generate New PDF
        </Button>
      )}

      {/* Phase: config — configure options */}
      {phase === 'config' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => handlePreset(key)}
                className={`text-left p-3 rounded-xl border-2 transition-colors ${
                  preset === key ? 'border-purple-400 bg-purple-50' : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <p className="text-xs font-semibold text-gray-800 mb-0.5">{p.label}</p>
                <p className="text-xs text-gray-400 leading-snug">{p.description}</p>
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {TOGGLES.map(({ key, label, hint }) => (
              <div key={key} className="flex items-start gap-3">
                <button
                  onClick={() => toggle(key)}
                  style={{ minWidth: '32px', height: '18px' }}
                  className={`mt-0.5 rounded-full flex-shrink-0 relative transition-colors ${options[key] ? 'bg-purple-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${options[key] ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </button>
                <div>
                  <p className="text-xs font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{hint}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPhase('idle')}>Cancel</Button>
            <Button size="sm" className="flex-1" onClick={handleGenerate}>
              <FileText size={13} /> Generate PDF
            </Button>
          </div>
        </div>
      )}

      {/* Phase: generated — 3 CTAs */}
      {phase === 'generated' && (
        <div className="space-y-3">
          {/* Generated file card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
            <div className="w-9 h-9 rounded-lg bg-white border border-green-200 flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{reportName}</p>
              <p className="text-xs text-gray-400">
                {PRESETS[preset].label}
                {options.anonymize ? ' · Anonymized' : ' · Attributed'}
                {options.includeExcluded ? ' · All responses' : ''}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 font-medium">Choose what to do with this PDF:</p>

          <div className="space-y-2">
            {/* Download */}
            <Button variant="secondary" size="sm" className="w-full justify-start gap-2" onClick={handleDownload}>
              <Download size={13} /> Download (internal only)
            </Button>

            {/* Update Result Hub */}
            <button
              onClick={handleUpdateHub}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors"
            >
              <Globe size={13} /> Update Result Hub with this PDF
              <span className="ml-auto text-purple-400 font-normal">experts see revised results</span>
            </button>

            {/* Send to experts */}
            <button
              onClick={() => setPhase('send_email')}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-white text-xs font-semibold transition-opacity hover:opacity-90 shadow-sm"
              style={{ backgroundColor: '#4A00F8', borderColor: '#4A00F8' }}
            >
              <Send size={13} /> Send to {survey.responsesReceived} experts
              <span className="ml-auto text-purple-200 font-normal">+ updates Result Hub</span>
            </button>
          </div>

          <button
            onClick={() => setPhase('config')}
            className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1 transition-colors"
          >
            <RefreshCcw size={11} /> Regenerate with different options
          </button>
        </div>
      )}

      {/* Phase: send_email — email customisation + warning */}
      {phase === 'send_email' && (
        <div className="space-y-3">
          {/* Generated file reminder */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-100">
            <FileText size={13} className="text-green-600 flex-shrink-0" />
            <p className="text-xs text-gray-700 truncate font-medium">{reportName}</p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Sending this email will also <strong>update the Result Hub</strong> with this PDF. Aggregated results visible to experts will reflect your settings above.
            </p>
          </div>

          {/* Email editor */}
          <div className={`rounded-xl border-2 overflow-hidden transition-colors ${emailExpanded ? 'border-purple-300' : 'border-purple-200'}`}>
            <button
              onClick={() => setEmailExpanded(v => !v)}
              className={`w-full flex items-center justify-between px-3 py-2.5 transition-colors ${emailExpanded ? 'bg-purple-100' : 'bg-purple-50 hover:bg-purple-100'}`}
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-purple-700">
                <Mail size={13} className="text-purple-500" />
                Customise report email
              </span>
              <ChevronDown size={13} className={`text-purple-400 transition-transform ${emailExpanded ? 'rotate-180' : ''}`} />
            </button>
            {emailExpanded && (
              <div className="p-3 space-y-2.5 bg-white">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-600">Body</label>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {REPORT_MERGE_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setEmailBody(b => b + tag)}
                          className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded px-1.5 py-0.5 hover:bg-purple-100 transition-colors font-mono"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    rows={5}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 resize-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1"><Paperclip size={11} /> Additional attachments</label>
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {attachments.map((f, i) => (
                        <span key={i} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded-lg max-w-full">
                          <Paperclip size={10} className="flex-shrink-0 text-gray-400" />
                          <span className="truncate max-w-[120px]">{f.name}</span>
                          <span className="text-gray-400 flex-shrink-0">· {formatSize(f.size)}</span>
                          <button onClick={() => removeAttachment(i)} className="ml-0.5 text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors"><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input ref={attachmentsRef} type="file" multiple className="hidden" onChange={handleAttachFiles} />
                  <button
                    onClick={() => attachmentsRef.current?.click()}
                    className="text-xs text-purple-600 border border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Paperclip size={11} /> Attach files
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPhase('generated')}>← Back</Button>
            <Button size="sm" className="flex-1" onClick={handleSendToExperts}>
              <Send size={13} /> Send to {survey.responsesReceived} experts
            </Button>
          </div>
        </div>
      )}

      {/* After any action: persistent CTAs always available */}
      {phase === 'idle' && resultHubState !== null && (
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={handleDownload}>
            <Download size={13} /> Download
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => setPhase('config')}>
            <RefreshCcw size={13} /> Regenerate
          </Button>
          <Button size="sm" className="flex-1" onClick={() => setPhase('config')}>
            <Send size={13} /> Send again
          </Button>
        </div>
      )}
    </Card>
  );
}

export default GenerateReportSection;
