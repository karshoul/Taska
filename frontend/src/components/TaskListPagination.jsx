import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TaskListPagination = ({
  handleNext,
  handlePrev,
  handlePageChange,
  page,
  totalPages,
}) => {
  const generatePages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page > 3) pages.push("...");
    
    let start = Math.max(2, page - 1);
    let end = Math.min(totalPages - 1, page + 1);

    if (page <= 3) end = 4;
    if (page >= totalPages - 2) start = totalPages - 3;

    for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
    }

    if (page < totalPages - 2) pages.push("...");
    if (!pages.includes(totalPages)) pages.push(totalPages);

    return pages;
  };

  const pagesToShow = generatePages();

  return (
    /* THAY ĐỔI: Dồn trái (justify-start) và giảm margin top */
    <div className="flex justify-start items-center mt-6 ml-1">
      <Pagination className="mx-0 w-auto">
        <PaginationContent className="gap-1"> {/* Giảm khoảng cách giữa các nút */}
          
          {/* Nút Trước - Thu gọn icon */}
          <PaginationItem>
            <button
              onClick={page === 1 ? undefined : handlePrev}
              disabled={page === 1}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-all border border-transparent hover:bg-gray-100 disabled:opacity-30",
                "text-gray-500"
              )}
            >
              <ChevronLeft size={16} />
            </button>
          </PaginationItem>

          {/* Các con số - Bo tròn nhỏ và Font hiện đại */}
          {pagesToShow.map((p, index) => (
            <PaginationItem key={index}>
              {p === "..." ? (
                <div className="w-8 text-center text-gray-300 text-xs font-black">•••</div>
              ) : (
                <button
                  onClick={() => p !== page && handlePageChange(p)}
                  className={cn(
                    "w-8 h-8 text-xs font-black rounded-lg transition-all border",
                    p === page 
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200" 
                      : "bg-white border-gray-100 text-gray-400 hover:border-indigo-100 hover:text-indigo-600"
                  )}
                >
                  {p}
                </button>
              )}
            </PaginationItem>
          ))}

          {/* Nút Sau */}
          <PaginationItem>
            <button
              onClick={page === totalPages ? undefined : handleNext}
              disabled={page === totalPages}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-all border border-transparent hover:bg-gray-100 disabled:opacity-30",
                "text-gray-500"
              )}
            >
              <ChevronRight size={16} />
            </button>
          </PaginationItem>

        </PaginationContent>
      </Pagination>

      {/* Thông tin trang nhỏ ở cạnh (tùy chọn) */}
      <span className="ml-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
        Page {page} of {totalPages}
      </span>
    </div>
  );
};

export default TaskListPagination;