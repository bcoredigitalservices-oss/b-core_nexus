import React, { useState, useEffect } from "react";
import { X, Loader2, DollarSign, Calendar } from "lucide-react";
import { User, Customer, Quotation } from "../../types/types";
import { useAppContext } from "../../../../context/AppContext";

interface EditQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedQuot: Quotation) => void;
  quotationToEdit: Quotation | null;
  users: User[];
  customers: Customer[];
  authFetch: (path: string, options?: Record<string, any>) => Promise<any>;
}

export function EditQuotationModal({
  isOpen,
  onClose,
  onSuccess,
  quotationToEdit,
  users,
  customers,
  authFetch,
}: EditQuotationModalProps) {
  const [quotationNumber, setQuotationNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("draft");
  const [validityDate, setValidityDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const { systemSettings } = useAppContext();
  const baseCurrency = systemSettings?.base_currency || "USD";
  const [currency, setCurrency] = useState(baseCurrency);
  const [grandTotal, setGrandTotal] = useState("0");
  const [assignedOwner, setAssignedOwner] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const statusList = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "accepted", label: "Accepted" },
    { value: "declined", label: "Declined" },
    { value: "expired", label: "Expired" },
  ];

  useEffect(() => {
    if (isOpen && quotationToEdit) {
      setQuotationNumber(quotationToEdit.quotation_number || "");
      setCustomerId(quotationToEdit.customer_id || "");
      setStatus(quotationToEdit.status || "draft");
      setValidityDate(quotationToEdit.validity_date ? quotationToEdit.validity_date.split("T")[0] : "");
      setPaymentTerms(quotationToEdit.payment_terms || "Net 30");
      setCurrency(quotationToEdit.currency || baseCurrency);
      setGrandTotal(String(quotationToEdit.grand_total || 0));
      setAssignedOwner(quotationToEdit.owner_id || "");
      setErrorMsg("");
    }
  }, [isOpen, quotationToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotationNumber.trim() || !customerId || !quotationToEdit) return;

    setSaving(true);
    setErrorMsg("");

    try {
      const updated = await authFetch(`/sales/quotations/${quotationToEdit.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: status,
          validity_date: validityDate || null,
          payment_terms: paymentTerms,
          currency: currency,
          grand_total: parseFloat(grandTotal) || 0.0,
          subtotal: parseFloat(grandTotal) || 0.0,
          taxable_amount: parseFloat(grandTotal) || 0.0,
        }),
      });

      if (updated) {
        onSuccess(updated);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update quotation proposal settings.");
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
            Modify Proposal Settings
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
            
            {/* Quotation Number */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Quotation Number
              </label>
              <input
                type="text"
                disabled
                value={quotationNumber}
                className="w-full rounded-lg border border-color bg-main/40 py-2 px-3 text-xs outline-none text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>

            {/* Customer */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Customer Name
              </label>
              <select
                disabled
                value={customerId}
                className="w-full rounded-lg border border-color bg-main/40 py-2 px-3 text-xs outline-none text-[var(--text-muted)] cursor-not-allowed"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>

            {/* Total Value */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Total Value / Amount
              </label>
              <div className="relative flex items-center">
                <DollarSign size={13} className="absolute left-3 text-[var(--text-muted)]" />
                <input
                  type="number"
                  value={grandTotal}
                  onChange={(e) => setGrandTotal(e.target.value)}
                  className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                />
              </div>
            </div>

            {/* Validity Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Validity Expiry Date
              </label>
              <div className="relative flex items-center">
                <Calendar size={13} className="absolute left-3 text-[var(--text-muted)]" />
                <input
                  type="date"
                  value={validityDate}
                  onChange={(e) => setValidityDate(e.target.value)}
                  className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Proposal Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                {statusList.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                {Array.from(new Set(["USD", "NGN", baseCurrency])).map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>

            {/* Payment Terms */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Payment Terms
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
              />
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
