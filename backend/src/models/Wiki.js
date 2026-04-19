import mongoose from 'mongoose'; // Chuyển từ require sang import

const WikiSchema = new mongoose.Schema({
  title: { 
    type: String, 
    default: "Tài liệu mới",
    trim: true 
  },
  docId: { 
    type: String, 
    required: true, 
    unique: true // ID để share link và map với Firebase
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  collaborators: [
    { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }
  ],
  lastEditor: { 
    type: String, 
    default: "Sếp Tổng" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Kiểm tra xem model đã tồn tại chưa để tránh lỗi OverwriteModelError khi hot-reload
const Wiki = mongoose.models.Wiki || mongoose.model('Wiki', WikiSchema);

export default Wiki;