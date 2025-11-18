import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Tham chiếu đến model User
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "", // 🔹 mặc định rỗng nếu không nhập
    },
    deadline: {
      type: Date,
      default: null, // 🔹 có thể để null nếu không có deadline
    },
    status: {
      type: String,
      enum: ["active", "complete","backlog"],
      default: "active",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      frequency: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none',
      },
    },
    nextInstanceDate: {
      type: Date,
      default: null,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project', // Tham chiếu đến model 'Project' chúng ta sắp tạo
        default: null,  // Cho phép task không thuộc dự án nào
    },
    
  },
  {
    timestamps: true, // createdAt và updatedAt tự động thêm vào
  }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
