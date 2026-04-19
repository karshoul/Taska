import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Settings from '../models/settingsModel.js';

// @desc    Lấy tất cả dự án (Của tôi tạo HOẶC tôi được mời)
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
    try {
        const userId = req.user._id;
        // 👇 Phải là 'owner', KHÔNG ĐƯỢC là 'user'
        const projects = await Project.find({
            $or: [
                { owner: userId },   
                { members: userId }
            ]
        })
        .populate("owner", "name email avatar")
        .populate("members", "name email avatar")
        .sort({ createdAt: -1 });

        res.status(200).json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server khi lấy dự án" });
    }
};

// @desc    Tạo dự án mới
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
    try {
        const { name, description, color, deadline } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Vui lòng nhập tên dự án' });
        }

        // 1. 🛡️ KIỂM TRA GIỚI HẠN HỆ THỐNG (MỚI)
        const settings = await Settings.findOne({ singleton: 'main_settings' });
        const currentProjectCount = await Project.countDocuments({ 
            owner: req.user._id,
            status: 'Active' 
        });

        const limit = settings?.maxProjectsPerUser || 10; // Mặc định 10 nếu chưa có settings

        if (currentProjectCount >= limit) {
            return res.status(400).json({ 
                message: `Sếp đã đạt giới hạn tối đa ${limit} dự án. Vui lòng dọn dẹp hoặc nâng cấp tài khoản!` 
            });
        }

        // 2. Kiểm tra trùng tên (Giữ nguyên logic hay của sếp)
        const projectExists = await Project.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') }, 
            owner: req.user._id,
            status: 'Active'
        });

        if (projectExists) {
            return res.status(400).json({ message: 'Sếp đang có một dự án trùng tên rồi nhé.' });
        }

        // 3. Tạo dự án
        const project = new Project({
            name,
            description: description || "",
            color: color || '#4F46E5',
            owner: req.user._id, 
            deadline: deadline || null,
            members: [],
            status: 'Active'
        });

        const savedProject = await project.save();

        // Populate để FE có data hiển thị ngay
        const fullProject = await Project.findById(savedProject._id)
            .populate("owner", "name email avatar");

        res.status(201).json(fullProject);

    } catch (error) {
        console.error("❌ Lỗi createProject:", error);
        res.status(500).json({ message: "Lỗi server khi tạo dự án" });
    }
};

// @desc    Lấy chi tiết 1 dự án
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate("owner", "name email avatar")
            .populate("members", "name email avatar");

        if (!project) return res.status(404).json({ message: "Dự án không tồn tại" });

        // KIỂM TRA QUYỀN: Phải là Owner hoặc Member
        const isOwner = project.owner._id.equals(req.user._id);
        const isMember = project.members.some(member => member._id.equals(req.user._id));

        if (!isOwner && !isMember) {
            return res.status(403).json({ message: "Bạn không có quyền truy cập dự án này" });
        }

        res.status(200).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi Server" });
    }
};

// @desc    Cập nhật dự án
// @route   PUT /api/projects/:id
// @access  Private (Chỉ Owner)
export const updateProject = async (req, res) => {
    try {
        const { name, color, description, deadline, status } = req.body;

        // Tìm dự án
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: "Dự án không tồn tại" });
        }

        // Chỉ Owner mới được sửa thông tin quan trọng
        if (!project.owner.equals(req.user._id)) {
            return res.status(403).json({ message: "Chỉ chủ dự án mới được chỉnh sửa" });
        }

        // Cập nhật
        project.name = name || project.name;
        project.color = color || project.color;
        project.description = description !== undefined ? description : project.description; // Cho phép xóa mô tả
        project.deadline = deadline || project.deadline;
        project.status = status || project.status;

        const updatedProject = await project.save();
        res.status(200).json(updatedProject);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi cập nhật dự án" });
    }
};

// @desc    Xóa dự án
// @route   DELETE /api/projects/:id
// @access  Private (Chỉ Owner)
export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: "Dự án không tồn tại" });
        }

        // Chỉ Owner mới được xóa
        if (!project.owner.equals(req.user._id)) {
            return res.status(403).json({ message: "Chỉ chủ dự án mới được xóa" });
        }

        // 1. Xóa tất cả Task thuộc dự án này trước (Dọn dẹp)
        await Task.deleteMany({ project: req.params.id });

        // 2. Xóa dự án
        await project.deleteOne();
        
        res.status(200).json({ message: 'Đã xóa dự án và toàn bộ công việc liên quan' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server khi xóa dự án" });
    }
};

