import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { Lead, User } from "../../types/types";
import { useAppContext } from "../../../../context/AppContext";

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedLead: Lead) => void;
  leadToEdit: Lead | null;
  users: User[];
}

export function EditLeadModal({
  isOpen,
  onClose,
  onSuccess,
  leadToEdit,
}: EditLeadModalProps) {
  const { authFetch } = useAppContext();

  // Fields matching PUT /crm/leads/{id} exactly
  const [leadName, setLeadName] = useState("");
  const [leadType, setLeadType] = useState<"person" | "company">("person");
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("Website");
  const [status, setStatus] = useState("lead");
  const [priority, setPriority] = useState("Medium");
  const [isActive, setIsActive] = useState(true);

  // Linked contact — edited via the real Contact endpoint, not the Lead endpoint
  const [contactId, setContactId] = useState<string | null>(null);
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactJobTitle, setContactJobTitle] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (isOpen && leadToEdit) {
      setLeadName(leadToEdit.title || "");
      setLeadType((leadToEdit as any).lead_type || "person");
      setCompany(leadToEdit.company_name || "");
      setSource(leadToEdit.lead_source || "Website");
      setStatus(leadToEdit.pipeline_stage || "lead");
      setPriority((leadToEdit as any).priority || "Medium");
      setIsActive(leadToEdit.is_active !== false);

      const primaryLink = (leadToEdit as any).contacts?.find(
        (link: any) => link.role_at_lead === "Primary Contact"
      ) || (leadToEdit as any).contacts?.[0];
      const contact = primaryLink?.contact;

      setContactId(contact?.id || null);
      setContactFirstName(contact?.first_name || "");
      setContactLastName(contact?.last_name || "");
      setContactEmail(contact?.email || "");
      setContactPhone(contact?.phone || "");
      setContactJobTitle(contact?.job_title || "");

      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, leadToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadToEdit) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Update the Lead itself — only real Update-Lead fields
      const updated = await authFetch(`/crm/leads/${leadToEdit.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: leadName.trim(),
          lead_type: leadType,
          pipeline_stage: status,
          priority,
          company_name: company.trim() || null,
          lead_source: source,
          is_active: isActive,
        }),
      });

      // 2. Update the linked Contact separately, via the real Contact endpoint
      if (contactId) {
        try {
          await authFetch(`/crm/contacts/${contactId}`, {
            method: "PUT",
            body: JSON.stringify({
              first_name: contactFirstName.trim() || "Contact",
              last_name: contactLastName.trim() || null,
              email: contactEmail.trim() || null,
              phone: contactPhone.trim() || null,
              job_title: contactJobTitle.trim() || null,
              department: null,
            }),
          });
        } catch (e) {
          console.error("Failed to sync linked contact details:", e);
        }
      }

      if (updated) {
        setSuccessMsg("Lead parameters saved successfully.");
        onSuccess(updated);
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save lead updates.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !leadToEdit) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-6 animate-[fadeIn_0.2s_ease]">
      <div className="w-full max-w-[550px] bg-card border border-color rounded-2xl p-6 shadow-xl flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
        >
          <X size={15} />
        </button>

        <div className="flex flex-col gap-1 border-b border-color pb-3">
          <h3 className="text-[1.1rem] font-extrabold text-[var(--text-main)] flex items-center gap-2 m-0">
            <TrendingUp size={18} className="text-accent-primary" />
            Modify Lead Settings
          </h3>
          <p className="text-xs text-[var(--text-muted)] m-0">
            Adjust general specifications for reference:{" "}
            <strong className="font-mono text-accent-primary">{leadToEdit.reference_number}</strong>
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 py-2.5 px-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 py-2.5 px-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-xs">
            <CheckCircle size={15} className="shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Lead Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
              Lead Name / Title *
            </label>
            <input
              type="text"
              required
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] font-semibold"
            />
          </div>

          {/* Lead Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
              Lead Type
            </label>
            <select
              value={leadType}
              onChange={(e) => setLeadType(e.target.value as "person" | "company")}
              disabled={submitting}
              className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer font-semibold"
            >
              <option value="person">Individual (Person)</option>
              <option value="company">Organization (Company)</option>
            </select>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
              Company Name
            </label>
            <input
              type="text"
              disabled={submitting || leadType !== "company"}
              placeholder={leadType !== "company" ? "N/A (Individual Lead)" : "e.g. Acme Corp"}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] disabled:opacity-50 font-semibold"
            />
          </div>

          {/* Source, Status, Priority */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
              >
                <option value="Website">Website</option>
                <option value="Email">Email</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Referral">Referral</option>
                <option value="Partner">Partner</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Pipeline Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
              >
                <option value="lead">Lead</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won (Deal)</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Active toggle — real Update Lead field */}
          <label className="flex items-center gap-2 text-xs text-[var(--text-main)] font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={submitting}
              className="accent-accent-primary cursor-pointer"
            />
            Lead is active
          </label>

          {/* Linked Contact — real Contact fields, saved via /crm/contacts/{id} */}
          <div className="flex flex-col gap-3 border-t border-color pt-3.5 mt-1">
            <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
              Primary Contact {!contactId && <span className="opacity-50 normal-case">(none linked)</span>}
            </label>
            {contactId && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="First name"
                    value={contactFirstName}
                    onChange={(e) => setContactFirstName(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={contactLastName}
                    onChange={(e) => setContactLastName(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
                  />
                  <input
                    type="text"
                    placeholder="Job title"
                    value={contactJobTitle}
                    onChange={(e) => setContactJobTitle(e.target.value)}
                    disabled={submitting}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] col-span-2"
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-2.5 px-4 font-bold text-xs bg-accent-primary text-white hover:brightness-110 cursor-pointer transition shadow-md mt-2"
          >
            {submitting ? "Saving Lead Data..." : "Save Parameters"}
          </button>
        </form>
      </div>
    </div>
  );
}
