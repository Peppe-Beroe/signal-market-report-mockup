import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Homepage from './pages/Homepage';
import ProjectsList from './pages/ProjectsList';
import ProjectDetail from './pages/ProjectDetail';
import SurveyBuilder from './pages/SurveyBuilder';
import ApprovalReview from './pages/ApprovalReview';
import SurveyResults from './pages/SurveyResults';
import PostCloseReview from './pages/PostCloseReview';
import ExpertDatabase from './pages/ExpertDatabase';
import ExpertDetail from './pages/ExpertDetail';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';
import WaveSetup from './pages/WaveSetup';
import PeoplePage from './pages/PeoplePage';
import NotificationsPage from './pages/NotificationsPage';
import ExpertSurvey from './pages/expert/ExpertSurvey';
import ExpertThankYou from './pages/expert/ExpertThankYou';
import ExpertOptOut from './pages/expert/ExpertOptOut';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/survey/:token/thank-you" element={<ExpertThankYou />} />
          <Route path="/survey/:token/opt-out" element={<ExpertOptOut />} />
          <Route path="/survey/:token" element={<ExpertSurvey />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Homepage />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/:projectId" element={<ProjectDetail />} />
            <Route path="projects/:projectId/surveys/new" element={<SurveyBuilder mode="create" />} />
            <Route path="projects/:projectId/surveys/:surveyId/builder" element={<SurveyBuilder mode="edit" />} />
            <Route path="projects/:projectId/surveys/:surveyId/approve" element={<ApprovalReview />} />
            <Route path="projects/:projectId/surveys/:surveyId/results" element={<SurveyResults />} />
            <Route path="projects/:projectId/surveys/:surveyId/review" element={<PostCloseReview />} />
            <Route path="projects/:projectId/surveys/:surveyId/wave-setup" element={<WaveSetup />} />
            <Route path="experts" element={<ExpertDatabase />} />
            <Route path="experts/:expertId" element={<ExpertDetail />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
