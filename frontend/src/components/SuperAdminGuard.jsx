import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// Giả sử bạn lưu thông tin user trong localStorage hoặc Context
// Hãy sửa dòng này tùy theo cách bạn lấy user hiện tại
const getUser = () => JSON.parse(localStorage.getItem('userInfo')); 

const SuperAdminGuard = () => {
  const user = getUser();

  // Logic: Nếu không phải super_admin thì đá về trang admin thường (dashboard)
  if (user?.role !== 'super_admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Nếu đúng là super_admin, cho phép hiển thị trang con (Outlet)
  return <Outlet />;
};

export default SuperAdminGuard;