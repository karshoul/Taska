import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Kết nối với Cloudinary bằng các thông số trong .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình kho lưu trữ (Tạo sẵn 1 folder tên Taska_Avatars trên mây)
// config/cloudinary.js
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Taska_Attachments', 
        resource_type: 'auto', // 🔥 Quan trọng: Cho phép upload cả file (raw) lẫn ảnh
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'xlsx', 'pptx', 'txt']
    }
});

// Xuất ra middleware upload để dùng
export const upload = multer({ storage: storage });