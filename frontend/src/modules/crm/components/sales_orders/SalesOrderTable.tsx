import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit2 } from "lucide-react";
import { SalesOrder, Customer, User } from "../../types/types";
import { useAppContext } from "../../../../context/AppContext";

interface SalesOrderTableProps {
  salesOrders: SalesOrder[];
  customers: Customer[];
  users: User[];
  onEditClick: (order: SalesOrder) => void;
}

export function SalesOrderTable({
  salesOrders,
  customers,
  users,
  onEditClick,
}: SalesOrderTableProps) {
  const navigate = useNavigate();
  const { systemSettings } = useAppContext();

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
    if (s === "delivered") return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    if (s === "cancelled") return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
    if (s === "shipped") return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    if (s === "processing") return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
    return "bg-sky-500/10 text-sky-500 border border-sky-500/20"; // Confirmed / default
  };

  const formatCurrency = (amount: number, currencyCode?: string) => {
    const curr = currencyCode || systemSettings?.base_currency || "USD";
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
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] w-36 uppercase tracking-wider">
                Order Ref
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Customer Name
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] w-28 uppercase tracking-wider text-center">
                Status
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Expected Delivery
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Total Value
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Account Owner
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-color">
            {salesOrders.map((o) => (
              <tr 
                key={o.id} 
                className="hover:bg-main/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/workspace/crm/sales-orders/${o.id}`)}
              >
                <td className="py-3.5 px-5 font-mono font-bold text-xs text-accent-primary">
                  <Link 
                    to={`/workspace/crm/sales-orders/${o.id}`} 
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {o.reference_number || o.order_number}
                  </Link>
                </td>
                <td className="py-3.5 px-5 text-xs font-bold text-[var(--text-main)]">
                  {getCustomerName(o.customer_id)}
                </td>
                <td className="py-3.5 px-5 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(o.status)}`}>
                    {o.status}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-muted)]">
                  {o.expected_delivery_date ? (
                    new Date(o.expected_delivery_date).toLocaleDateString(undefined, { dateStyle: "medium" })
                  ) : (
                    <span className="opacity-40 italic">—</span>
                  )}
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-main)] font-semibold">
                  {formatCurrency(o.grand_total, o.currency)}
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-main)]">
                  {getOwnerName(o.owner_id)}
                </td>
                <td className="py-3.5 px-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(o);
                      }}
                      className="p-1.5 hover:bg-main border border-transparent hover:border-color text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg cursor-pointer transition"
                      title="Edit Sales Order details"
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
