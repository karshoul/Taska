import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "./contexts/AuthContext";

import IntroPage from "./pages/IntroPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/Register";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import KanbanPage from "./pages/KanbanPage";
import SchedulePage from "./pages/SchedulePage";
import AdminPage from "./pages/AdminPage";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AuthCallbackHandler from "./components/AuthCallbackHandler";

function App() {
  return (
    <>
      <Toaster richColors/>
      
      {/* ✅ Bọc toàn bộ app trong AuthProvider để mọi route đều có access tới context */}
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* -------------------- Public Routes -------------------- */}
            <Route path="/" element={<IntroPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* -------------------- USER Protected Routes -------------------- */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
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
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
