import mongoose from 'mongoose'

export const connectDB = async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_CONNECTSTRING
        )

        console.log("Liên kết cơ sở dữ liệu thành công!!!")
    } catch (err) {
        console.error("Lỗi khi kết nối cơ sở dữ liệu", err)
        process.exit(1);
    }
}