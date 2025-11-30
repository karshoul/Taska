import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "sonner";
import { CheckSquare, UserPlus, User, Mail, Lock } from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      toast.success("Đăng ký thành công! 🎉");
      navigate("/login"); 
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Đăng ký thất bại ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center font-sans bg-[#F8F9FC] relative overflow-hidden selection:bg-indigo-100">
      
      {/* BACKGROUND DECORATIONS (Đồng bộ với Login) */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-300/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[120px]" />

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
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tạo tài khoản mới</h2>
            <p className="text-gray-500 mt-2 text-sm">Bắt đầu hành trình quản lý công việc hiệu quả.</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Tên đăng nhập */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Tên hiển thị</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nhập tên của bạn"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-400 font-medium"
                    required
                />
            </div>
          </div>

          {/* Email */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-400 font-medium"
                    required
                />
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Mật khẩu</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all outline-none text-gray-800 font-medium"
                    required
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
                <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Đang xử lý...
                </span>
            ) : (
                <>
                    <UserPlus className="w-5 h-5" />
                    Đăng ký ngay
                </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors hover:underline">
            Đăng nhập
          </Link>
        </p>

      </motion.div>
    </div>
  );
};

export default RegisterPage;