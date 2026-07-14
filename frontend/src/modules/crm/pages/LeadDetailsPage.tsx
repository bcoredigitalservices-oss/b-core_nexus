import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  User as UserIcon,
  Globe,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Paperclip,
  UserPlus,
  Receipt,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";
import { Lead, User, Contact } from "../types/types";

// Extracted Subcomponents
import { LeadOverview } from "../components/leads/LeadOverview";
import { LeadContacts } from "../components/leads/LeadContacts";
import { LeadContactsList } from "../components/leads/LeadContactsList";
import { LeadActivities } from "../components/leads/LeadActivities";
import { LeadTags } from "../components/leads/LeadTags";
import { EntityChatBox } from "../../../components/ui/EntityChatBox";
import { RecordShareCard } from "../../../components/ui/RecordShareCard";

interface ContactDetailsData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
}

export default function LeadDetailsPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { authFetch, token, currentUser } = useAppContext();

  const [lead, setLead] = useState<Lead | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<
    "details" | "activities" | "connections" | "chat"
  >("details");

  const [associatedQuotations, setAssociatedQuotations] = useState<any[]>([]);
  const [associatedOrders, setAssociatedOrders] = useState<any[]>([]);

  // Core Form States (mirrored from backend)
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [leadType, setLeadType] = useState<"person" | "company">("person");
  const [pipelineStage, setPipelineStage] = useState("lead");
  const [priority, setPriority] = useState("Medium");
  const [leadSource, setLeadSource] = useState("Website");
  const [ownerId, setOwnerId] = useState("");

  // Ext Form States (associated contact fields)
  const [ext, setExt] = useState<ContactDetailsData>({
    firstName: "",
    lastName: "",
    jobTitle: "",
    department: "",
  });

  // Flat DB details saved locally on lead primary contact
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const fetchDetails = async () => {
    if (!leadId || !token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      // 1. Load users, core lead details, all contacts, quotations and orders
      const [leadData, usersData, contactsData, allQuots, allOrders] = await Promise.all([
        authFetch(`/crm/leads/${leadId}`),
        authFetch("/auth/users").catch(() => []) as Promise<User[]>,
        authFetch("/crm/contacts").catch(() => []) as Promise<Contact[]>,
        authFetch("/sales/quotations").catch(() => []) as Promise<any[]>,
        authFetch("/sales/orders").catch(() => []) as Promise<any[]>,
      ]);

      if (leadData) {
        setLead(leadData);
        setTitle(leadData.title || "");
        setCompanyName(leadData.company_name || "");
        setPipelineStage(leadData.pipeline_stage || "lead");
        setPriority(leadData.priority || "Medium");
        setLeadSource(leadData.lead_source || "Website");
        setOwnerId(leadData.owner_id || "");

        // Filter associated sales documents
        const matchedQuots = allQuots.filter((q: any) => q.lead_id === leadId);
        setAssociatedQuotations(matchedQuots);
        const quotIds = matchedQuots.map((q: any) => q.id);
        const matchedOrders = allOrders.filter((o: any) => quotIds.includes(o.quotation_id));
        setAssociatedOrders(matchedOrders);

        // Sync database contact fields and assign to states
        const primaryLink =
          leadData.contacts?.find(
            (link: any) => link.role_at_lead === "Primary Contact",
          ) || leadData.contacts?.[0];
        const contact = primaryLink?.contact;

        setLeadType(leadData.lead_type || "person");
        setEmail(contact?.email || leadData.email || "");
        setPhone(contact?.phone || leadData.phone || "");

        setExt({
          firstName: contact?.first_name || leadData.title?.split(" ")[0] || "",
          lastName: contact?.last_name || leadData.title?.split(" ")[1] || "",
          jobTitle: contact?.job_title || "",
          department: contact?.department || "",
        });
      }
      setUsers(usersData);
      setAllContacts(contactsData);
    } catch (err: any) {
      console.error("LeadDetails fetchDetails error:", err);
      setErrorMsg(
        err.message || "Failed to retrieve lead dashboard parameters.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [leadId, token]);

  const handleSave = async () => {
    if (!leadId) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // 1. Save core database fields
      const updated = await authFetch(`/crm/leads/${leadId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: title.trim(),
          lead_type: leadType,
          company_name: companyName.trim() || null,
          pipeline_stage: pipelineStage,
          priority: priority,
          lead_source: leadSource,
          owner_id: ownerId || null,
        }),
      });

      // 2. Save or update associated backend Contact
      const primaryLink =
        lead?.contacts?.find(
          (link: any) => link.role_at_lead === "Primary Contact",
        ) || lead?.contacts?.[0];
      const contact = primaryLink?.contact;

      if (contact?.id) {
        // Update existing contact
        await authFetch(`/crm/contacts/${contact.id}`, {
          method: "PUT",
          body: JSON.stringify({
            first_name: ext.firstName.trim() || "Contact",
            last_name: ext.lastName.trim() || null,
            email: email.trim() || null,
            phone: phone.trim() || null,
            job_title: ext.jobTitle?.trim() || null,
            department: ext.department?.trim() || null,
          }),
        });
      } else {
        // Create new contact and link it to the lead
        const newContact: any = await authFetch("/crm/contacts", {
          method: "POST",
          body: JSON.stringify({
            first_name: ext.firstName.trim() || "Contact",
            last_name: ext.lastName.trim() || null,
            email: email.trim() || null,
            phone: phone.trim() || null,
            job_title: ext.jobTitle?.trim() || null,
            department: ext.department?.trim() || null,
          }),
        });

        if (newContact?.id) {
          await authFetch(`/crm/leads/${leadId}/contacts`, {
            method: "POST",
            body: JSON.stringify({
              contact_id: newContact.id,
              role_at_lead: "Primary Contact",
            }),
          });
        }
      }

      setSuccessMsg("Lead parameters updated successfully.");
      await fetchDetails();
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update lead settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkContact = async (contactId: string, roleAtLead: string) => {
    if (!leadId) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const linked = await authFetch(`/crm/leads/${leadId}/contacts`, {
        method: "POST",
        body: JSON.stringify({
          contact_id: contactId,
          role_at_lead: roleAtLead,
        }),
      });
      setLead((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          contacts: [...(prev.contacts || []), linked],
        };
      });
      setSuccessMsg("Stakeholder linked successfully.");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to link contact connection.");
      throw err;
    }
  };

  const handleUnlinkContact = async (contactId: string) => {
    if (!leadId) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await authFetch(`/crm/leads/${leadId}/contacts/${contactId}`, {
        method: "DELETE",
      });
      setLead((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          contacts: (prev.contacts || []).filter(
            (c: any) => c.contact_id !== contactId,
          ),
        };
      });
      setSuccessMsg("Stakeholder unlinked successfully.");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to unlink contact connection.");
      throw err;
    }
  };

  const handleAddActivity = async (
    type: string,
    actTitle: string,
    description: string,
  ) => {
    if (!leadId) return;
    const notesStr = description ? `${actTitle}\n\n${description}` : actTitle;
    const created = await authFetch(`/crm/leads/${leadId}/activities`, {
      method: "POST",
      body: JSON.stringify({ activity_type: type, notes: notesStr }),
    });
    setLead((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        activities: [created, ...(prev.activities || [])],
      };
    });
  };

  const handleAddTag = async (tagName: string) => {
    if (!leadId) return;
    const created = await authFetch(`/crm/leads/${leadId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tag_name: tagName }),
    });
    setLead((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        tags: [...(prev.tags || []), created],
      };
    });
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!leadId) return;
    await authFetch(`/crm/leads/${leadId}/tags/${tagId}`, {
      method: "DELETE",
    });
    setLead((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        tags: (prev.tags || []).filter((t: any) => t.id !== tagId),
      };
    });
  };

  const handleConvert = async () => {
    if (!leadId) return;
    setConverting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await authFetch(`/crm/leads/${leadId}/convert`, {
        method: "POST",
      });

      setSuccessMsg(
        "Lead converted to Customer and Deal created successfully! Redirecting...",
      );
      setTimeout(() => {
        navigate("/workspace/crm/deals");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to convert lead.");
      setConverting(false);
    }
  };

  const getOwnerName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user ? `${user.first_name} ${user.last_name || ""}`.trim() : "Abdul";
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
          <span className="text-xs text-[var(--text-muted)]">
            Loading Lead Specification Dashboard…
          </span>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!lead) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto">
          <AlertCircle size={36} className="text-rose-500" />
          <h3 className="text-md font-bold text-[var(--text-main)]">
            {errorMsg || "Lead Record Not Found"}
          </h3>
          <Link
            to="/workspace/crm/leads"
            className="text-xs font-bold text-accent-primary hover:underline"
          >
            Return to Leads Workspace
          </Link>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-5 max-w-[1400px] mx-auto animate-[fadeIn_0.2s_ease]">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-color pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/workspace/crm/leads"
              className="p-2 border border-color bg-card hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl cursor-pointer transition"
            >
              <ArrowLeft size={14} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Lead File Profile / {lead.reference_number}
                </span>
                <span className="text-[9px] bg-accent-primary/10 text-accent-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {pipelineStage}
                </span>
              </div>
              <h2 className="text-lg font-black text-[var(--text-main)] mt-1 mb-0 select-all">
                {title || lead.title}
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
            {!lead.is_converted && pipelineStage !== "converted" && (
              <button
                onClick={handleConvert}
                disabled={converting}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition"
              >
                {converting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Converting...
                  </>
                ) : (
                  <>
                    <UserPlus size={12} /> Convert to Customer
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleSave}
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

        {/* Dashboard Grid split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main specifications Forms */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Tabs Header */}
            <div className="flex border-b border-color bg-card rounded-2xl p-1.5 gap-1 shadow-sm select-none">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "details" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("activities")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "activities" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Activities
              </button>
              <button
                onClick={() => setActiveTab("connections")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "connections" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Connections
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "chat" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Collaborative Chat
              </button>
            </div>

            {/* Tab: Details */}
            {activeTab === "details" && (
              <div className="flex flex-col gap-5 animate-[fadeIn_0.15s_ease]">
                <LeadOverview
                  title={title}
                  setTitle={setTitle}
                  companyName={companyName}
                  setCompanyName={setCompanyName}
                  leadType={leadType}
                  setLeadType={setLeadType}
                  pipelineStage={pipelineStage}
                  setPipelineStage={setPipelineStage}
                  leadSource={leadSource}
                  setLeadSource={setLeadSource}
                  priority={priority}
                  setPriority={setPriority}
                  ext={ext}
                  setExt={setExt}
                />

                <LeadContacts
                  email={email}
                  setEmail={setEmail}
                  phone={phone}
                  setPhone={setPhone}
                  ext={ext}
                  setExt={setExt}
                />
              </div>
            )}

            {/* Tab: Activities */}
            {activeTab === "activities" && (
              <div className="animate-[fadeIn_0.15s_ease]">
                <LeadActivities
                  activities={lead.activities || []}
                  users={users}
                  onAddActivity={handleAddActivity}
                />
              </div>
            )}

            {/* Tab: Connections */}
            {activeTab === "connections" && (
              <div className="animate-[fadeIn_0.15s_ease]">
                <LeadContactsList
                  leadContacts={lead.contacts || []}
                  allContacts={allContacts}
                  onLinkContact={handleLinkContact}
                  onUnlinkContact={handleUnlinkContact}
                />
              </div>
            )}

            {/* Tab: Chat */}
            {activeTab === "chat" && (
              <div className="animate-[fadeIn_0.15s_ease]">
                <EntityChatBox
                  entityType="lead"
                  entityId={leadId || ""}
                  users={users}
                />
              </div>
            )}
          </div>

          {/* Right sidebar quick action blocks */}
          <div className="flex flex-col gap-5">
            {/* Section: Assign Owner */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <UserPlus size={12} className="text-accent-primary" /> Assigned
                Owner
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
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name || ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <RecordShareCard
              entityType="lead"
              entityId={leadId || ""}
              users={users}
              currentUserId={currentUser?.id}
              ownerId={ownerId}
            />

            {/* Section: Attachments Upload */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <Paperclip size={12} className="text-accent-primary" />{" "}
                Attachment Vault
              </span>
              <div className="border border-dashed border-color hover:border-accent-primary/40 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 bg-main/10">
                <Plus size={18} className="text-[var(--text-muted)]" />
                <span className="text-xs font-semibold text-[var(--text-main)]">
                  Upload Document
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">
                  PDF, JPG, PNG up to 10MB
                </span>
              </div>
            </div>

            {/* Section: Associated Sales Documents */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <Receipt size={12} className="text-accent-primary" /> Associated Sales Documents
              </span>
              
              <div className="flex flex-col gap-3.5 text-xs">
                {/* Quotations Sub-Section */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Quotations
                  </span>
                  {associatedQuotations.length === 0 ? (
                    <span className="text-[11px] text-[var(--text-muted)] italic pl-1">No linked quotations</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {associatedQuotations.map((q) => (
                        <Link
                          key={q.id}
                          to={`/workspace/crm/quotations/${q.id}`}
                          className="flex items-center justify-between p-2 rounded-lg border border-color hover:border-accent-primary/30 bg-main/20 hover:bg-main/40 transition-all font-semibold text-[var(--text-main)]"
                        >
                          <span className="hover:underline">{q.quotation_number}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                            q.status === "accepted" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          }`}>
                            {q.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sales Orders Sub-Section */}
                <div className="flex flex-col gap-1.5 border-t border-color/45 pt-3">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Sales Orders
                  </span>
                  {associatedOrders.length === 0 ? (
                    <span className="text-[11px] text-[var(--text-muted)] italic pl-1">No linked sales orders</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {associatedOrders.map((o) => (
                        <Link
                          key={o.id}
                          to={`/workspace/crm/sales-orders/${o.id}`}
                          className="flex items-center justify-between p-2 rounded-lg border border-color hover:border-accent-primary/30 bg-main/20 hover:bg-main/40 transition-all font-semibold text-[var(--text-main)]"
                        >
                          <span className="hover:underline">{o.order_number}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase bg-emerald-500/10 text-emerald-500">
                            {o.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Label Classifications */}
            <LeadTags
              tags={lead.tags || []}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
