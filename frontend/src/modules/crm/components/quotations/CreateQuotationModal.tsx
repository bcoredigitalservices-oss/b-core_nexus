import React, { useState, useEffect } from "react";
import { X, Loader2, DollarSign, Calendar } from "lucide-react";
import { Customer, Quotation, Lead } from "../../types/types";
import { useAppContext } from "../../../../context/AppContext";

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newQuot: Quotation) => void;
  customers: Customer[];
  authFetch: (path: string, options?: Record<string, any>) => Promise<any>;
}

export function CreateQuotationModal({
  isOpen,
  onClose,
  onSuccess,
  customers,
  authFetch,
}: CreateQuotationModalProps) {
  // Pydantic-backed fields
  const [quotationNumber, setQuotationNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("draft");
  const [validityDate, setValidityDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const { systemSettings } = useAppContext();
  const baseCurrency = systemSettings?.base_currency || "USD";
  const [currency, setCurrency] = useState(baseCurrency);
  const [grandTotal, setGrandTotal] = useState("0");
  const [quotationType, setQuotationType] = useState("daily_usage");
  const [internalNotes, setInternalNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [leadId, setLeadId] = useState("");
  const [dealId, setDealId] = useState("");

  // Related dropdowns loaded dynamically
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const statusList = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
    { value: "expired", label: "Expired" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const typeList = [
    { value: "daily_usage", label: "Daily Usage" },
    { value: "urgent", label: "Urgent Proposal" },
    { value: "high_value", label: "High Value Opportunity" },
  ];

  useEffect(() => {
    if (isOpen) {
      authFetch("/crm/leads").then((res) => setLeads(res || [])).catch(() => {});
      authFetch("/crm/deals").then((res) => setDeals(res || [])).catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotationNumber.trim() || !customerId) {
      setErrorMsg("Quotation number and Customer association are required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const created = await authFetch("/sales/quotations", {
        method: "POST",
        body: JSON.stringify({
          quotation_number: quotationNumber.trim(),
          customer_id: customerId,
          status: status,
          validity_date: validityDate || null,
          payment_terms: paymentTerms || null,
          delivery_terms: deliveryTerms || null,
          currency: currency,
          subtotal: parseFloat(grandTotal) || 0.0,
          grand_total: parseFloat(grandTotal) || 0.0,
          taxable_amount: parseFloat(grandTotal) || 0.0,
          vat_rate: 7.5,
          vat_amount: (parseFloat(grandTotal) || 0.0) * 0.075,
          quotation_type: quotationType,
          internal_notes: internalNotes.trim() || null,
          customer_notes: customerNotes.trim() || null,
          lead_id: leadId || null,
          deal_id: dealId || null,
        }),
      });

      if (created) {
        onSuccess(created);
        onClose();
        // Reset states
        setQuotationNumber("");
        setCustomerId("");
        setStatus("draft");
        setValidityDate("");
        setPaymentTerms("Net 30");
        setDeliveryTerms("");
        setCurrency(baseCurrency);
        setGrandTotal("0");
        setQuotationType("daily_usage");
        setInternalNotes("");
        setCustomerNotes("");
        setLeadId("");
        setDealId("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create quotation proposal.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
      <div className="bg-card border border-color w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
          <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0">
            Create Proposal / Quotation
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="py-2 px-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-semibold animate-[fadeIn_0.2s_ease]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quotation Number */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Quotation Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. QTN-2026-001"
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold"
              />
            </div>

            {/* Select Customer */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Select Customer *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                <option value="">Select customer linkage</option>
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
                  className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold"
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
                Quotation Status
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
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer font-bold"
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
                placeholder="e.g. Net 30"
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
              />
            </div>

            {/* Delivery Terms */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Delivery Terms
              </label>
              <input
                type="text"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                placeholder="e.g. Ex Works, FOB"
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
              />
            </div>

            {/* Quotation Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Quotation Priority Class
              </label>
              <select
                value={quotationType}
                onChange={(e) => setQuotationType(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                {typeList.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Lead Link dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Associated Pipeline Lead
              </label>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                <option value="">No Lead Association</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.title} ({l.reference_number})</option>
                ))}
              </select>
            </div>

            {/* Deal Link dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Associated Opportunity Deal
              </label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                <option value="">No Deal Association</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>{d.deal_name} ({d.reference_number})</option>
                ))}
              </select>
            </div>

            {/* Internal Notes */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Internal Notes
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                placeholder="Log internal comments..."
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] resize-none"
              />
            </div>

            {/* Customer Notes */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Notes for Customer
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={2}
                placeholder="Message displayed to the client..."
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] resize-none"
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
                "Create Proposal"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
