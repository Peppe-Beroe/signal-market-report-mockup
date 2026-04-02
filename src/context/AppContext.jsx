import { createContext, useContext, useState } from 'react';
import { USERS, PROJECTS, SURVEYS, EXPERTS, AUDIT_EVENTS, INTERNAL_USERS, PROPOSALS, NOTIFICATIONS, TEMPLATES } from '../data/mockData';

const DEFAULT_CATEGORIES = [
  { id: 'cat1', name: 'Metals & Mining', active: true },
  { id: 'cat2', name: 'Chemicals', active: true },
  { id: 'cat3', name: 'Packaging', active: true },
  { id: 'cat4', name: 'Energy', active: true },
  { id: 'cat5', name: 'Agriculture', active: false },
];

const DEFAULT_TAXONOMY = [
  {
    id: 'dom1', name: 'Industry', active: true,
    spendingPools: [
      {
        id: 'sp1', name: 'Metals & Mining', active: true,
        categories: [
          { id: 'tc1', name: 'Steel', active: true },
          { id: 'tc2', name: 'Flat Steel', active: true },
          { id: 'tc3', name: 'Aluminium', active: true },
        ],
      },
      {
        id: 'sp2', name: 'Energy', active: true,
        categories: [
          { id: 'tc4', name: 'Oil & Gas', active: true },
          { id: 'tc5', name: 'Renewables', active: true },
        ],
      },
    ],
  },
  {
    id: 'dom2', name: 'Process', active: true,
    spendingPools: [
      {
        id: 'sp3', name: 'Chemicals', active: true,
        categories: [
          { id: 'tc6', name: 'Polypropylene', active: true },
          { id: 'tc7', name: 'Feedstocks', active: true },
        ],
      },
    ],
  },
  {
    id: 'dom3', name: 'Indirect', active: true,
    spendingPools: [
      {
        id: 'sp4', name: 'Packaging', active: true,
        categories: [
          { id: 'tc8', name: 'Flexible Packaging', active: true },
          { id: 'tc9', name: 'Rigid Packaging', active: true },
        ],
      },
    ],
  },
];

// Default question type availability per typology (P1-F-83)
const DEFAULT_TYPOLOGY_CONFIG = {
  market_signal_report: {
    single_choice: true, multi_choice: true, rating_scale: true, open_text: true,
    short_text: true, long_text: true, ranking: true, date_picker: true, number: true,
    file_attachment: false,
  },
  other_survey: {
    single_choice: true, multi_choice: true, rating_scale: true, open_text: true,
    short_text: true, long_text: true, ranking: true, date_picker: true, number: true,
    file_attachment: true,
  },
};

// Per-user external email templates (P1-F-96) — personal defaults for expert outreach emails.
// Each user owns their own copy; changes do not cascade to other users.
export const DEFAULT_EXTERNAL_TEMPLATES = {
  invitation: {
    subject: "You're invited: {{survey_name}}",
    body: `Dear {{expert_name}},\n\nWe are conducting a research survey as part of the Beroe Signal intelligence programme and would value your expert perspective.\n\nSurvey: {{survey_name}}\nClose date: {{close_date}}\n\nPlease click the link below to participate (estimated time: 5–8 minutes):\n{{survey_link}}\n\nYour responses are completely confidential and will only be used in aggregate for research purposes.\n\nThank you for your continued support.\n\nBest regards,\nBeroe Research Team`,
  },
  reminder: {
    subject: 'Reminder: {{survey_name}} closes on {{close_date}}',
    body: `Dear {{expert_name}},\n\nThis is a friendly reminder that the survey below is still open for your response.\n\nSurvey: {{survey_name}}\nClose date: {{close_date}}\n\nParticipate here:\n{{survey_link}}\n\nThank you for your continued support.\n\nBest regards,\nBeroe Research Team`,
  },
  // P1-F-100 — post-submission thank-you email
  postSubmission: {
    subject: 'Thank you for participating in {{survey_name}}',
    body: `Dear {{expert_name}},\n\nThank you for completing the {{survey_name}} survey. Your response has been recorded.\n\nYou can view the live aggregated results from other experts at any time using the link below:\n{{results_hub_link}}\n\nWe will also send you an email notification when the survey closes on {{survey_close_date}} and the final report is available for download.\n\nBest regards,\nBeroe Research Team`,
  },
  // P1-F-101 — survey-closed report-ready email
  surveyClosed: {
    subject: '{{survey_name}} has closed — your report is ready',
    body: `Dear {{expert_name}},\n\nThe {{survey_name}} survey has now closed. As a thank-you for your participation, the final Signal Market Report is now available for download.\n\nView results and download your report here:\n{{results_hub_link}}\n\nThis link expires on: {{expiry_date}}\n\nBest regards,\nBeroe Research Team`,
  },
  reportSharing: {
    subject: 'Your expert report is ready: {{report_title}}',
    body: `Dear {{expert_name}},\n\nThank you for participating in our research. Your exclusive copy of the report is now available.\n\nReport: {{report_title}}\n\nDownload your copy here:\n{{download_link}}\n\nThis link expires on: {{expiry_date}}\n\nBest regards,\nBeroe Research Team`,
  },
};

