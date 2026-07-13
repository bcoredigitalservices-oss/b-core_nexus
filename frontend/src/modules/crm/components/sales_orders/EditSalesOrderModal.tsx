import React, { useState, useEffect } from "react";
import { X, Loader2, Calendar } from "lucide-react";
import { SalesOrder, Customer } from "../../types/types";

interface EditSalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: SalesOrder) => void;
  orderToEdit: SalesOrder | null;
  customers: Customer[];
  authFetch: (path: string, options?: Record<string, any>) => Promise<any>;
}

export function EditSalesOrderModal({
  isOpen,
  onClose,
  onSuccess,
  orderToEdit,
  customers,
  authFetch,
}: EditSalesOrderModalProps) {
  const [orderNumber, setOrderNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [actualDeliveryDate, setActualDeliveryDate] = useState("");
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
    if (isOpen && orderToEdit) {
      setOrderNumber(orderToEdit.order_number);
      const cust = customers.find((c) => c.id === orderToEdit.customer_id);
      setCustomerName(cust ? cust.company_name : "Unknown Customer");
      setStatus(orderToEdit.status || "confirmed");
      setPaymentTerms(orderToEdit.payment_terms || "");
      setDeliveryTerms(orderToEdit.delivery_terms || "");
      setExpectedDeliveryDate(orderToEdit.expected_delivery_date ? orderToEdit.expected_delivery_date.split("T")[0] : "");
      setActualDeliveryDate(orderToEdit.actual_delivery_date ? orderToEdit.actual_delivery_date.split("T")[0] : "");
      setInternalNotes(orderToEdit.internal_notes || "");
      setErrorMsg("");
    }
  }, [isOpen, orderToEdit, customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToEdit) return;

    setSaving(true);
    setErrorMsg("");

    try {
      const updated = await authFetch(`/sales/orders/${orderToEdit.id}`, {
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

      if (updated) {
        onSuccess(updated);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update Sales Order settings.");
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
            Modify Sales Order Settings
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
            
            {/* Order Number */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Order Number
              </label>
              <input
                type="text"
                disabled
                value={orderNumber}
                className="w-full rounded-lg border border-color bg-main/40 py-2 px-3 text-xs outline-none text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>

            {/* Customer */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Customer Name
              </label>
              <input
                type="text"
                disabled
                value={customerName}
                className="w-full rounded-lg border border-color bg-main/40 py-2 px-3 text-xs outline-none text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>

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
                Order Status
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
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
              />
            </div>

            {/* Delivery Terms */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Delivery Terms
              </label>
              <input
                type="text"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
              />
            </div>

            {/* Internal Notes */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Internal Notes
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
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
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
