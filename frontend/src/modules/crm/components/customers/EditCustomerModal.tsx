import React, { useState, useEffect } from "react";
import { X, Loader2, CreditCard } from "lucide-react";
import { User, Customer } from "../../types/types";

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCust: Customer) => void;
  customerToEdit: Customer | null;
  users: User[];
  authFetch: (path: string, options?: Record<string, any>) => Promise<any>;
}

export function EditCustomerModal({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit,
  users,
  authFetch,
}: EditCustomerModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [creditLimit, setCreditLimit] = useState("");
  const [assignedOwner, setAssignedOwner] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const paymentTermsList = ["Net 30", "Net 60", "Immediate", "COD", "Due on Receipt"];

  useEffect(() => {
    if (isOpen && customerToEdit) {
      setCompanyName(customerToEdit.company_name || "");
      setTaxId(customerToEdit.tax_id || "");
      setPaymentTerms(customerToEdit.payment_terms || "Net 30");
      setCreditLimit(customerToEdit.credit_limit ? String(customerToEdit.credit_limit) : "");
      setAssignedOwner(customerToEdit.owner_id || "");
      setErrorMsg("");
    }
  }, [isOpen, customerToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !customerToEdit) return;

    setSaving(true);
    setErrorMsg("");

    try {
      const updated = await authFetch(`/crm/customers/${customerToEdit.id}`, {
        method: "PUT",
        body: JSON.stringify({
          company_name: companyName.trim(),
          tax_id: taxId.trim() || null,
          payment_terms: paymentTerms,
          credit_limit: creditLimit ? parseFloat(creditLimit) : null,
          owner_id: assignedOwner || null,
        }),
      });

      if (updated) {
        onSuccess(updated);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update customer profile.");
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
            Modify Customer Profile
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
            
            {/* Company Name */}
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
              />
            </div>

            {/* Tax ID */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Tax ID (GSTIN/VAT)
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. GB12345678"
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
              />
            </div>

            {/* Credit Limit */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Credit Limit ($)
              </label>
              <div className="relative flex items-center">
                <CreditCard size={13} className="absolute left-3 text-[var(--text-muted)]" />
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                />
              </div>
            </div>

            {/* Payment Terms */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                {paymentTermsList.map((term) => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>

            {/* Assigned Owner */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Account Owner
              </label>
              <select
                value={assignedOwner}
                onChange={(e) => setAssignedOwner(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                <option value="">Select Account Owner</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name || ""}
                  </option>
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
