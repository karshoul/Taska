import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Settings from '../models/settingsModel.js';

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

// 2️⃣ Middleware cho quyền ADMIN (Admin & Super Admin đều vào được)
// Logic: Super Admin là sếp của Admin, nên trang nào Admin vào được thì Super Admin cũng phải vào được.
export const adminGuard = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
        next(); 
    } else {
        res.status(403).json({ message: 'Truy cập bị từ chối. Yêu cầu quyền Quản trị viên.' });
    }
};

// 3️⃣ Middleware cho quyền SUPER ADMIN (Chỉ Super Admin mới vào được)
// Dùng cho: Xóa admin khác, xem log hệ thống, cấu hình web...
export const superAdminGuard = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({ message: 'Truy cập bị từ chối. Chỉ dành cho Super Admin.' });
    }
};

// ✅ MIDDLEWARE CHẶN BẢO TRÌ
export const checkMaintenance = async (req, res, next) => {
    try {
        // 1. Lấy cấu hình
        const settings = await Settings.findOne();

        // 2. Nếu đang bảo trì (isMaintenance = true)
        if (settings && settings.isMaintenance) {
            
            // 3. Kiểm tra quyền: Nếu là Admin hoặc Super Admin thì CHO QUA (để còn vào sửa lỗi)
            if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
                return next();
            }

            // 4. Nếu là User thường -> CHẶN
            return res.status(503).json({ 
                message: "Hệ thống đang bảo trì. Vui lòng quay lại sau ít phút!",
                isMaintenance: true 
            });
        }

        // Không bảo trì -> Cho qua
        next();
    } catch (error) {
        console.error(error);
        // Nếu lỗi DB thì cứ cho qua (fail-safe) hoặc chặn tùy bạn, ở đây mình cho qua
        next();
    }
};