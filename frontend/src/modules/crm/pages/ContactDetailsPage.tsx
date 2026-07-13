import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Save,
  Mail,
  Phone,
  Briefcase,
  Users
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";
import { User as UserItem } from "../types/types";

interface ContactDetails {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  department: string | null;
  is_active: boolean;
  owner_id: string | null;
  created_at: string;
}

export default function ContactDetailsPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const { token, authFetch } = useAppContext();

  // Data states
  const [contact, setContact] = useState<ContactDetails | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // UI/Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "connections">("details");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchData = async () => {
    if (!contactId || !token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [contactRes, usersRes, leadsRes, customersRes] = await Promise.all([
        authFetch(`/crm/contacts/${contactId}`) as Promise<ContactDetails>,
        authFetch("/auth/users").catch(() => []) as Promise<UserItem[]>,
        authFetch(`/crm/contacts/${contactId}/leads`).catch(() => []) as Promise<any[]>,
        authFetch(`/crm/contacts/${contactId}/customers`).catch(() => []) as Promise<any[]>,
      ]);

      if (contactRes) {
        setContact(contactRes);
        setFirstName(contactRes.first_name);
        setLastName(contactRes.last_name || "");
        setEmail(contactRes.email || "");
        setPhone(contactRes.phone || "");
        setJobTitle(contactRes.job_title || "");
        setDepartment(contactRes.department || "");
        setOwnerId(contactRes.owner_id || "");
        setIsActive(contactRes.is_active);
      }
      setUsers(usersRes);
      setLeads(leadsRes);
      setCustomers(customersRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load contact record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contactId, token]);

  const handleSaveContact = async () => {
    if (!contactId) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updated = await authFetch(`/crm/contacts/${contactId}`, {
        method: "PUT",
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          job_title: jobTitle.trim() || null,
          department: department.trim() || null,
          owner_id: ownerId || null,
          is_active: isActive,
        }),
      });
      setSuccessMsg("Contact details updated successfully.");
      setContact((prev) => prev ? { ...prev, ...updated } : null);
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save contact settings.");
    } finally {
      setSaving(false);
    }
  };

  const getOwnerName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user ? `${user.first_name} ${user.last_name || ""}`.trim() : "Unassigned";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center gap-3 py-32 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto">
          <Loader2 size={36} className="animate-spin text-accent-primary" />
          <span className="text-xs text-[var(--text-muted)]">Loading Contact File Ledger…</span>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!contact) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto">
          <AlertCircle size={36} className="text-rose-500" />
          <h3 className="text-md font-bold text-[var(--text-main)]">Contact Profile Not Found</h3>
          <Link to="/workspace/crm/contacts" className="text-xs font-bold text-accent-primary hover:underline">
            Return to Contacts directory
          </Link>
        </div>
      </WorkspaceLayout>
    );
  }

  const displayName = `${contact.first_name} ${contact.last_name || ""}`.trim();

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-5 max-w-[1400px] mx-auto animate-[fadeIn_0.2s_ease]">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-color pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/workspace/crm/contacts"
              className="p-2 border border-color bg-card hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl cursor-pointer transition"
            >
              <ArrowLeft size={14} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Contact Profile / ID: {contact.id.substring(0, 8)}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${contact.is_active ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
                  {contact.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <h2 className="text-lg font-black text-[var(--text-main)] mt-1 mb-0 select-all">
                {displayName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {successMsg && (
              <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 bg-emerald-500/10 py-1.5 px-3 rounded-lg border border-emerald-500/20">
                <CheckCircle size={14} /> {successMsg}
              </span>
            )}
            {errorMsg && (
              <span className="text-xs text-rose-500 font-semibold flex items-center gap-1 bg-rose-500/10 py-1.5 px-3 rounded-lg border border-rose-500/20">
                <AlertCircle size={14} /> {errorMsg}
              </span>
            )}
            <button
              onClick={handleSaveContact}
              disabled={saving}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-accent-primary text-white font-bold text-xs hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition"
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={12} /> Save Specifications
                </>
              )}
            </button>
          </div>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Tabs Header */}
            <div className="flex border-b border-color bg-card rounded-2xl p-1.5 gap-1 shadow-sm select-none animate-[fadeIn_0.1s_ease]">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "details" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("connections")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "connections" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Connections
              </button>
            </div>

            {/* Tab: Details */}
            {activeTab === "details" && (
              <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center gap-2 border-b border-color pb-3 mb-1">
                  <User className="text-accent-primary" size={16} />
                  <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                    Contact Bio Profile
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Designation / Job Title
                    </label>
                    <div className="relative flex items-center">
                      <Briefcase size={13} className="absolute left-3 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={13} className="absolute left-3 text-[var(--text-muted)]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <Phone size={13} className="absolute left-3 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:col-span-2 mt-1">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-accent-primary focus:ring-accent-primary"
                    />
                    <label htmlFor="isActive" className="text-xs text-[var(--text-muted)] font-semibold select-none cursor-pointer">
                      Mark contact profile as active
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Connections */}
            {activeTab === "connections" && (
              <div className="flex flex-col gap-5 animate-[fadeIn_0.15s_ease]">
                {/* Associated Customers */}
                <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-color pb-2">
                    <Users className="text-accent-primary" size={15} />
                    <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">Associated Customers</h3>
                  </div>

                  <div className="overflow-x-auto border border-color rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-main/50 border-b border-color">
                          <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">Ref Number</th>
                          <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">Company Name</th>
                          <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">Tax Identification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((c) => (
                          <tr key={c.id} className="border-b border-color/40 hover:bg-main/20">
                            <td className="py-3 px-4 font-mono font-bold text-accent-primary hover:underline">
                              <Link to={`/workspace/crm/customers/${c.id}`}>
                                {c.reference_number}
                              </Link>
                            </td>
                            <td className="py-3 px-4 font-bold text-[var(--text-main)] hover:underline">
                              <Link to={`/workspace/crm/customers/${c.id}`}>
                                {c.company_name}
                              </Link>
                            </td>
                            <td className="py-3 px-4 text-[var(--text-muted)]">
                              {c.tax_id || <span className="opacity-40 italic">—</span>}
                            </td>
                          </tr>
                        ))}
                        {customers.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-4 px-4 text-center text-xs text-[var(--text-muted)] italic">
                              No customer connections logged.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Associated Leads */}
                <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-color pb-2">
                    <FileText className="text-accent-primary" size={15} />
                    <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">Associated Leads</h3>
                  </div>

                  <div className="overflow-x-auto border border-color rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-main/50 border-b border-color">
                          <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">Ref Number</th>
                          <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">Lead Title</th>
                          <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">Status Stage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((l) => (
                          <tr key={l.id} className="border-b border-color/40 hover:bg-main/20">
                            <td className="py-3 px-4 font-mono font-bold text-accent-primary hover:underline">
                              <Link to={`/workspace/crm/leads/${l.id}`}>
                                {l.reference_number}
                              </Link>
                            </td>
                            <td className="py-3 px-4 font-bold text-[var(--text-main)] hover:underline">
                              <Link to={`/workspace/crm/leads/${l.id}`}>
                                {l.title}
                              </Link>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-main border border-color uppercase text-[10px] font-bold">
                                {l.pipeline_stage}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {leads.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-4 px-4 text-center text-xs text-[var(--text-muted)] italic">
                              No active pipeline lead connections.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar quick actions */}
          <div className="flex flex-col gap-5">
            {/* Owner Box */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <Users className="text-accent-primary" size={12} /> Contact Owner
              </span>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-accent-primary/10 text-accent-primary font-bold text-xs rounded-full flex items-center justify-center">
                  {getInitials(getOwnerName(ownerId))}
                </div>
                <div className="flex-1">
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full bg-main border border-color rounded-lg py-1.5 px-2 text-xs outline-none focus:border-accent-primary cursor-pointer text-[var(--text-main)] font-semibold"
                  >
                    <option value="">Select Account Owner</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name || ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Metadata */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm text-xs">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <FileText size={12} className="text-accent-primary" /> System Metadata
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Record ID:</span>
                  <span className="font-mono text-[var(--text-main)] font-medium select-all">
                    {contact.id.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Created At:</span>
                  <span className="text-[var(--text-main)] font-medium">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
