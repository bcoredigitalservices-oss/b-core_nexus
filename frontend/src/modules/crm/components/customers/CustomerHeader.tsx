import React from "react";
import { Building, Plus } from "lucide-react";

interface CustomerHeaderProps {
  totalCount: number;
  onCreateClick: () => void;
}

export function CustomerHeader({ totalCount, onCreateClick }: CustomerHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-color pb-4 gap-4 select-none">
      <div className="flex items-center gap-3.5">
        <div className="h-10 w-10 bg-indigo-600/10 text-indigo-600 flex items-center justify-center rounded-xl">
          <Building size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-[var(--text-main)] m-0">
            Customers Directory
          </h1>
          <p className="text-[var(--text-muted)] text-xs mt-1 m-0">
            Total Converted Organizations: <span className="text-[var(--text-main)] font-black">{totalCount}</span>
          </p>
        </div>
      </div>

      <button
        onClick={onCreateClick}
        className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-accent-primary text-white font-bold text-xs hover:brightness-110 shadow-sm cursor-pointer transition select-none"
      >
        <Plus size={14} /> Add Customer
      </button>
    </div>
  );
}
