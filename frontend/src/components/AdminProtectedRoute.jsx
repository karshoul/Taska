import React from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  // Khi trạng thái xác thực đang tải (chưa biết có đăng nhập hay không)
  if (isLoading) {
    return null;
  }

  // Nếu chưa đăng nhập
  if (!isAuthenticated) {
    toast.error("Vui lòng đăng nhập để truy cập.");
    return <Navigate to="/login" replace />;
  }

  // Nếu không phải admin
  if (userRole !== "admin") {
    toast.error("Bạn không có quyền truy cập trang quản trị.");
    return <Navigate to="/app" replace />;
  }

  // Nếu đã đăng nhập và là admin
  return children;
};

export default AdminProtectedRoute;
