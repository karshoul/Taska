import Task from "../models/Task.js";
import ExcelJS from 'exceljs';

// 📌 Lấy tất cả task
export const getAllTasks = async (req, res) => {
  const { filter = "today" } = req.query;
  const now = new Date();
  let startDate;

  switch (filter) {
    case "today": { startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break; }
    case "week": { const mondayDate = now.getDate() - (now.getDay() - 1) - (now.getDay() === 0 ? 7 : 0); startDate = new Date(now.getFullYear(), now.getMonth(), mondayDate); break; }
    case "month": { startDate = new Date(now.getFullYear(), now.getMonth(), 1); break; }
    case "all": default: { startDate = null; }
  }

  const baseQuery = { 
    user: req.user._id, 
    isTemplate: false 
  };

  const query = startDate
    ? { ...baseQuery, createdAt: { $gte: startDate } }
    : baseQuery;

  try {
    const result = await Task.aggregate([
      { $match: query }, 
      {
        $lookup: {
            from: 'projects', 
            localField: 'project',
            foreignField: '_id',
            as: 'projectInfo' 
        }
      },
      {
        $unwind: {
            path: '$projectInfo',
            preserveNullAndEmptyArrays: true
        }
      },
      {
          $addFields: {
              project: "$projectInfo"
          }
      },
      {
        $facet: {
          tasks: [ { $sort: { createdAt: -1 } } ],
          activeCount: [{ $match: { status: "active" } }, { $count: "count" }],
          completeCount: [ { $match: { status: "complete" } }, { $count: "count" } ],
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

// 📌 Tạo task mới
export const createTask = async (req, res) => {
  try {
    // 1. ✅ THÊM 'priority' VÀO DANH SÁCH NHẬN DỮ LIỆU
    const { title, description, deadline, status, recurrence, project, priority } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Tiêu đề không được để trống" });
    }

    // --- TRƯỜNG HỢP 1: CÔNG VIỆC LẶP LẠI ---
    if (recurrence && recurrence.frequency && recurrence.frequency !== 'none') {
      const firstInstanceDate = deadline ? new Date(deadline) : new Date();
      let nextDate = new Date(firstInstanceDate);
      
      // Tính toán ngày lặp tiếp theo
      if (recurrence.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      if (recurrence.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      if (recurrence.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

      // Tạo Task Mẫu (Template) để sinh ra các task sau này
      const templateTask = new Task({
        user: req.user._id,
        title,
        description,
        project,
        priority: priority || 'medium', // ✅ LƯU PRIORITY CHO TEMPLATE
        isTemplate: true,
        recurrence: recurrence,
        nextInstanceDate: nextDate,
        status: 'active',
      });
      await templateTask.save();

      // Tạo Task Đầu tiên (Instance 1) để hiển thị ngay
      const firstInstance = new Task({
        user: req.user._id,
        title,
        description,
        project,
        priority: priority || 'medium', // ✅ LƯU PRIORITY CHO TASK ĐẦU TIÊN
        deadline: firstInstanceDate,
        status: status || 'active',
        isTemplate: false,
        templateId: templateTask._id,
      });
      
      const newInstance = await firstInstance.save();
      res.status(201).json(newInstance);

    } else {
      // --- TRƯỜNG HỢP 2: CÔNG VIỆC BÌNH THƯỜNG (KHÔNG LẶP) ---
      const task = new Task({
        user: req.user._id,
        title,
        description,
        project,
        priority: priority || 'medium', // ✅ QUAN TRỌNG: LƯU PRIORITY TẠI ĐÂY
        deadline: deadline || null,
        status: status || 'active',
        isTemplate: false,
        recurrence: { frequency: 'none' },
      });

      const newTask = await task.save();
      res.status(201).json(newTask);
    }
  } catch (error) {
    console.error("Lỗi khi gọi createTask", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 📌 Cập nhật task
export const updateTask = async (req, res) => {
  try {
    // 1. ✅ THÊM 'priority' VÀO DANH SÁCH NHẬN
    const { title, description, deadline, status, completedAt, project, priority } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (status !== undefined) updateData.status = status;
    if (completedAt !== undefined) updateData.completedAt = completedAt;
    if (project !== undefined) updateData.project = project;
    
    // 2. ✅ THÊM DÒNG NÀY ĐỂ CẬP NHẬT PRIORITY
    if (priority !== undefined) updateData.priority = priority;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updateData }, 
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Nhiệm vụ không tồn tại hoặc bạn không có quyền sửa" });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Lỗi khi gọi updateTask", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 📌 Xóa task (Không đổi)
export const deleteTask = async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deletedTask) {
      return res.status(404).json({ message: "Nhiệm vụ không tồn tại hoặc bạn không có quyền xóa" });
    }

    res.status(200).json(deletedTask);
  } catch (error) {
    console.error("Lỗi khi gọi deleteTask", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Lấy 1 task theo ID
export const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('project');
        if (!task) return res.status(404).json({ message: "Không tìm thấy công việc" });
        
        // Kiểm tra quyền sở hữu (Security)
        if (task.user.toString() !== req.user._id.toString()) {
             return res.status(403).json({ message: "Không có quyền truy cập" });
        }

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

// 📥 XUẤT FILE EXCEL CHO USER (Chỉ lấy task của chính họ)
export const exportMyTasksToExcel = async (req, res) => {
    try {
        // 1. Lấy ID người dùng đang đăng nhập
        const userId = req.user._id;

        // 2. Tìm task của RIÊNG người dùng đó
        const tasks = await Task.find({ user: userId }).sort({ createdAt: -1 });

        // 3. Tạo File Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Công việc của tôi');

        // 4. Định nghĩa cột
        worksheet.columns = [
            { header: 'Tiêu đề', key: 'title', width: 30 },
            { header: 'Mô tả', key: 'desc', width: 40 },
            { header: 'Trạng thái', key: 'status', width: 15 },
            { header: 'Độ ưu tiên', key: 'priority', width: 15 },
            { header: 'Hạn chót', key: 'deadline', width: 20 },
            { header: 'Ngày tạo', key: 'createdAt', width: 20 }
        ];

        // 5. Thêm dữ liệu
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

        // Style dòng tiêu đề cho đẹp
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF6B21A8' } // Màu tím giống theme web của bạn
        };

        // 6. Trả về file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=my_tasks.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).json({ message: "Lỗi khi xuất file Excel" });
    }
};