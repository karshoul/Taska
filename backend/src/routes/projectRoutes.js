import express from 'express';
import { protect } from '../middleWare/authMiddleware.js';
import { 
    createProject, 
    getProjects,       
    getProjectById,    
    updateProject,      
    deleteProject, 
    inviteMemberToProject, // ✅ Sửa tên import
    respondToProjectInvite // ✅ Thêm hàm mới
} from '../controllers/projectController.js';

const router = express.Router();

// Tất cả các route bên dưới đều yêu cầu đăng nhập
router.use(protect); 

// 1. Lấy danh sách & Tạo dự án
router.route('/')
    .get(getProjects)       
    .post(createProject);

// 2. Route xử lý việc Gửi lời mời
router.post('/:id/invite', inviteMemberToProject);

// 3. Route xử lý việc Đồng ý / Từ chối (Lưu ý: :notificationId không phải :id của dự án)
router.put('/invite/:notificationId', respondToProjectInvite);

// 4. Các thao tác với ID dự án cụ thể (Xem, Sửa, Xóa) 
// (Nên để route /:id ở dưới cùng để tránh bị nhầm lẫn đường dẫn)
router.route('/:id')
    .get(getProjectById)    
    .put(updateProject)     
    .delete(deleteProject); 

export default router;