import { useState } from 'react';
import { FileText, Download, Send, RefreshCcw, Check, ChevronDown, Mail } from 'lucide-react';
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

export function GenerateReportSection({ survey, addToast }) {
  const { getUserEmailTemplates, currentUser } = useApp();
  const userTpls = getUserEmailTemplates(currentUser?.id);

  const [phase, setPhase] = useState('config');
  const [preset, setPreset] = useState('expert');
  const [options, setOptions] = useState(PRESETS.expert.defaults);
  const [sent, setSent] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [reportEmailSubject, setReportEmailSubject] = useState(userTpls.reportSharing.subject);
  const [reportEmailBody, setReportEmailBody] = useState(userTpls.reportSharing.body);

  const handlePreset = (key) => {
    setPreset(key);
    setOptions(PRESETS[key].defaults);
  };

  const toggle = (key) => setOptions(o => ({ ...o, [key]: !o[key] }));

  const handleGenerate = () => {
    setPhase('generated');
    setSent(false);
    addToast('PDF report generated');
  };

  const handleSend = () => {
    setSent(true);
    const count = survey.responsesReceived;
    addToast(`Report sent to ${count} respondent${count !== 1 ? 's' : ''}`);
  };

  const surveySlug = survey.name.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '');
  const reportName = `${surveySlug}_${PRESETS[preset].label.replace(/\s+/g, '_')}.pdf`;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={15} className="text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-800">Generate Report</h3>
      </div>

      {phase === 'config' ? (
        <div className="space-y-4">
          {/* Preset selector */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => handlePreset(key)}
                className={`text-left p-3 rounded-xl border-2 transition-colors ${
                  preset === key
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <p className="text-xs font-semibold text-gray-800 mb-0.5">{p.label}</p>
                <p className="text-xs text-gray-400 leading-snug">{p.description}</p>
              </button>
            ))}
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {TOGGLES.map(({ key, label, hint }) => (
              <div key={key} className="flex items-start gap-3">
                <button
                  onClick={() => toggle(key)}
                  style={{ minWidth: '32px', height: '18px' }}
                  className={`mt-0.5 rounded-full flex-shrink-0 relative transition-colors ${
                    options[key] ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${
                      options[key] ? 'translate-x-3.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <div>
                  <p className="text-xs font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{hint}</p>
                </div>
              </div>
            ))}
          </div>

          <Button size="sm" className="w-full" onClick={handleGenerate}>
            <FileText size={13} /> Generate PDF
          </Button>
        </div>
      ) : (
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

          {/* Report sharing email editor */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setEmailExpanded(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <Mail size={12} className="text-purple-500" />
                Customise report sharing email
              </span>
              <ChevronDown size={12} className={`text-gray-400 transition-transform ${emailExpanded ? 'rotate-180' : ''}`} />
            </button>
            {emailExpanded && (
              <div className="p-3 space-y-2 bg-white">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={reportEmailSubject}
                    onChange={e => setReportEmailSubject(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Body</label>
                  <textarea
                    value={reportEmailBody}
                    onChange={e => setReportEmailBody(e.target.value)}
                    rows={5}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-300 resize-none font-mono"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {REPORT_MERGE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setReportEmailBody(b => b + tag)}
                      className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded px-1.5 py-0.5 hover:bg-purple-100 transition-colors font-mono"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => addToast('Report downloaded')}>
              <Download size={13} /> Download
            </Button>
            {!sent ? (
              <Button size="sm" className="flex-1" onClick={handleSend}>
                <Send size={13} /> Send to {survey.responsesReceived} experts
              </Button>
            ) : (
              <span className="flex-1 flex items-center justify-center gap-1 text-xs text-green-600 font-medium">
                <Check size={13} /> Sent
              </span>
            )}
          </div>

          <button
            onClick={() => { setPhase('config'); setSent(false); }}
            className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1 transition-colors"
          >
            <RefreshCcw size={11} /> Regenerate with different options
          </button>
        </div>
      )}
    </Card>
  );
}

export default GenerateReportSection;
