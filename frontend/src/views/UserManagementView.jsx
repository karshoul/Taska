import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Loader2, ArrowUp, ArrowDown, UserX, UserCheck, Search, X } from "lucide-react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

// --- COMPONENT MODAL (GIỮ NGUYÊN) ---
const ConfirmationModal = ({ title, message, onConfirm, onCancel, isSubmitting, confirmText, confirmVariant = "red" }) => {
    const backdropVariants = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
    const modalVariants = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } };
    
    const confirmColors = confirmVariant === 'red' 
        ? "bg-red-100 text-red-700 hover:bg-red-200" 
        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";

    return createPortal(
        <AnimatePresence>
            <motion.div
                key="backdrop"
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                variants={backdropVariants} initial="initial" animate="animate" exit="exit"
                onClick={onCancel}
            />
            <motion.div
                key="modal"
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                variants={modalVariants} initial="initial" animate="animate" exit="exit"
            >
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>
                    <p className="text-gray-600 mb-4">{message}</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={onCancel} disabled={isSubmitting} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-full shadow-sm transition bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 w-28">
                            ✖️ Hủy
                        </button>
                        <button onClick={onConfirm} disabled={isSubmitting} className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-full shadow-sm transition disabled:opacity-50 w-28 ${confirmColors}`}>
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmText}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

const UserManagementView = ({ users, refreshUsers, currentUserRole }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingUserId, setUpdatingUserId] = useState(null);

    // State cho Modals
    const [userToToggle, setUserToToggle] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    // Logic lọc & phân trang
    const sortedAndPagedUsers = useMemo(() => {
        if (!users || users.length === 0) return [];
        const filtered = users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()));
        const sorted = [...filtered].sort((a, b) => {
            let valA = a[sortBy] ?? ""; let valB = b[sortBy] ?? "";
            if (sortBy === "isActive") { valA = valA === false ? 0 : 1; valB = valB === false ? 0 : 1; }
            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [users, currentPage, sortBy, sortOrder, searchTerm]);

    const totalPages = Math.ceil((users?.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase().trim())).length || 0) / ITEMS_PER_PAGE);
    
    const handlePageChange = (page) => { if (page > 0 && page <= totalPages) setCurrentPage(page); };
    const handleSort = (key) => { if (sortBy === key) { setSortOrder(sortOrder === "asc" ? "desc" : "asc"); } else { setSortBy(key); setSortOrder("asc"); } };
    const renderSortIcon = (key) => { if (sortBy !== key) return null; return sortOrder === "asc" ? <ArrowUp className="w-4 h-4 ml-1 inline" /> : <ArrowDown className="w-4 h-4 ml-1 inline" />; };

    // --- ACTIONS ---
    const handleToggleStatus = async () => {
        if (!userToToggle) return;
        const newStatus = userToToggle.isActive === false ? true : false;
        const actionText = newStatus ? "kích hoạt" : "vô hiệu hóa";
        
        setUpdatingUserId(userToToggle._id);
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:5001/api/admin/users/${userToToggle._id}/status`, { isActive: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Đã ${actionText} tài khoản ${userToToggle.name}.`);
            refreshUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || `Không thể ${actionText} tài khoản.`);
        } finally {
            setUpdatingUserId(null);
            setUserToToggle(null);
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        setUpdatingUserId(userToDelete._id);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5001/api/admin/users/${userToDelete._id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Đã xóa người dùng ${userToDelete.name}.`);
            refreshUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể xóa người dùng.");
        } finally {
            setUpdatingUserId(null);
            setUserToDelete(null);
        }
    };

    if (!users) {
        return <div className="text-center p-10"><Loader2 className="animate-spin w-8 h-8 mx-auto mb-3" /> Đang tải dữ liệu...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-xl animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
                <h2 className="text-2xl font-semibold text-gray-800">Quản lý Người dùng ({users.length})</h2>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all w-60"
                        />
                    </div>
                    <button onClick={refreshUsers} className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition duration-150">Tải lại</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {["name", "email", "role", "isActive"].map((key) => (
                                <th key={key} onClick={() => handleSort(key)} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                                    {key === "isActive" ? "Trạng thái" : key.charAt(0).toUpperCase() + key.slice(1)} {renderSortIcon(key)}
                                </th>
                            ))}
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <AnimatePresence>
                            {sortedAndPagedUsers.map((user) => (
                                <motion.tr
                                    key={user._id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.25 }}
                                    className={user.isActive === false ? "bg-gray-100 opacity-60" : ""}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.role === "super_admin" ? "bg-purple-100 text-purple-800" 
                                            : user.role === "admin" ? "bg-red-100 text-red-800" 
                                            : "bg-green-100 text-green-800"}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`font-semibold ${user.isActive === false ? "text-red-500" : "text-green-600"}`}>{user.isActive === false ? "Vô hiệu hóa" : "Hoạt động"}</span></td>
                                    
                                    {/* --- CỘT HÀNH ĐỘNG --- */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex justify-center items-center gap-3">
                                            
                                            {/* NÚT KHÓA/MỞ KHÓA */}
                                            <button
                                                onClick={() => setUserToToggle(user)}
                                                disabled={
                                                    updatingUserId || 
                                                    user.role === "super_admin" || 
                                                    (user.role === "admin" && currentUserRole !== "super_admin")
                                                }
                                                className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={user.role === "super_admin" ? "Không thể tác động Super Admin" : "Thay đổi trạng thái"}
                                            >
                                                {updatingUserId === user._id ? <Loader2 className="w-5 h-5 animate-spin" /> : (user.isActive === false ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />)}
                                            </button>

                                            {/* ✅ ĐÃ SỬA: LOGIC NÚT XÓA CHO PHÉP ADMIN XÓA USER */}
                                            {(currentUserRole === "super_admin" || currentUserRole === "admin") && (
                                                <button
                                                    onClick={() => setUserToDelete(user)}
                                                    disabled={
                                                        updatingUserId || 
                                                        user.role === "super_admin" || // 1. Không bao giờ xóa Super Admin
                                                        (currentUserRole === "admin" && user.role === "admin") // 2. Admin không thể xóa Admin khác
                                                    }
                                                    className={`disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        // Đổi màu nút thành xám nếu bị disable (để người dùng dễ hiểu)
                                                        (currentUserRole === "admin" && user.role === "admin") || user.role === "super_admin"
                                                        ? "text-gray-300" 
                                                        : "text-red-600 hover:text-red-900"
                                                    }`}
                                                    title={
                                                        user.role === "super_admin" ? "Không thể xóa Super Admin" : 
                                                        (currentUserRole === "admin" && user.role === "admin" ? "Bạn không thể xóa Admin khác" : "Xóa người dùng")
                                                    }
                                                >
                                                    {updatingUserId === user._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                                </button>
                                            )}
                                            
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* PHÂN TRANG */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                    >
                        Trang trước
                    </button>
                    <span className="text-sm text-gray-600">Trang {currentPage} / {totalPages}</span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                    >
                        Trang sau
                    </button>
                </div>
            )}

            {sortedAndPagedUsers.length === 0 && (
                <p className="text-center py-8 text-gray-500">Không tìm thấy người dùng nào.</p>
            )}

            {/* MODALS */}
            {userToToggle && (
                <ConfirmationModal
                    title={userToToggle.isActive ? "Vô hiệu hóa tài khoản?" : "Kích hoạt tài khoản?"}
                    message={`Bạn có chắc muốn ${userToToggle.isActive ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản: ${userToToggle.name}?`}
                    onConfirm={handleToggleStatus}
                    onCancel={() => setUserToToggle(null)}
                    isSubmitting={updatingUserId === userToToggle._id}
                    confirmText={userToToggle.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                    confirmVariant={userToToggle.isActive ? "red" : "yellow"}
                />
            )}

            {userToDelete && (
                <ConfirmationModal
                    title="Xác nhận xóa tài khoản?"
                    message={`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản: ${userToDelete.name}? Mọi dữ liệu (công việc, dự án) của người này cũng sẽ bị xóa.`}
                    onConfirm={handleDelete}
                    onCancel={() => setUserToDelete(null)}
                    isSubmitting={updatingUserId === userToDelete._id}
                    confirmText="🗑️ Có, xoá"
                    confirmVariant="red"
                />
            )}
        </div>
    );
};

export default UserManagementView;