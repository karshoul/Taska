import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js'; // Đảm bảo đường dẫn đúng
import dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5001/api/auth/google/callback" // Phải khớp với route trong authRoutes.js
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (user) {
            // Trường hợp 1: User đã tồn tại với email này
            
            // 1a. Nếu User ĐÃ đăng ký bằng Google (có googleId), chỉ cần đăng nhập
            if (user.googleId) {
                return done(null, user);
            }
            
            // 1b. Nếu User là tài khoản truyền thống (CHƯA CÓ googleId)
            // Cập nhật tài khoản đó để liên kết với Google ID.
            // Điều này cho phép User đăng nhập bằng cả 2 phương thức từ nay về sau (nếu User.js cho phép)
            // hoặc chỉ bằng Google nếu logic của bạn yêu cầu.
            
            // TÔI KHUYẾN NGHỊ: Cập nhật googleId và không đụng chạm đến password
            user.googleId = profile.id;
            await user.save();
            
            return done(null, user);

        } else {
            // Trường hợp 2: User CHƯA tồn tại, tạo tài khoản mới
            user = await User.create({ 
                email: email,
                name: profile.displayName,
                googleId: profile.id, // 🎯 BẮT BUỘC: Lưu Google ID
                password: null, // 🎯 BẮT BUỘC: Đảm bảo mật khẩu là null 
                role: ['admin@gmail.com', 'superadmin@gmail.com'].includes(email) ? 'admin' : 'user'
            });
            return done(null, user);
        }
    } catch (error) {
        // Xử lý lỗi
        console.error("Lỗi trong Google Strategy:", error);
        done(error, null);
    }
}));

// Không cần thiết cho API stateless (dựa trên JWT), nhưng Passport yêu cầu định nghĩa
// (Nếu bạn sử dụng session, hãy giữ lại phần này)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});
