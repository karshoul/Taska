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

const TaskListPagination = ({
  handleNext,
  handlePrev,
  handlePageChange,
  page,
  totalPages,
}) => {
  const generatePages = () => {
    const pages = [];

    // Nếu tổng số trang nhỏ hoặc bằng 7, hiển thị tất cả
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Luôn thêm trang đầu và trang cuối
    pages.push(1);

    // Xử lý các trang gần đầu (Page 1, 2, 3)
    if (page <= 3) {
      pages.push(2, 3, 4);
      pages.push("...");
    }
    // Xử lý các trang gần cuối (Ví dụ: Page totalPages-2, totalPages-1, totalPages)
    else if (page >= totalPages - 2) {
      pages.push("...");
      pages.push(totalPages - 3, totalPages - 2, totalPages - 1);
    }
    // Xử lý các trang ở giữa
    else {
      pages.push("...");
      pages.push(page - 1, page, page + 1);
      pages.push("...");
    }

    // Luôn thêm trang cuối cùng (tránh bị trùng nếu đã thêm ở logic trên)
    if (pages[pages.length - 1] !== totalPages) {
        pages.push(totalPages);
    }
    
    // Loại bỏ dấu ... liền kề nếu có
    const finalPages = pages.filter((p, index) => {
        return p !== "..." || pages[index - 1] !== "...";
    });

    return finalPages;
  };

  const pagesToShow = generatePages();

  return (
    <div className="flex justify-center mt-4">
      <Pagination>
        <PaginationContent>
          {/* Trước */}
          <PaginationItem>
            <PaginationPrevious
              onClick={page === 1 ? undefined : handlePrev}
              className={cn(
                "cursor-pointer",
                page === 1 && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>

          {pagesToShow.map((p, index) => (
            <PaginationItem key={index}>
              {p === "..." ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={p === page}
                  onClick={() => {
                    if (p !== page) handlePageChange(p);
                  }}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          {/* Sau */}
          <PaginationItem>
            <PaginationNext
              onClick={page === totalPages ? undefined : handleNext}
              className={cn(
                "cursor-pointer",
                page === totalPages && "pointer-events-none opacity-50"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default TaskListPagination;