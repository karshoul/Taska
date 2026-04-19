import React from 'react';
import { 
    FileText, FileSpreadsheet, FileArchive, 
    FileIcon, Image, Download, ExternalLink, Paperclip 
} from 'lucide-react';

const AttachmentList = ({ attachments }) => {
    if (!attachments || attachments.length === 0) return null;

    // 🔥 HÀM XỬ LÝ TẢI FILE ÉP BUỘC
    const handleDownload = async (fileUrl, fileName) => {
        try {
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName; // Ép tên file khi tải về
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Lỗi khi tải file:", error);
            // Nếu lỗi (do CORS), mở tab mới như cũ để user tự lưu
            window.open(fileUrl, '_blank');
        }
    };

    const getFileIcon = (fileType) => {
        if (fileType?.includes('image')) return <Image className="w-4 h-4 text-blue-500" />;
        if (fileType?.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
        if (fileType?.includes('word') || fileType?.includes('officedocument')) 
            return <FileText className="w-4 h-4 text-blue-700" />;
        if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) 
            return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
        return <FileIcon className="w-4 h-4 text-gray-500" />;
    };

    return (
        <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Tài liệu đính kèm ({attachments.length})</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((file, index) => (
                    <div key={index} className="group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-gray-50 rounded-lg">{getFileIcon(file.fileType)}</div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-medium text-gray-800 truncate">{file.name}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <a href={file.url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                            {/* 🔥 NÚT TẢI VỀ ĐÃ ĐƯỢC FIX */}
                            <button 
                                onClick={() => handleDownload(file.url, file.name)}
                                className="p-1.5 text-gray-400 hover:text-green-600"
                                title="Tải về máy"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AttachmentList;