import Project from '../models/Project.js'; // Model dự án cũ của sếp
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';

export const getWorkspaceInfo = async (req, res) => {
  try {
    let workspace = await Workspace.findOne({ owner: req.user._id })
      .populate({
        path: 'projects.members', // Lấy thông tin cộng sự TRONG từng dự án
        select: 'name email avatar'
      })
      .populate({
        path: 'members.user', // Lấy thông tin cộng sự CHUNG của Workspace
        select: 'name email avatar role'
      });

    if (!workspace) {
      // Logic tạo mới nếu chưa có (như đã làm)
      return res.status(200).json({ projects: [], members: [] });
    }

    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const migrateDataToWorkspace = async (req, res) => {
  try {
    // 1. Lấy tất cả các dự án từ bảng Project cũ
    const allOldProjects = await Project.find({});
    
    if (allOldProjects.length === 0) {
      return res.status(200).json({ message: "Không có dự án cũ nào để chuyển đổi sếp ơi!" });
    }

    let migrationCount = 0;

    // 2. Duyệt qua từng dự án cũ
    for (const oldProj of allOldProjects) {
      // Tìm Workspace của chủ sở hữu dự án đó
      let workspace = await Workspace.findOne({ owner: oldProj.owner });

      // Nếu User này chưa có Workspace, tạo mới luôn cho họ
      if (!workspace) {
        workspace = await Workspace.create({
          owner: oldProj.owner,
          name: "My Workspace",
          projects: [],
          members: [{ user: oldProj.owner, role: 'admin' }]
        });
      }

      // 3. Kiểm tra xem dự án này đã được copy sang chưa (tránh trùng lặp)
      const isAlreadyMigrated = workspace.projects.some(p => p.name === oldProj.name);

      if (!isAlreadyMigrated) {
        // "Bế" dự án cũ vào mảng projects của Workspace
        workspace.projects.push({
          name: oldProj.name,
          color: oldProj.color || '#4f46e5',
          status: 'active',
          members: oldProj.members || [], // Giữ nguyên cộng sự nếu có
          createdAt: oldProj.createdAt || Date.now()
        });
        
        await workspace.save();
        migrationCount++;
      }
    }

    res.status(200).json({ 
      message: `Bùng nổ! Đã chuyển đổi thành công ${migrationCount} dự án vào Workspace.`,
      status: "Success"
    });
  } catch (error) {
    console.error("LỖI MIGRATION:", error);
    res.status(500).json({ message: "Lỗi trong quá trình chuyển đổi dữ liệu." });
  }
};