import mongoose from "mongoose";

// 1. Schema con cho Bình luận (Comment) - Giống GitHub Issue Comment
const commentSchema = new mongoose.Schema({
  user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
  },
  content: { type: String, required: true }, // Nội dung chat
  createdAt: { type: Date, default: Date.now }
});

// 2. Schema con cho Lịch sử hoạt động (Activity Log) - Giống GitHub Timeline
const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Ai thực hiện?
  action: { type: String, required: true }, // Hành động (Vd: "Đổi trạng thái")
  details: { type: String }, // Chi tiết (Vd: "Từ In Progress -> In Review")
  timestamp: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    attachments: [{
      name: { type: String },      // Tên file: "Bao-cao.docx"
      url: { type: String },       // Link file từ Cloudinary/Server: "https://..."
      fileType: { type: String },  // Định dạng: "image/png", "application/pdf"...
      public_id: { type: String }  // ID để sau này sếp muốn xóa file trên Cloudinary
    }],
    
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // 🔗 Bắt buộc thuộc về 1 Project
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false, // 👈 ĐỔI THÀNH FALSE
        default: null,   // 👈 THÊM MẶC ĐỊNH NULL
    },
    
    // ✍️ Người tạo task (Reporter)
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    // 👤 Người thực hiện (Assignee)
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null 
    },

    // 🔥 TAGS: Dùng để khớp với Skill của User (Smart Assign)
    tags: [{ type: String, trim: true }],

    // 🔗 DEPENDENCIES: Logic Workflow
    dependencies: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Task" 
    }],

    deadline: {
      type: Date,
      default: null,
    },
    collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
}],

    // 🔥 CẬP NHẬT STATUS (QUY TRÌNH DUYỆT BÀI)
    // Thay đổi từ 'active' sang chuẩn Agile/GitHub hơn
    status: {
      type: String,
      enum: ["To Do", "In Progress", "In Review", "Done", "Backlog"], 
      default: "To Do",
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // 🔥 HAI TRƯỜNG MỚI QUAN TRỌNG:
    comments: [commentSchema], 
    activities: [activitySchema],

    // --- CÁC TRƯỜNG CŨ GIỮ NGUYÊN ---
    completedAt: { type: Date, default: null },
    isTemplate: { type: Boolean, default: false },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    recurrence: {
      frequency: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none',
      },
    },
    nextInstanceDate: { type: Date, default: null },
    isReminded: { type: Boolean, default: false },
    isPersonal: {
        type: Boolean,
        default: false
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 MIDDLEWARE QUAN TRỌNG:
// Mỗi khi tìm Task, tự động lấy luôn tên + avatar của người comment
// Giúp Frontend hiển thị đẹp ngay lập tức mà không cần gọi thêm API
taskSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'comments.user',
        select: 'name avatar email'
    });
    next();
});

// Index tìm kiếm nhanh
taskSchema.index({ project: 1, assignee: 1, status: 1 });

const Task = mongoose.model("Task", taskSchema);
export default Task;