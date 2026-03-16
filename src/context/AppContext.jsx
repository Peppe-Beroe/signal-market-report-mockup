import { createContext, useContext, useState } from 'react';
import { USERS, PROJECTS, SURVEYS, EXPERTS, AUDIT_EVENTS } from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(USERS.admin);
  const [surveys, setSurveys] = useState(SURVEYS);
  const [projects] = useState(PROJECTS);
  const [experts] = useState(EXPERTS);
  const [auditEvents] = useState(AUDIT_EVENTS);
  const [toasts, setToasts] = useState([]);

  const switchRole = (roleKey) => setCurrentUser(USERS[roleKey]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

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
      approveSurvey, rejectSurvey, launchSurvey,
      toggleExclusion, updateAnnotation, transferToDataHub,
      toasts, addToast, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
