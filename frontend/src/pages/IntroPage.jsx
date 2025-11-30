import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    CheckCircle2, Users, CalendarDays, History, 
    Rocket, Zap, Sparkles, BrainCircuit, ArrowRight, Target
} from "lucide-react";

// --- ANIMATION VARIANTS ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

const IntroPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
            title: "Quản lý công việc",
            desc: "Sắp xếp task khoa học với giao diện Kanban trực quan. Kéo thả mượt mà, cập nhật tức thì.",
            color: "bg-green-50 border-green-100"
        },
        {
            icon: <BrainCircuit className="w-8 h-8 text-purple-500" />,
            title: "AI Trợ lý thông minh",
            desc: "Bí ý tưởng? Hãy để AI gợi ý kế hoạch chi tiết chỉ trong 1 giây. Tăng tốc độ làm việc gấp 10 lần.",
            color: "bg-purple-50 border-purple-100"
        },
        {
            icon: <CalendarDays className="w-8 h-8 text-blue-500" />,
            title: "Lịch & Nhắc nhở",
            desc: "Không bao giờ trễ hạn với hệ thống Lịch biểu tích hợp và Thông báo tự động qua Email.",
            color: "bg-blue-50 border-blue-100"
        },
        {
            icon: <History className="w-8 h-8 text-orange-500" />,
            title: "Thống kê hiệu suất",
            desc: "Biểu đồ trực quan giúp bạn nhìn lại chặng đường đã qua và tối ưu hóa năng suất mỗi ngày.",
            color: "bg-orange-50 border-orange-100"
        },
    ];

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#F8F9FC] font-sans text-gray-800 selection:bg-indigo-100">
            
            {/* BACKGROUND EFFECTS */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-[120px]" />
            </div>

            {/* HEADER / NAVBAR */}
            <nav className="relative z-20 flex justify-between items-center px-6 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2 font-bold text-2xl text-gray-900">
                    <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    Taska
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate("/login")} className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition px-4 py-2">
                        Đăng nhập
                    </button>
                    <button onClick={() => navigate("/register")} className="hidden sm:block px-5 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        Đăng ký miễn phí
                    </button>
                </div>
            </nav>

            {/* HERO SECTION */}
            <motion.header 
                className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                initial="hidden" animate="visible" variants={containerVariants}
            >
                {/* Left Content */}
                <div className="space-y-8 text-center lg:text-left">
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm text-sm font-bold text-indigo-600">
                        <Sparkles className="w-4 h-4 fill-indigo-600" /> 
                        Nền tảng quản lý công việc thế hệ mới
                    </motion.div>
                    
                    <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                        Biến ý tưởng thành <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">hành động thực tế.</span>
                    </motion.h1>
                    
                    <motion.p variants={itemVariants} className="text-xl text-gray-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Taska giúp bạn tổ chức công việc, theo dõi tiến độ và đạt được mục tiêu nhanh hơn nhờ sự hỗ trợ của <b>Trí tuệ nhân tạo (AI)</b>.
                    </motion.p>
                    
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <button onClick={() => navigate("/register")} className="px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl hover:shadow-purple-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                            Bắt đầu ngay <ArrowRight className="w-5 h-5" />
                        </button>
                        <button onClick={() => navigate("/login")} className="px-8 py-4 text-lg font-bold text-gray-700 bg-white border-2 border-gray-100 rounded-2xl hover:border-indigo-100 hover:bg-indigo-50 transition-all">
                            Đã có tài khoản?
                        </button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-gray-400 text-sm font-medium">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> Miễn phí trọn đời</div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> Không cần thẻ tín dụng</div>
                    </motion.div>
                </div>

                {/* Right Image (Mockup) */}
                <motion.div variants={itemVariants} className="relative hidden lg:block">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[3rem] rotate-6 opacity-20 blur-2xl"></div>
                    <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-2xl p-6 transform -rotate-3 hover:rotate-0 transition duration-500">
                        {/* Fake UI Representation */}
                        <div className="space-y-4 select-none pointer-events-none">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
                                <div className="flex gap-2">
                                    <div className="h-8 w-8 bg-purple-100 rounded-full"></div>
                                    <div className="h-8 w-8 bg-gray-100 rounded-full"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 h-64 rounded-2xl p-3 space-y-3">
                                    <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                                    <div className="bg-white p-3 rounded-xl shadow-sm h-20"></div>
                                    <div className="bg-white p-3 rounded-xl shadow-sm h-24 border-l-4 border-red-400"></div>
                                </div>
                                <div className="bg-indigo-50/50 h-64 rounded-2xl p-3 space-y-3">
                                    <div className="h-4 w-20 bg-indigo-200 rounded mb-2"></div>
                                    <div className="bg-white p-3 rounded-xl shadow-sm h-28 border-l-4 border-yellow-400"></div>
                                </div>
                                <div className="bg-gray-50 h-64 rounded-2xl p-3 space-y-3">
                                    <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                                    <div className="bg-white p-3 rounded-xl shadow-sm h-16 border-l-4 border-green-400 opacity-60"></div>
                                    <div className="bg-white p-3 rounded-xl shadow-sm h-20 border-l-4 border-green-400 opacity-60"></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce-slow">
                            <div className="p-3 bg-green-100 rounded-full text-green-600"><CheckCircle2 className="w-6 h-6"/></div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Hiệu suất</p>
                                <p className="text-lg font-extrabold text-gray-800">+145%</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.header>

            {/* FEATURES GRID */}
            <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Tất cả công cụ bạn cần</h2>
                    <p className="text-lg text-gray-500">Đơn giản hóa quy trình làm việc phức tạp với bộ công cụ mạnh mẽ của Taska.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((f, idx) => (
                        <motion.div 
                            key={idx}
                            whileHover={{ y: -5 }}
                            className={`p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl transition-all duration-300 ${f.color} bg-opacity-20`}
                        >
                            <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">{f.title}</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* AI SECTION (ĐIỂM NHẤN) */}
            <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-purple-600/20 blur-[100px] rounded-full"></div>
                
                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sm font-bold text-purple-300 mb-8">
                        <Sparkles className="w-4 h-4" /> Tính năng độc quyền
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                        Gặp gỡ <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Taska AI</span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        Không còn phải đau đầu suy nghĩ "Bắt đầu từ đâu?". Chỉ cần nhập mục tiêu, AI sẽ tự động lên kế hoạch chi tiết từng bước cho bạn.
                    </p>
                    
                    {/* AI DEMO BOX */}
                    <div className="bg-gray-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-3xl mx-auto text-left shadow-2xl">
                        <div className="flex gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                                <BrainCircuit className="w-6 h-6 text-white" />
                            </div>
                            <div className="bg-gray-700/50 rounded-2xl rounded-tl-none p-4 text-gray-200 text-sm">
                                "Hãy lập kế hoạch học ReactJS trong 3 bước."
                            </div>
                        </div>
                        <div className="flex gap-4 justify-end">
                            <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl rounded-tr-none p-4 text-white text-sm w-fit">
                                <p className="font-bold text-indigo-300 mb-2 flex items-center gap-2"><Zap className="w-3 h-3"/> Gợi ý từ AI:</p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div> Tìm hiểu cú pháp ES6 & JSX</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div> Học về Components, Props và State</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div> Thực hành làm một To-do List đơn giản</li>
                                </ul>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION (QUOTE) */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    
                    <div className="relative z-10 space-y-6">
                        <Target className="w-12 h-12 mx-auto text-yellow-300 opacity-80" />
                        <h2 className="text-3xl md:text-4xl font-bold leading-snug">
                            "Đừng để công việc kiểm soát bạn. <br/> Hãy để Taska giúp bạn kiểm soát công việc."
                        </h2>
                        <div className="pt-4">
                            <button onClick={() => navigate("/register")} className="px-10 py-4 bg-white text-indigo-700 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                Tham gia miễn phí ngay
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-200 bg-white">
                <p>© {new Date().getFullYear()} Taska. Sản phẩm đồ án tâm huyết.</p>
            </footer>
        </div>
    );
};

export default IntroPage;