import React from "react";
import { Plus, TrendingUp } from "lucide-react";

interface LeadHeaderProps {
  totalCount: number;
  onCreateClick: () => void;
}

export function LeadHeader({ totalCount, onCreateClick }: LeadHeaderProps) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-color pb-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium select-none mb-1.5">
        <span>CRM</span>
        <span className="opacity-50">/</span>
        <span className="text-[var(--text-main)] font-semibold">Leads</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight m-0 flex items-center gap-2.5">
            <TrendingUp className="text-accent-primary" size={24} />
            Leads Workspace
            <span className="text-xs bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded-full font-bold">
              {totalCount} total
            </span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 m-0">
            Log pipeline items, manage deals, and track lead engagements.
          </p>
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-accent-primary text-white font-bold text-xs hover:brightness-110 shadow-sm cursor-pointer transition-all duration-150"
        >
          <Plus size={14} /> Create Lead
        </button>
      </div>
    </div>
  );
}
