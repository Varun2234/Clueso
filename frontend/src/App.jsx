import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import UploadFeedback from './pages/UploadFeedback';
import FeedbackDetail from './pages/FeedbackDetail';

/**
 * ProtectedRoute Component
 * Redirects to /login if the user is not authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * PublicRoute Component
 * Redirects to /dashboard if an authenticated user tries to access login/signup.
 */
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes (Accessible only when logged out) */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } 
        />

        {/* Protected Routes (Accessible only when logged in) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default view: Redirect / to /dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Main Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Feature: New Collection (Video Upload & AI Processing) */}
          <Route path="upload" element={<UploadFeedback />} />
          
          {/* Feature: Feedback Detail & AI Summaries (Specific ID) */}
          <Route path="feedback/:id" element={<FeedbackDetail />} />
          
          {/* Placeholder for Feedback List Page */}
          <Route path="feedback" element={<div className="p-8 font-medium">Feedback List view is integrated into the Dashboard.</div>} />
          
          {/* Placeholder for Settings */}
          <Route path="settings" element={<div className="p-8 font-medium text-gray-500">Settings Page (Coming Soon)</div>} />
        </Route>

        {/* 404 Catch-all: Redirect unknown routes back to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;