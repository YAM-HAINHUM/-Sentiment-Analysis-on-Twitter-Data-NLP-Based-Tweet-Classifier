import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./store/authStore";
import { ThemeProvider } from "./store/themeStore";
import AppLayout from "./components/layout/AppLayout";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import AnalysisPage from "./pages/AnalysisPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import InsightsPage from "./pages/InsightsPage";
import TrendsPage from "./pages/TrendsPage";
import EmotionsPage from "./pages/EmotionsPage";
import SavedReportsPage from "./pages/SavedReportsPage";


import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/app/analyze" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login"  element={<PublicOnlyRoute><AuthPage mode="login" /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><AuthPage mode="register" /></PublicOnlyRoute>} />

      {/* Protected app routes */}
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/analyze" replace />} />
        <Route path="analyze"   element={<AnalysisPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="history"   element={<HistoryPage />} />
        <Route path="insights"  element={<InsightsPage />} />
        <Route path="trends"    element={<TrendsPage />} />
        <Route path="emotions"  element={<EmotionsPage />} />
        <Route path="reports"   element={<SavedReportsPage />} />

        <Route path="admin"     element={<AdminPage />} />
        <Route path="settings"  element={<SettingsPage />} />
        <Route path="profile"   element={<ProfilePage />} />
      </Route>

      {/* Required top-level routes */}
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/analyze" element={<Navigate to="/app/analyze" replace />} />
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/history" element={<Navigate to="/app/history" replace />} />
      <Route path="/insights" element={<Navigate to="/app/insights" replace />} />

      <Route path="/admin" element={<Navigate to="/app/admin" replace />} />


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--color-surface)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
                fontSize: "13px",
              },
            }}
          />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
