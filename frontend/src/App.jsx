import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "./contexts/AuthContext";

import IntroPage from "./pages/IntroPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/Register";
import NewHomePage from "./pages/NewHomePage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import KanbanPage from "./pages/KanbanPage";
import SchedulePage from "./pages/SchedulePage";
import AdminPage from "./pages/AdminPage";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AuthCallbackHandler from "./components/AuthCallbackHandler";
import AIFloatingBot from "./components/AIFloatingBot";
import AnnouncementBanner from "./components/AnnouncementBanner";

/**
 * Tách nội dung App ra để có thể sử dụng hook useLocation() 
 * nhằm kiểm tra Route hiện tại.
 */
function AppContent() {
  const location = useLocation();

  // Danh sách các đường dẫn không hiển thị Bot (Trang chào, Đăng nhập, Đăng ký)
  const hideBotPaths = ["/", "/login", "/register", "/auth/callback"];
  const shouldShowBot = !hideBotPaths.includes(location.pathname);

  const hideBannerPaths = ["/", "/login", "/register", "/auth/callback"]; 
  const shouldShowBanner = !hideBannerPaths.includes(location.pathname);

  return (
    <>

    {shouldShowBanner && <AnnouncementBanner />}

      <Routes>
        {/* -------------------- Public Routes -------------------- */}
        <Route path="/" element={<IntroPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* -------------------- USER Protected Routes -------------------- */}
        <Route
          path="/app"
          element={
            //<ProtectedRoute>
              <NewHomePage />
            //</ProtectedRoute>
          }
        />

        <Route
          path="/kanban"
          element={
            <ProtectedRoute>
              <KanbanPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <SchedulePage />
            </ProtectedRoute>
          }
        />

        {/* -------------------- ADMIN Protected Route -------------------- */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminPage />
            </AdminProtectedRoute>
          }
        />

        {/* -------------------- OAuth Callback -------------------- */}
        <Route path="/auth/callback" element={<AuthCallbackHandler />} />

        {/* -------------------- Not Found -------------------- */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Hiển thị Bot trên toàn bộ các trang App trừ trang Login/Register */}
      {shouldShowBot && <AIFloatingBot />}
    </>
  );
}

function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      
      {/* BrowserRouter bọc ngoài cùng để cung cấp context điều hướng */}
      <BrowserRouter>
        {/* AuthProvider bọc bên trong để quản lý trạng thái đăng nhập */}
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;