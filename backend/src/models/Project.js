// file: models/projectModel.js
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên dự án là bắt buộc'],
        trim: true,
    },
    color: {
        type: String,
        default: '#808080', // Mặc định là màu xám
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
}, { timestamps: true });

projectSchema.index({ user: 1, name: 1 }, { unique: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;