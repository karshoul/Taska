import React, { useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

const EditUserModal = ({ user, onClose, refreshUsers }) => {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    role: user.role || "user",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `http://localhost:3001/api/admin/users/${user._id}`,
        formData,
        { withCredentials: true }
      );
      refreshUsers();
      onClose();
    } catch (error) {
      console.error("Lỗi khi cập nhật user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay mờ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fadeIn z-10">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Chỉnh sửa User
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Tên
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          {/* Vai trò */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Vai trò
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
