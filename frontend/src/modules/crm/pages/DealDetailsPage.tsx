import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Save,
  Users,
  DollarSign,
  Calendar,
  Building,
  Receipt,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";
import { User as UserItem, Customer, Lead } from "../types/types";
import { EntityChatBox } from "../../../components/ui/EntityChatBox";
import { RecordShareCard } from "../../../components/ui/RecordShareCard";

interface DealDetails {
  id: string;
  reference_number: string;
  deal_name: string;
  pipeline_stage: string;
  expected_revenue: number;
  close_date: string | null;
  is_active: boolean;
  owner_id: string | null;
  customer_id: string | null;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function DealDetailsPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const { token, authFetch, currentUser } = useAppContext();

  // Data states
  const [deal, setDeal] = useState<DealDetails | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [associatedQuotations, setAssociatedQuotations] = useState<any[]>([]);
  const [associatedOrders, setAssociatedOrders] = useState<any[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "connections" | "chat"
  >("details");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit fields
  const [dealName, setDealName] = useState("");
  const [pipelineStage, setPipelineStage] = useState("discovery");
  const [expectedRevenue, setExpectedRevenue] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [ownerId, setOwnerId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [leadId, setLeadId] = useState("");

  const salesStages = ["discovery", "proposal", "negotiation", "won", "lost"];

  const fetchData = async () => {
    if (!dealId || !token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [dealRes, usersRes, customersRes, leadsRes, allQuots, allOrders] = await Promise.all([
        authFetch(`/crm/deals/${dealId}`) as Promise<DealDetails>,
        authFetch("/auth/users").catch(() => []) as Promise<UserItem[]>,
        authFetch("/crm/customers").catch(() => []) as Promise<Customer[]>,
        authFetch("/crm/leads").catch(() => []) as Promise<Lead[]>,
        authFetch("/sales/quotations").catch(() => []) as Promise<any[]>,
        authFetch("/sales/orders").catch(() => []) as Promise<any[]>,
      ]);

      if (dealRes) {
        setDeal(dealRes);
        setDealName(dealRes.deal_name);
        setPipelineStage(dealRes.pipeline_stage || "discovery");
        setExpectedRevenue(String(dealRes.expected_revenue || 0.0));
        setCloseDate(dealRes.close_date || "");
        setIsActive(dealRes.is_active);
        setOwnerId(dealRes.owner_id || "");
        setCustomerId(dealRes.customer_id || "");
        setLeadId(dealRes.lead_id || "");

        // Filter associated sales documents
        const matchedQuots = allQuots.filter((q: any) => q.deal_id === dealId);
        setAssociatedQuotations(matchedQuots);
        const quotIds = matchedQuots.map((q: any) => q.id);
        const matchedOrders = allOrders.filter((o: any) => quotIds.includes(o.quotation_id));
        setAssociatedOrders(matchedOrders);
      }
      setUsers(usersRes);
      setCustomers(customersRes);
      setLeads(leadsRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load opportunity profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dealId, token]);

  const handleSaveDeal = async () => {
    if (!dealId) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updated = await authFetch(`/crm/deals/${dealId}`, {
        method: "PUT",
        body: JSON.stringify({
          deal_name: dealName.trim(),
          pipeline_stage: pipelineStage,
          expected_revenue: expectedRevenue ? parseFloat(expectedRevenue) : 0.0,
          close_date: closeDate || null,
          is_active: isActive,
          owner_id: ownerId || null,
          customer_id: customerId || null,
          lead_id: leadId || null,
        }),
      });
      setSuccessMsg("Opportunity pipeline settings saved successfully.");
      setDeal((prev) => (prev ? { ...prev, ...updated } : null));
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update opportunity details.");
    } finally {
      setSaving(false);
    }
  };

  const getOwnerName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user
      ? `${user.first_name} ${user.last_name || ""}`.trim()
      : "Unassigned";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getStageBadgeClass = (stage: string) => {
    const s = stage.toLowerCase();
    if (s === "won" || s === "closed won")
      return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    if (s === "lost" || s === "closed lost")
      return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
    if (s === "negotiation")
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    if (s === "proposal")
      return "bg-sky-500/10 text-sky-500 border border-sky-500/20";
    return "bg-slate-500/10 text-[var(--text-muted)] border border-color";
  };

  if (loading) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center gap-3 py-32 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto">
          <Loader2 size={36} className="animate-spin text-accent-primary" />
          <span className="text-xs text-[var(--text-muted)]">
            Loading Pipeline Opportunity Profile…
          </span>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!deal) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto">
          <AlertCircle size={36} className="text-rose-500" />
          <h3 className="text-md font-bold text-[var(--text-main)]">
            Opportunity Record Not Found
          </h3>
          <Link
            to="/workspace/crm/deals"
            className="text-xs font-bold text-accent-primary hover:underline"
          >
            Return to Deals directory
          </Link>
        </div>
      </WorkspaceLayout>
    );
  }

  const linkedCustomer = customers.find((c) => c.id === customerId);
  const linkedLead = leads.find((l) => l.id === leadId);

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-5 max-w-[1400px] mx-auto animate-[fadeIn_0.2s_ease]">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-color pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/workspace/crm/deals"
              className="p-2 border border-color bg-card hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl cursor-pointer transition"
            >
              <ArrowLeft size={14} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Opportunity File / {deal.reference_number}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStageBadgeClass(pipelineStage)}`}
                >
                  {pipelineStage}
                </span>
              </div>
              <h2 className="text-lg font-black text-[var(--text-main)] mt-1 mb-0 select-all">
                {deal.deal_name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {successMsg && (
              <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1 bg-emerald-500/10 py-1.5 px-3 rounded-lg border border-emerald-500/20 animate-[fadeIn_0.2s_ease]">
                <CheckCircle size={14} /> {successMsg}
              </span>
            )}
            {errorMsg && (
              <span className="text-xs text-rose-500 font-semibold flex items-center gap-1 bg-rose-500/10 py-1.5 px-3 rounded-lg border border-rose-500/20 animate-[fadeIn_0.2s_ease]">
                <AlertCircle size={14} /> {errorMsg}
              </span>
            )}
            <button
              onClick={handleSaveDeal}
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

        {/* Dashboard split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
              <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center gap-2 border-b border-color pb-3 mb-1">
                  <TrendingUp className="text-accent-primary" size={16} />
                  <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                    Opportunity Pipeline Profile
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Deal Name */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Opportunity Title Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={dealName}
                      onChange={(e) => setDealName(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold"
                    />
                  </div>

                  {/* Stage */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Sales Pipeline Stage
                    </label>
                    <select
                      value={pipelineStage}
                      onChange={(e) => setPipelineStage(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                    >
                      {salesStages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Expected Value */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Expected Value ($)
                    </label>
                    <div className="relative flex items-center">
                      <DollarSign
                        size={13}
                        className="absolute left-3 text-[var(--text-muted)]"
                      />
                      <input
                        type="number"
                        value={expectedRevenue}
                        onChange={(e) => setExpectedRevenue(e.target.value)}
                        className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold"
                      />
                    </div>
                  </div>

                  {/* Target Close Date */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Expected Closing Date
                    </label>
                    <div className="relative flex items-center">
                      <Calendar
                        size={13}
                        className="absolute left-3 text-[var(--text-muted)]"
                      />
                      <input
                        type="date"
                        value={closeDate}
                        onChange={(e) => setCloseDate(e.target.value)}
                        className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  {/* Is Active Status checkbox */}
                  <div className="flex items-center gap-2 md:col-span-2 mt-1">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-accent-primary focus:ring-accent-primary"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-xs text-[var(--text-muted)] font-semibold select-none cursor-pointer"
                    >
                      Mark opportunity pipeline as active
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Connections */}
            {activeTab === "connections" && (
              <div className="flex flex-col gap-5 animate-[fadeIn_0.15s_ease]">
                {/* Associated Customer */}
                <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-color pb-2">
                    <Building className="text-accent-primary" size={15} />
                    <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                      Associated Customer
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Select Linked Customer
                    </label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full max-w-md rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                    >
                      <option value="">
                        Standalone Deal (No Customer Link)
                      </option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name} ({c.reference_number})
                        </option>
                      ))}
                    </select>

                    {linkedCustomer && (
                      <div className="mt-2 p-4 bg-main/30 border border-color rounded-xl max-w-md flex flex-col gap-1.5">
                        <span className="text-[9px] bg-accent-primary/10 text-accent-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider self-start">
                          {linkedCustomer.reference_number}
                        </span>
                        <strong className="text-xs text-[var(--text-main)]">
                          {linkedCustomer.company_name}
                        </strong>
                        <Link
                          to={`/workspace/crm/customers/${linkedCustomer.id}`}
                          className="text-[10px] text-accent-primary hover:underline font-bold self-start mt-1"
                        >
                          View complete Customer profile ledger →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Associated Lead */}
                <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-color pb-2">
                    <FileText className="text-accent-primary" size={15} />
                    <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                      Associated Lead Source
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Select Linked Lead
                    </label>
                    <select
                      value={leadId}
                      onChange={(e) => setLeadId(e.target.value)}
                      className="w-full max-w-md rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                    >
                      <option value="">No Lead Association</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title} ({l.reference_number})
                        </option>
                      ))}
                    </select>

                    {linkedLead && (
                      <div className="mt-2 p-4 bg-main/30 border border-color rounded-xl max-w-md flex flex-col gap-1.5">
                        <span className="text-[9px] bg-accent-primary/10 text-accent-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider self-start">
                          {linkedLead.reference_number}
                        </span>
                        <strong className="text-xs text-[var(--text-main)]">
                          {linkedLead.title}
                        </strong>
                        <Link
                          to={`/workspace/crm/leads/${linkedLead.id}`}
                          className="text-[10px] text-accent-primary hover:underline font-bold self-start mt-1"
                        >
                          View complete Lead details file →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Chat */}
            {activeTab === "chat" && (
              <div className="animate-[fadeIn_0.15s_ease]">
                <EntityChatBox
                  entityType="deal"
                  entityId={dealId || ""}
                  users={users}
                />
              </div>
            )}
          </div>

          {/* Right sidebar quick actions */}
          <div className="flex flex-col gap-5">
            {/* Owner Box */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <Users size={12} className="text-accent-primary" /> Deal
                Pipeline Owner
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

            <RecordShareCard
              entityType="deal"
              entityId={dealId || ""}
              users={users}
              currentUserId={currentUser?.id}
              ownerId={ownerId}
            />

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

            {/* Quick Metadata */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm text-xs">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <FileText size={12} className="text-accent-primary" /> System
                Metadata
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Record ID:</span>
                  <span className="font-mono text-[var(--text-main)] font-medium select-all">
                    {deal.id.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Created At:</span>
                  <span className="text-[var(--text-main)] font-medium">
                    {new Date(deal.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">
                    Last Updated:
                  </span>
                  <span className="text-[var(--text-main)] font-medium">
                    {new Date(deal.updated_at).toLocaleDateString()}
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
