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
        // 1. ✅ KIỂM TRA CẤU HÌNH HỆ THỐNG (Singleton)
        const settings = await Settings.findOne({ singleton: 'main_settings' });
        
        // Nếu sếp đã tắt "Cho phép đăng ký" trong Admin
        if (settings && settings.allowRegistrations === false) {
            return res.status(403).json({ 
                message: "Hệ thống đang tạm ngưng đăng ký tài khoản mới. Sếp vui lòng quay lại sau!" 
            });
        }

        const { name, email, password } = req.body;
        
        // Validation cơ bản
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
        }

        // Kiểm tra email tồn tại
        const userExists = await User.findOne({ email });
        if (userExists) {
            if (userExists.googleId) {
                return res.status(400).json({ message: "Email này đã được đăng ký bằng Google. Vui lòng đăng nhập bằng Google." });
            }
            return res.status(400).json({ message: "Email đã được sử dụng" });
        }

        // 2. ✅ TẠO USER
        // Model User sẽ tự hash mật khẩu nhờ middleware pre('save')
        const user = await User.create({
            name,
            email,
            password, // Gửi pass gốc, model tự xử
            role: 'user',
            isActive: true // Mặc định tài khoản mới là hoạt động
        });

        // 3. ✅ TRẢ VỀ TOKEN
        const token = user.getSignedJwtToken(); 
        
        res.status(201).json({ 
            success: true,
            token,
            role: user.role,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("❌ Lỗi khi đăng ký:", error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: "Lỗi hệ thống khi tạo tài khoản" });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Tìm người dùng
        const user = await User.findOne({ email }).select('+password');

        // 🔥 QUAN TRỌNG: Phải kiểm tra user tồn tại TRƯỚC KHI truy cập user.role
        if (!user) {
            return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
        }

        // --- Chỉ được log sau khi đã chắc chắn user khác null ---
        console.log("Role thực tế trong DB là:", `'${user.role}'`);

        // 2. Kiểm tra trạng thái Active
        if (user.isActive === false) {
            return res.status(403).json({ 
                message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." 
            });
        }
        
        // 3. Kiểm tra Google Account
        if (user.googleId && !user.password) {
            return res.status(403).json({ 
                message: "Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google." 
            });
        }

        // 4. So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
        }

        // 5. Thành công
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id, user.email, user.name, user.role); 
        
        // ✅ ĐÃ SỬA: Trả về đầy đủ thông tin để Frontend vẽ giao diện
        res.status(200).json({ 
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            token
        });

    } catch (error) {
        console.error("Lỗi khi đăng nhập:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const updateUserProfile = async (req, res) => {
  try {
    // Tìm user theo ID (lấy từ token)
    const user = await User.findById(req.user._id);

    if (user) {
      // Cập nhật từng trường nếu có gửi lên
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.avatar = req.body.avatar || user.avatar;

      // 🔥 CẬP NHẬT SKILLS
      // Nếu có gửi skills lên thì thay thế mảng cũ bằng mảng mới
      if (req.body.skills) {
        user.skills = req.body.skills; 
      }

      // Nếu có gửi password mới thì cập nhật (Middleware trong Model sẽ tự mã hóa)
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      // Trả về thông tin mới nhất
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        skills: updatedUser.skills, // ✅ Đã có skill mới
        avatar: updatedUser.avatar,
        token: req.user.token, // Giữ nguyên token cũ nếu cần hoặc generate mới
      });
    } else {
      res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật hồ sơ" });
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

