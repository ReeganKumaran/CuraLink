import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PatientOnboarding from './pages/PatientOnboarding';
import ResearcherOnboarding from './pages/ResearcherOnboarding';
import PatientDashboard from './pages/PatientDashboard';
import ResearcherDashboard from './pages/ResearcherDashboard';
import DirectorManagement from './components/DirectorManagement/DirectorManagement';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/patient/onboarding" element={<PatientOnboarding />} />
          <Route path="/researcher/onboarding" element={<ResearcherOnboarding />} />
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/researcher/dashboard" element={<ResearcherDashboard />} />
          <Route path="/director-management" element={<DirectorManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;