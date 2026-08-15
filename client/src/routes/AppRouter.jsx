import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage   from "../pages/LandingPage";
import LoginPage     from "../pages/LoginPage";
import RegisterPage  from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import InterviewPage from "../pages/InterviewPage";
import ResumePage    from "../pages/ResumePage";
import HistoryPage   from "../pages/HistoryPage";
import SettingsPage  from "../pages/SettingsPage";
import ProtectedRoute from "./ProtectedRoute";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes — require authentication */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/resume"    element={<ProtectedRoute><ResumePage /></ProtectedRoute>} />
        <Route path="/history"   element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/settings"  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/*
          Interview routes — all handled by InterviewPage state machine.
          /interview              → redirect to /interview/setup
          /interview/setup        → configuration screen
          /interview/session/:id  → live session (asks, records, feedback, report)
        */}
        <Route path="/interview" element={<ProtectedRoute><Navigate to="/interview/setup" replace /></ProtectedRoute>} />
        <Route path="/interview/setup"        element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
        <Route path="/interview/session/:id"  element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
