import React from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react'; // Import icon loading cho đẹp

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  // 1. Trạng thái đang tải
  if (isLoading) {
    // Nên hiển thị loading spinner thay vì null để user biết app đang chạy
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
    );
  }

  // 2. Kiểm tra đăng nhập
  if (!isAuthenticated) {
    // Dùng setTimeout để tránh warning update state trong render (tùy chọn)
    // Nhưng để đơn giản cứ giữ nguyên toast nếu nó hoạt động tốt
    toast.error("Vui lòng đăng nhập để truy cập.");
    return <Navigate to="/login" replace />;
  }

  // 3. ✅ SỬA LỖI Ở ĐÂY: Kiểm tra quyền (Admin HOẶC Super Admin)
  // Logic: Nếu role KHÔNG nằm trong danh sách cho phép -> Chặn
  if (!['admin', 'super_admin'].includes(userRole)) {
    toast.error("Bạn không có quyền truy cập trang quản trị.");
    return <Navigate to="/app" replace />;
  }

  // 4. Hợp lệ -> Cho phép truy cập
  return children;
};

export default AdminProtectedRoute;