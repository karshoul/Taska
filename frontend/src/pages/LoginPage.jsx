import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext"; // ✅ Dùng AuthContext
import { useNavigate } from "react-router-dom";

const GOOGLE_AUTH_URL = "http://localhost:5001/api/auth/google";

const GoogleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.611 3.522-3.87 5.86-6.37 7.151-1.579.808-3.323 1.34-5.184 1.34-7.447 0-13.468-6.021-13.468-13.469 0-7.447 6.021-13.468 13.468-13.468 4.239 0 7.377 1.832 9.479 3.611l4.908-4.757C36.936 4.965 31.799 3 24.12 3c-11.025 0-19.96 8.935-19.96 19.96S13.095 42.92 24.12 42.92c9.816 0 17.065-7.55 19.243-16.797V20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.307 20.083h5.727C13.257 15.688 18.232 13 24.12 13c3.085 0 5.922 1.05 8.169 2.836l-4.908 4.757C26.176 19.34 24.12 19.083 24.12 19.083c-4.912 0-9.221 3.238-10.706 7.649H6.307c2.31-6.195 8.019-10.871 17.813-10.871z"
    />
    <path
      fill="#4CAF50"
      d="M11.897 27.683c-.453 1.258-.707 2.636-.707 4.077 0 1.441.254 2.819.707 4.077h-5.59C5.41 33.914 5 32.067 5 30.159c0-1.908.41-3.755 1.298-5.462h5.59z"
    />
    <path
      fill="#1976D2"
      d="M24.12 42.92c-5.717 0-10.686-2.585-14.195-6.733l5.59-4.077c1.378 3.818 5.61 6.51 10.45 6.51 4.316 0 8.09-2.164 10.198-5.413l5.59 4.077C40.697 39.582 33.15 42.92 24.12 42.92z"
    />
  </svg>
);

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth(); // ✅ Lấy login() từ AuthContext
  const navigate = useNavigate();

  // ✅ Xử lý đăng nhập thường
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5001/api/auth/login", {
        email,
        password,
      });

      const { token, role } = res.data;

      // ✅ Gọi hàm login() trong AuthContext (tự navigate theo role)
      login(token, role);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại!";
      setError(msg);
      toast.error(msg);
    }
  };

  // ✅ Xử lý đăng nhập Google OAuth
  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  // ✅ Xử lý token khi callback từ Google về
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const role = params.get("role");
    const errorParam = params.get("error");

    if (token && role) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      window.history.replaceState({}, document.title, window.location.pathname);
      login(token, role); // ✅ Gọi login() để cập nhật context + navigate
    } else if (errorParam) {
      const msg = errorParam || "Đăng nhập Google thất bại.";
      toast.error(msg);
      setError(msg);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [login]);

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] relative flex items-center justify-center font-inter">
      {/* Hiệu ứng nền */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, rgba(56, 189, 248, 0.4) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.3) 0%, transparent 70%),
            radial-gradient(ellipse at 60% 20%, rgba(236, 72, 153, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 80%, rgba(34, 197, 94, 0.2) 0%, transparent 65%)
          `,
        }}
      />

      {/* Form login */}
      <motion.div
        className="relative z-10 w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-extrabold text-center text-gray-900">
          Chào mừng quay lại 👋
        </h2>
        <p className="text-center text-sm text-gray-600">
          Truy cập vào không gian làm việc của bạn.
        </p>

        <motion.button
          onClick={handleGoogleLogin}
          whileHover={{ scale: 1.02 }}
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 py-2 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
        >
          <GoogleIcon />
          Đăng nhập bằng Google
        </motion.button>

        <div className="flex items-center space-x-2">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="text-gray-500 text-sm font-medium">HOẶC</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-100 p-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg shadow-lg hover:bg-indigo-700 transition"
          >
            Đăng nhập
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 pt-2">
          Chưa có tài khoản?{" "}
          <a href="/register" className="text-indigo-600 hover:underline">
            Đăng ký ngay
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
