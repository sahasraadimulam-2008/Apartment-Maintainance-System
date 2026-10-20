import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './components/common/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import ResidentDashboard from './pages/ResidentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import ComplaintsPage from './pages/ComplaintsPage';
import FlatsPage from './pages/FlatsPage';
import ResidentsPage from './pages/ResidentsPage';
import StaffManagementPage from './pages/StaffManagementPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import PaymentsPage from './pages/PaymentsPage';
import AiAssistantPage from './pages/AiAssistantPage';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Landing & Authentication */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Workspace */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Resident Home */}
            <Route
              path="/dashboard"
              element={
                <RoleRoute allowedRoles={['resident']}>
                  <ResidentDashboard />
                </RoleRoute>
              }
            />

            {/* Admin Home */}
            <Route
              path="/admin"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              }
            />

            {/* Staff Home */}
            <Route
              path="/staff"
              element={
                <RoleRoute allowedRoles={['staff']}>
                  <StaffDashboard />
                </RoleRoute>
              }
            />

            {/* Shared Management Modules */}
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/flats" element={<FlatsPage />} />
            <Route
              path="/residents"
              element={
                <RoleRoute allowedRoles={['admin', 'staff']}>
                  <ResidentsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/staff-management"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <StaffManagementPage />
                </RoleRoute>
              }
            />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/ai-assistant" element={<AiAssistantPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
