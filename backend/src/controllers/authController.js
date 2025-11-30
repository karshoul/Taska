import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Settings from '../models/settingsModel.js';

// --- HÀM TẠO TOKEN JWT BỔ SUNG TRƯỜNG 'role' ---
const generateToken = (id, email, name, role) => {
    // ✅ THÊM KIỂM TRA: Đảm bảo biến môi trường đã được tải
    if (!process.env.JWT_SECRET) {
        console.error("❌ LỖI: Biến môi trường JWT_SECRET chưa được đặt!");
        // Ném lỗi để bắt ở khối catch bên dưới
        throw new Error("JWT_SECRET is not defined."); 
    }

    return jwt.sign(
        { 
            id, 
            email, 
            name,
            role // <-- THÊM TRƯỜNG ROLE VÀO PAYLOAD
        }, 
        process.env.JWT_SECRET, 
        { 
            expiresIn: '30d' 
        }
    );
};
// --------------------------------------------------------------------------

export const register = async (req, res) => {
    try {

        // 1. ✅ KIỂM TRA CẤU HÌNH HỆ THỐNG
        const settings = await Settings.findOne();
        // Nếu có settings và allowRegistrations = false -> Chặn luôn
        if (settings && settings.allowRegistrations === false) {
            return res.status(403).json({ message: "Hệ thống đang tạm ngưng đăng ký tài khoản mới." });
        }

        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            if (userExists.googleId) {
                return res.status(400).json({ message: "Email này đã được đăng ký bằng Google. Vui lòng đăng nhập bằng Google." });
            }
            return res.status(400).json({ message: "Email đã được sử dụng" });
        }

        // ✅ ĐÃ SỬA: Bỏ qua việc hash thủ công.
        // Gửi thẳng mật khẩu gốc vào User.create().
        // Middleware pre('save') trong userModel.js sẽ tự động xử lý việc mã hóa.
        const user = await User.create({
            name,
            email,
            password: password, // Gửi mật khẩu gốc
            role: 'user',
            // Ghi chú: Đảm bảo model của bạn có trường `authProvider`
            // authProvider: 'local', 
        });

        // Tạo token và trả về
        const token = user.getSignedJwtToken(); // Dùng phương thức từ model
        
        res.status(201).json({ 
            token,
            role: user.role 
        });
    } catch (error) {
        console.error("Lỗi khi đăng ký:", error);
        // Xử lý lỗi validation của Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Tìm người dùng bằng email và lấy cả mật khẩu
        const user = await User.findOne({ email }).select('+password');

        console.log("Role thực tế trong DB là:", `'${user.role}'`);
        
        if (!user) {
            return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
        }

        // 2. ✅ KIỂM TRA TRẠNG THÁI TÀI KHOẢN (BƯỚC QUAN TRỌNG MỚI)
        // Kiểm tra này phải được thực hiện trước khi kiểm tra mật khẩu.
        if (user.isActive === false) {
            return res.status(403).json({ 
                message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." 
            });
        }
        
        // 3. Kiểm tra phương thức đăng nhập
        if (user.googleId && !user.password) {
            return res.status(403).json({ 
                message: "Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google." 
            });
        }

        // 4. So sánh mật khẩu cho tài khoản truyền thống
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
        }

        // 5. Nếu đăng nhập thành công, cập nhật lastLogin và tạo token
        user.lastLogin = new Date();
        await user.save(); // Lưu lại ngày đăng nhập mới nhất

        const token = generateToken(user._id, user.email, user.name, user.role); 
        
        res.status(200).json({ 
            token, 
            role: user.role 
        });

    } catch (error) {
        console.error("Lỗi khi đăng nhập:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};


// --------------------------------------------------------------------------
// --- CHỨC NĂNG: Xử lý Callback từ Google OAuth (Đã sửa log) ---
// --------------------------------------------------------------------------
export const googleAuthCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("http://localhost:5173/login?error=NoUserReturned");
    }

    // ✅ ĐÃ SỬA: Thêm name và email vào payload của token
    const token = jwt.sign(
      { 
        id: req.user._id, 
        role: req.user.role,
        name: req.user.name,   // Thêm tên người dùng
        email: req.user.email  // Thêm email người dùng
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Chuyển hướng về frontend với token mới đã chứa đủ thông tin
    res.redirect(`http://localhost:5173/login?token=${token}&role=${req.user.role}`);
  } catch (error) {
    console.error("Lỗi trong googleAuthCallback:", error);
    res.redirect("http://localhost:5173/login?error=ServerError");
  }
};

