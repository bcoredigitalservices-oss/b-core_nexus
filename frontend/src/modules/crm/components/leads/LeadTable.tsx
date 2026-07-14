import React from "react";
import { Link } from "react-router-dom";
import { Eye, Edit2, Trash2, UserPlus } from "lucide-react";
import { Lead, User, Contact } from "../../types/types";

interface LeadTableProps {
  leads: Lead[];
  users: User[];
  contacts: Contact[];
  onEditClick: (lead: Lead) => void;
  onDeleteClick: (id: string) => void;
  onConvertClick?: (id: string) => void;
}

export function LeadTable({
  leads,
  users,
  contacts,
  onEditClick,
  onDeleteClick,
  onConvertClick,
}: LeadTableProps) {
  // Helper: Get Owner Full Name
  const getOwnerName = (ownerId?: string | null) => {
    if (!ownerId) return "Unassigned";
    const user = users.find((u) => u.id === ownerId);
    return user ? `${user.first_name} ${user.last_name || ""}`.trim() : "Unknown Operator";
  };

  // Helper: Get Mapped Contact Name
  const getLeadContact = (lead: Lead) => {
    if (contacts.length === 0) return "No Contacts";
    const refNum = lead.reference_number || "";
    const index = parseInt(refNum.replace(/\D/g, ""), 10) || 0;
    const contact = contacts[index % contacts.length];
    return contact
      ? `${contact.first_name} ${contact.last_name || ""}`.trim()
      : "No Contacts";
  };

  // Helper: Status stage color configurations
  const getStageBadgeClass = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "won":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "lost":
        return "bg-gray-500/10 text-gray-500 border border-gray-500/20";
      case "proposal":
      case "negotiation":
        return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
      case "qualified":
        return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
      default:
        return "bg-sky-500/10 text-sky-500 border border-sky-500/20";
    }
  };

  return (
    <div className="bg-card border border-color rounded-xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.01)] animate-[fadeIn_0.2s_ease]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-color bg-main select-none">
              <th className="py-3.5 px-5 font-bold text-[var(--text-muted)] w-14 text-center">Ref</th>
              <th className="py-3.5 px-4 font-bold text-[var(--text-muted)]">Lead Name</th>
              <th className="py-3.5 px-4 font-bold text-[var(--text-muted)]">Company</th>
              <th className="py-3.5 px-4 font-bold text-[var(--text-muted)] w-28 text-center">Status</th>
              <th className="py-3.5 px-4 font-bold text-[var(--text-muted)]">Source</th>
              <th className="py-3.5 px-4 font-bold text-[var(--text-muted)]">Owner</th>
              <th className="py-3.5 px-4 font-bold text-[var(--text-muted)]">Contacts</th>
              <th className="py-3.5 px-4 font-bold text-[var(--text-muted)]">Created At</th>
              <th className="py-3.5 px-4 font-bold text-[var(--text-muted)] w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-color">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-main/40 transition-colors">
                <td className="py-3.5 px-5 font-mono font-bold text-center text-accent-primary">{lead.reference_number}</td>
                <td className="py-3.5 px-4 font-bold text-[var(--text-main)] truncate max-w-[200px]">{lead.title}</td>
                <td className="py-3.5 px-4 text-[var(--text-muted)]">{lead.company_name || <span className="opacity-40 italic">—</span>}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStageBadgeClass(lead.pipeline_stage)}`}>
                    {lead.pipeline_stage}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-[var(--text-muted)]">{lead.lead_source || "Website"}</td>
                <td className="py-3.5 px-4 font-medium text-[var(--text-main)]">{getOwnerName(lead.owner_id)}</td>
                <td className="py-3.5 px-4 font-medium text-[var(--text-muted)]">{getLeadContact(lead)}</td>
                <td className="py-3.5 px-4 text-[var(--text-muted)]">
                  {new Date(lead.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center justify-center gap-1.5">
                    <Link
                      to={`/workspace/crm/leads/${lead.id}`}
                      title="View Details"
                      className="p-1.5 border border-color rounded-lg bg-card hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer inline-flex items-center"
                    >
                      <Eye size={13} />
                    </Link>
                    <button
                      onClick={() => onEditClick(lead)}
                      title="Edit Details"
                      className="p-1.5 border border-color rounded-lg bg-card hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                    {onConvertClick && !lead.is_converted && lead.pipeline_stage !== "converted" && (
                      <button
                        onClick={() => onConvertClick(lead.id)}
                        title="Convert to Customer"
                        className="p-1.5 border border-color rounded-lg bg-card hover:bg-main text-emerald-600 hover:bg-emerald-500/5 transition cursor-pointer"
                      >
                        <UserPlus size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteClick(lead.id)}
                      title="Delete Lead"
                      className="p-1.5 border border-color rounded-lg bg-card hover:bg-main text-rose-500 hover:bg-rose-500/5 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
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