// @desc    GỬI LỜI MỜI thành viên vào dự án
// @route   POST /api/projects/:id/invite
// @access  Private (Chỉ Owner)
export const inviteMemberToProject = async (req, res) => {
    try {
        const { email } = req.body;
        const projectId = req.params.id;

        if (!email) return res.status(400).json({ message: "Vui lòng nhập email" });

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: "Dự án không tồn tại" });

        // 1. Kiểm tra quyền Owner
        if (!project.owner.equals(req.user._id)) {
            return res.status(403).json({ message: "Chỉ chủ dự án mới được gửi lời mời" });
        }

        // 2. Tìm User cần mời
        const userToInvite = await User.findOne({ email: email.toLowerCase() });
        if (!userToInvite) {
            return res.status(404).json({ message: "Không tìm thấy người dùng với email này" });
        }

        // 3. Kiểm tra xem có mời chính mình không
        if (userToInvite._id.equals(req.user._id)) {
             return res.status(400).json({ message: "Bạn đã là chủ dự án rồi" });
        }

        // 4. Kiểm tra xem đã là thành viên chưa
        const isAlreadyMember = project.members.some(memberId => memberId.equals(userToInvite._id));
        if (isAlreadyMember) {
            return res.status(400).json({ message: "Thành viên này đã có trong dự án" });
        }

        // 5. Kiểm tra xem đã có lời mời Pending nào gửi cho người này chưa
        const existingInvite = await Notification.findOne({
            recipient: userToInvite._id,
            project: project._id,
            type: 'PROJECT_INVITE',
            inviteStatus: 'pending'
        });

        if (existingInvite) {
            return res.status(400).json({ message: "Bạn đã gửi lời mời cho người này rồi, đang chờ họ đồng ý." });
        }

        // 6. TẠO THÔNG BÁO GỬI ĐI THAY VÌ ADD TRỰC TIẾP
        const newNotification = new Notification({
            recipient: userToInvite._id,
            sender: req.user._id,
            project: project._id,
            type: 'PROJECT_INVITE',
            title: "Lời mời tham gia dự án",
            message: `Bạn được mời tham gia dự án "${project.name}"`,
            inviteStatus: 'pending'
        });

        await newNotification.save();
        res.status(200).json({ message: "Đã gửi lời mời thành công! Chờ người đó đồng ý." });

    } catch (error) {
        // 🔥 GHI RÕ LỖI RA TERMINAL ĐỂ BẮT QUẢ TANG
        console.log("============== LỖI GỬI LỜI MỜI ==============");
        console.error(error);
        console.log("=============================================");
        res.status(500).json({ message: "Lỗi server khi gửi lời mời" });
    }
};

// @desc    PHẢN HỒI LỜI MỜI (Đồng ý hoặc Từ chối)
// @route   PUT /api/projects/invite/:notificationId
// @access  Private (Người nhận thông báo)
export const respondToProjectInvite = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { action } = req.body; // action nhận 1 trong 2 giá trị: 'accept' hoặc 'reject'

        // 1. Tìm thông báo
        const notification = await Notification.findById(notificationId).populate('project');
        if (!notification) return res.status(404).json({ message: "Không tìm thấy lời mời" });

        // 2. Chặn nếu không phải người nhận hoặc lời mời đã xử lý
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền xử lý lời mời này" });
        }
        if (notification.inviteStatus !== 'pending') {
            return res.status(400).json({ message: "Lời mời này đã được xử lý" });
        }

        // 3. Xử lý logic
        if (action === 'accept') {
            const project = await Project.findById(notification.project._id);
            // Kiểm tra một lần nữa cho chắc ăn (phòng trường hợp project bị xoá)
            if (project) {
                if (!project.members.includes(req.user._id)) {
                    project.members.push(req.user._id);
                    await project.save();
                }
                notification.inviteStatus = 'accepted';
                notification.message = `Bạn đã tham gia dự án "${project.name}"`;
                notification.isRead = true; // Chuyển thành đã đọc luôn
            } else {
                return res.status(404).json({ message: "Dự án này không còn tồn tại" });
            }
        } else if (action === 'reject') {
            notification.inviteStatus = 'rejected';
            notification.message = `Bạn đã từ chối tham gia dự án "${notification.project.name}"`;
            notification.isRead = true;
        } else {
            return res.status(400).json({ message: "Hành động không hợp lệ" });
        }

        await notification.save();

        res.status(200).json({ 
            message: action === 'accept' ? "Đã tham gia dự án" : "Đã từ chối lời mời",
            notification 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi server khi xử lý lời mời" });
    }
};