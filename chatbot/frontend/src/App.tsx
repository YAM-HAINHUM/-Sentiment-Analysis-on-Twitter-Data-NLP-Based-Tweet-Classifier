import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import AuthPage from "./pages/AuthPage";
import MainLayout from "./pages/MainLayout";
import SettingsPage from "./pages/SettingsPage";

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1f2937", color: "#f9fafb", border: "1px solid rgba(255,255,255,0.1)" },
          duration: 3000,
        }}
      />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Protected><MainLayout /></Protected>} />
        <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
