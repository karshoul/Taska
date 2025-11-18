import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware để xác thực người dùng đã đăng nhập
export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Gắn user vào request để các route sau có thể sử dụng
            req.user = await User.findById(decoded.id).select("-password");
            
            if (!req.user) {
                return res.status(401).json({ message: "Người dùng không tồn tại" });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: "Không được phép, token không hợp lệ" });
        }
    }
    if (!token) {
        return res.status(401).json({ message: "Không được phép, không có token" });
    }
};

// ✅ TỐI ƯU HÓA: Middleware để kiểm tra quyền Admin
// Middleware này phải được dùng SAU middleware `protect`
export const adminGuard = (req, res, next) => {
    // `protect` đã chạy trước và gắn `req.user`
    if (req.user && req.user.role === 'admin') {
        next(); // Nếu là admin, cho qua
    } else {
        res.status(403).json({ message: 'Truy cập bị từ chối. Yêu cầu quyền Admin.' });
    }
};