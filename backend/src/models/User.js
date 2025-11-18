import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';      // ✅ Import bcryptjs
import jwt from 'jsonwebtoken';   // ✅ Import jsonwebtoken

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
        enum: ['user', 'admin'],
        default: 'user',
    },
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
    }
}, { timestamps: true });

// Middleware để hash mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    // ✅ Bật lại logic hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ✅ Sửa lại hàm so sánh mật khẩu
userSchema.methods.matchPassword = async function(enteredPassword) {
    // `this.password` đã được select: false, nên cần lấy lại khi cần
    return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Sửa lại hàm tạo token
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { 
            id: this._id,
            name: this.name,
            email: this.email,
            role: this.role
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

const User = mongoose.model('User', userSchema);
export default User;