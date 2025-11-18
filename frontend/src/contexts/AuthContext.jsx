import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// 1️⃣ Khởi tạo Context
const AuthContext = createContext();

// Hook tùy chỉnh để sử dụng Auth Context dễ dàng
export const useAuth = () => useContext(AuthContext);

// 2️⃣ AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // 🧠 Hàm dùng chung để kiểm tra token & role trong localStorage
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
    }

    setIsLoading(false);
    console.log("🔁 Cập nhật AuthContext:", { token, role });
  };

  // 🔁 Kiểm tra trạng thái ban đầu khi load trang
  useEffect(() => {
    checkAuthStatus();

    // 🪄 Theo dõi thay đổi của localStorage (khi user đăng nhập/đăng xuất)
    const handleStorageChange = () => checkAuthStatus();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 🔑 Hàm login
  const login = (token, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setIsAuthenticated(true);
    setUserRole(role);
    toast.success("Đăng nhập thành công!");

    // 👉 Chuyển hướng tùy theo vai trò
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/app');
    }
  };

  // 🚪 Hàm logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setUserRole(null);
    toast.info("Bạn đã đăng xuất.");
    navigate('/login');
  };

  const value = { isAuthenticated, userRole, isLoading, login, logout };

  // 🕓 Loading UI trong khi kiểm tra trạng thái đăng nhập
  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
