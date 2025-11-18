import express from "express";
import { register, login, googleAuthCallback } from "../controllers/authController.js";
import passport from "passport"; 

const router = express.Router();

// ------------------------------------
// 1. Routes Đăng ký/Đăng nhập Truyền thống
// ------------------------------------
router.post("/register", register);
router.post("/login", login);

// ------------------------------------
// 2. Routes Đăng nhập bằng Google (OAuth 2.0)
// ------------------------------------

// Route Khởi tạo OAuth: 
router.get(
    "/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Route Callback OAuth: 
router.get(
    "/google/callback", 
    passport.authenticate("google", { 
        // ✅ THÊM MÃ LỖI: Quay lại trang đăng nhập nếu thất bại
        failureRedirect: "http://localhost:5173/login?error=AuthFailedByPassport", 
        session: false 
    }),
    googleAuthCallback // Xử lý tạo JWT và chuyển hướng về frontend
);

export default router;
