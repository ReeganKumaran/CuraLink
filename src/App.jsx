import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import PatientOnboarding from './pages/PatientOnboarding';
import ResearcherOnboarding from './pages/ResearcherOnboarding';
import PatientDashboard from './pages/PatientDashboard';
import ResearcherDashboard from './pages/ResearcherDashboard';
import HealthExperts from './pages/HealthExperts';
import ResearcherMeetingRequests from './pages/ResearcherMeetingRequests';
import DirectorManagement from './components/DirectorManagement/DirectorManagement';
import Publications from './pages/Publications';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/patient/onboarding" element={<PatientOnboarding />} />
          <Route path="/researcher/onboarding" element={<ResearcherOnboarding />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/health-experts" element={<HealthExperts />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/researcher/dashboard" element={<ResearcherDashboard />} />
          <Route path="/researcher/meeting-requests" element={<ResearcherMeetingRequests />} />
          <Route path="/director-management" element={<DirectorManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;