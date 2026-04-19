import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên dự án là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên dự án không được quá 100 ký tự']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },
    color: {
        type: String,
        default: '#4F46E5', // Màu tím mặc định (Indigo-600) cho đẹp hơn màu xám
    },
    // 👑 Người tạo/Sở hữu dự án
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',    
    },
    // 👥 Danh sách thành viên tham gia
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    deadline: { 
        type: Date, 
        default: null 
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Archived'],
        default: 'Active'
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true }, // Để hiển thị virtuals khi convert sang JSON
    toObject: { virtuals: true }
});

// Index tìm kiếm
projectSchema.index({ owner: 1, members: 1 }); // Tìm dự án của tôi
projectSchema.index({ name: 'text' }); // Tìm kiếm theo tên (Full-text search)

const Project = mongoose.model('Project', projectSchema);
export default Project;