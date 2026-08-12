import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import InterviewPage from "../pages/InterviewPage";
import ReportPage from "../pages/ReportPage";
import ResumePage from "../pages/ResumePage";
import HistoryPage from "../pages/HistoryPage";
import SettingsPage from "../pages/SettingsPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;