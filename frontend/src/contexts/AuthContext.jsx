import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userInfo, setUserInfo] = useState(null); 
  
  const navigate = useNavigate();

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const userRaw = localStorage.getItem('userInfo');

      if (token && role) {
        setIsAuthenticated(true);
        setUserRole(role);
        
        // Fix lỗi Parse an toàn
        if (userRaw && userRaw !== "undefined") {
          setUserInfo(JSON.parse(userRaw));
        }
      } else {
        // Reset sạch sẽ nếu không có token
        setIsAuthenticated(false);
        setUserRole(null);
        setUserInfo(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Nếu dữ liệu storage hỏng, dọn dẹp luôn cho sạch
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    const handleStorageChange = () => checkAuthStatus();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (token, role, user) => {
    if (!token || !user) {
        toast.error("Dữ liệu đăng nhập không hợp lệ!");
        return;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('userInfo', JSON.stringify(user)); 
    
    setIsAuthenticated(true);
    setUserRole(role);
    setUserInfo(user);

    toast.success("Chào mừng sếp trở lại!");

    // Điều hướng thông minh
    if (role === 'admin' || role === 'super_admin') {
      navigate('/admin');
    } else {
      navigate('/app'); 
    }
  };

  const logout = () => {
    localStorage.clear(); // Xóa sạch mọi thứ cho an toàn
    setIsAuthenticated(false);
    setUserRole(null);
    setUserInfo(null);
    
    toast.info("Đã đăng xuất an toàn.");
    navigate('/login');
  };

  const value = { isAuthenticated, userRole, userInfo, isLoading, login, logout, checkAuthStatus };

  // Đừng return null, hãy return một cái Spinner/Loading nhẹ cho chuyên nghiệp sếp ạ
  if (isLoading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ); 

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};