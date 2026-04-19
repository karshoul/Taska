import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    CheckCircle2, Users, CalendarDays, History, 
    Rocket, Zap, Sparkles, BrainCircuit, ArrowRight, 
    Target, LayoutDashboard, FileText, ShieldCheck, MousePointer2
} from "lucide-react";

// --- ANIMATION VARIANTS ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

const scrollVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: {
        y: 0, opacity: 1,
        transition: { type: "spring", bounce: 0.4, duration: 1 }
    }
};

const IntroPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" />,
            title: "Quản lý Kanban",
            desc: "Kéo thả task thông minh, phân loại trạng thái trực quan giúp bao quát toàn bộ tiến độ dự án.",
            color: "hover:border-emerald-200 hover:bg-emerald-50/30"
        },
        {
            icon: <BrainCircuit className="w-7 h-7 text-indigo-600" />,
            title: "Trợ lý AI Thông minh",
            desc: "Tự động lập kế hoạch chi tiết từ mục tiêu của bạn. Tăng năng suất gấp 10 lần với klapeisix Bot.",
            color: "hover:border-indigo-200 hover:bg-indigo-50/30"
        },
        {
            icon: <Users className="w-7 h-7 text-blue-500" />,
            title: "Workspace Nhóm",
            desc: "Không gian làm việc chung chuyên nghiệp, mời thành viên và cộng tác thời gian thực dễ dàng.",
            color: "hover:border-blue-200 hover:bg-blue-50/30"
        },
        {
            icon: <FileText className="w-7 h-7 text-orange-500" />,
            title: "Taska Docs",
            desc: "Soạn thảo tài liệu trực tuyến ngay trong ứng dụng, liên kết trực tiếp vào từng đầu việc cụ thể.",
            color: "hover:border-orange-200 hover:bg-orange-50/30"
        },
    ];

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#FDFDFF] font-sans text-gray-900 selection:bg-indigo-100">
            
            {/* ✨ BACKGROUND EFFECTS ✨ */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[140px]" />
                <div className="absolute bottom-[5%] left-[-10%] w-[700px] h-[700px] bg-purple-200/30 rounded-full blur-[140px]" />
            </div>

            {/* 🧭 NAVBAR */}
            <nav className="relative z-50 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2.5 font-black text-2xl tracking-tighter text-gray-900">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-indigo-200 shadow-lg">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    TASKA
                </div>
                <div className="flex items-center gap-3 md:gap-6">
                    <button onClick={() => navigate("/login")} className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-all">
                        Đăng nhập
                    </button>
                    <button 
                        onClick={() => navigate("/register")} 
                        className="px-6 py-3 text-sm font-black text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95"
                    >
                        DÙNG MIỄN PHÍ
                    </button>
                </div>
            </nav>

            {/* 🚀 HERO SECTION */}
            <motion.header 
                className="relative z-10 max-w-7xl mx-auto px-8 pt-12 pb-24 lg:pt-20 lg:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
                initial="hidden" animate="visible" variants={containerVariants}
            >
                <div className="space-y-8 text-center lg:text-left">
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-black uppercase tracking-widest text-indigo-600">
                        <Sparkles className="w-3.5 h-3.5 fill-indigo-600 animate-pulse" /> 
                        The Future of Productivity
                    </motion.div>
                    
                    <motion.h1 variants={itemVariants} className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05] text-gray-900">
                        Làm việc thông minh. <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">Kiến tạo tương lai.</span>
                    </motion.h1>
                    
                    <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                        Taska là nền tảng quản trị công việc toàn diện, kết hợp sức mạnh của <b>AI</b> và quy trình <b>Agile</b> để đưa hiệu suất của bạn lên một tầm cao mới.
                    </motion.p>
                    
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <button onClick={() => navigate("/register")} className="px-10 py-5 text-lg font-black text-white bg-gray-900 rounded-[2rem] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 group">
                            Bắt đầu ngay <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                        <button onClick={() => navigate("/login")} className="px-10 py-5 text-lg font-bold text-gray-700 bg-white border-2 border-gray-100 rounded-[2rem] hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                            Xem bản Demo
                        </button>
                    </motion.div>

                    {/* Stats Counter */}
                    <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6 pt-12 border-t border-gray-100">
                        <div>
                            <h4 className="text-3xl font-black text-indigo-600">10k+</h4>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Tasks Done</p>
                        </div>
                        <div>
                            <h4 className="text-3xl font-black text-purple-600">500+</h4>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Projects</p>
                        </div>
                        <div>
                            <h4 className="text-3xl font-black text-emerald-500">99%</h4>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Efficiency</p>
                        </div>
                    </motion.div>
                </div>

                {/* Visual Mockup */}
                <motion.div variants={itemVariants} className="relative hidden lg:block group">
                    <div className="absolute inset-0 bg-indigo-500 rounded-[3rem] rotate-3 opacity-10 blur-3xl group-hover:rotate-6 transition-transform duration-700"></div>
                    <div className="relative bg-white border border-gray-100 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] p-8 transform -rotate-2 hover:rotate-0 transition-all duration-700">
                        <div className="space-y-5">
                            <div className="flex justify-between items-center mb-6">
                                <div className="h-4 w-32 bg-gray-100 rounded-full"></div>
                                <div className="flex gap-2">
                                    <div className="h-6 w-6 bg-indigo-100 rounded-full"></div>
                                    <div className="h-6 w-6 bg-purple-100 rounded-full"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-3">
                                    <div className="h-3 w-16 bg-indigo-200 rounded"></div>
                                    <div className="h-16 bg-white rounded-xl shadow-sm border-l-4 border-indigo-500"></div>
                                    <div className="h-12 bg-white rounded-xl shadow-sm"></div>
                                </div>
                                <div className="bg-gray-50/50 p-4 rounded-2xl space-y-3">
                                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                    <div className="h-20 bg-white rounded-xl shadow-sm border-l-4 border-emerald-400"></div>
                                    <div className="h-10 bg-white rounded-xl shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                        {/* Floating Element */}
                        <div className="absolute -bottom-10 -right-10 bg-white p-5 rounded-[2rem] shadow-2xl border border-gray-100 flex items-center gap-4 animate-bounce-slow">
                            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200"><BrainCircuit size={24}/></div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase">AI Engine</p>
                                <p className="text-sm font-bold text-gray-800 italic">Optimized by AI</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.header>

            {/* 🛠️ FEATURES SECTION */}
            <motion.section 
                initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.2 }} variants={scrollVariants}
                className="relative z-10 py-24 px-8 max-w-7xl mx-auto"
            >
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight italic">Tất cả trong một không gian.</h2>
                    <p className="text-lg text-gray-500 font-medium italic">Không còn phải chuyển đổi giữa hàng chục ứng dụng rác. Taska có mọi thứ sếp cần.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((f, idx) => (
                        <motion.div 
                            key={idx}
                            whileHover={{ y: -12, scale: 1.02 }}
                            className={`p-10 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-500 relative group cursor-default ${f.color}`}
                        >
                            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-8 group-hover:rotate-12 transition-transform">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight">{f.title}</h3>
                            <p className="text-gray-500 leading-relaxed text-sm font-medium">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* 🛡️ ADMIN & SECURITY SECTION (New) */}
            <section className="py-24 bg-gray-50 border-y border-gray-100 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="order-2 lg:order-1 relative">
                        <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-900 p-6 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono">admin_dashboard_v2.log</div>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="h-6 w-full bg-gray-100 rounded-lg animate-pulse"></div>
                                <div className="h-6 w-3/4 bg-gray-100 rounded-lg animate-pulse"></div>
                                <div className="flex gap-4">
                                    <div className="h-24 w-1/2 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                        <ShieldCheck size={32} className="text-indigo-600" />
                                    </div>
                                    <div className="h-24 w-1/2 bg-purple-50 rounded-2xl flex items-center justify-center">
                                        <LayoutDashboard size={32} className="text-purple-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 space-y-8">
                        <div className="w-16 h-1 bg-indigo-600"></div>
                        <h2 className="text-4xl font-black text-gray-900 leading-tight italic">Quản trị tối cao. <br/>An toàn tuyệt đối.</h2>
                        <p className="text-lg text-gray-500 font-medium">Hệ thống Admin Dashboard mạnh mẽ cho phép điều phối tài nguyên, giám sát sức khỏe hệ thống và bảo mật dữ liệu cấp độ doanh nghiệp.</p>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex gap-3 items-center font-bold text-sm text-gray-700">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div> Audit Logs
                            </div>
                            <div className="flex gap-3 items-center font-bold text-sm text-gray-700">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div> Backup System
                            </div>
                            <div className="flex gap-3 items-center font-bold text-sm text-gray-700">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div> Health Check
                            </div>
                            <div className="flex gap-3 items-center font-bold text-sm text-gray-700">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div> Multi-Role
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 📣 CTA FOOTER */}
            <section className="py-24 px-8">
                <div className="max-w-5xl mx-auto bg-indigo-600 rounded-[4rem] p-16 text-center text-white shadow-[0_40px_80px_-15px_rgba(79,70,229,0.3)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 to-purple-800"></div>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <svg width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0h100v100H0z" fill="url(#a)" />
                            <defs><pattern id="a" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#fff" /></pattern></defs>
                        </svg>
                    </div>
                    
                    <div className="relative z-10 space-y-10">
                        <h2 className="text-4xl md:text-6xl font-black leading-none tracking-tight italic">
                            Sẵn sàng làm chủ <br className="hidden md:block" /> vận mệnh công việc?
                        </h2>
                        <div className="pt-6">
                            <button onClick={() => navigate("/register")} className="px-12 py-6 bg-white text-indigo-700 font-black text-xl rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-4 mx-auto">
                                BẮT ĐẦU NGAY <Rocket size={24} />
                            </button>
                        </div>
                        <p className="text-indigo-100/60 text-xs font-bold uppercase tracking-[0.3em]">Join 1,000+ users today</p>
                    </div>
                </div>
            </section>

            {/* 🏁 FOOTER */}
            <footer className="py-12 text-center border-t border-gray-100 bg-white">
                <div className="flex justify-center gap-8 mb-6">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors">Facebook</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors">GitHub</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors">Contact</span>
                </div>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-loose">
                    © {new Date().getFullYear()} TASKA PRODUCTIONS. <br/>
                    ENGINEERED BY KHUONG. MADE WITH PASSION.
                </p>
            </footer>
        </div>
    );
};

export default IntroPage;