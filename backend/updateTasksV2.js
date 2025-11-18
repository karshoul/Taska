import mongoose from 'mongoose';
import dotenv from 'dotenv';
// ✅ SỬA LẠI ĐƯỜNG DẪN NÀY
import Task from './src/models/Task.js'; 

dotenv.config();

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_CONNECTSTRING) {
            throw new Error('Không tìm thấy biến MONGO_URI trong file .env');
        }
        const conn = await mongoose.connect(process.env.MONGODB_CONNECTSTRING);
        console.log(`✅ MongoDB đã kết nối: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`);
        process.exit(1);
    }
};

const updateExistingTasks = async () => {
    await connectDB();

    try {
        console.log('🚀 Bắt đầu cập nhật trường Project và Tags cho Tasks...');

        // Tìm tất cả task CHƯA có trường "project"
        const result = await Task.updateMany(
            { project: { $exists: false } }, // Điều kiện: chỉ chọn task chưa có trường 'project'
            { 
                $set: { 
                    project: null,  // Thêm project: null
                    tags: []        // Thêm tags: []
                } 
            }
        );

        console.log('-------------------------------------------');
        console.log('🎉 CẬP NHẬT HOÀN TẤT! 🎉');
        console.log(`- Đã tìm thấy: ${result.matchedCount} công việc cần cập nhật.`);
        console.log(`- Đã cập nhật thành công: ${result.modifiedCount} công việc.`);
        console.log('-------------------------------------------');
        
        if (result.matchedCount === 0) {
            console.log('ℹ️ Tất cả công việc đã có trường "project" và "tags".');
        }

    } catch (error) {
        console.error('💥 Đã xảy ra lỗi trong quá trình cập nhật:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB.');
        process.exit(0);
    }
};

// Chạy hàm cập nhật
updateExistingTasks();