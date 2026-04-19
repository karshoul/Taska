import express from 'express';
import { 
    getMyWikis, 
    createWiki, 
    updateWikiTitle, 
    deleteWiki,
    joinWiki // 🔥 Thêm hàm này từ Controller vào
} from '../controllers/wikiController.js';
import { protect } from '../middleWare/authMiddleware.js';

const router = express.Router();

// Tất cả các route này đều cần đăng nhập (protect)
router.route('/').get(protect, getMyWikis);
router.route('/create').post(protect, createWiki);

// 🔥 THÊM ROUTE NÀY: Để cộng sự nhập mã và lưu vào Dashboard của họ
router.route('/join').post(protect, joinWiki); 

router.route('/update/:docId').put(protect, updateWikiTitle);
router.route('/:docId').delete(protect, deleteWiki);

export default router;