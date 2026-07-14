import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-color pt-4 px-1 mt-2 animate-[fadeIn_0.2s_ease]">
      <span className="text-[10px] text-[var(--text-muted)] font-mono">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="py-1 px-3 border border-color bg-card rounded-lg text-xs font-semibold hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="py-1 px-3 border border-color bg-card rounded-lg text-xs font-semibold hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
