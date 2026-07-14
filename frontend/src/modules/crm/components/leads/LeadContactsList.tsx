import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, Trash2, X, Link as LinkIcon, Loader2 } from "lucide-react";
import { Contact } from "../../types/types";

interface LeadContactsListProps {
  leadContacts: any[];
  allContacts: Contact[];
  onLinkContact: (contactId: string, roleAtLead: string) => Promise<void>;
  onUnlinkContact: (contactId: string) => Promise<void>;
}

export function LeadContactsList({
  leadContacts = [],
  allContacts = [],
  onLinkContact,
  onUnlinkContact,
}: LeadContactsListProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [roleAtLead, setRoleAtLead] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) return;

    setSubmitting(true);
    setLocalError("");
    try {
      await onLinkContact(selectedContactId, roleAtLead.trim() || "Influencer");
      setSelectedContactId("");
      setRoleAtLead("");
      setIsLinking(false);
    } catch (err: any) {
      setLocalError(err.message || "Failed to link contact.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = async (contactId: string) => {
    try {
      await onUnlinkContact(contactId);
    } catch (err: any) {
      setLocalError(err.message || "Failed to unlink contact.");
    }
  };

  // Filter out contacts that are already linked to the lead
  const unlinkedContacts = allContacts.filter(
    (c) => !leadContacts.some((link) => link.contact_id === c.id)
  );

  return (
    <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-color pb-3">
        <div className="flex items-center gap-2">
          <Users className="text-accent-primary" size={16} />
          <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
            Associated Stakeholders
          </h3>
        </div>
        {!isLinking && (
          <button
            onClick={() => setIsLinking(true)}
            className="flex items-center gap-1 py-1.5 px-3 bg-accent-primary text-white rounded-lg text-xs font-bold hover:brightness-110 cursor-pointer transition shadow-xs"
          >
            <Plus size={12} /> Link Stakeholder
          </button>
        )}
      </div>

      {localError && (
        <div className="py-2 px-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-semibold">
          {localError}
        </div>
      )}

      {/* Inline Link Contact Form */}
      {isLinking && (
        <form onSubmit={handleLink} className="bg-main/30 border border-color p-4 rounded-xl flex flex-col gap-3 animate-[slideUp_0.15s_ease-out]">
          <div className="flex justify-between items-center border-b border-color/40 pb-2">
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon size={11} className="text-accent-primary" /> Link Existing Contact
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLinking(false);
                setLocalError("");
              }}
              disabled={submitting}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-50 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Select Contact *
              </label>
              <select
                required
                value={selectedContactId}
                disabled={submitting}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-1.5 px-2.5 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
              >
                <option value="">Choose contact...</option>
                {unlinkedContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name || ""} {c.email ? `(${c.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Role at Lead Opportunity
              </label>
              <input
                type="text"
                placeholder="e.g. Decision Maker, Technical Reviewer"
                value={roleAtLead}
                disabled={submitting}
                onChange={(e) => setRoleAtLead(e.target.value)}
                className="w-full rounded-lg border border-color bg-main py-1.5 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setIsLinking(false);
                setLocalError("");
              }}
              className="py-1.5 px-3 border border-color rounded-lg text-xs font-semibold hover:bg-main text-[var(--text-muted)] cursor-pointer transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-1.5 px-3 bg-accent-primary text-white rounded-lg text-xs font-bold hover:brightness-110 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Plus size={11} />
              )}
              Link Connection
            </button>
          </div>
        </form>
      )}

      {/* Linked Stakeholders Table */}
      <div className="overflow-x-auto border border-color rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-main/50 border-b border-color select-none">
              <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Stakeholder</th>
              <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Email Address</th>
              <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Role at Lead</th>
              <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right w-16">Revoke</th>
            </tr>
          </thead>
          <tbody>
            {leadContacts.map((link) => (
              <tr key={link.id} className="border-b border-color/40 hover:bg-main/10 text-xs transition-colors">
                <td className="py-3 px-4 font-bold text-[var(--text-main)] hover:underline">
                  <Link to={`/workspace/crm/contacts/${link.contact_id}`} onClick={(e) => e.stopPropagation()}>
                    {link.contact?.first_name} {link.contact?.last_name || ""}
                  </Link>
                </td>
                <td className="py-3 px-4 text-[var(--text-muted)] font-medium">
                  {link.contact?.email || <span className="opacity-40 italic">—</span>}
                </td>
                <td className="py-3 px-4 text-[var(--text-main)] font-semibold">
                  <span className="px-2 py-0.5 rounded-full text-[9px] bg-main border border-color">
                    {link.role_at_lead || "Stakeholder"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleUnlink(link.contact_id)}
                    className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg border border-transparent hover:border-rose-500/20 cursor-pointer transition"
                    title="Remove Contact Linkage"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {leadContacts.length === 0 && (
              <tr>
                <td colSpan={4} className="py-5 px-4 text-center text-xs text-[var(--text-muted)] italic">
                  No other contacts mapped to this lead file yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
