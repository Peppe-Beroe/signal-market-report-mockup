import { createContext, useContext, useState } from 'react';
import { USERS, PROJECTS, SURVEYS, EXPERTS, AUDIT_EVENTS } from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(USERS.admin);
  const [surveys, setSurveys] = useState(SURVEYS);
  const [projects, setProjects] = useState(PROJECTS);
  const [experts, setExperts] = useState(EXPERTS);
  const [auditEvents] = useState(AUDIT_EVENTS);
  const [toasts, setToasts] = useState([]);

  const switchRole = (roleKey) => setCurrentUser(USERS[roleKey]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

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
    addToast(`Expert "${data.name}" added`);
    return newExpert;
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
    addToast(status === 'Draft' ? 'Draft saved' : 'Survey submitted for approval');
    return newSurvey;
  };

  const updateSurvey = ({ surveyId, name, questions, status }) => {
    setSurveys(prev => prev.map(s =>
      s.id === surveyId ? { ...s, name, questions, ...(status ? { status } : {}) } : s
    ));
    addToast(status === 'Submitted' ? 'Survey submitted for approval' : 'Draft saved');
  };

  const deleteSurvey = (surveyId) => {
    setSurveys(prev => prev.filter(s => s.id !== surveyId));
    addToast('Survey deleted', 'warning');
  };

  const approveSurvey = (surveyId) => {
    setSurveys(prev => prev.map(s =>
      s.id === surveyId ? { ...s, status: 'Approved', approvedBy: currentUser.name } : s
    ));
    addToast('Survey approved successfully');
  };

  const rejectSurvey = (surveyId, reason) => {
    setSurveys(prev => prev.map(s =>
      s.id === surveyId ? { ...s, status: 'Draft', rejectionReason: reason } : s
    ));
    addToast('Survey returned to draft with feedback', 'warning');
  };

  const launchSurvey = (surveyId) => {
    setSurveys(prev => prev.map(s =>
      s.id === surveyId ? { ...s, status: 'Running', sendDate: '2026-03-15', closeDate: '2026-03-29' } : s
    ));
    addToast('Survey launched — invitations sent to experts');
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
    setSurveys(prev => prev.map(s =>
      s.id === surveyId
        ? { ...s, status: 'Transferred', transferredAt: new Date().toISOString() }
        : s
    ));
    addToast('Dataset transferred to DataHub successfully');
  };

  return (
    <AppContext.Provider value={{
      currentUser, switchRole,
      surveys, projects, experts, auditEvents,
      createProject, createExpert, createSurvey, updateSurvey, deleteSurvey,
      approveSurvey, rejectSurvey, launchSurvey,
      toggleExclusion, updateAnnotation, transferToDataHub,
      toasts, addToast, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
