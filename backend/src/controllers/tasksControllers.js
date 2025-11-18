import Task from "../models/Task.js";

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
    // ❌ Đã xóa 'tags'
    const { title, description, deadline, status, recurrence, project } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Tiêu đề không được để trống" });
    }

    if (recurrence && recurrence.frequency && recurrence.frequency !== 'none') {
      const firstInstanceDate = deadline ? new Date(deadline) : new Date();
      let nextDate = new Date(firstInstanceDate);
      if (recurrence.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      if (recurrence.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      if (recurrence.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

      const templateTask = new Task({
        user: req.user._id,
        title,
        description,
        project,
        // ❌ Đã xóa 'tags'
        isTemplate: true,
        recurrence: recurrence,
        nextInstanceDate: nextDate,
        status: 'active',
      });
      await templateTask.save();

      const firstInstance = new Task({
        user: req.user._id,
        title,
        description,
        project,
        // ❌ Đã xóa 'tags'
        deadline: firstInstanceDate,
        status: status || 'active',
        isTemplate: false,
        templateId: templateTask._id,
      });
      
      const newInstance = await firstInstance.save();
      res.status(201).json(newInstance);

    } else {
      const task = new Task({
        user: req.user._id,
        title,
        description,
        project,
        // ❌ Đã xóa 'tags'
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
    // ❌ Đã xóa 'tags'
    const { title, description, deadline, status, completedAt, project } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (status !== undefined) updateData.status = status;
    if (completedAt !== undefined) updateData.completedAt = completedAt;
    if (project !== undefined) updateData.project = project;
    // ❌ Đã xóa 'tags'

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