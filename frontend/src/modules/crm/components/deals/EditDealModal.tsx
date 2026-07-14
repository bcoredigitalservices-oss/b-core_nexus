import React, { useState, useEffect } from "react";
import { X, Loader2, DollarSign, Calendar } from "lucide-react";
import { User, Customer, Lead, Deal } from "../../types/types";

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedDeal: Deal) => void;
  dealToEdit: Deal | null;
  users: User[];
  customers: Customer[];
  leads: Lead[];
  authFetch: (path: string, options?: Record<string, any>) => Promise<any>;
}

export function EditDealModal({
  isOpen,
  onClose,
  onSuccess,
  dealToEdit,
  customers,
  leads,
  authFetch,
}: EditDealModalProps) {
  const [dealName, setDealName] = useState("");
  const [pipelineStage, setPipelineStage] = useState("discovery");
  const [expectedRevenue, setExpectedRevenue] = useState("0");
  const [closeDate, setCloseDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [leadId, setLeadId] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const stagesList = [
    { value: "discovery", label: "Discovery" },
    { value: "qualification", label: "Qualification" },
    { value: "proposal", label: "Proposal" },
    { value: "negotiation", label: "Negotiation" },
    { value: "won", label: "Closed Won" },
    { value: "lost", label: "Closed Lost" },
  ];

  useEffect(() => {
    if (isOpen && dealToEdit) {
      setDealName(dealToEdit.deal_name || "");
      setPipelineStage(dealToEdit.pipeline_stage || "discovery");
      setExpectedRevenue(String(dealToEdit.expected_revenue || 0));
      setCloseDate(dealToEdit.close_date ? dealToEdit.close_date.split("T")[0] : "");
      setCustomerId(dealToEdit.customer_id || "");
      setLeadId(dealToEdit.lead_id || "");
      setErrorMsg("");
    }
  }, [isOpen, dealToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName.trim() || !dealToEdit) return;

    setSaving(true);
    setErrorMsg("");

    try {
      // owner_id is never part of this schema — server-assigned, sending it does nothing.
      const updated = await authFetch(`/crm/deals/${dealToEdit.id}`, {
        method: "PUT",
        body: JSON.stringify({
          deal_name: dealName.trim(),
          pipeline_stage: pipelineStage,
          expected_revenue: parseFloat(expectedRevenue) || 0.0,
          close_date: closeDate || null,
          customer_id: customerId || null,
          lead_id: leadId || null,
          is_active: true,
        }),
      });

      if (updated) {
        onSuccess(updated);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update deal parameters.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
      <div className="bg-card border border-color w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
          <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0">
            Modify Opportunity Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="py-2 px-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Deal Name */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Opportunity / Deal Name *
              </label>
              <input
                type="text"
                required
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
              />
            </div>

            {/* Expected Revenue */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Expected Value / Revenue ($)
              </label>
              <div className="relative flex items-center">
                <DollarSign size={13} className="absolute left-3 text-[var(--text-muted)]" />
                <input
                  type="number"
                  value={expectedRevenue}
                  onChange={(e) => setExpectedRevenue(e.target.value)}
                  className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                />
              </div>
            </div>

            {/* Target Close Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Target Close Date
              </label>
              <div className="relative flex items-center">
                <Calendar size={13} className="absolute left-3 text-[var(--text-muted)]" />
                <input
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                />
              </div>
            </div>

            {/* Pipeline Stage */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Pipeline Stage
              </label>
              <select
                value={pipelineStage}
                onChange={(e) => setPipelineStage(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                {stagesList.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>

            {/* Link Customer */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Link Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  if (e.target.value) setLeadId("");
                }}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                <option value="">Select customer linkage</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>

            {/* Link Lead */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Link Lead
              </label>
              <select
                value={leadId}
                onChange={(e) => {
                  setLeadId(e.target.value);
                  if (e.target.value) setCustomerId("");
                }}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                <option value="">Select lead linkage</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-color pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 py-2 px-5 bg-accent-primary text-white font-bold text-xs rounded-xl hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition"
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}