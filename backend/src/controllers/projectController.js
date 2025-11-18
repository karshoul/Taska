// file: controllers/projectController.js
import Project from '../models/Project.js';
import Task from '../models/Task.js';

// @desc    Lấy tất cả dự án của người dùng
// @route   GET /api/projects
// @access  Private
export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find({ user: req.user._id });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server khi lấy dự án" });
    }
};

// @desc    Tạo dự án mới
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
    try {
        const { name, color } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Vui lòng nhập tên dự án' });
        }

        // ✅ THÊM BƯỚC KIỂM TRA TRÙNG LẶP
        // Tìm một dự án có cùng tên VÀ cùng user ID
        const projectExists = await Project.findOne({ 
            name: name, 
            user: req.user._id 
        });

        if (projectExists) {
            return res.status(400).json({ message: 'Một dự án với tên này đã tồn tại.' });
        }
        // ✅ KẾT THÚC BƯỚC KIỂM TRA

        const project = new Project({
            name,
            color: color || '#808080',
            user: req.user._id,
        });
        const createdProject = await project.save();
        res.status(201).json(createdProject);
    } catch (error) {
        // Xử lý lỗi nếu index ở Model báo trùng (trường hợp an toàn)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Một dự án với tên này đã tồn tại.' });
        }
        res.status(500).json({ message: "Lỗi server khi tạo dự án" });
    }
};

// @desc    Xóa dự án
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: "Không tìm thấy dự án" });
        }
        if (project.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Không có quyền" });
        }

        await project.deleteOne();
        
        // CẬP NHẬT QUAN TRỌNG:
        // Gỡ bỏ dự án này khỏi tất cả các task đang liên kết với nó
        await Task.updateMany(
            { project: req.params.id },
            { $set: { project: null } }
        );
        
        res.status(200).json({ message: 'Dự án đã được xóa' });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server khi xóa dự án" });
    }
};