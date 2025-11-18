import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { visibleTaskLimit } from "@/lib/data";
import Navbar from "@/components/Navbar";
import AddTask from "@/components/AddTask";
import DateTimeFilter from "@/components/DateTimeFilter";
import Footer from "@/components/Footer";
import StatsAndFilters from "@/components/StatsAndFilters";
import TaskList from "@/components/TaskList";
import TaskListPagination from "@/components/TaskListPagination";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";

// --- Modal Xóa Dự án ---
const DeleteProjectModal = ({ project, onClose, onConfirm }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    return createPortal(
        <AnimatePresence>
            <motion.div
                key="backdrop-delete"
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
            />
            <motion.div
                key="modal-delete"
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            >
                <div 
                    className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Xác nhận xoá</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Bạn có chắc chắn muốn xóa dự án: <strong className="font-semibold text-red-600">{project.name}</strong>?
                            <br/><br/>
                            <span className="font-medium">Lưu ý:</span> Các công việc thuộc dự án này sẽ không bị xóa.
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Hủy</button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    await onConfirm(project.id, project.name); 
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Có, xoá"}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};


const HomePage = () => {
    const [taskBuffer, setTaskBuffer] = useState([]);
    const [activeTaskCount, setActiveTaskCount] = useState(0);
    const [completeTaskCount, setCompleteTaskCount] = useState(0);
    const [filter, setFilter] = useState("all");
    const [dateQuery, setDateQuery] = useState("today");
    const [page, setPage] = useState(1);

    const [projects, setProjects] = useState([]);
    const [projectFilter, setProjectFilter] = useState("all");
    const [projectToDelete, setProjectToDelete] = useState(null);
    // ❌ Đã xóa state 'allTags' và 'tagFilter'

    const fetchTasks = useCallback(async () => {
        try {
            const res = await api.get(`/tasks?filter=${dateQuery}`);
            setTaskBuffer(res.data.tasks || []);
            setActiveTaskCount(res.data.activeCount || 0);
            setCompleteTaskCount(res.data.completeCount || 0);
            // eslint-disable-next-line no-unused-vars
        } catch (error) { toast.error("Lỗi khi truy xuất tasks."); }
    }, [dateQuery]);

    const refreshProjects = useCallback(async () => {
        try {
            const res = await api.get("/projects");
            setProjects(res.data || []);
            // eslint-disable-next-line no-unused-vars
        } catch (error) { toast.error("Không thể tải danh sách dự án"); }
    }, []);

    // ❌ Đã xóa hàm `fetchAllTags`

    const handleDeleteProject = async (projectId, projectName) => {
        try {
            await api.delete(`/projects/${projectId}`);
            toast.success(`Đã xóa dự án "${projectName}"`);
            await refreshProjects();
            if (projectFilter === projectId) setProjectFilter("all");
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa dự án");
        } finally {
            setProjectToDelete(null);
        }
    };

    const triggerDeleteProject = (projectId, projectName) => {
        setProjectToDelete({ id: projectId, name: projectName });
    };

    const handleCreateProject = async (newProjectName) => {
        try {
            const res = await api.post("/projects", { name: newProjectName });
            toast.success(`Đã tạo dự án "${newProjectName}"`);
            await refreshProjects();
            return res.data; 
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi tạo dự án");
            return null;
        }
    };

    useEffect(() => {
        fetchTasks();
        refreshProjects();
        // ❌ Đã xóa `fetchAllTags`
    }, [fetchTasks, refreshProjects]);

    useEffect(() => {
        setPage(1);
    }, [filter, dateQuery, projectFilter]); // ❌ Đã xóa `tagFilter`

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    const handleTaskChanged = () => {
        fetchTasks();
        // ❌ Đã xóa `fetchAllTags`
    };

    const filteredTasks = useMemo(() => {
        return taskBuffer
            .filter((task) => {
                switch (filter) {
                    case "active": return task.status === "active";
                    case "completed": return task.status === "complete";
                    default: return true;
                }
            })
            .filter((task) => {
                if (projectFilter === 'all') return true;
                if (projectFilter === 'none') return !task.project;
                return task.project?._id === projectFilter || task.project === projectFilter;
            });
            // ❌ Đã xóa bộ lọc `.filter()` cho tags
    }, [taskBuffer, filter, projectFilter]); // ❌ Đã xóa `tagFilter`

    const totalPages = Math.ceil(filteredTasks.length / visibleTaskLimit);
    const currentPage = Math.min(page, totalPages) || 1;
    const visibleTasks = filteredTasks.slice((currentPage - 1) * visibleTaskLimit, currentPage * visibleTaskLimit);

    const projectFilterOptions = useMemo(() => [
        { value: 'all', label: 'Tất cả dự án' },
        { value: 'none', label: '(Không có dự án)' },
        ...projects.map(p => ({ value: p._id, label: p.name })),
    ], [projects]); 

    // ❌ Đã xóa `tagFilterOptions`

    const containerVariants = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen w-full relative bg-gray-50"> 
            <div className="fixed inset-0 z-0 opacity-70" style={{
                background: `
                    radial-gradient(ellipse 85% 65% at 8% 8%, rgba(175, 109, 255, 0.25), transparent 60%),
                    radial-gradient(ellipse 75% 60% at 75% 35%, rgba(255, 235, 170, 0.35), transparent 62%),
                    radial-gradient(ellipse 70% 60% at 15% 80%, rgba(255, 100, 180, 0.20), transparent 62%),
                    radial-gradient(ellipse 70% 60% at 92% 92%, rgba(120, 190, 255, 0.25), transparent 62%),
                    linear-gradient(180deg, #fefeff 0%, #f7faff 100%)
                `,
            }} />
            <motion.div
                className="relative z-10 mx-auto px-4 md:px-0 pt-4 pb-16 max-w-7xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="w-full sticky top-0 z-20 border-b border-gray-100/80 backdrop-blur-sm">
                    <div className="px-4 md:px-8 py-3"> <Navbar /> </div>
                </motion.div>
                <motion.div variants={itemVariants} className="px-4 md:px-8 mt-6 mb-6">
                    <Header />
                </motion.div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-8">
                    <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
                        <AddTask 
                            handleNewTaskAdded={handleTaskChanged}
                            projects={projects}
                            onCreateProject={handleCreateProject}
                            onDeleteProject={triggerDeleteProject} 
                        />
                    </motion.div>
                    <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-start border-b pb-2 gap-4"> 
                            <h2 className="text-2xl font-bold text-gray-800 flex-shrink-0">Danh Sách Công Việc</h2>
                            <div className="text-sm text-gray-500 font-medium text-right flex-grow pt-1">
                                <Footer activeTasksCount={activeTaskCount} completedTasksCount={completeTaskCount} />
                            </div>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100">
                            <StatsAndFilters
                                filter={filter}
                                setFilter={setFilter}
                                activeTasksCount={activeTaskCount}
                                completedTasksCount={completeTaskCount}
                            />
                        </div>
                        <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
                            {/* ❌ Xóa props 'tagFilter', 'setTagFilter', 'tagOptions' */}
                            <DateTimeFilter 
                                dateQuery={dateQuery} 
                                setDateQuery={setDateQuery} 
                                projectFilter={projectFilter}
                                setProjectFilter={setProjectFilter}
                                projectOptions={projectFilterOptions}
                                onDeleteProject={triggerDeleteProject}
                            />
                            {totalPages > 1 && (
                                <TaskListPagination
                                    handleNext={() => setPage(p => Math.min(p + 1, totalPages))}
                                    handlePrev={() => setPage(p => Math.max(p - 1, 1))}
                                    handlePageChange={setPage}
                                    page={currentPage}
                                    totalPages={totalPages}
                                />
                            )}
                        </div>
                        <div className="flex-1 space-y-4 min-h-[250px]">
                            <TaskList
                                filteredTasks={visibleTasks}
                                handleTaskChanged={handleTaskChanged}
                            />
                        </div>
                    </motion.div>
                </div>
            </motion.div> 

            {projectToDelete && (
                <DeleteProjectModal
                    project={projectToDelete}
                    onClose={() => setProjectToDelete(null)}
                    onConfirm={handleDeleteProject}
                />
            )}
        </div>
    );
};

export default HomePage;