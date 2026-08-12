import { BrowserRouter, Routes, Route } from "react-router-dom";

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
        <Route path="/interview" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
        <Route path="/report"    element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
        <Route path="/history"   element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/settings"  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
