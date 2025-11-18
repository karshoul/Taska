// src/pages/GoogleRedirect.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const GoogleRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/app"); // ✅ Chuyển vào dashboard
    } else {
      navigate("/login");
    }
  }, [location, navigate]);

  return <p>Đang đăng nhập bằng Google...</p>;
};

export default GoogleRedirect;
