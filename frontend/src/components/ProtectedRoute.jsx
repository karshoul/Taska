import React from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // ⏳ Khi còn đang kiểm tra trạng thái đăng nhập
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-700">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  // ❌ Nếu chưa đăng nhập
  if (!isAuthenticated) {
    toast.error("Vui lòng đăng nhập để truy cập.");
    return <Navigate to="/login" replace />;
  }

  // ✅ Nếu đã đăng nhập hợp lệ
  return children;
};

export default ProtectedRoute;
