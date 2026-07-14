import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  ShoppingBag,
  Save,
  Users,
  Settings,
  Building,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";
import { User, Customer, Lead, Product } from "../types/types";
import { RecordShareCard } from "../../../components/ui/RecordShareCard";

interface QuotationLineItem {
  id: string;
  quotation_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_of_measure: string | null;
  unit_price: number;
  line_discount_type: string | null;
  line_discount_value: number;
  line_discount_amount: number;
  line_total: number;
  sort_order: number;
}

interface QuotationDetails {
  id: string;
  reference_number: string;
  quotation_number: string;
  version: number;
  parent_quotation_id: string | null;
  owner_id: string | null;
  customer_id: string;
  template_id: string | null;
  status: string;
  validity_date: string | null;
  payment_terms: string | null;
  delivery_terms: string | null;
  currency: string;
  subtotal: number;
  overall_discount_type: string | null;
  overall_discount_value: number;
  overall_discount_amount: number;
  taxable_amount: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  quotation_type: string | null;
  internal_notes: string | null;
  customer_notes: string | null;
  prepared_by_id: string | null;
  approved_by_id: string | null;
  approved_at: string | null;
  lead_id: string | null;
  deal_id: string | null;
  created_at: string;
  updated_at: string;
  line_items: QuotationLineItem[];
}

