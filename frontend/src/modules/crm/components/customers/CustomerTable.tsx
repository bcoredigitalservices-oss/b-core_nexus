import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit2 } from "lucide-react";
import { Customer, User } from "../../types/types";

interface CustomerTableProps {
  customers: Customer[];
  users: User[];
  onEditClick: (customer: Customer) => void;
}

export function CustomerTable({ customers, users, onEditClick }: CustomerTableProps) {
  const navigate = useNavigate();

  const getOwnerName = (id?: string | null) => {
    if (!id) return "Unassigned";
    const user = users.find((u) => u.id === id);
    return user ? `${user.first_name} ${user.last_name || ""}`.trim() : "Unknown Operator";
  };

  return (
    <div className="bg-card border border-color rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-color bg-main/50 select-none">
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] w-28 uppercase tracking-wider">
                Cust ID
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Company Name
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Tax ID (VAT/GST)
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Payment Terms
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Credit Limit
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
            {customers.map((c) => (
              <tr 
                key={c.id} 
                className="hover:bg-main/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/workspace/crm/customers/${c.id}`)}
              >
                <td className="py-3.5 px-5 font-mono font-bold text-xs text-accent-primary">
                  <Link 
                    to={`/workspace/crm/customers/${c.id}`} 
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.reference_number}
                  </Link>
                </td>
                <td className="py-3.5 px-5 text-xs font-bold text-[var(--text-main)]">
                  <Link 
                    to={`/workspace/crm/customers/${c.id}`} 
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.company_name}
                  </Link>
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-muted)]">
                  {c.tax_id || <span className="opacity-40 italic">—</span>}
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-main)] font-semibold">
                  {c.payment_terms || "Net 30"}
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-main)] font-semibold">
                  {c.credit_limit !== null && c.credit_limit !== undefined ? (
                    `$${Number(c.credit_limit).toLocaleString()}`
                  ) : (
                    <span className="opacity-40 italic">—</span>
                  )}
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-main)]">
                  {getOwnerName(c.owner_id)}
                </td>
                <td className="py-3.5 px-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(c);
                      }}
                      className="p-1.5 hover:bg-main border border-transparent hover:border-color text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg cursor-pointer transition"
                      title="Edit Customer Profile"
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
