import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên là bắt buộc']
    },
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Vui lòng nhập email hợp lệ']
    },
    password: {
        type: String,
        required: function() { return !this.googleId; },
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'super_admin'],
        default: 'user',
    },
    avatar: {
        type: String,
        default: "" // Link ảnh đại diện (Cloudinary/Firebase)
    },
    // 🔥 MỚI: Dùng cho Smart Assign (Ví dụ: ["React", "Backend", "Design"])
    skills: [{ 
        type: String, 
        trim: true 
    }],
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date
    },
    contacts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

// --- GIỮ NGUYÊN PHẦN MIDDLEWARE BCRYPT & JWT CỦA BẠN ---
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { id: this._id, name: this.name, email: this.email, role: this.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

const User = mongoose.model('User', userSchema);
export default User;