import React from "react";
import { PowerOff, X } from "lucide-react";

interface DeactivateDealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
}

export function DeactivateDealDialog({
  isOpen,
  onClose,
  onConfirm,
  submitting = false,
}: DeactivateDealDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-6 animate-[fadeIn_0.2s_ease]">
      <div className="w-full max-w-[400px] bg-card border border-color rounded-2xl p-6 shadow-xl flex flex-col gap-4 relative">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer disabled:opacity-50"
        >
          <X size={15} />
        </button>

        <div className="flex flex-col gap-3 text-center items-center pt-2">
          <div className="h-12 w-12 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center border border-amber-500/20">
            <PowerOff size={22} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
              Confirm Deal Deactivation
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-2 m-0 leading-relaxed">
              Are you sure you want to deactivate this sales pipeline opportunity? This will hide the deal from the active deals pipeline view, but it can be reactivated later.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs font-semibold hover:bg-card hover:text-[var(--text-main)] transition cursor-pointer disabled:opacity-50 text-[var(--text-muted)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="w-full rounded-lg py-2 px-3 font-bold text-xs bg-amber-600 text-white hover:bg-amber-500 transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {submitting ? "Deactivating..." : "Confirm Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}
