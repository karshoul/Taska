import axios from "axios";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";

const api = axios.create({
  baseURL: BASE_URL,
});

// 1. Request Interceptor (Giữ nguyên của bạn)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. 🔥 THÊM RESPONSE INTERCEPTOR (Tự động Logout khi lỗi Token)
api.interceptors.response.use(
  (response) => response.data, // Trả về data luôn cho gọn code gọi API
  (error) => {
    if (error.response && error.response.status === 401) {
      // Nếu Backend báo 401 (Unauthorized) -> Xóa token và reload
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userInfo");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;