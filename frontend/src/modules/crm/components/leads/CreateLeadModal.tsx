import React, { useState } from "react";
import { X, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { Contact, Lead, User } from "../../types/types";
import { useAppContext } from "../../../../context/AppContext";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLead: Lead) => void;
  contacts: Contact[];
  users: User[];
}

export function CreateLeadModal({
  isOpen,
  onClose,
  onSuccess,
  contacts,
}: CreateLeadModalProps) {
  const { authFetch } = useAppContext();

  // Core Lead fields (all confirmed present on POST /crm/leads)
  const [leadName, setLeadName] = useState("");
  const [leadType, setLeadType] = useState<"person" | "company">("person");
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("Website");
  const [status, setStatus] = useState("lead");
  const [priority, setPriority] = useState("Medium");

  // Contact linkage — Lead has no email/phone/website columns of its own.
  // These live on a real Contact record, linked via primary_contact_id.
  const [linkMode, setLinkMode] = useState<"new" | "existing">("new");
  const [existingContactId, setExistingContactId] = useState("");
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactJobTitle, setContactJobTitle] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const resetForm = () => {
    setLeadName("");
    setLeadType("person");
    setCompany("");
    setSource("Website");
    setStatus("lead");
    setPriority("Medium");
    setLinkMode("new");
    setExistingContactId("");
    setContactFirstName("");
    setContactLastName("");
    setContactEmail("");
    setContactPhone("");
    setContactJobTitle("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim()) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Resolve primary_contact_id — either link an existing Contact,
      //    or create one on the fly (real Contact fields only).
      let primaryContactId: string | null = null;

      if (linkMode === "existing") {
        primaryContactId = existingContactId || null;
      } else if (contactFirstName.trim() || contactEmail.trim() || contactPhone.trim()) {
        try {
          const contact: any = await authFetch("/crm/contacts", {
            method: "POST",
            body: JSON.stringify({
              first_name: contactFirstName.trim() || leadName.split(" ")[0] || "Lead",
              last_name: contactLastName.trim() || null,
              email: contactEmail.trim() || null,
              phone: contactPhone.trim() || null,
              job_title: contactJobTitle.trim() || null,
              department: null,
            }),
          });
          if (contact?.id) primaryContactId = contact.id;
        } catch (err) {
          console.error("Failed to pre-create associated contact:", err);
        }
      }

      // 2. Create the Lead — only fields the backend schema actually accepts.
      //    owner_id is never in this list: it's server-assigned, sending it does nothing.
      const payload = {
        title: leadName.trim(),
        lead_type: leadType,
        company_name: company.trim() || null,
        pipeline_stage: status,
        priority,
        lead_source: source,
        primary_contact_id: primaryContactId,
      };

      const newLead = await authFetch("/crm/leads", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (newLead) {
        setSuccessMsg("Lead created successfully.");
        onSuccess(newLead);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create lead profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
            Create New Lead
          </h3>
          <p className="text-xs text-[var(--text-muted)] m-0">
            Insert basic parameters to setup a sales pipeline lead.
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
              placeholder="e.g. Acme Enterprise ERP License"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
            />
          </div>

          {/* Lead Type & Company */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Lead Type
              </label>
              <select
                value={leadType}
                onChange={(e) => setLeadType(e.target.value as "person" | "company")}
                disabled={submitting}
                className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
              >
                <option value="person">Person</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Company
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
              />
            </div>
          </div>

          {/* Source, Status, Priority Grid — all real Lead fields */}
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

          {/* Contact Linkage — real Contact entity, not fake Lead columns */}
          <div className="flex flex-col gap-2 border-t border-color pt-3.5 mt-1">
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                Primary Contact
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setLinkMode("new")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition ${
                    linkMode === "new"
                      ? "bg-accent-primary text-white border-accent-primary"
                      : "border-color text-[var(--text-muted)]"
                  }`}
                >
                  New Contact
                </button>
                <button
                  type="button"
                  onClick={() => setLinkMode("existing")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition ${
                    linkMode === "existing"
                      ? "bg-accent-primary text-white border-accent-primary"
                      : "border-color text-[var(--text-muted)]"
                  }`}
                >
                  Existing Contact
                </button>
              </div>
            </div>

            {linkMode === "existing" ? (
              <select
                value={existingContactId}
                onChange={(e) => setExistingContactId(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
              >
                <option value="">No contact linked</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name || ""}
                    {c.email ? ` — ${c.email}` : ""}
                  </option>
                ))}
              </select>
            ) : (
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
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-2.5 px-4 font-bold text-xs bg-accent-primary text-white hover:brightness-110 cursor-pointer transition shadow-md mt-2"
          >
            {submitting ? "Saving Lead Data..." : "Generate Lead Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