export default function QuotationDetailsPage() {
  const { quotationId } = useParams<{ quotationId: string }>();
  const { token, authFetch, currentUser } = useAppContext();
  const navigate = useNavigate();

  // Data states
  const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // UI / Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "items" | "terms" | "connections">("details");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit fields
  const [quotationNumber, setQuotationNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("draft");
  const [validityDate, setValidityDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [subtotal, setSubtotal] = useState(0.0);
  const [grandTotal, setGrandTotal] = useState(0.0);
  const [quotationType, setQuotationType] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [leadId, setLeadId] = useState("");
  const [dealId, setDealId] = useState("");
  const [ownerId, setOwnerId] = useState("");

  // Line item modal
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [lineProductId, setLineProductId] = useState("");
  const [lineDesc, setLineDesc] = useState("");
  const [lineQty, setLineQty] = useState("1");
  const [linePrice, setLinePrice] = useState("0");

  const statusList = ["draft", "sent", "accepted", "rejected", "expired", "cancelled"];
  const typeList = ["daily_usage", "urgent", "high_value"];

  const fetchData = async () => {
    if (!quotationId || !token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [quotRes, customersRes, leadsRes, dealsRes, usersRes, productsRes] = await Promise.all([
        authFetch(`/sales/quotations/${quotationId}`) as Promise<QuotationDetails>,
        authFetch("/crm/customers").catch(() => []) as Promise<Customer[]>,
        authFetch("/crm/leads").catch(() => []) as Promise<Lead[]>,
        authFetch("/crm/deals").catch(() => []) as Promise<any[]>,
        authFetch("/auth/users").catch(() => []) as Promise<User[]>,
        authFetch("/sales/products").catch(() => []) as Promise<Product[]>,
      ]);

      if (quotRes) {
        setQuotation(quotRes);
        setQuotationNumber(quotRes.quotation_number);
        setCustomerId(quotRes.customer_id);
        setStatus(quotRes.status);
        setValidityDate(quotRes.validity_date || "");
        setPaymentTerms(quotRes.payment_terms || "");
        setDeliveryTerms(quotRes.delivery_terms || "");
        setCurrency(quotRes.currency);
        setSubtotal(quotRes.subtotal);
        setGrandTotal(quotRes.grand_total);
        setQuotationType(quotRes.quotation_type || "daily_usage");
        setInternalNotes(quotRes.internal_notes || "");
        setCustomerNotes(quotRes.customer_notes || "");
        setLeadId(quotRes.lead_id || "");
        setDealId(quotRes.deal_id || "");
        setOwnerId(quotRes.owner_id || "");
      }
      setCustomers(customersRes);
      setLeads(leadsRes);
      setDeals(dealsRes);
      setUsers(usersRes);
      setProducts(productsRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load quotation details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [quotationId, token]);

  const handleSaveQuotation = async () => {
    if (!quotationId) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      // Calculate tax parameters automatically
      const currentSubtotal = quotation?.line_items?.reduce((sum, item) => sum + item.line_total, 0) || parseFloat(grandTotal) || 0;
      const currentVatAmount = currentSubtotal * 0.075;
      const currentGrandTotal = currentSubtotal + currentVatAmount;

      const updated = await authFetch(`/sales/quotations/${quotationId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: status,
          validity_date: validityDate || null,
          payment_terms: paymentTerms || null,
          delivery_terms: deliveryTerms || null,
          currency: currency,
          subtotal: currentSubtotal,
          taxable_amount: currentSubtotal,
          vat_rate: 7.5,
          vat_amount: currentVatAmount,
          grand_total: currentGrandTotal,
          quotation_type: quotationType,
          internal_notes: internalNotes.trim() || null,
          customer_notes: customerNotes.trim() || null,
        }),
      });

      setSuccessMsg("Quotation settings updated successfully.");
      setQuotation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...updated,
          subtotal: currentSubtotal,
          vat_amount: currentVatAmount,
          grand_total: currentGrandTotal,
        };
      });
      setSubtotal(currentSubtotal);
      setGrandTotal(currentGrandTotal);
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save quotation details.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotationId || !lineDesc.trim()) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const qty = parseFloat(lineQty) || 1.0;
      const price = parseFloat(linePrice) || 0.0;
      const total = qty * price;

      const createdItem = await authFetch(`/sales/quotations/${quotationId}/line-items`, {
        method: "POST",
        body: JSON.stringify({
          product_id: lineProductId || null,
          description: lineDesc.trim(),
          quantity: qty,
          unit_price: price,
          line_total: total,
          sort_order: (quotation?.line_items?.length || 0) + 1,
        }),
      });

      setQuotation((prev) => {
        if (!prev) return null;
        const newItems = [...prev.line_items, createdItem];
        const newSubtotal = newItems.reduce((sum, i) => sum + i.line_total, 0);
        const newVat = newSubtotal * 0.075;
        const newGrand = newSubtotal + newVat;
        return {
          ...prev,
          line_items: newItems,
          subtotal: newSubtotal,
          vat_amount: newVat,
          grand_total: newGrand,
        };
      });

      setSubtotal((prev) => prev + total);
      setGrandTotal((prev) => (prev + total) * 1.075);
      setLineModalOpen(false);
      setLineProductId("");
      setLineDesc("");
      setLineQty("1");
      setLinePrice("0");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add line item.");
    } finally {
      setSaving(false);
    }
  };

  const handleConvertOrder = async () => {
    if (!quotationId) return;
    setConverting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await authFetch(`/sales/quotations/${quotationId}/convert-to-order`, {
        method: "POST",
      });
      setSuccessMsg("Successfully converted proposal to active Sales Order!");
      setStatus("accepted");
      setQuotation((prev) => prev ? { ...prev, status: "accepted" } : null);
      setTimeout(() => {
        navigate("/workspace/crm/sales-orders");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to convert proposal to Sales Order.");
      setConverting(false);
    }
  };

  const handleSelectProduct = (prodId: string) => {
    setLineProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setLineDesc(prod.name);
      setLinePrice(String(prod.standard_price));
    }
  };

  const getCustomerName = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    return cust ? cust.company_name : "Associated Customer";
  };

  const getOwnerName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user ? `${user.first_name} ${user.last_name || ""}`.trim() : "Unassigned Owner";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusBadgeClass = (statusStr: string) => {
    const s = statusStr.toLowerCase();
    if (s === "accepted") return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    if (s === "rejected") return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
    if (s === "sent") return "bg-sky-500/10 text-sky-500 border border-sky-500/20";
    if (s === "expired") return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    return "bg-slate-500/10 text-[var(--text-muted)] border border-color";
  };

  if (loading) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center gap-3 py-32 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto">
          <Loader2 size={36} className="animate-spin text-accent-primary" />
          <span className="text-xs text-[var(--text-muted)]">Loading Proposal Details Ledger…</span>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!quotation) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto">
          <AlertCircle size={36} className="text-rose-500" />
          <h3 className="text-md font-bold text-[var(--text-main)]">Proposal / Quotation Not Found</h3>
          <Link to="/workspace/crm/quotations" className="text-xs font-bold text-accent-primary hover:underline">
            Return to Quotations Directory
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
              to="/workspace/crm/quotations"
              className="p-2 border border-color bg-card hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl cursor-pointer transition"
            >
              <ArrowLeft size={14} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Proposal Document / {quotation.reference_number || quotation.quotation_number}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadgeClass(status)}`}>
                  {status}
                </span>
              </div>
              <h2 className="text-lg font-black text-[var(--text-main)] mt-1 mb-0 select-all">
                QTN for {getCustomerName(customerId)}
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

            {/* Convert button */}
            {status.toLowerCase() !== "accepted" && (
              <button
                onClick={handleConvertOrder}
                disabled={converting}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition"
              >
                {converting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Converting...
                  </>
                ) : (
                  <>
                    <ShoppingBag size={12} /> Convert to Order
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleSaveQuotation}
              disabled={saving}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-accent-primary text-white font-bold text-xs hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition"
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={12} /> Save Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workspace Layout Grid split */}
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
                onClick={() => setActiveTab("items")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "items" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Items ({quotation.line_items.length})
              </button>
              <button
                onClick={() => setActiveTab("terms")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "terms" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Terms & Notes
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
                  <FileText className="text-accent-primary" size={16} />
                  <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                    Proposal parameters
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Proposal Number */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Quotation Number *
                    </label>
                    <input
                      type="text"
                      disabled
                      value={quotationNumber}
                      className="w-full rounded-lg border border-color bg-main/50 py-2 px-3 text-xs outline-none text-[var(--text-muted)] font-mono font-bold"
                    />
                  </div>

                  {/* Customer Link */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Linked Customer Profile
                    </label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.company_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Expiry Date */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Validity Expiry Date
                    </label>
                    <div className="relative flex items-center">
                      <Calendar size={13} className="absolute left-3 text-[var(--text-muted)]" />
                      <input
                        type="date"
                        value={validityDate}
                        onChange={(e) => setValidityDate(e.target.value)}
                        className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Status dropdown */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Quotation Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer font-semibold"
                    >
                      {statusList.map((st) => (
                        <option key={st} value={st}>{st.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Currency selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Billing Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer font-bold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="NGN">NGN (₦)</option>
                    </select>
                  </div>

                  {/* Quotation Type class */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Quotation Priority
                    </label>
                    <select
                      value={quotationType}
                      onChange={(e) => setQuotationType(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                    >
                      {typeList.map((t) => (
                        <option key={t} value={t}>{t.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Items Line ledger */}
            {activeTab === "items" && (
              <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center justify-between border-b border-color pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="text-accent-primary" size={16} />
                    <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">Line Items Ledger</h3>
                  </div>
                  <button
                    onClick={() => setLineModalOpen(true)}
                    className="flex items-center gap-1 py-1.5 px-3 bg-accent-primary text-white rounded-lg text-xs font-bold hover:brightness-110 cursor-pointer transition shadow-xs"
                  >
                    <Plus size={12} /> Add Line Item
                  </button>
                </div>

                <div className="overflow-x-auto border border-color rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-main/50 border-b border-color">
                        <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] w-12 text-center uppercase">No.</th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">Item Description</th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] w-20 text-center uppercase">Quantity</th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] w-28 text-right uppercase">Unit Price</th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] w-32 text-right uppercase">Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotation.line_items.map((item, idx) => (
                        <tr key={item.id} className="border-b border-color/40 hover:bg-main/20">
                          <td className="py-3 px-4 font-mono font-bold text-[var(--text-muted)] text-center">{idx + 1}</td>
                          <td className="py-3 px-4 text-[var(--text-main)] font-semibold">{item.description}</td>
                          <td className="py-3 px-4 font-bold text-[var(--text-main)] text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-right font-medium text-[var(--text-muted)]">
                            {currency === "NGN" ? "₦" : "$"}{Number(item.unit_price).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-[var(--text-main)]">
                            {currency === "NGN" ? "₦" : "$"}{Number(item.line_total).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {quotation.line_items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 px-4 text-center text-xs text-[var(--text-muted)] italic">
                            No item master details added to proposal yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Calculations Summary Section */}
                <div className="flex flex-col gap-2.5 bg-main/20 p-4 border border-color rounded-xl max-w-sm ml-auto w-full text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Subtotal:</span>
                    <span className="font-bold text-[var(--text-main)]">
                      {currency === "NGN" ? "₦" : "$"}{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">VAT Amount (7.5%):</span>
                    <span className="font-semibold text-[var(--text-muted)]">
                      {currency === "NGN" ? "₦" : "$"}{(subtotal * 0.075).toLocaleString()}
                    </span>
                  </div>
                  <hr className="border-color" />
                  <div className="flex justify-between text-sm">
                    <span className="font-extrabold text-[var(--text-main)]">Grand Total Value:</span>
                    <span className="font-black text-accent-primary">
                      {currency === "NGN" ? "₦" : "$"}{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Terms & Notes */}
            {activeTab === "terms" && (
              <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center gap-2 border-b border-color pb-3 mb-1">
                  <Settings className="text-accent-primary" size={16} />
                  <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                    Proposals Terms & Remarks Notes
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Payment terms */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Payment Terms Agreement
                    </label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="e.g. Net 30, COD"
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                    />
                  </div>

                  {/* Delivery terms */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Delivery Logistic Terms
                    </label>
                    <input
                      type="text"
                      value={deliveryTerms}
                      onChange={(e) => setDeliveryTerms(e.target.value)}
                      placeholder="e.g. FOB, Ex Works"
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                    />
                  </div>

                  {/* Internal Notes */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Internal Audit Notes
                    </label>
                    <textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] resize-none"
                    />
                  </div>

                  {/* Customer Notes */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Customer Description Note
                    </label>
                    <textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Connections */}
            {activeTab === "connections" && (
              <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center gap-2 border-b border-color pb-3 mb-1">
                  <Users className="text-accent-primary" size={16} />
                  <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                    Linked Pipeline Connections
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Lead connection link */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Associated Pipeline Lead Link
                    </label>
                    <select
                      value={leadId}
                      onChange={(e) => setLeadId(e.target.value)}
                      className="w-full max-w-md rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer font-semibold"
                    >
                      <option value="">No Associated Lead</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>{l.title} ({l.reference_number})</option>
                      ))}
                    </select>
                  </div>

                  {/* Deal connection link */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Associated Pipeline Opportunity Deal Link
                    </label>
                    <select
                      value={dealId}
                      onChange={(e) => setDealId(e.target.value)}
                      className="w-full max-w-md rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer font-semibold"
                    >
                      <option value="">No Associated Deal</option>
                      {deals.map((d) => (
                        <option key={d.id} value={d.id}>{d.deal_name} ({d.reference_number})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar quick details */}
          <div className="flex flex-col gap-5">
            {/* Account Owner */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm text-xs">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <Users size={12} className="text-accent-primary" /> Proposal Owner
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
                    <option value="">Select Owner</option>
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
              entityType="quotation"
              entityId={quotationId || ""}
              users={users}
              currentUserId={currentUser?.id}
              ownerId={ownerId}
            />

            {/* Section: Associated Pipeline Records */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <Receipt size={12} className="text-accent-primary" /> Associated Pipeline Records
              </span>
              
              <div className="flex flex-col gap-3 text-xs">
                {/* Linked Customer */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Customer Link
                  </span>
                  {(() => {
                    const c = customers.find(x => x.id === customerId);
                    return c ? (
                      <Link
                        to={`/workspace/crm/customers/${c.id}`}
                        className="flex items-center gap-2 p-2 rounded-lg border border-color hover:border-accent-primary/30 bg-main/20 hover:bg-main/40 transition-all font-semibold text-[var(--text-main)] hover:underline"
                      >
                        <Building size={12} className="text-accent-primary shrink-0" />
                        <span>{c.company_name}</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)] italic pl-1">No linked customer</span>
                    );
                  })()}
                </div>

                {/* Linked Lead */}
                {leadId && (
                  <div className="flex flex-col gap-1 border-t border-color/45 pt-2">
                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Lead Source
                    </span>
                    {(() => {
                      const l = leads.find(x => x.id === leadId);
                      return l ? (
                        <Link
                          to={`/workspace/crm/leads/${l.id}`}
                          className="flex items-center gap-2 p-2 rounded-lg border border-color hover:border-accent-primary/30 bg-main/20 hover:bg-main/40 transition-all font-semibold text-[var(--text-main)] hover:underline"
                        >
                          <FileText size={12} className="text-accent-primary shrink-0" />
                          <span>{l.title}</span>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)] italic pl-1">No linked lead</span>
                      );
                    })()}
                  </div>
                )}

                {/* Linked Deal */}
                {dealId && (
                  <div className="flex flex-col gap-1 border-t border-color/45 pt-2">
                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Deal Pipeline Link
                    </span>
                    {(() => {
                      const d = deals.find(x => x.id === dealId);
                      return d ? (
                        <Link
                          to={`/workspace/crm/deals/${d.id}`}
                          className="flex items-center gap-2 p-2 rounded-lg border border-color hover:border-accent-primary/30 bg-main/20 hover:bg-main/40 transition-all font-semibold text-[var(--text-main)] hover:underline"
                        >
                          <TrendingUp size={12} className="text-accent-primary shrink-0" />
                          <span>{d.deal_name}</span>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)] italic pl-1">No linked deal</span>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Audit Metadata */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm text-xs">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <FileText size={12} className="text-accent-primary" /> Audit Metadata Log
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Document ID:</span>
                  <span className="font-mono text-[var(--text-main)] font-medium select-all">
                    {quotation.id.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Prepared By:</span>
                  <span className="text-[var(--text-main)] font-medium">
                    {getOwnerName(quotation.prepared_by_id || "")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Created At:</span>
                  <span className="text-[var(--text-main)] font-medium">
                    {new Date(quotation.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Last Updated:</span>
                  <span className="text-[var(--text-main)] font-medium">
                    {new Date(quotation.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Line Item Modal Dialog Popup */}
      {lineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
          <div className="bg-card border border-color w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
              <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                Add Quotation Line Item
              </h2>
              <button
                onClick={() => setLineModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddLineItem} className="p-6 flex flex-col gap-4">
              {/* Product SKU choose */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                  Choose SKU / Product
                </label>
                <select
                  value={lineProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                >
                  <option value="">Choose item SKU</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku}: {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                  Item Description *
                </label>
                <input
                  type="text"
                  required
                  value={lineDesc}
                  onChange={(e) => setLineDesc(e.target.value)}
                  className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    value={lineQty}
                    onChange={(e) => setLineQty(e.target.value)}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                  />
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Unit Price ($/₦)
                  </label>
                  <input
                    type="number"
                    required
                    value={linePrice}
                    onChange={(e) => setLinePrice(e.target.value)}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-color pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setLineModalOpen(false)}
                  className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !lineDesc.trim()}
                  className="flex items-center gap-1.5 py-2 px-5 bg-accent-primary text-white font-bold text-xs rounded-xl hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition"
                >
                  {saving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Save Line Item"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}

// Simple local X icon wrapper to avoid syntax compilation issues
function X({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
