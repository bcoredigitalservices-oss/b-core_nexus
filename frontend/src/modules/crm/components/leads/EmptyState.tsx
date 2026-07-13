import React from "react";
import { Sliders } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl max-w-[1400px] mx-auto animate-[fadeIn_0.25s_ease]">
      <div className="h-12 w-12 bg-main border border-color rounded-xl flex items-center justify-center text-[var(--text-muted)]">
        <Sliders size={20} />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
          No matching leads found
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-2 m-0 max-w-[320px] leading-relaxed">
          Try adjusting your query strings or dropdown filters, or add a new record to start logging.
        </p>
      </div>
    </div>
  );
}
