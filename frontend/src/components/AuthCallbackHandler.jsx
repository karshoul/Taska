import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthCallbackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      // ✅ Lưu token vào localStorage
      localStorage.setItem("token", token);

      // 🔁 Điều hướng vào trang chính
      navigate("/app", { replace: true });
    } else {
      // ❌ Không có token → quay lại login
      navigate("/login", { replace: true });
    }
  }, [location, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h3>Đang xử lý đăng nhập Google...</h3>
      <p>Vui lòng chờ trong giây lát...</p>
    </div>
  );
};

export default AuthCallbackHandler;
