import React from "react";
import { FileText, Plus } from "lucide-react";

interface QuotationHeaderProps {
  totalCount: number;
  onCreateClick: () => void;
}

export function QuotationHeader({ totalCount, onCreateClick }: QuotationHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-color pb-4 gap-4 select-none animate-[fadeIn_0.2s_ease]">
      <div className="flex items-center gap-3.5">
        <div className="h-10 w-10 bg-indigo-600/10 text-indigo-600 flex items-center justify-center rounded-xl">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-[var(--text-main)] m-0">
            Quotations Manager
          </h1>
          <p className="text-[var(--text-muted)] text-xs mt-1 m-0">
            Total active proposals: <span className="text-[var(--text-main)] font-black">{totalCount}</span>
          </p>
        </div>
      </div>

      <button
        onClick={onCreateClick}
        className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-accent-primary text-white font-bold text-xs hover:brightness-110 shadow-sm cursor-pointer transition select-none"
      >
        <Plus size={14} /> Create Quotation
      </button>
    </div>
  );
}
