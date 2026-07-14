import React, { useState, useEffect } from "react";
import { X, Loader2, Calendar } from "lucide-react";
import { Customer, SalesOrder, Quotation } from "../../types/types";

interface CreateSalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newOrder: SalesOrder) => void;
  customers: Customer[];
  authFetch: (path: string, options?: Record<string, any>) => Promise<any>;
}

export function CreateSalesOrderModal({
  isOpen,
  onClose,
  onSuccess,
  customers,
  authFetch,
}: CreateSalesOrderModalProps) {
  // Quotations list loaded dynamically
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotId, setSelectedQuotId] = useState("");

  // Pydantic-backed fields to customize on conversion
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [actualDeliveryDate, setActualDeliveryDate] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const statusList = [
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSelectedQuotId("");
      // Fetch available quotations
      authFetch("/sales/quotations")
        .then((res) => {
          setQuotations(res || []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSelectQuotation = (quotId: string) => {
    setSelectedQuotId(quotId);
    const q = quotations.find((quot) => quot.id === quotId);
    if (q) {
      setPaymentTerms(q.payment_terms || "");
      setDeliveryTerms(q.delivery_terms || "");
      setInternalNotes(q.internal_notes || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotId) {
      setErrorMsg("Please select an active quotation to convert.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      // 1. Convert Quotation to Order
      const newOrder = await authFetch(`/sales/quotations/${selectedQuotId}/convert-to-order`, {
        method: "POST",
      });

      if (newOrder && newOrder.id) {
        // 2. Save delivery and status updates if customized
        const updated = await authFetch(`/sales/orders/${newOrder.id}`, {
          method: "PUT",
          body: JSON.stringify({
            status: status,
            payment_terms: paymentTerms || null,
            delivery_terms: deliveryTerms || null,
            expected_delivery_date: expectedDeliveryDate || null,
            actual_delivery_date: actualDeliveryDate || null,
            internal_notes: internalNotes || null,
          }),
        });

        onSuccess(updated || newOrder);
        onClose();
        // Reset states
        setSelectedQuotId("");
        setExpectedDeliveryDate("");
        setActualDeliveryDate("");
        setStatus("confirmed");
        setPaymentTerms("");
        setDeliveryTerms("");
        setInternalNotes("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create sales order proposal.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedQuot = quotations.find((q) => q.id === selectedQuotId);
  const selectedCustomer = selectedQuot
    ? customers.find((c) => c.id === selectedQuot.customer_id)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
      <div className="bg-card border border-color w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
          <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0">
            Create Sales Order
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
            {/* Choose Quotation */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Select Source Quotation *
              </label>
              <select
                required
                value={selectedQuotId}
                onChange={(e) => handleSelectQuotation(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                <option value="">Select active quotation proposal</option>
                {quotations.map((q) => {
                  const cust = customers.find((c) => c.id === q.customer_id);
                  return (
                    <option key={q.id} value={q.id}>
                      {q.reference_number || q.quotation_number} — {cust ? cust.company_name : "Standalone"}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Display Quotation Details */}
            {selectedQuot && (
              <div className="md:col-span-2 p-3 bg-main/30 border border-color rounded-xl flex flex-col gap-1.5 text-xs animate-[fadeIn_0.15s_ease]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Customer:</span>
                  <strong className="text-[var(--text-main)]">{selectedCustomer?.company_name || "Unknown"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Total Quotation Value:</span>
                  <strong className="text-accent-primary font-black">
                    {selectedQuot.currency === "NGN" ? "₦" : "$"}{Number(selectedQuot.grand_total).toLocaleString()}
                  </strong>
                </div>
              </div>
            )}

            {/* Expected Delivery Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Expected Delivery Date
              </label>
              <div className="relative flex items-center">
                <Calendar size={13} className="absolute left-3 text-[var(--text-muted)]" />
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                />
              </div>
            </div>

            {/* Actual Delivery Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Actual Delivery Date
              </label>
              <div className="relative flex items-center">
                <Calendar size={13} className="absolute left-3 text-[var(--text-muted)]" />
                <input
                  type="date"
                  value={actualDeliveryDate}
                  onChange={(e) => setActualDeliveryDate(e.target.value)}
                  className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Sales Order Status
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

            {/* Payment Terms */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Payment Terms
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. Net 30, COD"
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold"
              />
            </div>

            {/* Delivery Terms */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Delivery logistic Terms
              </label>
              <input
                type="text"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                placeholder="e.g. Ex Works, FOB"
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
              />
            </div>

            {/* Internal Notes */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Internal Remarks
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                placeholder="Add audit tags or notes..."
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] resize-none font-medium"
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
              disabled={saving || !selectedQuotId}
              className="flex items-center gap-1.5 py-2 px-5 bg-accent-primary text-white font-bold text-xs rounded-xl hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition"
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Saving...
                </>
              ) : (
                "Create Sales Order"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Simple local X icon
function X({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
