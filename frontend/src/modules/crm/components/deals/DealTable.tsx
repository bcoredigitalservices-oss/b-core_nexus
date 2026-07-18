import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit2, TrendingUp, Power, PowerOff } from "lucide-react";
import { Deal, User, Customer, Lead } from "../../types/types";
import { useAppContext } from "../../../../context/AppContext";

interface DealTableProps {
  deals: Deal[];
  users: User[];
  customers: Customer[];
  leads: Lead[];
  onEditClick: (deal: Deal) => void;
  onToggleActiveClick: (deal: Deal) => void;
}

export function DealTable({
  deals,
  users,
  customers,
  leads,
  onEditClick,
  onToggleActiveClick,
}: DealTableProps) {
  const navigate = useNavigate();
  const { systemSettings } = useAppContext();
  const baseCurrency = systemSettings?.base_currency || "USD";

  const getOwnerName = (id?: string | null) => {
    if (!id) return "Unassigned";
    const user = users.find((u) => u.id === id);
    return user ? `${user.first_name} ${user.last_name || ""}`.trim() : "Unknown Operator";
  };

  const getAssociationName = (deal: Deal) => {
    if (deal.customer_id) {
      const cust = customers.find((c) => c.id === deal.customer_id);
      return cust ? `Cust: ${cust.company_name}` : "Associated Customer";
    }
    if (deal.lead_id) {
      const lead = leads.find((l) => l.id === deal.lead_id);
      return lead ? `Lead: ${lead.title}` : "Associated Lead";
    }
    return "Standalone Opportunity";
  };

  const getStageBadgeClass = (stage: string) => {
    const s = stage.toLowerCase();
    if (s === "won" || s === "closed won") return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    if (s === "lost" || s === "closed lost") return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
    if (s === "negotiation") return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    if (s === "proposal") return "bg-sky-500/10 text-sky-500 border border-sky-500/20";
    return "bg-slate-500/10 text-[var(--text-muted)] border border-color";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: baseCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return <span className="opacity-40 italic">—</span>;
    return new Date(dateStr).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  };

  return (
    <div className="bg-card border border-color rounded-2xl overflow-hidden shadow-sm animate-[fadeIn_0.2s_ease]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-color bg-main/50 select-none">
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] w-24 uppercase tracking-wider">
                Deal Ref
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Opportunity Name
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Association
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] w-28 uppercase tracking-wider text-center">
                Stage
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Expected Value
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Target Close Date
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Deal Owner
              </th>
              <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-color">
            {deals.map((d) => (
              <tr 
                key={d.id} 
                className={`hover:bg-main/30 transition-colors cursor-pointer ${!d.is_active ? "opacity-75" : ""}`}
                onClick={() => navigate(`/workspace/crm/deals/${d.id}`)}
              >
                <td className="py-3.5 px-5 font-mono font-bold text-xs text-accent-primary">
                  <Link 
                    to={`/workspace/crm/deals/${d.id}`} 
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {d.reference_number || `DEAL-${d.id.substring(0,4).toUpperCase()}`}
                  </Link>
                </td>
                <td className="py-3.5 px-5 text-xs font-bold text-[var(--text-main)]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-emerald-500 shrink-0" size={13} />
                    <Link 
                      to={`/workspace/crm/deals/${d.id}`} 
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {d.deal_name}
                    </Link>
                    {!d.is_active && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wider">
                        Inactive
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-muted)]">
                  {getAssociationName(d)}
                </td>
                <td className="py-3.5 px-5 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStageBadgeClass(d.pipeline_stage)}`}>
                    {d.pipeline_stage}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-main)] font-semibold">
                  {formatCurrency(d.expected_revenue)}
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-main)] font-semibold">
                  {formatDate(d.close_date)}
                </td>
                <td className="py-3.5 px-5 text-xs text-[var(--text-main)]">
                  {getOwnerName(d.owner_id)}
                </td>
                <td className="py-3.5 px-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(d);
                      }}
                      className="p-1.5 hover:bg-main border border-transparent hover:border-color text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg cursor-pointer transition"
                      title="Edit Opportunity"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleActiveClick(d);
                      }}
                      className={`p-1.5 hover:bg-main border border-transparent hover:border-color rounded-lg cursor-pointer transition ${
                        d.is_active 
                          ? "text-amber-600 hover:bg-amber-500/5" 
                          : "text-emerald-600 hover:bg-emerald-500/5"
                      }`}
                      title={d.is_active ? "Deactivate Opportunity" : "Activate Opportunity"}
                    >
                      {d.is_active ? <PowerOff size={13} /> : <Power size={13} />}
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

