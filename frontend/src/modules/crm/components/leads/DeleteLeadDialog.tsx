import React from "react";
import { AlertCircle, Trash2, X } from "lucide-react";

interface DeleteLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
}

export function DeleteLeadDialog({
  isOpen,
  onClose,
  onConfirm,
  submitting = false,
}: DeleteLeadDialogProps) {
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
          <div className="h-12 w-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/20">
            <Trash2 size={22} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
              Confirm Lead Deletion
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-2 m-0 leading-relaxed">
              Are you absolutely sure you want to delete this lead record? This action cannot be undone and will permanently remove this pipeline entry.
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
            className="w-full rounded-lg py-2 px-3 font-bold text-xs bg-rose-600 text-white hover:bg-rose-500 transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {submitting ? "Deleting..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