// Org-wide internal notification templates (P1-F-95) — Super Admin controlled.
// Changes made by SA apply to the notification emails received by all internal users.
export const DEFAULT_INTERNAL_NOTIF_TEMPLATES = {
  survey_approved: {
    emailSubject: 'Your survey "{{survey_name}}" has been approved',
    emailBody: `Hi {{user_name}},\n\nYour survey "{{survey_name}}" in project "{{project_name}}" has been approved by {{actor_name}}.\n\nYou can now launch the wave from your project dashboard.\n\nBeroe Signal Platform`,
    inPlatformText: 'Survey "{{survey_name}}" approved by {{actor_name}}.',
  },
  survey_rejected: {
    emailSubject: 'Your survey "{{survey_name}}" has been rejected',
    emailBody: `Hi {{user_name}},\n\nYour survey "{{survey_name}}" in project "{{project_name}}" was rejected by {{actor_name}}.\n\nReason: {{reason}}\n\nPlease update the survey and resubmit.\n\nBeroe Signal Platform`,
    inPlatformText: 'Survey "{{survey_name}}" rejected. Reason: {{reason}}',
  },
  response_rate_alert: {
    emailSubject: 'Response rate alert: "{{survey_name}}" below threshold',
    emailBody: `Hi {{user_name}},\n\nThe response rate for "{{survey_name}}" has fallen below your configured threshold.\n\nCurrent rate: {{response_rate}}%  |  Threshold: {{threshold}}%\n\nBeroe Signal Platform`,
    inPlatformText: '"{{survey_name}}" response rate ({{response_rate}}%) is below threshold.',
  },
  proposal_approved: {
    emailSubject: 'Your membership proposal was approved',
    emailBody: `Hi {{user_name}},\n\nYour proposal to add {{target_user}} to "{{project_name}}" as {{proposed_role}} has been approved by {{actor_name}}.\n\nBeroe Signal Platform`,
    inPlatformText: 'Membership proposal for {{target_user}} in "{{project_name}}" approved.',
  },
  proposal_rejected: {
    emailSubject: 'Your membership proposal was rejected',
    emailBody: `Hi {{user_name}},\n\nYour proposal to add {{target_user}} to "{{project_name}}" as {{proposed_role}} was rejected. Reason: {{reason}}\n\nBeroe Signal Platform`,
    inPlatformText: 'Membership proposal for {{target_user}} rejected. Reason: {{reason}}',
  },
  proposal_auto_cancelled: {
    emailSubject: 'Your membership proposal was auto-cancelled',
    emailBody: `Hi {{user_name}},\n\nYour membership proposal for {{target_user}} in "{{project_name}}" was automatically cancelled because the target user has been deactivated.\n\nBeroe Signal Platform`,
    inPlatformText: 'Membership proposal for {{target_user}} auto-cancelled (user deactivated).',
  },
  new_proposal_received: {
    emailSubject: 'New membership proposal for "{{project_name}}"',
    emailBody: `Hi {{user_name}},\n\n{{actor_name}} has proposed adding {{target_user}} to "{{project_name}}" as {{proposed_role}}.\n\nReview this request in your project settings.\n\nBeroe Signal Platform`,
    inPlatformText: '{{actor_name}} proposed adding {{target_user}} to "{{project_name}}" as {{proposed_role}}.',
  },
  invite_approved: {
    emailSubject: 'Your platform invite request was approved',
    emailBody: `Hi {{user_name}},\n\nYour request to invite {{target_user}} as {{proposed_role}} has been approved. The invitation has been sent.\n\nBeroe Signal Platform`,
    inPlatformText: 'Invite request for {{target_user}} approved.',
  },
  invite_rejected: {
    emailSubject: 'Your platform invite request was rejected',
    emailBody: `Hi {{user_name}},\n\nYour request to invite {{target_user}} as {{proposed_role}} was rejected. Reason: {{reason}}\n\nBeroe Signal Platform`,
    inPlatformText: 'Invite request for {{target_user}} rejected. Reason: {{reason}}',
  },
  expert_change_resolved: {
    emailSubject: 'Your expert change request has been resolved',
    emailBody: `Hi {{user_name}},\n\nYour change request for expert "{{expert_name}}" has been {{decision}} by {{actor_name}}.\n\nBeroe Signal Platform`,
    inPlatformText: 'Expert change request for "{{expert_name}}" was {{decision}}.',
  },
  wave_closed: {
    emailSubject: '"{{survey_name}}" has closed',
    emailBody: `Hi {{user_name}},\n\nThe survey "{{survey_name}}" in project "{{project_name}}" has closed.\n\nFinal response rate: {{response_rate}}%\n\nResults are now available for review.\n\nBeroe Signal Platform`,
    inPlatformText: '"{{survey_name}}" closed. Final response rate: {{response_rate}}%.',
  },
  org_wide_proposal_result: {
    emailSubject: 'Your Org-Wide template proposal was {{decision}}',
    emailBody: `Hi {{user_name}},\n\nYour proposal to promote template "{{template_name}}" to Org-Wide was {{decision}} by {{actor_name}}.\n\nBeroe Signal Platform`,
    inPlatformText: 'Org-Wide proposal for "{{template_name}}" was {{decision}} by {{actor_name}}.',
  },
  // P1-F-61 13th event — auto-report live (non-suppressible, fires to Project Editors/Owner on survey Close)
  auto_report_live: {
    emailSubject: 'Auto-report is live on the Expert Results Hub — {{survey_name}}',
    emailBody: `Hi {{user_name}},\n\nAn auto-generated report for "{{survey_name}}" is now live on the Expert Results Hub. Experts who responded have already been notified.\n\nOnly send a revised version from the Review panel if it adds genuine value beyond what experts can already see.\n\nBeroe Signal Platform`,
    inPlatformText: 'Auto-report for "{{survey_name}}" is live on the Expert Results Hub. Experts have been notified.',
  },
};

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(USERS.admin);
  const [surveys, setSurveys] = useState(SURVEYS);
  const [projects, setProjects] = useState(PROJECTS);
  const [experts, setExperts] = useState(EXPERTS);
  const [auditEvents, setAuditEvents] = useState(AUDIT_EVENTS);
  const [toasts, setToasts] = useState([]);
  const [templates, setTemplates] = useState(TEMPLATES);
  const [changeRequests, setChangeRequests] = useState([]);
  const [internalUsers, setInternalUsers] = useState(INTERNAL_USERS);
  const [orgTimezone, setOrgTimezone] = useState('IST');
  const [proposals, setProposals] = useState(PROPOSALS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [taxonomy, setTaxonomy] = useState(DEFAULT_TAXONOMY);
  const [typologyConfig, setTypologyConfig] = useState(DEFAULT_TYPOLOGY_CONFIG);
  const [orgWideProposals, setOrgWideProposals] = useState([]);
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    const events = [
      'survey_approved', 'survey_rejected', 'proposal_approved', 'proposal_rejected',
      'proposal_auto_cancelled', 'new_proposal_received', 'invite_approved', 'invite_rejected',
      'response_rate_alert', 'expert_change_resolved', 'wave_closed',
    ];
    return Object.fromEntries(events.map(e => [e, { email: true, inPlatform: true }]));
  });
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  // Per-user external email templates (P1-F-96). Keyed by userId; seeded from DEFAULT_EXTERNAL_TEMPLATES on first access.
  const [userEmailTemplatesState, setUserEmailTemplatesState] = useState({});
  const getUserEmailTemplates = (userId) => ({
    invitation:     { ...DEFAULT_EXTERNAL_TEMPLATES.invitation,     ...(userEmailTemplatesState[userId]?.invitation     || {}) },
    reminder:       { ...DEFAULT_EXTERNAL_TEMPLATES.reminder,       ...(userEmailTemplatesState[userId]?.reminder       || {}) },
    postSubmission: { ...DEFAULT_EXTERNAL_TEMPLATES.postSubmission, ...(userEmailTemplatesState[userId]?.postSubmission || {}) },
    surveyClosed:   { ...DEFAULT_EXTERNAL_TEMPLATES.surveyClosed,   ...(userEmailTemplatesState[userId]?.surveyClosed   || {}) },
    reportSharing:  { ...DEFAULT_EXTERNAL_TEMPLATES.reportSharing,  ...(userEmailTemplatesState[userId]?.reportSharing  || {}) },
  });
  const setUserEmailTemplate = (userId, type, tpl) => {
    setUserEmailTemplatesState(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [type]: tpl },
    }));
  };

  // Org-wide internal notification templates (P1-F-95). Super Admin controlled.
  const [internalNotifTemplates, setInternalNotifTemplates] = useState(DEFAULT_INTERNAL_NOTIF_TEMPLATES);

  const markNotificationRead = (id) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllNotificationsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const switchRole = (roleKey) => setCurrentUser(USERS[roleKey]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const addAuditEvent = (action, target, targetType = 'survey', details = '') => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setAuditEvents(prev => [{
      id: `a${Date.now()}`,
      user: currentUser.name,
      action,
      target,
      targetType,
      timestamp,
      details,
    }, ...prev]);
  };

  const createProject = (data) => {
    const today = new Date().toISOString().split('T')[0];
    // Per P1-F-68: when a Standard User creates a project they must assign an Admin as owner.
    // data.ownerName is provided by the creation modal in that case; falls back to currentUser.name for Admin/SA.
    const newProject = {
      id: `p${Date.now()}`,
      name: data.name,
      owner: data.ownerName || currentUser.name,
      status: 'Active',
      created: today,
      surveysCount: 0,
      lastActivity: today,
    };
    setProjects(prev => [...prev, newProject]);
    addAuditEvent('Project created', data.name, 'project', 'New project created');
    addToast(`Project "${data.name}" created`);
    return newProject;
  };

  const createExpert = (data) => {
    const newExpert = {
      id: `e${Date.now()}`,
      name: data.name,
      email: data.email,
      company: data.company,
      title: data.title,
      domain: data.domain || '',
      spendingPool: data.spendingPool || '',
      category: data.category || '',
      geography: data.geography || '',
      tags: data.tags ? data.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      status: 'Active',
      waves: 0,
    };
    setExperts(prev => [...prev, newExpert]);
    addAuditEvent('Expert added', data.name, 'expert', `New expert record created — ${data.company}, ${data.title}`);
    addToast(`Expert "${data.name}" added`);
    return newExpert;
  };

  const updateExpert = (expertId, data) => {
    setExperts(prev => prev.map(e => e.id === expertId ? { ...e, ...data } : e));
    addAuditEvent('Expert record updated', data.name || expertId, 'expert', 'Expert profile updated');
    addToast('Expert updated successfully');
  };

  const deactivateExpert = (expertId) => {
    setExperts(prev => prev.map(e => e.id === expertId ? { ...e, status: 'Deactivated' } : e));
    const expert = experts.find(e => e.id === expertId);
    addAuditEvent('Expert deactivated', expert?.name || expertId, 'expert', 'Expert status set to Deactivated');
    addToast('Expert deactivated', 'warning');
  };

  const createSurvey = ({ projectId, name, categories = [], typology = 'market_signal_report', questions, status = 'Draft', waveConfig = null }) => {
    const wave = surveys.filter(s => s.projectId === projectId).length + 1;
    const newSurvey = {
      id: `s${Date.now()}`,
      projectId,
      name,
      categories,
      category: categories[0] || '',
      typology,
      status,
      wave,
      createdBy: currentUser.name,
      approvedBy: null,
      sendDate: null,
      closeDate: null,
      expertsTargeted: experts.length,
      responsesReceived: 0,
      responseRate: 0,
      questions,
      responses: [],
      reminders: [],
      emailStatus: [],
      ...(waveConfig ? { waveConfig } : {}),
    };
    setSurveys(prev => [...prev, newSurvey]);
    addAuditEvent('Survey created', name, 'survey', `Draft survey created with ${questions.length} questions`);
    addToast(status === 'Draft' ? 'Draft saved' : 'Survey submitted for approval');
    return newSurvey;
  };

  const updateSurvey = ({ surveyId, name, categories, questions, status, waveConfig }) => {
    setSurveys(prev => prev.map(s => {
      if (s.id !== surveyId) return s;
      // If re-submitting after rejection, store the current questions as previousSnapshot
      const isResubmit = status === 'Submitted' && s.rejectionReason;
      return {
        ...s,
        name,
        ...(categories !== undefined ? { categories, category: categories?.[0] || '' } : {}),
        questions,
        ...(waveConfig !== undefined ? { waveConfig } : {}),
        ...(status ? { status } : {}),
        ...(isResubmit ? {
          previousSnapshot: { submittedAt: s.previousSnapshot?.submittedAt || null, questions: s.questions },
          rejectionReason: s.rejectionReason, // keep for diff display
        } : {}),
      };
    }));
    if (status === 'Submitted') {
      addAuditEvent('Survey submitted for approval', name, 'survey', 'Survey moved to Submitted status');
    }
    addToast(status === 'Submitted' ? 'Survey submitted for approval' : 'Draft saved');
  };

  const deleteSurvey = (surveyId) => {
    const survey = surveys.find(s => s.id === surveyId);
    setSurveys(prev => prev.filter(s => s.id !== surveyId));
    addAuditEvent('Survey deleted', survey?.name || surveyId, 'survey', 'Survey permanently deleted');
    addToast('Survey deleted', 'warning');
  };

  const approveSurvey = (surveyId) => {
    const survey = surveys.find(s => s.id === surveyId);
    setSurveys(prev => prev.map(s =>
      s.id === surveyId ? { ...s, status: 'Approved', approvedBy: currentUser.name } : s
    ));
    addAuditEvent('Survey approved', survey?.name || surveyId, 'survey', `Approved by ${currentUser.name}`);
    addToast('Survey approved successfully');
  };

  const rejectSurvey = (surveyId, reason) => {
    const survey = surveys.find(s => s.id === surveyId);
    setSurveys(prev => prev.map(s =>
      s.id === surveyId ? { ...s, status: 'Draft', rejectionReason: reason } : s
    ));
    addAuditEvent('Survey rejected', survey?.name || surveyId, 'survey', `Returned to Draft: ${reason}`);
    addToast('Survey returned to Draft with feedback — all settings preserved', 'warning');
  };

  const saveWaveSetup = (surveyId, config) => {
    const survey = surveys.find(s => s.id === surveyId);
    setSurveys(prev => prev.map(s =>
      s.id === surveyId ? { ...s, waveConfig: config } : s
    ));
    addAuditEvent('Schedule configured', survey?.name || surveyId, 'survey',
      `Send: ${config.sendDate ? config.sendDate.split('T')[0] : '—'} · Close: ${config.closeDate ? config.closeDate.split('T')[0] : '—'} · Experts: ${config.selectedExperts?.length || 0}`);
    addToast('Schedule saved — survey ready for approval');
  };

  const launchSurvey = (surveyId) => {
    const survey = surveys.find(s => s.id === surveyId);
    setSurveys(prev => prev.map(s =>
      s.id === surveyId ? { ...s, status: 'Running', sendDate: '2026-03-15', closeDate: '2026-03-29' } : s
    ));
    addAuditEvent('Survey launched', survey?.name || surveyId, 'survey', 'Invitations sent to experts');
    addToast('Survey launched — invitations sent to experts');
  };

  const launchSurveyWithConfig = (surveyId, config) => {
    const survey = surveys.find(s => s.id === surveyId);
    setSurveys(prev => prev.map(s =>
      s.id === surveyId
        ? {
            ...s,
            status: 'Running',
            sendDate: config.sendDate ? config.sendDate.split('T')[0] : '2026-03-16',
            closeDate: config.closeDate ? config.closeDate.split('T')[0] : '2026-03-30',
            waveConfig: config,
            emailStatus: config.selectedExperts
              ? config.selectedExperts.map(e => ({ expertId: e.id, expertName: e.name, status: 'delivered', lastEvent: config.sendDate ? config.sendDate.split('T')[0] : '2026-03-16' }))
              : s.emailStatus,
          }
        : s
    ));
    addAuditEvent('Survey launched', survey?.name || surveyId, 'survey', `Invitations scheduled for ${config.selectedExperts?.length || 0} experts`);
    addToast('Survey launched — invitations sent to experts');
  };

  const cloneSurvey = (surveyId) => {
    const original = surveys.find(s => s.id === surveyId);
    if (!original) return null;
    const newSurvey = {
      ...original,
      id: `s${Date.now()}`,
      name: `${original.name} — copy`,
      status: 'Draft',
      approvedBy: null,
      sendDate: null,
      closeDate: null,
      responsesReceived: 0,
      responseRate: 0,
      responses: [],
      reminders: [],
      emailStatus: [],
      createdBy: currentUser.name,
      questions: original.questions.map(q => ({ ...q, id: `q${Date.now()}_${Math.random().toString(36).slice(2,6)}` })),
    };
    setSurveys(prev => [...prev, newSurvey]);
    addAuditEvent('Survey cloned', newSurvey.name, 'survey', `Cloned from "${original.name}"`);
    addToast(`Survey cloned as "${newSurvey.name}"`);
    return newSurvey;
  };

  const saveTemplate = (name, questions, visibility = 'private', projectId = null, categories = []) => {
    const template = {
      id: `tpl${Date.now()}`,
      name,
      questions,
      visibility, // 'private' | 'project'
      projectId: visibility === 'project' ? projectId : null,
      ownerId: currentUser.id,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
      categories,
      versionCount: 1,
    };
    setTemplates(prev => [...prev, template]);
    addToast(`Template "${name}" saved`);
    return template;
  };

  const deleteTemplate = (templateId) => {
    const tpl = templates.find(t => t.id === templateId);
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    addToast(`Template "${tpl?.name || ''}" deleted`, 'warning');
  };

  const renameTemplate = (templateId, newName) => {
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, name: newName } : t));
    addToast(`Template renamed to "${newName}"`);
  };

  const updateTemplateQuestions = (templateId, updatedQuestions) => {
    const tpl = templates.find(t => t.id === templateId);
    setTemplates(prev => prev.map(t => t.id === templateId
      ? { ...t, questions: updatedQuestions, versionCount: (t.versionCount || 1) + 1 }
      : t
    ));
    addAuditEvent('Template questions updated', tpl?.name || templateId, 'template', `Questions edited by ${currentUser.name}`);
    addToast('Template questions updated');
  };

  // Super Admin only — revert any template back to private
  const revertTemplateToPrivate = (templateId) => {
    const tpl = templates.find(t => t.id === templateId);
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, visibility: 'private', projectId: null } : t));
    // Remove any pending org-wide proposal for this template
    setOrgWideProposals(prev => prev.filter(p => p.templateId !== templateId));
    addAuditEvent('Template reverted to private', tpl?.name || templateId, 'template', `Visibility reverted to private by Super Admin`);
    addToast(`"${tpl?.name}" reverted to private`);
  };

  // Any editor — propose a template for Org-Wide visibility (SA must approve)
  const proposeOrgWide = (templateId) => {
    const tpl = templates.find(t => t.id === templateId);
    const alreadyPending = orgWideProposals.some(p => p.templateId === templateId);
    if (alreadyPending) { addToast('Proposal already pending', 'warning'); return; }
    const proposal = {
      id: `owp${Date.now()}`,
      templateId,
      templateName: tpl?.name || templateId,
      proposedBy: currentUser.name,
      proposedAt: new Date().toISOString().split('T')[0],
    };
    setOrgWideProposals(prev => [...prev, proposal]);
    addAuditEvent('Org-Wide proposal submitted', tpl?.name || templateId, 'template', `Proposed by ${currentUser.name}`);
    addToast(`Org-Wide proposal submitted for "${tpl?.name}" — pending Super Admin approval`);
  };

  // Super Admin — approve an org-wide proposal
  const approveOrgWide = (proposalId) => {
    const proposal = orgWideProposals.find(p => p.id === proposalId);
    if (!proposal) return;
    setTemplates(prev => prev.map(t => t.id === proposal.templateId
      ? { ...t, visibility: 'org_wide', projectId: null }
      : t
    ));
    setOrgWideProposals(prev => prev.filter(p => p.id !== proposalId));
    addAuditEvent('Org-Wide promotion approved', proposal.templateName, 'template', `Approved by ${currentUser.name}`);
    addToast(`Template "${proposal.templateName}" promoted to Org-Wide`);
  };

  // Super Admin — reject an org-wide proposal
  const rejectOrgWide = (proposalId) => {
    const proposal = orgWideProposals.find(p => p.id === proposalId);
    if (!proposal) return;
    setOrgWideProposals(prev => prev.filter(p => p.id !== proposalId));
    addAuditEvent('Org-Wide promotion rejected', proposal.templateName, 'template', `Rejected by ${currentUser.name}`);
    addToast(`Org-Wide proposal for "${proposal.templateName}" rejected`);
  };

  const revertTemplateVersion = (templateId, targetVersion) => {
    setTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      const newVersion = (t.versionCount || 1) + 1;
      const newEntry = {
        v: newVersion,
        date: new Date().toISOString().split('T')[0],
        changedBy: currentUser.name,
        summary: `Reverted to v${targetVersion}`,
      };
      return {
        ...t,
        versionCount: newVersion,
        versionHistory: [...(t.versionHistory || []), newEntry],
      };
    }));
    addToast(`Template reverted to v${targetVersion} — saved as new version`, 'success');
  };

  // Super Admin — update a question type's availability for a typology
  const updateTypologyConfig = (typology, questionType, enabled) => {
    setTypologyConfig(prev => ({
      ...prev,
      [typology]: { ...prev[typology], [questionType]: enabled },
    }));
    addAuditEvent('Typology config updated', typology, 'settings', `${questionType} ${enabled ? 'enabled' : 'disabled'} for ${typology}`);
    addToast('Question type configuration saved');
  };

  const toggleExclusion = (surveyId, expertId) => {
    setSurveys(prev => prev.map(s => {
      if (s.id !== surveyId) return s;
      return {
        ...s,
        responses: s.responses.map(r =>
          r.expertId === expertId ? { ...r, excluded: !r.excluded } : r
        ),
      };
    }));
  };

  const updateAnnotation = (surveyId, expertId, annotation) => {
    setSurveys(prev => prev.map(s => {
      if (s.id !== surveyId) return s;
      return {
        ...s,
        responses: s.responses.map(r =>
          r.expertId === expertId ? { ...r, annotation } : r
        ),
      };
    }));
  };

  const archiveProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, archived: true, status: 'Archived' } : p));
    addAuditEvent('Project archived', project?.name || projectId, 'project', 'Project moved to archive');
    addToast(`Project archived`);
  };

  const unarchiveProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, archived: false, status: 'Active' } : p));
    addAuditEvent('Project restored', project?.name || projectId, 'project', 'Project restored from archive');
    addToast(`Project restored`);
  };

  const archiveSurvey = (surveyId) => {
    const survey = surveys.find(s => s.id === surveyId);
    const blocked = ['Submitted', 'Approved', 'Running'];
    if (survey && blocked.includes(survey.status)) {
      addToast(`Cannot archive a ${survey.status} survey — ${survey.status === 'Running' ? 'close it first' : 'withdraw it first'}`, 'warning');
      return;
    }
    setSurveys(prev => prev.map(s => s.id === surveyId ? { ...s, archived: true } : s));
    addAuditEvent('Survey archived', survey?.name || surveyId, 'survey', 'Survey moved to archive');
    addToast(`Survey archived`);
  };

  const unarchiveSurvey = (surveyId) => {
    const survey = surveys.find(s => s.id === surveyId);
    setSurveys(prev => prev.map(s => s.id === surveyId ? { ...s, archived: false } : s));
    addAuditEvent('Survey restored', survey?.name || surveyId, 'survey', 'Survey restored from archive');
    addToast(`Survey restored`);
  };

  const submitChangeRequest = (data) => {
    const refNum = `REQ-${String(changeRequests.length + 1).padStart(3, '0')}`;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const newReq = {
      id: `req${Date.now()}`,
      refNum,
      requestType: data.requestType,
      expertName: data.expertName,
      details: data.details,
      justification: data.justification,
      submittedBy: currentUser.name,
      status: 'Pending',
      timestamp,
    };
    setChangeRequests(prev => [newReq, ...prev]);
    addAuditEvent('Expert change request submitted', data.expertName, 'expert', `${data.requestType} request — ${data.details}`);
    return newReq;
  };

  const resolveChangeRequest = (reqId) => {
    setChangeRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'Resolved' } : r));
    addToast('Request marked as resolved');
  };

  const createProposal = (data) => {
    const id = `pr${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newProposal = {
      id,
      version: 1,
      submittedDate: today,
      submittedBy: currentUser.id,
      submittedByName: currentUser.name,
      status: 'Pending',
      ...data,
    };
    setProposals(prev => [newProposal, ...prev]);
    addAuditEvent(
      'Membership change proposal submitted',
      data.targetUserName || data.inviteEmail,
      'user',
      `Proposed role: ${data.proposedRole || data.requestedRole} on ${data.projectName || '—'}`
    );
    addToast(
      data.type === 'platform_invite'
        ? 'Invite request submitted — a Super Admin will review it'
        : 'Proposal submitted — a Project Owner will review it'
    );
  };

  const addUserToProject = (userId, projectId, projectName, role) => {
    const user = internalUsers.find(u => u.id === userId);
    setInternalUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      if (u.projects.some(p => p.id === projectId)) return u;
      return { ...u, projects: [...u.projects, { id: projectId, name: projectName, projectRole: role }] };
    }));
    addAuditEvent('Project member added', user ? `${user.firstName} ${user.lastName}` : userId, 'user', `Added to "${projectName}" as ${role}`);
    addToast(`User added to "${projectName}" as ${role}`);
  };

  const deactivateUser = (userId) => {
    const user = internalUsers.find(u => u.id === userId);
    setInternalUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Deactivated' } : u));
    // Transfer all templates owned by the deactivated user to Super Admin (u1)
    const superAdmin = internalUsers.find(u => u.role === 'Super Admin');
    if (superAdmin) {
      setTemplates(prev => prev.map(t =>
        t.ownerId === userId
          ? { ...t, ownerId: superAdmin.id, createdBy: superAdmin.firstName + ' ' + superAdmin.lastName }
          : t
      ));
    }
    addAuditEvent('User deactivated', user ? `${user.firstName} ${user.lastName}` : userId, 'user', 'User account deactivated; templates transferred to Super Admin');
    addToast('User deactivated', 'warning');
  };

  const updateUserRole = (userId, newRole) => {
    const user = internalUsers.find(u => u.id === userId);
    setInternalUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    addAuditEvent('User role changed', user ? `${user.firstName} ${user.lastName}` : userId, 'user', `Role changed to ${newRole}`);
    addToast('User role updated');
  };

  const updateUserCategory = (userId, responsibleCategories) => {
    const user = internalUsers.find(u => u.id === userId);
    const first = responsibleCategories[0] || {};
    setInternalUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      responsibleCategories,
      domain: first.domain || '',
      spendingPool: first.spendingPool || '',
      category: first.category || '',
    } : u));
    addAuditEvent('User category updated', user ? `${user.firstName} ${user.lastName}` : userId, 'user',
      `Category perimeter updated: ${responsibleCategories.map(c => c.category).join(', ') || '(none)'}`);
    addToast('Category assignment updated');
  };

  const attachReport = (surveyId, fileName) => {
    setSurveys(prev => prev.map(s =>
      s.id === surveyId
        ? { ...s, attachedReport: { fileName, attachedAt: new Date().toISOString(), attachedBy: currentUser.name } }
        : s
    ));
    addAuditEvent('Report attached', fileName, 'survey', 'Market intelligence report attached to survey');
    addToast('Report attached successfully');
  };

  const shareReport = (surveyId, count) => {
    setSurveys(prev => prev.map(s =>
      s.id === surveyId
        ? { ...s, reportSharedAt: new Date().toISOString(), reportDownloads: {} }
        : s
    ));
    addAuditEvent('Report shared', `${count} experts`, 'survey', 'Report link shared with responding experts');
    addToast(`Report shared with ${count} experts`);
  };

  const closeSurvey = (surveyId) => {
    const survey = surveys.find(s => s.id === surveyId);
    setSurveys(prev => prev.map(s =>
      s.id === surveyId ? { ...s, status: 'Review' } : s
    ));
    addAuditEvent('Survey closed', survey?.name || surveyId, 'survey', 'Survey manually closed — entered Review state');
    addToast('Survey closed — now in Review');
  };

  const proposeAmendments = (surveyId, amendments, sendBack) => {
    const survey = surveys.find(s => s.id === surveyId);
    const existingCycle = (survey?.amendments || []).reduce((max, a) => Math.max(max, a.cycle || 0), 0);
    const cycle = existingCycle + 1;
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const stamped = amendments.map((a, i) => ({
      ...a,
      id: `amend_${Date.now()}_${i}`,
      cycle,
      proposedBy: currentUser.name,
      proposedAt: ts,
      status: sendBack ? 'pending' : 'settled',
      resolution: sendBack ? null : { decision: 'accepted', by: currentUser.name, at: ts },
      poResponse: null,
    }));
    setSurveys(prev => prev.map(s => {
      if (s.id !== surveyId) return s;
      return {
        ...s,
        status: sendBack ? 'Draft' : 'Approved',
        amendments: [...(s.amendments || []), ...stamped],
        ...(sendBack ? {} : { approvedBy: currentUser.name }),
      };
    }));
    if (sendBack) {
      addAuditEvent('Survey returned with amendments', survey?.name || surveyId, 'survey', `Cycle ${cycle}: ${amendments.length} change(s) proposed by ${currentUser.name}`);
      addToast(`Survey returned to editor with ${amendments.length} proposed change(s)`);
    } else {
      addAuditEvent('Survey approved with amendments', survey?.name || surveyId, 'survey', `Approved by ${currentUser.name} with ${amendments.length} direct change(s)`);
      addToast('Survey approved with amendments');
    }
  };

  const resolveAmendments = (surveyId, resolutions) => {
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setSurveys(prev => prev.map(s => {
      if (s.id !== surveyId) return s;
      return {
        ...s,
        amendments: (s.amendments || []).map(a => {
          const res = resolutions.find(r => r.id === a.id);
          if (!res || a.status !== 'pending') return a;
          return {
            ...a,
            status: res.decision === 'accepted' ? 'settled' : res.decision,
            resolution: {
              by: currentUser.name,
              at: ts,
              decision: res.decision,
              reason: res.reason || '',
              counterValue: res.counterValue,
            },
          };
        }),
      };
    }));
    addAuditEvent('Amendments reviewed', '', 'survey', `${resolutions.length} amendment(s) reviewed by ${currentUser.name}`);
  };

  const respondToEditorFeedback = (surveyId, poResponses) => {
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'00')}:${String(now.getMinutes()).padStart(2,'00')}`;
    setSurveys(prev => prev.map(s => {
      if (s.id !== surveyId) return s;
      return {
        ...s,
        amendments: (s.amendments || []).map(a => {
          const res = poResponses.find(r => r.id === a.id);
          if (!res) return a;
          if (res.decision === 'accept_rejection' || res.decision === 'accept_override') {
            return { ...a, status: 'settled', poResponse: { decision: res.decision, at: ts } };
          }
          // repropose — reset to pending with updated value/note
          return {
            ...a,
            status: 'pending',
            after: res.newAfter !== undefined ? res.newAfter : a.after,
            note: res.note || a.note,
            resolution: null,
            poResponse: { decision: 'repropose', at: ts, note: res.note || '' },
          };
        }),
      };
    }));
    addToast('Responses recorded');
  };

  const transferToDataHub = (surveyId) => {
    const survey = surveys.find(s => s.id === surveyId);
    setSurveys(prev => prev.map(s =>
      s.id === surveyId
        ? { ...s, status: 'Transferred', transferredAt: new Date().toISOString() }
        : s
    ));
    addAuditEvent('Dataset transferred to DataHub', survey?.name || surveyId, 'survey', `${survey?.responsesReceived || 0} responses exported`);
    addToast('Dataset transferred to DataHub successfully');
  };

  return (
    <AppContext.Provider value={{
      currentUser, switchRole,
      surveys, projects, experts, auditEvents,
      internalUsers, proposals,
      notifications, markNotificationRead, markAllNotificationsRead,
      templates, changeRequests,
      createProject, createExpert, updateExpert, deactivateExpert,
      archiveProject, unarchiveProject, archiveSurvey, unarchiveSurvey,
      createSurvey, updateSurvey, deleteSurvey,
      approveSurvey, rejectSurvey, saveWaveSetup, launchSurvey, launchSurveyWithConfig, closeSurvey,
      cloneSurvey, saveTemplate, deleteTemplate, renameTemplate, updateTemplateQuestions, revertTemplateToPrivate, revertTemplateVersion,
      proposeOrgWide, approveOrgWide, rejectOrgWide, orgWideProposals,
      typologyConfig, updateTypologyConfig,
      submitChangeRequest, resolveChangeRequest,
      createProposal, addUserToProject,
      deactivateUser, updateUserRole, updateUserCategory,
      attachReport, shareReport,
      toggleExclusion, updateAnnotation, transferToDataHub,
      proposeAmendments, resolveAmendments, respondToEditorFeedback,
      categories, setCategories,
      taxonomy, setTaxonomy,
      orgTimezone, setOrgTimezone,
      notificationPrefs, setNotificationPrefs,
      getUserEmailTemplates, setUserEmailTemplate,
      internalNotifTemplates, setInternalNotifTemplates,
      toasts, addToast, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
