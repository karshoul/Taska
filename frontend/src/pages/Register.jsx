import React, { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "sonner";

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
    console.log("Dữ liệu gửi đi:", form); 
    try {
      await api.post("/auth/register", form);
      toast.success("Đăng ký thành công 🎉");
      navigate("/login"); // chuyển sang đăng nhập
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Đăng ký thất bại ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] relative flex items-center justify-center">
  {/* Cosmic Aurora */}
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

  {/* Khối chứa form */}
  <motion.div
    className="relative z-10 bg-white shadow-xl rounded-2xl p-8 w-full max-w-md"
    initial={{ opacity: 0, y: -40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    {/* Tiêu đề */}
    <motion.h1
      className="text-3xl font-bold text-center mb-6 text-purple-600"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      ✨ Đăng ký tài khoản
    </motion.h1>

    {/* Form */}
    <form onSubmit={handleSubmit} className="space-y-4">
      <motion.div whileFocus={{ scale: 1.02 }}>
        <label className="block mb-1 font-medium">Tên đăng nhập</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400"
        />
      </motion.div>

      <motion.div whileFocus={{ scale: 1.02 }}>
        <label className="block mb-1 font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400"
        />
      </motion.div>

      <motion.div whileFocus={{ scale: 1.02 }}>
        <label className="block mb-1 font-medium">Mật khẩu</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400"
        />
      </motion.div>

      <motion.button
        type="submit"
        disabled={loading}
        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {loading ? "⏳ Đang đăng ký..." : "Đăng ký"}
      </motion.button>
    </form>

    {/* Link chuyển trang */}
    <p className="text-sm text-center text-gray-600 mt-6">
      Đã có tài khoản?{" "}
      <button
        onClick={() => navigate("/login")}
        className="text-purple-600 font-semibold hover:underline"
      >
        Đăng nhập ngay
      </button>
    </p>
  </motion.div>
</div>

  );
};

export default RegisterPage;
