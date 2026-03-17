import { createContext, useContext, useState } from 'react';
import { USERS, PROJECTS, SURVEYS, EXPERTS, AUDIT_EVENTS, INTERNAL_USERS, PROPOSALS, NOTIFICATIONS } from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(USERS.admin);
  const [surveys, setSurveys] = useState(SURVEYS);
  const [projects, setProjects] = useState(PROJECTS);
  const [experts, setExperts] = useState(EXPERTS);
  const [auditEvents, setAuditEvents] = useState(AUDIT_EVENTS);
  const [toasts, setToasts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [internalUsers, setInternalUsers] = useState(INTERNAL_USERS);
  const [orgTimezone, setOrgTimezone] = useState('IST');
  const [proposals, setProposals] = useState(PROPOSALS);
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    const events = [
      'survey_approved', 'survey_rejected', 'proposal_approved', 'proposal_rejected',
      'proposal_auto_cancelled', 'new_proposal_received', 'invite_approved', 'invite_rejected',
      'response_rate_alert', 'expert_change_resolved', 'wave_closed',
    ];
    return Object.fromEntries(events.map(e => [e, { email: true, inPlatform: true }]));
  });
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

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
    const newProject = {
      id: `p${Date.now()}`,
      name: data.name,
      category: data.category,
      owner: currentUser.name,
      status: 'Active',
      created: today,
      surveysCount: 0,
      lastActivity: today,
    };
    setProjects(prev => [...prev, newProject]);
    addAuditEvent('Project created', data.name, 'project', `New project under ${data.category} category`);
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
      expertise: data.expertise ? data.expertise.split(',').map(s => s.trim()).filter(Boolean) : [],
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

  const createSurvey = ({ projectId, name, questions, status = 'Draft' }) => {
    const wave = surveys.filter(s => s.projectId === projectId).length + 1;
    const newSurvey = {
      id: `s${Date.now()}`,
      projectId,
      name,
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
    };
    setSurveys(prev => [...prev, newSurvey]);
    addAuditEvent('Survey created', name, 'survey', `Draft survey created with ${questions.length} questions`);
    addToast(status === 'Draft' ? 'Draft saved' : 'Survey submitted for approval');
    return newSurvey;
  };

  const updateSurvey = ({ surveyId, name, questions, status }) => {
    setSurveys(prev => prev.map(s => {
      if (s.id !== surveyId) return s;
      // If re-submitting after rejection, store the current questions as previousSnapshot
      const isResubmit = status === 'Submitted' && s.rejectionReason;
      return {
        ...s,
        name,
        questions,
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
    addAuditEvent('Survey rejected', survey?.name || surveyId, 'survey', `Returned to draft: ${reason}`);
    addToast('Survey returned to draft with feedback', 'warning');
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

  const saveTemplate = (name, questions) => {
    const template = {
      id: `tpl${Date.now()}`,
      name,
      questions,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTemplates(prev => [...prev, template]);
    addToast(`Template "${name}" saved`);
    return template;
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
    addToast('Proposal submitted — a Project Owner will review it');
  };

  const deactivateUser = (userId) => {
    const user = internalUsers.find(u => u.id === userId);
    setInternalUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Deactivated' } : u));
    addAuditEvent('User deactivated', user ? `${user.firstName} ${user.lastName}` : userId, 'user', 'User account deactivated');
    addToast('User deactivated', 'warning');
  };

  const updateUserRole = (userId, newRole) => {
    const user = internalUsers.find(u => u.id === userId);
    setInternalUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    addAuditEvent('User role changed', user ? `${user.firstName} ${user.lastName}` : userId, 'user', `Role changed to ${newRole}`);
    addToast('User role updated');
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
      approveSurvey, rejectSurvey, launchSurvey, launchSurveyWithConfig,
      cloneSurvey, saveTemplate,
      submitChangeRequest, resolveChangeRequest,
      createProposal,
      deactivateUser, updateUserRole,
      attachReport, shareReport,
      toggleExclusion, updateAnnotation, transferToDataHub,
      orgTimezone, setOrgTimezone,
      notificationPrefs, setNotificationPrefs,
      toasts, addToast, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
