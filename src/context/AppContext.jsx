import { createContext, useContext, useState } from 'react';
import { USERS, PROJECTS, SURVEYS, EXPERTS, AUDIT_EVENTS } from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(USERS.admin);
  const [surveys, setSurveys] = useState(SURVEYS);
  const [projects, setProjects] = useState(PROJECTS);
  const [experts, setExperts] = useState(EXPERTS);
  const [auditEvents, setAuditEvents] = useState(AUDIT_EVENTS);
  const [toasts, setToasts] = useState([]);
  const [templates, setTemplates] = useState([]);

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
    setSurveys(prev => prev.map(s =>
      s.id === surveyId ? { ...s, name, questions, ...(status ? { status } : {}) } : s
    ));
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
      templates,
      createProject, createExpert, updateExpert, deactivateExpert,
      createSurvey, updateSurvey, deleteSurvey,
      approveSurvey, rejectSurvey, launchSurvey, launchSurveyWithConfig,
      cloneSurvey, saveTemplate,
      toggleExclusion, updateAnnotation, transferToDataHub,
      toasts, addToast, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
