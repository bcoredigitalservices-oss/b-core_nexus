import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit2, ShoppingBag, Loader2 } from "lucide-react";
import { Quotation, Customer, User } from "../../types/types";

interface QuotationTableProps {
  quotations: Quotation[];
  customers: Customer[];
  users: User[];
  onEditClick: (quotation: Quotation) => void;
  onConvertClick: (id: string) => void;
  convertingId: string | null;
}

export function QuotationTable({
  quotations,
  customers,
  users,
  onEditClick,
  onConvertClick,
  convertingId,
}: QuotationTableProps) {
  const navigate = useNavigate();

  const getCustomerName = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    return cust ? cust.company_name : "Unknown Customer";
  };

  const getOwnerName = (id?: string | null) => {
    if (!id) return "Unassigned";
    const user = users.find((u) => u.id === id);
    return user ? `${user.first_name} ${user.last_name || ""}`.trim() : "Unknown Operator";
  };

  const getStatusBadgeClass = (statusStr: string) => {
    const s = statusStr.toLowerCase();
    if (s === "accepted") return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    if (s === "rejected") return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
    if (s === "sent") return "bg-sky-500/10 text-sky-500 border border-sky-500/20";
    if (s === "expired") return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    return "bg-slate-500/10 text-[var(--text-muted)] border border-color";
  };

  const formatCurrency = (amount: number, currencyCode: string = "USD") => {
    const curr = currencyCode === "NGN" ? "NGN" : "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-card border border-color rounded-2xl overflow-hidden shadow-sm animate-[fadeIn_0.2s_ease]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-color bg-main/50 select-none">
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] w-32 uppercase tracking-wider">
                Quotation Ref
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Customer Name
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] w-28 uppercase tracking-wider text-center">
                Status
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Validity
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Total Value
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Assigned Owner
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-color">
            {quotations.map((q) => (
              <tr 
                key={q.id} 
                className="hover:bg-main/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/workspace/crm/quotations/${q.id}`)}
              >
                <td className="py-3.5 px-5 font-mono font-bold text-xs text-accent-primary">
                  <Link 
                    to={`/workspace/crm/quotations/${q.id}`} 
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {q.reference_number || q.quotation_number}
                  </Link>
                </td>
                <td className="py-3.5 px-5 text-xs font-bold text-[var(--text-main)]">
                  {getCustomerName(q.customer_id)}
                </td>
                <td className="py-3.5 px-5 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(q.status)}`}>
                    {q.status}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-muted)]">
                  {q.validity_date ? (
                    new Date(q.validity_date).toLocaleDateString(undefined, { dateStyle: "medium" })
                  ) : (
                    <span className="opacity-40 italic">—</span>
                  )}
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-main)] font-semibold">
                  {formatCurrency(q.grand_total, q.currency)}
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-main)]">
                  {getOwnerName(q.owner_id)}
                </td>
                <td className="py-3.5 px-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Convert to Sales Order */}
                    {q.status.toLowerCase() === "accepted" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onConvertClick(q.id);
                        }}
                        disabled={convertingId === q.id}
                        className="p-1.5 hover:bg-emerald-500/10 text-emerald-600 rounded-lg cursor-pointer transition border border-transparent hover:border-emerald-500/20"
                        title="Convert to Sales Order"
                      >
                        {convertingId === q.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <ShoppingBag size={13} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(q);
                      }}
                      className="p-1.5 hover:bg-main border border-transparent hover:border-color text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg cursor-pointer transition"
                      title="Edit Quotation details"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
