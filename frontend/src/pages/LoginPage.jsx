import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext"; 
import { useNavigate, Link } from "react-router-dom";
import { CheckSquare, LogIn } from "lucide-react"; // Icon logo

const GOOGLE_AUTH_URL = "http://localhost:5001/api/auth/google";

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" fill="none">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.611 3.522-3.87 5.86-6.37 7.151-1.579.808-3.323 1.34-5.184 1.34-7.447 0-13.468-6.021-13.468-13.469 0-7.447 6.021-13.468 13.468-13.468 4.239 0 7.377 1.832 9.479 3.611l4.908-4.757C36.936 4.965 31.799 3 24.12 3c-11.025 0-19.96 8.935-19.96 19.96S13.095 42.92 24.12 42.92c9.816 0 17.065-7.55 19.243-16.797V20.083z" />
    <path fill="#FF3D00" d="M6.307 20.083h5.727C13.257 15.688 18.232 13 24.12 13c3.085 0 5.922 1.05 8.169 2.836l-4.908 4.757C26.176 19.34 24.12 19.083 24.12 19.083c-4.912 0-9.221 3.238-10.706 7.649H6.307c2.31-6.195 8.019-10.871 17.813-10.871z" />
    <path fill="#4CAF50" d="M11.897 27.683c-.453 1.258-.707 2.636-.707 4.077 0 1.441.254 2.819.707 4.077h-5.59C5.41 33.914 5 32.067 5 30.159c0-1.908.41-3.755 1.298-5.462h5.59z" />
    <path fill="#1976D2" d="M24.12 42.92c-5.717 0-10.686-2.585-14.195-6.733l5.59-4.077c1.378 3.818 5.61 6.51 10.45 6.51 4.316 0 8.09-2.164 10.198-5.413l5.59 4.077C40.697 39.582 33.15 42.92 24.12 42.92z" />
  </svg>
);

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  // Logic Login cũ giữ nguyên
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", { email, password });
      const { token, role } = res.data;
      login(token, role);
      if (role === 'admin' || role === 'super_admin') {
          navigate('/admin', { replace: true });
      } else {
          navigate('/app', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Đăng nhập thất bại!";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  // Logic xử lý callback Google (giữ nguyên để an toàn)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const errorParam = params.get("error");

    if (token && role) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      window.history.replaceState({}, document.title, window.location.pathname);
      login(token, role); 
    } else if (errorParam) {
      const msg = errorParam || "Đăng nhập Google thất bại.";
      toast.error(msg);
      setError(msg);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [login]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center font-sans bg-[#F8F9FC] relative overflow-hidden selection:bg-indigo-100">
      
      {/* BACKGROUND DECORATIONS (Giống Intro) */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-300/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[120px]" />

      <motion.div
        className="relative z-10 w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Header: Logo & Title */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg mb-4">
                <CheckSquare className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Chào mừng trở lại!</h2>
            <p className="text-gray-500 mt-2 text-sm">Vui lòng đăng nhập để tiếp tục quản lý công việc.</p>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm active:scale-[0.98]"
        >
          <GoogleIcon />
          Đăng nhập bằng Google
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Hoặc</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-400 font-medium"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-bold text-gray-700">Mật khẩu</label>
                <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Quên mật khẩu?</a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all outline-none text-gray-800 font-medium"
              required
            />
          </div>

          {error && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl font-medium text-center"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Đăng nhập
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors hover:underline">
            Đăng ký ngay
          </Link>
        </p>

      </motion.div>
    </div>
  );
};

export default LoginPage;