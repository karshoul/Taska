// file: middleWare/errorMiddleware.js

// Middleware 404: Bắt các route không tìm thấy
const notFound = (req, res, next) => {
    const error = new Error(`Không tìm thấy - ${req.originalUrl}`);
    res.status(404);
    next(error); // Chuyển lỗi xuống errorHandler
};

// Middleware Xử lý Lỗi Toàn cục
const errorHandler = (err, req, res, next) => {
    // Đôi khi lỗi có statusCode 200, ta cần đổi nó sang 500
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Xử lý các lỗi cụ thể của Mongoose
    if (err.name === 'ValidationError') {
        statusCode = 400; // Bad Request
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Không tìm thấy tài nguyên';
    }
    if (err.code === 11000) { // Lỗi trùng lặp (duplicate key)
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `Trường ${field} đã tồn tại. Vui lòng sử dụng giá trị khác.`;
    }

    res.status(statusCode).json({
        message: message,
        // Chỉ hiện stack trace nếu đang ở môi trường 'development'
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export { notFound, errorHandler };