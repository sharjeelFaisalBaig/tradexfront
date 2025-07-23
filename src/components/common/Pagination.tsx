import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { getPaginationRange } from "@/hooks/useGetPaginationRange";

type PaginationProps = {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  siblingCount?: number; // Optional: number of pages beside current
};

export const Pagination = ({
  totalPages,
  currentPage,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) => {
  const paginationRange = getPaginationRange(
    currentPage,
    totalPages,
    siblingCount
  );

  const onNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const onPrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  return (
    <PaginationRoot>
      <PaginationContent>
        {/* Previous */}
        <PaginationItem>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onPrevious();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-lg border"
            style={{ borderColor: "#CBD5E0", color: "#00AA67" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </PaginationLink>
        </PaginationItem>

        {/* Page Numbers */}
        {paginationRange.map((page, index) => (
          <PaginationItem key={index}>
            {page === "DOTS" ? (
              <PaginationLink
                href="#"
                className="w-10 h-10 flex items-center justify-center text-gray-400"
              >
                ...
              </PaginationLink>
            ) : (
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(Number(page));
                }}
                isActive={page === currentPage}
                className={`w-10 h-10 flex items-center justify-center rounded-lg border ${
                  page === currentPage
                    ? "border-[#CBD5E0] text-[#00AA67]"
                    : "text-[#CBD5E0]"
                }`}
                style={{ borderColor: "#CBD5E0" }}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        {/* Next */}
        <PaginationItem>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNext();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-lg border"
            style={{ borderColor: "#CBD5E0", color: "#00AA67" }}
          >
            <ChevronRight className="w-4 h-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
};
