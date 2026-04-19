import mongoose from 'mongoose';

/**
 * Workspace Model - Hệ điều hành quản trị dự án Taska
 * Lưu ý: File này quản lý cả danh sách Dự án và Thành viên (Cộng sự)
 */
const WorkspaceSchema = new mongoose.Schema({
  // Tên của Workspace (Ví dụ: Công ty A, Nhóm Đồ Án...)
  name: { 
    type: String, 
    default: "My Workspace",
    trim: true 
  },

  // Chủ sở hữu tối cao của Workspace
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },

  // DANH SÁCH DỰ ÁN (PROJECTS)
  projects: [{ 
    name: { 
      type: String, 
      required: true,
      trim: true 
    }, 
    color: { 
      type: String, 
      default: '#4f46e5' // Màu sắc định danh dự án
    },
    status: { 
      type: String, 
      enum: ['active', 'archived', 'completed'], 
      default: 'active' 
    },
    
    // 🔥 CHIÊU CUỐI: Cộng sự tham gia riêng cho từng dự án
    // Giúp sếp biết "Dự án A có những ai làm"
    members: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],

  // DANH SÁCH CỘNG SỰ CHUNG (MEMBERS)
  // Quản lý tất cả những người có quyền truy cập vào Workspace này
  members: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    role: { 
      type: String, 
      enum: ['admin', 'member', 'viewer'], 
      default: 'member' 
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, { 
  // Tự động tạo createdAt và updatedAt cho cả Workspace
  timestamps: true 
});

// Tạo Index để tìm kiếm nhanh hơn khi dữ liệu bùng nổ
WorkspaceSchema.index({ owner: 1 });
WorkspaceSchema.index({ "members.user": 1 });

const Workspace = mongoose.model('Workspace', WorkspaceSchema);

export default Workspace;