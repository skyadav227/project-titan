import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage   from "../pages/LandingPage";
import LoginPage     from "../pages/LoginPage";
import RegisterPage  from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import InterviewPage from "../pages/InterviewPage";
import ReportPage    from "../pages/ReportPage";
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
        <Route path="/settings"  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/*
          History routes.
          /history              → list of all past interviews
          /history/:sessionId   → the specific report for that session
          History is the single entry point for past interviews and their reports.
        */}
        <Route path="/history"             element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/history/:sessionId"  element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />

        {/*
          Legacy /reports routes — redirect to /history equivalents so any
          existing bookmarks or in-flight navigations still work.
        */}
        <Route path="/reports"             element={<ProtectedRoute><Navigate to="/history" replace /></ProtectedRoute>} />
        <Route path="/reports/:sessionId"  element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />

        {/*
          Interview routes — all handled by InterviewPage state machine.
          /interview              → redirect to /interview/setup
          /interview/setup        → configuration screen (ALWAYS shows fresh setup)
          /interview/session/:id  → live session only (asking, recording, feedback)
                                    report_ready state navigates away to /history/:id
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
