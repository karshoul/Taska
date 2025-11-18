import React from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion"; // <-- Import motion
import {
    CheckCircle,
    Users,
    Calendar,
    History,
    Rocket,
    ListTodo,
    Zap, // Icon mới cho khối trích dẫn
    Quote, // Icon trích dẫn
} from "lucide-react";

// Định nghĩa các biến thể animation (Giữ nguyên)
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
        },
    },
};

const IntroPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-pink-600" />,
            title: "Quản lý công việc",
            desc: "Tạo, sắp xếp và đánh dấu công việc hoàn thành nhanh chóng, trực quan.",
        },
        {
            icon: <Users className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />,
            title: "Làm việc nhóm",
            desc: "Chia sẻ nhiệm vụ, phân công công việc và cùng nhau theo dõi tiến độ.",
        },
        {
            icon: <Calendar className="w-8 h-8 md:w-10 md:h-10 text-green-600" />,
            title: "Lên kế hoạch",
            desc: "Sắp xếp công việc theo ngày, tuần, tháng để không bỏ lỡ deadline.",
        },
        {
            icon: <History className="w-8 h-8 md:w-10 md:h-10 text-yellow-600" />,
            title: "Xem lại lịch sử",
            desc: "Theo dõi quá trình hoàn thành và phân tích hiệu suất làm việc.",
        },
    ];

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-slate-50">
            
            {/* Aurora background */}
            <div
                className="absolute inset-0 z-0 opacity-80"
                style={{
                    background: `
                        radial-gradient(ellipse 85% 65% at 8% 8%, rgba(175, 109, 255, 0.42), transparent 60%),
                        radial-gradient(ellipse 75% 60% at 75% 35%, rgba(255, 235, 170, 0.55), transparent 62%),
                        radial-gradient(ellipse 70% 60% at 15% 80%, rgba(255, 100, 180, 0.40), transparent 62%),
                        radial-gradient(ellipse 70% 60% at 92% 92%, rgba(120, 190, 255, 0.45), transparent 62%),
                        linear-gradient(180deg, #f7faff 0%, #fff 100%)
                    `,
                }}
            />

            {/* Hero section */}
            <motion.header 
                className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-6 text-center"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                
            >
                
                <motion.div variants={itemVariants} className="mb-4">
                    <span className="inline-flex items-center gap-2 px-4 py-1 text-sm font-medium text-pink-600 bg-pink-100 rounded-full shadow-md">
                        <Rocket className="w-4 h-4" /> Bắt đầu cuộc sống năng suất mới!
                    </span>
                </motion.div>
                
                <motion.h1 
                variants={itemVariants}
                className="mb-6 text-5xl font-extrabold md:text-7xl leading-tight tracking-tighter max-w-5xl" 
            >
                <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2"> 
                    
                    <span className="inline-flex items-center space-x-3 sm:space-x-4">
                        <ListTodo 
                            className="w-10 h-10 sm:w-12 sm:h-12 text-white p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl flex-shrink-0"
                        />
                        <span
                            className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 font-extrabold"
                        >
                            Taska
                        </span>
                    </span> 
                    
                    <span className="text-gray-900">
                             Quản lý công việc thông minh
                    </span>
                </div>
            </motion.h1>
                
                <motion.p 
                    variants={itemVariants} 
                    className="max-w-3xl mb-10 text-xl text-gray-600"
                >
                    Ứng dụng giúp bạn theo dõi, sắp xếp và hoàn thành mục tiêu công việc
                    cá nhân lẫn nhóm, trực quan và hiệu quả.
                </motion.p>
                
                <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
                    <button
                        onClick={() => navigate("/login")}
                        className="px-10 py-4 text-lg font-bold text-white transition-all duration-300 transform bg-purple-600 rounded-xl shadow-lg hover:bg-purple-700 hover:shadow-xl hover:scale-[1.02]"
                    >
                        Bắt đầu với Taska
                    </button>
                    <button
                        onClick={() => navigate("/register")}
                        className="px-10 py-4 text-lg font-bold text-purple-600 transition-all duration-300 transform bg-white border-2 border-purple-600 rounded-xl shadow-lg hover:bg-purple-50 hover:shadow-xl hover:scale-[1.02]"
                    >
                        Tạo tài khoản mới
                    </button>
                </motion.div>
            </motion.header>

            {/* --- */}

            {/* Features section (Giữ nguyên) */}
            <section className="relative z-10 py-24 bg-white/70 backdrop-blur-lg">
                <h2 className="mb-16 text-4xl font-extrabold text-center text-gray-800">
                    Tập trung vào điều quan trọng nhất
                </h2>
                
                <motion.div 
                    className="grid max-w-6xl gap-8 px-6 mx-auto sm:grid-cols-2 lg:grid-cols-4"
                    initial="hidden"
                    whileInView="visible" 
                    viewport={{ once: true, amount: 0.3 }}
                    variants={containerVariants}
                >
                    {features.map((f, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="flex flex-col items-center p-8 text-center bg-white rounded-3xl shadow-xl hover:shadow-2xl hover:border-purple-300 border-2 border-transparent transition-all duration-300"
                        >
                            <div className="p-3 mb-4 rounded-full bg-slate-100">{f.icon}</div>
                            <h3 className="mt-2 text-xl font-bold text-gray-800">
                                {f.title}
                            </h3>
                            <p className="mt-3 text-base text-gray-500">{f.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* --- */}

            {/* ABOUT SECTION ĐÃ CHỈNH SỬA - Thêm khối Trích dẫn/Minh họa */}
            <section className="relative z-10 py-24 text-white bg-gradient-to-br from-purple-700 to-pink-600">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    
                    {/* Cột 1: Nội dung chính */}
                    <div className="space-y-6 text-center lg:text-left">
                        <h2 className="text-4xl font-extrabold flex items-center justify-center lg:justify-start gap-3">
                            <Zap className="w-8 h-8 text-yellow-300" /> Hiệu suất cao, ít căng thẳng
                        </h2>
                        
                        <p className="text-xl text-purple-200">
                            Taska không chỉ là một công cụ quản lý công việc, mà còn là **người bạn
                            đồng hành** giúp bạn tập trung, sắp xếp khoa học và đạt được hiệu suất
                            cao nhất trong học tập, công việc và cuộc sống.
                        </p>

                        <button
                            onClick={() => navigate("/register")}
                            className="px-10 py-4 text-lg font-bold text-purple-700 bg-white rounded-xl shadow-2xl hover:bg-gray-100 transition-transform transform hover:scale-[1.05]"
                        >
                            Khám phá Taska ngay hôm nay
                        </button>
                    </div>

                    {/* Cột 2: Trích dẫn/Lời chứng thực nổi bật */}
                    <motion.div 
                        className="p-8 bg-white/20 rounded-2xl backdrop-blur-sm shadow-2xl border-2 border-white/50 space-y-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        viewport={{ once: true, amount: 0.5 }}
                    >
                        <Quote className="w-10 h-10 text-white/80" />
                        <p className="text-xl italic font-light text-white leading-relaxed">
                            "Dùng Taska sẽ giúp bạn tăng năng suất lên cao nhất để có thể để cạnh tranh với đối thủ của bạn !!!."
                        </p>
                        <div className="pt-2 text-right">
                            <p className="font-semibold text-white">- Khuong Lap -</p>
                            <p className="text-sm text-purple-200">Quản lý Dự án</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- */}

            {/* Footer */}
            <footer className="relative z-10 py-6 text-center text-gray-500 bg-white/90 backdrop-blur-md border-t border-gray-100">
                © {new Date().getFullYear()} Taska. Được xây dựng với đam mê.
            </footer>
        </div>
    );
};

export default IntroPage;