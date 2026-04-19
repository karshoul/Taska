import Task from "../models/Task.js";
import Project from "../models/Project.js"; // ✅ Cần import Project để kiểm tra
import ExcelJS from 'exceljs';
import User from "../models/User.js";
import mongoose from "mongoose";
import { createNotificationInternal } from "./notificationController.js";

// 📌 Lấy tất cả task (Của tôi tạo HOẶC Tôi được giao)
export const getAllTasks = async (req, res) => {
  const { filter = "all" } = req.query;
  const now = new Date();
  let startDate;

  // 1. Xử lý bộ lọc thời gian
  switch (filter) {
    case "today": { startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break; }
    case "week": { const mondayDate = now.getDate() - (now.getDay() - 1) - (now.getDay() === 0 ? 7 : 0); startDate = new Date(now.getFullYear(), now.getMonth(), mondayDate); break; }
    case "month": { startDate = new Date(now.getFullYear(), now.getMonth(), 1); break; }
    case "all": default: { startDate = null; }
  }

  // 2. ✅ LOGIC MỚI: Lấy task mà tôi là Reporter HOẶC Assignee
  const userId = req.user._id;
  const baseQuery = { 
    $or: [
        { reporter: userId }, 
        { assignee: userId }
    ],
    isTemplate: false 
  };

  const query = startDate
    ? { ...baseQuery, createdAt: { $gte: startDate } }
    : baseQuery;

  try {
    const result = await Task.aggregate([
      { $match: query }, 
      // Populate Project Info
      {
        $lookup: {
            from: 'projects', 
            localField: 'project',
            foreignField: '_id',
            as: 'projectInfo' 
        }
      },
      { $unwind: { path: '$projectInfo', preserveNullAndEmptyArrays: true } },
      
      // ✅ Populate Assignee Info (Để biết ai đang làm)
      {
        $lookup: {
            from: 'users',
            localField: 'assignee',
            foreignField: '_id',
            as: 'assigneeInfo'
        }
      },
      { $unwind: { path: '$assigneeInfo', preserveNullAndEmptyArrays: true } },

      // Format lại output
      {
          $addFields: {
              project: "$projectInfo",
              assignee: { $ifNull: ["$assigneeInfo", null] } // Trả về null nếu chưa giao ai
          }
      },
      // ✅ FIX Ở ĐÂY: Dùng $unset để dọn dẹp data thừa và ẩn thông tin mật
      { 
          $unset: [
              "projectInfo",        // Xoá cục rác tạm
              "assigneeInfo",       // Xoá cục rác tạm
              "assignee.password",  // Ẩn password của người được giao (Nằm trong biến assignee)
              "assignee.role"       // Ẩn quyền
          ] 
      },

      {
        $facet: {
          tasks: [ { $sort: { createdAt: -1 } } ],
          activeCount: [{ $match: { status: "To Do" } }, { $count: "count" }], 
          completeCount: [ { $match: { status: "Done" } }, { $count: "count" } ],
        },
      },
    ]);

    const tasks = result[0].tasks;
    const activeCount = result[0].activeCount[0]?.count || 0;
    const completeCount = result[0].completeCount[0]?.count || 0;

    res.status(200).json({ tasks, activeCount, completeCount });
  } catch (error) {
    console.error("Lỗi khi gọi getAllTasks", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Ép kiểu ID để MongoDB không tìm trượt
    const tasks = await Task.find({ 
      project: new mongoose.Types.ObjectId(projectId) 
    })
      .sort({ createdAt: -1 })
      .populate('assignee', 'name avatar')
      .populate('collaborators', 'name avatar')
      .populate('project', 'name color');

    res.status(200).json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error("Lỗi lấy task dự án:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getPersonalTasks = async (req, res) => {
  try {
    const userId = req.user._id;

    // Tìm các task:
    // 1. project: null (không thuộc dự án nào)
    // 2. assignee: userId (được giao cho mình - logic ở hàm createTask đã tự gán này rồi)
    // 3. isTemplate: false (không lấy task mẫu lặp lại)
    const tasks = await Task.find({
      project: null,
      assignee: userId,
      isTemplate: false
    })
    .sort({ createdAt: -1 }) // Mới nhất lên đầu
    .populate('reporter', 'name avatar email'); // Lấy thông tin người tạo (thường là chính mình)

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách việc cá nhân:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách công việc" });
  }
};

// 📌 Tạo task mới
export const createTask = async (req, res) => {
  try {
    // 1. Lấy dữ liệu từ req.body (Lúc này là FormData gửi lên)
    const { 
        title, description, deadline, status, recurrence, 
        project, priority, assignee, tags, dependencies 
    } = req.body;

    // 2. Kiểm tra tiêu đề
    if (!title) {
        return res.status(400).json({ message: "Tiêu đề không được để trống" });
    }

    // 3. Xử lý File đính kèm (Nếu có)
    let attachments = [];
    if (req.files && req.files.length > 0) {
        attachments = req.files.map(file => ({
            name: file.originalname,
            url: file.path,        // Link từ Cloudinary
            fileType: file.mimetype,
            public_id: file.filename
        }));
    }

    // 4. Xác định loại hình công việc (Cá nhân hay Dự án)
    const isPersonalTask = !project || project === "none" || project === "";

    // 5. Chuẩn bị dữ liệu Task gốc
    // Lưu ý: recurrence từ FormData có thể là chuỗi JSON, cần parse lại
    let parsedRecurrence = { frequency: 'none' };
    try {
        if (recurrence) {
            parsedRecurrence = typeof recurrence === 'string' ? JSON.parse(recurrence) : recurrence;
        }
    } catch (e) {
        console.error("Lỗi parse recurrence:", e);
    }

    const taskData = {
        title,
        description: description || "",
        project: isPersonalTask ? null : project,
        priority: priority || 'medium',
        reporter: req.user._id,
        assignee: isPersonalTask ? req.user._id : (assignee && assignee !== "none" ? assignee : null),
        tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
        dependencies: dependencies ? (typeof dependencies === 'string' ? JSON.parse(dependencies) : dependencies) : [],
        status: status || 'To Do',
        attachments: attachments // 🔥 Thêm mảng file vào đây
    };

    // 6. Xử lý logic Công việc lặp lại (Recurring)
    if (parsedRecurrence && parsedRecurrence.frequency && parsedRecurrence.frequency !== 'none') {
      const firstInstanceDate = deadline ? new Date(deadline) : new Date();
      let nextDate = new Date(firstInstanceDate);
      
      const freq = parsedRecurrence.frequency;
      if (freq === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      else if (freq === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (freq === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

      // Tạo Task mẫu (Template)
      const templateTask = new Task({
        ...taskData,
        isTemplate: true,
        recurrence: parsedRecurrence,
        nextInstanceDate: nextDate,
      });
      await templateTask.save();

      // Tạo bản thực thi đầu tiên
      const firstInstance = new Task({
        ...taskData,
        deadline: firstInstanceDate,
        isTemplate: false,
        templateId: templateTask._id,
        recurrence: parsedRecurrence,
      });
      
      const savedInstance = await firstInstance.save();

const newInstance = await Task.findById(savedInstance._id)
    .populate('assignee', 'name avatar email')
    .populate('project', 'name color'); // Nếu sếp muốn hiện tên dự án luôn

return res.status(201).json(newInstance);

    } else {
      // 7. Xử lý Công việc thường
      const task = new Task({
        ...taskData,
        deadline: deadline ? new Date(deadline) : null,
        isTemplate: false,
        recurrence: { frequency: 'none' },
      });

      const newTask = await (await task.save()).populate('assignee', 'name avatar email');
      if (taskData.assignee && taskData.assignee.toString() !== req.user._id.toString()) {
        await createNotificationInternal({
            recipientId: taskData.assignee,
            senderId: req.user._id,
            projectId: taskData.project || null,
            title: "Công việc mới được giao",
            message: `đã giao cho bạn công việc: "${title}"`,
            type: 'PROJECT_INVITE'
        });
    }
      return res.status(201).json(newTask);
    }

  } catch (error) {
    console.error("Lỗi tại createTask Controller:", error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
    }
    res.status(500).json({ message: "Lỗi hệ thống khi tạo công việc" });
  }
};

// 📌 Cập nhật task 
// @desc    Cập nhật nhiệm vụ
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            deadline, 
            status, 
            priority, 
            assignee, 
            tags, 
            project, 
            collaborators 
        } = req.body;
        
        const userId = req.user._id;

        // 1. Tìm task và kiểm tra quyền (Người tạo hoặc Người được giao mới có quyền sửa)
        const task = await Task.findOne({
            _id: req.params.id,
            $or: [{ reporter: userId }, { assignee: userId }]
        });

        if (!task) return res.status(404).json({ message: "Không tìm thấy nhiệm vụ hoặc sếp không có quyền sửa" });

        // 2. Xử lý logic thay đổi Dự án (Project)
        if (project !== undefined) {
            // Nếu FE gửi "none" hoặc chuỗi rỗng -> Task cá nhân (null)
            const newProjectId = (project === "none" || project === "") ? null : project;
            
            // Ghi log nếu có sự thay đổi dự án
            if (String(task.project) !== String(newProjectId)) {
                task.activities.push({
                    user: userId,
                    action: "Chuyển dự án",
                    details: newProjectId ? "Đã đưa nhiệm vụ vào dự án mới" : "Đã chuyển về việc cá nhân"
                });
                task.project = newProjectId;
            }
        }

        // 3. Xử lý danh sách Cộng sự (Collaborators)
        if (collaborators !== undefined) {
            try {
                // Nếu gửi qua FormData, collaborators thường là chuỗi JSON.stringified
                const parsedCollaborators = typeof collaborators === 'string' 
                    ? JSON.parse(collaborators) 
                    : collaborators;
                
                task.collaborators = parsedCollaborators;
            } catch (e) {
                console.error("Lỗi parse collaborators:", e);
                // Nếu lỗi parse thì gán giá trị thô nếu nó là mảng
                if (Array.isArray(collaborators)) task.collaborators = collaborators;
            }
        }

        // 4. Xử lý logic thay đổi Người thực hiện (Assignee)
        if (assignee !== undefined) {
            const currentAssigneeId = task.assignee ? task.assignee.toString() : null;
            const newAssigneeId = (assignee === "none" || !assignee) ? null : assignee;

            if (newAssigneeId !== currentAssigneeId) {
                if (!newAssigneeId) {
                    task.assignee = null;
                    task.activities.push({ user: userId, action: "Cập nhật", details: "Đã gỡ người thực hiện" });
                } else {
                    const newUser = await User.findById(newAssigneeId).select('name');
                    task.assignee = newAssigneeId;
                    task.activities.push({
                        user: userId,
                        action: "Giao việc",
                        details: `Đã giao cho: ${newUser ? newUser.name : "Thành viên mới"}`
                    });
                }
            }
        }

        // 5. Ghi log khi đổi trạng thái (Status)
        if (status && status !== task.status) {
            task.activities.push({
                user: userId,
                action: "Đổi trạng thái",
                details: `Từ '${task.status}' sang '${status}'`
            });
            task.status = status;
        }

        // 6. Cập nhật các thông tin cơ bản khác
        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (deadline !== undefined) task.deadline = deadline;
        if (priority) task.priority = priority;
        if (tags) task.tags = tags;

        const { existingAttachments } = req.body;


        let updatedAttachments = [];
if (existingAttachments) {
    try {
        // Vì gửi qua FormData nên nó là chuỗi JSON, cần parse lại
        updatedAttachments = typeof existingAttachments === 'string' 
            ? JSON.parse(existingAttachments) 
            : existingAttachments;
    } catch (e) {
        console.error("Lỗi parse existingAttachments:", e);
    }
}


if (req.files && req.files.length > 0) {
    const newAttachments = req.files.map(file => ({
        name: file.originalname,
        url: file.path,        // Link từ Cloudinary
        fileType: file.mimetype,
        public_id: file.filename
    }));
    // Gộp ảnh cũ còn lại + ảnh mới
    updatedAttachments = [...updatedAttachments, ...newAttachments];
}

// Bước C: Cập nhật vào Database (chỉ cập nhật nếu có gửi trường này hoặc có file mới)
// Nếu sếp xóa hết sạch ảnh cũ và không thêm ảnh mới, updatedAttachments sẽ là []
if (existingAttachments !== undefined || (req.files && req.files.length > 0)) {
    task.attachments = updatedAttachments;
}

        
console.log("=== KIỂM TRA TRƯỚC KHI LƯU ===");
console.log("ID Task:", task._id);
console.log("Dự án mới sẽ lưu:", task.project);
console.log("Assignee mới:", task.assignee);

await task.save();
console.log("=== ĐÃ LƯU THÀNH CÔNG VÀO DB ===");

        // 8. Populate đầy đủ để trả về Frontend render lại UI ngay lập tức
        const updatedTask = await Task.findById(task._id)
            .populate('project', 'name color')
            .populate('assignee', 'name avatar email')
            .populate('collaborators', 'name avatar email')
            .populate('reporter', 'name email')
            .populate({
                path: 'activities.user',
                select: 'name avatar'
            })
            .populate({
                path: 'comments.user',
                select: 'name avatar'
            });

        res.status(200).json(updatedTask);

    } catch (error) {
        console.error("Lỗi cập nhật task:", error);
        res.status(500).json({ message: "Lỗi server: " + error.message });
    }
};

// 📌 Xóa task
export const deleteTask = async (req, res) => {
  try {
    // 🔥 QUYỀN XÓA: Chỉ Reporter (Người tạo) mới được xóa task
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      reporter: req.user._id, 
    });

    if (!deletedTask) {
      return res.status(404).json({ message: "Không tìm thấy task hoặc bạn không có quyền xóa" });
    }

    res.status(200).json(deletedTask);
  } catch (error) {
    console.error("Lỗi khi gọi deleteTask", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 📌 Lấy 1 task theo ID
export const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('project')
            .populate('assignee', 'name email avatar') // Hiện thông tin người làm
            .populate('reporter', 'name email') // Hiện thông tin người tạo
            .populate('activities.user', 'name avatar');

        if (!task) return res.status(404).json({ message: "Không tìm thấy công việc" });
        
        // Kiểm tra quyền xem (Reporter, Assignee hoặc thành viên Project)
        // (Tạm thời check đơn giản: phải là người tạo hoặc người làm)
        const canView = 
            task.reporter._id.toString() === req.user._id.toString() ||
            (task.assignee && task.assignee._id.toString() === req.user._id.toString());

        // Nếu muốn chặt chẽ hơn: Check xem user có nằm trong Project Members không? (Cần query Project)

        if (!canView) {
             return res.status(403).json({ message: "Không có quyền truy cập task này" });
        }

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

// 📥 XUẤT FILE EXCEL (Task được giao cho tôi)
export const exportMyTasksToExcel = async (req, res) => {
    try {
        const userId = req.user._id;

        // ✅ Chỉ lấy các task mà tôi là ASSIGNEE (Việc tôi phải làm)
        const tasks = await Task.find({ assignee: userId }).sort({ createdAt: -1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Việc cần làm của tôi');

        worksheet.columns = [
            { header: 'Tiêu đề', key: 'title', width: 30 },
            { header: 'Mô tả', key: 'desc', width: 40 },
            { header: 'Trạng thái', key: 'status', width: 15 },
            { header: 'Độ ưu tiên', key: 'priority', width: 15 },
            { header: 'Hạn chót', key: 'deadline', width: 20 },
            { header: 'Ngày tạo', key: 'createdAt', width: 20 }
        ];

        tasks.forEach(task => {
            worksheet.addRow({
                title: task.title,
                desc: task.description || '',
                status: task.status === 'complete' ? 'Hoàn thành' : 'Đang làm',
                priority: task.priority === 'high' ? 'Cao 🔥' : task.priority === 'low' ? 'Thấp ☕' : 'Trung bình ⚡',
                deadline: task.deadline ? new Date(task.deadline).toLocaleString('vi-VN') : '',
                createdAt: new Date(task.createdAt).toLocaleString('vi-VN')
            });
        });

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF6B21A8' }
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=my_tasks.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).json({ message: "Lỗi khi xuất file Excel" });
    }
};

export const addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task không tồn tại" });

        task.comments.push({ user: req.user._id, content });
        
        // Ghi log vào activities
        task.activities.push({
            user: req.user._id,
            action: "Bình luận",
            details: `Đã thêm bình luận mới`
        });

        await task.save();

        // Trả về task đã populate đầy đủ để FE update State phát một
        const updatedTask = await Task.findById(task._id)
            .populate('comments.user', 'name avatar')
            .populate('activities.user', 'name avatar');

        res.status(200).json(updatedTask); // 👈 Trả về cả task (hoặc {comments:..., activities:...})
    } catch (error) {
        res.status(500).json({ message: "Lỗi thêm bình luận" });
    }
};

// @desc    Sửa bình luận
export const updateComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const { content } = req.body;

        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Task không tồn tại" });

        const comment = task.comments.id(commentId);
        if (!comment) return res.status(404).json({ message: "Bình luận không tồn tại" });

        // 🔥 FIX Ở ĐÂY: Lấy ID chuẩn xác dù nó có bị populate thành Object hay không
        const commentUserId = comment.user._id ? comment.user._id.toString() : comment.user.toString();

        if (commentUserId !== req.user._id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền sửa bình luận này" });
        }

        comment.content = content;
        await task.save();

        const updatedTask = await Task.findById(task._id).populate('comments.user', 'name avatar email');
        res.status(200).json(updatedTask.comments);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi sửa bình luận" });
    }
};

// @desc    Xoá bình luận
export const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;

        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: "Task không tồn tại" });

        const comment = task.comments.id(commentId);
        if (!comment) return res.status(404).json({ message: "Bình luận không tồn tại" });

        // 🔥 FIX Ở ĐÂY TƯƠNG TỰ BÊN TRÊN
        const commentUserId = comment.user._id ? comment.user._id.toString() : comment.user.toString();

        if (commentUserId !== req.user._id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền xoá bình luận này" });
        }

        task.comments.pull(commentId);
        await task.save();

        const updatedTask = await Task.findById(task._id).populate('comments.user', 'name avatar email');
        res.status(200).json(updatedTask.comments);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xoá bình luận" });
    }
};