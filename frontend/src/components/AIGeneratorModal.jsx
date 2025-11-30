import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Plus, Loader2, CheckCircle2, Circle, BrainCircuit, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

const AIGeneratorModal = ({ isOpen, onClose, onAddTasks }) => {
    const [goal, setGoal] = useState("");
    const [generatedTasks, setGeneratedTasks] = useState([]); 
    const [selectedTasks, setSelectedTasks] = useState([]);   
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!goal.trim()) {
            toast.warning("Hãy nhập mục tiêu của bạn trước!");
            return;
        }

        setIsLoading(true);
        setGeneratedTasks([]); 
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post('http://localhost:5001/api/ai/generate', 
                { goal }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setGeneratedTasks(res.data.tasks);
            setSelectedTasks(res.data.tasks); 
        } catch (error) {
            console.error(error);
            toast.error("AI đang bận, vui lòng thử lại sau!");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelectTask = (task) => {
        if (selectedTasks.includes(task)) {
            setSelectedTasks(selectedTasks.filter(t => t !== task));
        } else {
            setSelectedTasks([...selectedTasks, task]);
        }
    };

    const handleAddSelectedToBoard = () => {
        if (selectedTasks.length === 0) {
            toast.warning("Vui lòng chọn ít nhất 1 công việc");
            return;
        }
        onAddTasks(selectedTasks); 
        onClose(); 
        setGoal(""); 
        setGeneratedTasks([]);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                // Backdrop mờ tối
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20 ring-1 ring-gray-200"
                    >
                        {/* Header Gradient */}
                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 pb-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                            
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                            <BrainCircuit className="w-5 h-5 text-yellow-300" />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight">AI Trợ lý công việc</h2>
                                    </div>
                                    <p className="text-indigo-100 text-sm opacity-90">Nhập mục tiêu, AI sẽ lên kế hoạch giúp bạn.</p>
                                </div>
                                <button 
                                    onClick={onClose} 
                                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Body Container - Đẩy lên đè vào Header */}
                        <div className="px-6 pb-6 -mt-6 relative z-20">
                            <div className="bg-white rounded-2xl shadow-lg p-1 border border-gray-100">
                                <div className="flex gap-2 p-1">
                                    <input 
                                        type="text" 
                                        value={goal}
                                        onChange={(e) => setGoal(e.target.value)}
                                        placeholder="VD: Lập kế hoạch học ReactJS..."
                                        className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all outline-none text-gray-800 placeholder:text-gray-400"
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleGenerate}
                                        disabled={isLoading}
                                        className="bg-violet-600 text-white px-5 rounded-xl hover:bg-violet-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center min-w-[50px]"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Result Area */}
                            <div className="mt-6 space-y-4 min-h-[100px]">
                                {generatedTasks.length > 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                <Lightbulb className="w-4 h-4 text-yellow-500" /> Gợi ý dành cho bạn:
                                            </h3>
                                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-md text-gray-600">
                                                Đã chọn {selectedTasks.length}/{generatedTasks.length}
                                            </span>
                                        </div>
                                        
                                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {generatedTasks.map((task, index) => {
                                                const isSelected = selectedTasks.includes(task);
                                                return (
                                                    <motion.div 
                                                        key={index}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        onClick={() => toggleSelectTask(task)}
                                                        className={`p-3.5 rounded-xl cursor-pointer border transition-all duration-200 flex items-start gap-3 group ${
                                                            isSelected 
                                                            ? 'bg-violet-50 border-violet-200 shadow-sm' 
                                                            : 'bg-white border-gray-100 hover:border-violet-200 hover:shadow-sm'
                                                        }`}
                                                    >
                                                        <div className={`mt-0.5 transition-colors ${isSelected ? 'text-violet-600' : 'text-gray-300 group-hover:text-violet-300'}`}>
                                                            {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                        </div>
                                                        <span className={`text-sm font-medium leading-snug ${isSelected ? 'text-violet-900' : 'text-gray-600'}`}>
                                                            {task}
                                                        </span>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>

                                        <button 
                                            onClick={handleAddSelectedToBoard}
                                            className="w-full bg-gray-900 text-white py-3.5 rounded-xl hover:bg-gray-800 font-bold shadow-lg shadow-gray-200 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Thêm {selectedTasks.length} công việc
                                        </button>
                                    </motion.div>
                                ) : (
                                    // Empty State (Chưa nhập gì)
                                    !isLoading && (
                                        <div className="flex flex-col items-center justify-center text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                            <Sparkles className="w-10 h-10 mb-3 opacity-20" />
                                            <p className="text-sm font-medium">Nhập mục tiêu để AI bắt đầu suy nghĩ...</p>
                                        </div>
                                    )
                                )}

                                {isLoading && (
                                    <div className="flex flex-col items-center justify-center py-10 text-violet-600">
                                        <Loader2 className="w-8 h-8 animate-spin mb-3" />
                                        <p className="text-sm font-medium animate-pulse">Đang phân tích yêu cầu...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AIGeneratorModal;