import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Loader2, UserMinus } from "lucide-react";
import { toast } from "sonner";

const ContactList = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Hàm tải danh sách bạn bè
    const fetchContacts = async () => {
        try {
            const res = await api.get("/users/contacts");
            // Đảm bảo data luôn là mảng để tránh lỗi map
            setContacts(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Lỗi tải danh sách cộng sự", error);
            // Không cần setContacts([]) ở đây vì state khởi tạo là []
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
        
        const handleUpdate = () => fetchContacts();
        window.addEventListener("updateContacts", handleUpdate);
        return () => window.removeEventListener("updateContacts", handleUpdate);
    }, []);

    // 2. Hàm Xoá Cộng Sự
    const handleRemoveContact = async (contactId, contactName, e) => {
        // Ngăn chặn sự kiện click lan ra thẻ cha (quan trọng nếu thẻ cha có onClick)
        e.stopPropagation(); 
        
        if (!window.confirm(`Bạn có chắc chắn muốn huỷ kết bạn với ${contactName}?`)) {
            return;
        }

        try {
            await api.post("/users/remove-contact", { targetUserId: contactId });
            toast.success(`Đã xoá ${contactName} khỏi danh sách.`);
            
            setContacts(prev => prev.filter(c => c._id !== contactId));
            
            // Dispatch event để các component khác (nếu có) biết danh sách đã thay đổi
            window.dispatchEvent(new Event("updateContacts"));
            
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi xoá cộng sự");
        }
    };

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400"/></div>;

    if (contacts.length === 0) {
        return (
            <div className="text-center py-4 text-xs text-gray-400 italic bg-gray-50 rounded-xl mx-2">
                Chưa có cộng sự nào.
            </div>
        );
    }

    return (
        <div className="space-y-1 mt-2 px-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">Cộng sự ({contacts.length})</h4>
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                {contacts.map((contact) => (
                    // ✅ ĐÃ SỬA: Dùng flex, items-center và justify-between để dàn hàng ngang
                    <div key={contact._id} className="group flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                        
                        {/* 1. Phần Avatar và Thông tin (Gom chung lại) */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {contact.avatar ? (
                                        <img src={contact.avatar} alt={contact.name} className="w-full h-full rounded-full object-cover"/>
                                    ) : (
                                        contact.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            
                            {/* Thông tin */}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-700 truncate group-hover:text-indigo-700 transition-colors">{contact.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{contact.email}</p>
                            </div>
                        </div>

                        {/* 2. ✅ ĐÃ SỬA NÚT XOÁ: Nằm ngay ngắn ở cuối cùng */}
                        <button
    onClick={(e) => handleRemoveContact(contact._id, contact.name, e)}
    className="shrink-0 p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all ml-2"
    title="Xoá cộng sự"
>
    <UserMinus className="w-4 h-4" />
</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContactList;