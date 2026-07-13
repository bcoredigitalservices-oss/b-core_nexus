import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Save,
  Users,
  FileText,
  Building,
  Mail,
  Phone,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";
import { User, Customer, Quotation, Product, PriceList, PriceListItem } from "../../crm/types/types";
import { Plus, Coins } from "lucide-react";

interface SalesOrderLineItem {
  id: string;
  sales_order_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_of_measure: string | null;
  unit_price: number;
  line_total: number;
}

interface SalesOrderDetails {
  id: string;
  reference_number: string;
  order_number: string;
  quotation_id: string;
  customer_id: string;
  owner_id: string | null;
  status: string;
  payment_terms: string | null;
  delivery_terms: string | null;
  currency: string;
  subtotal: number;
  overall_discount_amount: number;
  vat_amount: number;
  grand_total: number;
  internal_notes: string | null;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  created_at: string;
  updated_at: string;
  line_items: SalesOrderLineItem[];
}

export default function SalesOrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { token, authFetch } = useAppContext();

  // Data states
  const [order, setOrder] = useState<SalesOrderDetails | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);
  const [customerContacts, setCustomerContacts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  // UI / Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "address" | "terms" | "connections" | "products" | "price-lists">("details");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit fields
  const [status, setStatus] = useState("confirmed");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [actualDeliveryDate, setActualDeliveryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [ownerId, setOwnerId] = useState("");

  // Catalog Products & Price Lists states
  const [products, setProducts] = useState<Product[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);

  // Catalog Modals
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [createPriceListOpen, setCreatePriceListOpen] = useState(false);
  const [priceListDetailOpen, setPriceListDetailOpen] = useState(false);
  const [addPriceListItemOpen, setAddPriceListItemOpen] = useState(false);

  // Form states for creating/editing Product
  const [prodSku, setProdSku] = useState("");
  const [prodSerial, setProdSerial] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodUom, setProdUom] = useState("units");
  const [prodPrice, setProdPrice] = useState("0");
  const [prodMinQty, setProdMinQty] = useState("1");
  const [prodLeadTime, setProdLeadTime] = useState("0");
  const [prodStock, setProdStock] = useState("0");
  const [prodActive, setProdActive] = useState(true);

  // Form states for creating Price List
  const [plName, setPlName] = useState("");
  const [plCurrency, setPlCurrency] = useState("NGN");
  const [plDefault, setPlDefault] = useState(false);

  // Form states for adding Price List Item
  const [pliProductId, setPliProductId] = useState("");
  const [pliPrice, setPliPrice] = useState("0");

  const statusList = ["confirmed", "processing", "shipped", "delivered", "cancelled"];

  const fetchData = async () => {
    if (!orderId || !token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [orderRes, customersRes, quotationsRes, usersRes, leadsRes, dealsRes] = await Promise.all([
        authFetch(`/sales/orders/${orderId}`) as Promise<SalesOrderDetails>,
        authFetch("/crm/customers").catch(() => []) as Promise<Customer[]>,
        authFetch("/sales/quotations").catch(() => []) as Promise<Quotation[]>,
        authFetch("/auth/users").catch(() => []) as Promise<User[]>,
        authFetch("/crm/leads").catch(() => []) as Promise<any[]>,
        authFetch("/crm/deals").catch(() => []) as Promise<any[]>,
      ]);

      if (orderRes) {
        setOrder(orderRes);
        setStatus(orderRes.status);
        setExpectedDeliveryDate(orderRes.expected_delivery_date ? orderRes.expected_delivery_date.split("T")[0] : "");
        setActualDeliveryDate(orderRes.actual_delivery_date ? orderRes.actual_delivery_date.split("T")[0] : "");
        setPaymentTerms(orderRes.payment_terms || "");
        setDeliveryTerms(orderRes.delivery_terms || "");
        setInternalNotes(orderRes.internal_notes || "");
        setOwnerId(orderRes.owner_id || "");

        // Fetch parent customer's addresses and linked contacts if available
        if (orderRes.customer_id) {
          const [addressesRes, contactsRes] = await Promise.all([
            authFetch(`/crm/customers/${orderRes.customer_id}/addresses`).catch(() => []),
            authFetch(`/crm/customers/${orderRes.customer_id}/contacts`).catch(() => []),
          ]);
          setCustomerAddresses(addressesRes);
          setCustomerContacts(contactsRes);
        }
      }
      setCustomers(customersRes);
      setQuotations(quotationsRes);
      setUsers(usersRes);
      setLeads(leadsRes);
      setDeals(dealsRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load Sales Order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orderId, token]);

  const fetchProducts = async () => {
    try {
      setLoadingCatalog(true);
      const res = await authFetch("/sales/products");
      if (Array.isArray(res)) {
        setProducts(res);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch products.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchPriceLists = async () => {
    try {
      setLoadingCatalog(true);
      const res = await authFetch("/sales/price-lists");
      if (Array.isArray(res)) {
        setPriceLists(res);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch price lists.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchSingleProduct = async (id: string) => {
    try {
      setLoadingCatalog(true);
      const res = await authFetch(`/sales/products/${id}`);
      setSelectedProduct(res);
      
      if (res) {
        setProdSku(res.sku);
        setProdSerial(res.serial_number || "");
        setProdName(res.name);
        setProdDesc(res.description || "");
        setProdUom(res.unit_of_measure);
        setProdPrice(String(res.standard_price));
        setProdMinQty(String(res.min_order_qty));
        setProdLeadTime(String(res.lead_time_days));
        setProdStock(String(res.stock_qty));
        setProdActive(res.is_active);
      }
      setProductDetailOpen(true);
      setIsEditingProduct(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch product details.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchSinglePriceList = async (id: string) => {
    try {
      setLoadingCatalog(true);
      const res = await authFetch(`/sales/price-lists/${id}`);
      setSelectedPriceList(res);
      setPriceListDetailOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch price list details.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);
    try {
      const payload = {
        sku: prodSku.trim(),
        serial_number: prodSerial.trim() || null,
        name: prodName.trim(),
        description: prodDesc.trim() || null,
        unit_of_measure: prodUom.trim(),
        standard_price: parseFloat(prodPrice) || 0.0,
        min_order_qty: parseInt(prodMinQty) || 1,
        lead_time_days: parseInt(prodLeadTime) || 0,
        stock_qty: parseInt(prodStock) || 0,
        is_active: prodActive
      };

      const newProduct = await authFetch("/sales/products", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setProducts(prev => [...prev, newProduct]);
      setSuccessMsg("Product created successfully.");
      setCreateProductOpen(false);
      resetProductForm();
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create product.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);
    try {
      const payload = {
        sku: prodSku.trim(),
        serial_number: prodSerial.trim() || null,
        name: prodName.trim(),
        description: prodDesc.trim() || null,
        unit_of_measure: prodUom.trim(),
        standard_price: parseFloat(prodPrice) || 0.0,
        min_order_qty: parseInt(prodMinQty) || 1,
        lead_time_days: parseInt(prodLeadTime) || 0,
        stock_qty: parseInt(prodStock) || 0,
        is_active: prodActive
      };

      const updated = await authFetch(`/sales/products/${selectedProduct.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      setSelectedProduct(updated);
      setIsEditingProduct(false);
      setSuccessMsg("Product updated successfully.");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePriceList = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);
    try {
      const payload = {
        name: plName.trim(),
        currency: plCurrency,
        is_default: plDefault
      };

      const newPL = await authFetch("/sales/price-lists", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setPriceLists(prev => [...prev, newPL]);
      setSuccessMsg("Price List created successfully.");
      setCreatePriceListOpen(false);
      setPlName("");
      setPlCurrency("NGN");
      setPlDefault(false);
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create price list.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPriceListItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPriceList) return;
    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);
    try {
      const payload = {
        product_id: pliProductId,
        price: parseFloat(pliPrice) || 0.0
      };

      await authFetch(`/sales/price-lists/${selectedPriceList.id}/items`, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      await fetchSinglePriceList(selectedPriceList.id);
      setAddPriceListItemOpen(false);
      setPliProductId("");
      setPliPrice("0");
      setSuccessMsg("Price list item added successfully.");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add price list item.");
    } finally {
      setSaving(false);
    }
  };

  const resetProductForm = () => {
    setProdSku("");
    setProdSerial("");
    setProdName("");
    setProdDesc("");
    setProdUom("units");
    setProdPrice("0");
    setProdMinQty("1");
    setProdLeadTime("0");
    setProdStock("0");
    setProdActive(true);
  };

  const handleTabChange = (tab: "details" | "address" | "terms" | "connections" | "products" | "price-lists") => {
    setActiveTab(tab);
    if (tab === "products") {
      fetchProducts();
    } else if (tab === "price-lists") {
      fetchPriceLists();
      fetchProducts();
    }
  };

  const handleSaveOrder = async () => {
    if (!orderId) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updated = await authFetch(`/sales/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: status,
          payment_terms: paymentTerms || null,
          delivery_terms: deliveryTerms || null,
          expected_delivery_date: expectedDeliveryDate || null,
          actual_delivery_date: actualDeliveryDate || null,
          internal_notes: internalNotes || null,
        }),
      });

      setSuccessMsg("Sales Order details updated successfully.");
      setOrder((prev) => prev ? { ...prev, ...updated } : null);
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save Sales Order settings.");
    } finally {
      setSaving(false);
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
    if (s === "delivered") return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    if (s === "cancelled") return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
    if (s === "shipped") return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    if (s === "processing") return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
    return "bg-sky-500/10 text-sky-500 border border-sky-500/20";
  };

  if (loading) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center gap-3 py-32 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto">
          <Loader2 size={36} className="animate-spin text-accent-primary" />
          <span className="text-xs text-[var(--text-muted)]">Loading Sales Order Ledger Profile…</span>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!order) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto">
          <AlertCircle size={36} className="text-rose-500" />
          <h3 className="text-md font-bold text-[var(--text-main)]">Sales Order Record Not Found</h3>
          <Link to="/workspace/crm/sales-orders" className="text-xs font-bold text-accent-primary hover:underline">
            Return to Sales Orders Directory
          </Link>
        </div>
      </WorkspaceLayout>
    );
  }

  const linkedQuotation = quotations.find((q) => q.id === order.quotation_id);

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-5 max-w-[1400px] mx-auto animate-[fadeIn_0.2s_ease]">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-color pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/workspace/crm/sales-orders"
              className="p-2 border border-color bg-card hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl cursor-pointer transition"
            >
              <ArrowLeft size={14} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Sales Order Document / {order.reference_number || order.order_number}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadgeClass(status)}`}>
                  {status}
                </span>
              </div>
              <h2 className="text-lg font-black text-[var(--text-main)] mt-1 mb-0 select-all">
                SO for {getCustomerName(order.customer_id)}
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
              onClick={handleSaveOrder}
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

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Tabs Header */}
            <div className="flex border-b border-color bg-card rounded-2xl p-1.5 gap-1 shadow-sm select-none">
              <button
                onClick={() => handleTabChange("details")}
                className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "details" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Details
              </button>
              <button
                onClick={() => handleTabChange("address")}
                className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "address" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Address & Contact
              </button>
              <button
                onClick={() => handleTabChange("terms")}
                className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "terms" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Terms & Notes
              </button>
              <button
                onClick={() => handleTabChange("connections")}
                className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "connections" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Connections
              </button>
              <button
                onClick={() => handleTabChange("products")}
                className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "products" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Catalog Products
              </button>
              <button
                onClick={() => handleTabChange("price-lists")}
                className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "price-lists" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Price Lists
              </button>
            </div>

            {/* Tab: Details */}
            {activeTab === "details" && (
              <div className="flex flex-col gap-5 animate-[fadeIn_0.15s_ease]">
                {/* Meta parameters */}
                <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b border-color pb-3 mb-1">
                    <ShoppingBag className="text-accent-primary" size={16} />
                    <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">Order parameters</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Order Number */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                        Order Number
                      </label>
                      <input
                        type="text"
                        disabled
                        value={order.order_number}
                        className="w-full rounded-lg border border-color bg-main/50 py-2 px-3 text-xs outline-none text-[var(--text-muted)] font-mono font-bold"
                      />
                    </div>

                    {/* Customer */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                        Linked Customer
                      </label>
                      <input
                        type="text"
                        disabled
                        value={getCustomerName(order.customer_id)}
                        className="w-full rounded-lg border border-color bg-main/50 py-2 px-3 text-xs outline-none text-[var(--text-muted)] font-bold"
                      />
                    </div>

                    {/* Expected Date */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                        Expected Delivery Date
                      </label>
                      <div className="relative flex items-center">
                        <Calendar size={13} className="absolute left-3 text-[var(--text-muted)]" />
                        <input
                          type="date"
                          value={expectedDeliveryDate}
                          onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                          className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Actual Date */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                        Actual Delivery Date
                      </label>
                      <div className="relative flex items-center">
                        <Calendar size={13} className="absolute left-3 text-[var(--text-muted)]" />
                        <input
                          type="date"
                          value={actualDeliveryDate}
                          onChange={(e) => setActualDeliveryDate(e.target.value)}
                          className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                        Order Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer font-bold"
                      >
                        {statusList.map((st) => (
                          <option key={st} value={st}>{st.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>

                    {/* Billing Currency */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                        Currency
                      </label>
                      <input
                        type="text"
                        disabled
                        value={order.currency}
                        className="w-full rounded-lg border border-color bg-main/50 py-2 px-3 text-xs outline-none text-[var(--text-muted)] font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Items Line Table */}
                <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-color pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="text-accent-primary" size={16} />
                      <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">Line Items Ledger</h3>
                    </div>
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
                        {order.line_items.map((item, idx) => (
                          <tr key={item.id} className="border-b border-color/40 hover:bg-main/20">
                            <td className="py-3 px-4 font-mono font-bold text-[var(--text-muted)] text-center">{idx + 1}</td>
                            <td className="py-3 px-4 text-[var(--text-main)] font-semibold">{item.description}</td>
                            <td className="py-3 px-4 font-bold text-[var(--text-main)] text-center">{item.quantity}</td>
                            <td className="py-3 px-4 text-right font-medium text-[var(--text-muted)]">
                              {order.currency === "NGN" ? "₦" : "$"}{Number(item.unit_price).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[var(--text-main)]">
                              {order.currency === "NGN" ? "₦" : "$"}{Number(item.line_total).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {order.line_items.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-4 px-4 text-center text-xs text-[var(--text-muted)] italic">
                              No items associated with order.
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
                        {order.currency === "NGN" ? "₦" : "$"}{order.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">VAT Amount:</span>
                      <span className="font-semibold text-[var(--text-muted)]">
                        {order.currency === "NGN" ? "₦" : "$"}{order.vat_amount.toLocaleString()}
                      </span>
                    </div>
                    <hr className="border-color" />
                    <div className="flex justify-between text-sm">
                      <span className="font-extrabold text-[var(--text-main)]">Grand Total Value:</span>
                      <span className="font-black text-accent-primary">
                        {order.currency === "NGN" ? "₦" : "$"}{order.grand_total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Address & Contact */}
            {activeTab === "address" && (
              <div className="flex flex-col gap-5 animate-[fadeIn_0.15s_ease]">
                {/* Billing/Shipping Address Details */}
                <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-color pb-2">
                    <Building className="text-accent-primary" size={15} />
                    <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">Customer Addresses</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerAddresses.map((addr) => (
                      <div key={addr.id} className="p-4 bg-main/30 border border-color rounded-xl flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] bg-accent-primary/10 text-accent-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            {addr.address_type}
                          </span>
                          {addr.is_default && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="m-0 text-[var(--text-main)] font-semibold mt-1">
                          {addr.address_line_1}
                          {addr.address_line_2 && `, ${addr.address_line_2}`}
                        </p>
                        <p className="m-0 text-[var(--text-muted)]">
                          {addr.city}, {addr.state} {addr.zip_code}
                        </p>
                        <p className="m-0 text-[var(--text-muted)] font-medium">
                          {addr.country}
                        </p>
                      </div>
                    ))}
                    {customerAddresses.length === 0 && (
                      <div className="col-span-2 py-4 text-center text-xs text-[var(--text-muted)] italic">
                        No customer addresses registered.
                      </div>
                    )}
                  </div>
                </div>

                {/* Linked Contacts */}
                <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-color pb-2">
                    <Users className="text-accent-primary" size={15} />
                    <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">Linked Customer Contacts</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerContacts.map((link) => {
                      const c = link.contact;
                      return (
                        <div key={link.id} className="p-4 bg-main/30 border border-color rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-[var(--text-main)] block mb-0.5">
                              {c.first_name} {c.last_name || ""}
                            </strong>
                            <span className="text-[10px] text-[var(--text-muted)] font-medium block">
                              Role: {link.role_at_customer || "Unspecified"}
                            </span>
                            {c.email && (
                              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-1">
                                <Mail size={10} /> {c.email}
                              </span>
                            )}
                            {c.phone && (
                              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                <Phone size={10} /> {c.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {customerContacts.length === 0 && (
                      <div className="col-span-2 py-4 text-center text-xs text-[var(--text-muted)] italic">
                        No contacts associated with this customer profile.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Terms & Notes */}
            {activeTab === "terms" && (
              <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center gap-2 border-b border-color pb-3 mb-1">
                  <FileText className="text-accent-primary" size={16} />
                  <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                    Agreement Terms & Remarks
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Payment Terms */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Payment Terms Agreement
                    </label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="e.g. Net 30"
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold"
                    />
                  </div>

                  {/* Delivery Terms */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Delivery Logistic Terms
                    </label>
                    <input
                      type="text"
                      value={deliveryTerms}
                      onChange={(e) => setDeliveryTerms(e.target.value)}
                      placeholder="e.g. Ex Works, FOB"
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                    />
                  </div>

                  {/* Internal Remarks */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Internal Remarks Notes
                    </label>
                    <textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      rows={4}
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
                    Linked Pipeline connections
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Customer Link Card */}
                  <div className="p-4 bg-main/30 border border-color rounded-xl max-w-md flex flex-col gap-1.5 text-xs">
                    <span className="text-[9px] bg-accent-primary/10 text-accent-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider self-start">
                      Connected Customer
                    </span>
                    <strong className="text-xs text-[var(--text-main)]">{getCustomerName(order.customer_id)}</strong>
                    <Link
                      to={`/workspace/crm/customers/${order.customer_id}`}
                      className="text-[10px] text-accent-primary hover:underline font-bold self-start mt-1"
                    >
                      View complete Customer profile ledger →
                    </Link>
                  </div>

                  {/* Quotation Link Card */}
                  {linkedQuotation && (
                    <div className="p-4 bg-main/30 border border-color rounded-xl max-w-md flex flex-col gap-1.5 text-xs">
                      <span className="text-[9px] bg-accent-primary/10 text-accent-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider self-start">
                        Connected Proposal Document
                      </span>
                      <strong className="text-xs text-[var(--text-main)]">
                        {linkedQuotation.reference_number || linkedQuotation.quotation_number}
                      </strong>
                      <Link
                        to={`/workspace/crm/quotations/${linkedQuotation.id}`}
                        className="text-[10px] text-accent-primary hover:underline font-bold self-start mt-1"
                      >
                        View source Quotation document →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Products */}
            {activeTab === "products" && (
              <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center justify-between border-b border-color pb-3 mb-1">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="text-accent-primary" size={16} />
                    <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                      Catalog Products Directory
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      resetProductForm();
                      setCreateProductOpen(true);
                    }}
                    className="flex items-center gap-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer transition"
                  >
                    <Plus size={10} /> Add Catalog Product
                  </button>
                </div>

                {loadingCatalog ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-xs text-[var(--text-muted)]">
                    <Loader2 size={16} className="animate-spin text-accent-primary" />
                    <span>Loading products catalog...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-color rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-main/50 border-b border-color">
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase">Name</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase">SKU</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[var(--text-muted)] text-right uppercase">Std Price</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[var(--text-muted)] text-center uppercase">Stock</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase">UOM</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[var(--text-muted)] text-center uppercase">Status</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[var(--text-muted)] text-center uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id} className="border-b border-color/40 hover:bg-main/20">
                            <td className="py-3 px-3 text-[var(--text-main)] font-semibold">{p.name}</td>
                            <td className="py-3 px-3 text-[var(--text-muted)] font-mono">{p.sku}</td>
                            <td className="py-3 px-3 text-right font-semibold text-[var(--text-main)]">${Number(p.standard_price).toLocaleString()}</td>
                            <td className="py-3 px-3 text-center text-[var(--text-muted)]">{p.stock_qty}</td>
                            <td className="py-3 px-3 text-[var(--text-muted)]">{p.unit_of_measure}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${p.is_active ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}>
                                {p.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => fetchSingleProduct(p.id)}
                                className="text-[10px] text-accent-primary hover:underline font-bold cursor-pointer"
                              >
                                View / Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                        {products.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)] italic">
                              No products found. Create a product using the button above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Price Lists */}
            {activeTab === "price-lists" && (
              <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center justify-between border-b border-color pb-3 mb-1">
                  <div className="flex items-center gap-2">
                    <Coins className="text-accent-primary" size={16} />
                    <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                      Standard Price Lists
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setPlName("");
                      setPlCurrency("NGN");
                      setPlDefault(false);
                      setCreatePriceListOpen(true);
                    }}
                    className="flex items-center gap-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer transition"
                  >
                    <Plus size={10} /> Create Price List
                  </button>
                </div>

                {loadingCatalog ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-xs text-[var(--text-muted)]">
                    <Loader2 size={16} className="animate-spin text-accent-primary" />
                    <span>Loading price lists...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {priceLists.map((pl) => (
                      <div key={pl.id} className="p-4 bg-main/30 border border-color rounded-xl flex flex-col gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-[var(--text-main)]">{pl.name}</strong>
                          <div className="flex gap-1.5">
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-accent-primary/10 text-accent-primary uppercase tracking-wider">
                              {pl.currency}
                            </span>
                            {pl.is_default && (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 uppercase tracking-wider">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => fetchSinglePriceList(pl.id)}
                          className="mt-2 text-[10px] text-accent-primary hover:underline font-bold self-start cursor-pointer"
                        >
                          View Pricing Details & items &rarr;
                        </button>
                      </div>
                    ))}
                    {priceLists.length === 0 && (
                      <div className="col-span-2 py-8 text-center text-xs text-[var(--text-muted)] italic">
                        No Price Lists registered. Create one using the button above.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar details */}
          <div className="flex flex-col gap-5">
            {/* Account Owner */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm text-xs">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <Users size={12} className="text-accent-primary" /> Order Owner
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

            {/* Section: Associated Pipeline Records */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm text-xs">
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
                    const c = customers.find(x => x.id === order.customer_id);
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

                {/* Linked Quotation */}
                <div className="flex flex-col gap-1 border-t border-color/45 pt-2">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Quotation Proposal Link
                  </span>
                  {(() => {
                    const q = quotations.find(x => x.id === order.quotation_id);
                    return q ? (
                      <Link
                        to={`/workspace/crm/quotations/${q.id}`}
                        className="flex items-center gap-2 p-2 rounded-lg border border-color hover:border-accent-primary/30 bg-main/20 hover:bg-main/40 transition-all font-semibold text-[var(--text-main)] hover:underline"
                      >
                        <FileText size={12} className="text-accent-primary shrink-0" />
                        <span>{q.quotation_number}</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)] italic pl-1">No linked quotation</span>
                    );
                  })()}
                </div>

                {/* Linked Lead (if any from quotation) */}
                {(() => {
                  const q = quotations.find(x => x.id === order.quotation_id);
                  if (!q || !q.lead_id) return null;
                  const l = leads.find(x => x.id === q.lead_id);
                  return (
                    <div className="flex flex-col gap-1 border-t border-color/45 pt-2">
                      <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                        Lead Source
                      </span>
                      {l ? (
                        <Link
                          to={`/workspace/crm/leads/${l.id}`}
                          className="flex items-center gap-2 p-2 rounded-lg border border-color hover:border-accent-primary/30 bg-main/20 hover:bg-main/40 transition-all font-semibold text-[var(--text-main)] hover:underline"
                        >
                          <Building size={12} className="text-accent-primary shrink-0" />
                          <span>{l.title}</span>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)] italic pl-1">No linked lead</span>
                      )}
                    </div>
                  );
                })()}

                {/* Linked Deal (if any from quotation) */}
                {(() => {
                  const q = quotations.find(x => x.id === order.quotation_id);
                  if (!q || !q.deal_id) return null;
                  const d = deals.find(x => x.id === q.deal_id);
                  return (
                    <div className="flex flex-col gap-1 border-t border-color/45 pt-2">
                      <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                        Deal Pipeline Link
                      </span>
                      {d ? (
                        <Link
                          to={`/workspace/crm/deals/${d.id}`}
                          className="flex items-center gap-2 p-2 rounded-lg border border-color hover:border-accent-primary/30 bg-main/20 hover:bg-main/40 transition-all font-semibold text-[var(--text-main)] hover:underline"
                        >
                          <TrendingUp size={12} className="text-accent-primary shrink-0" />
                          <span>{d.deal_name}</span>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)] italic pl-1">No linked deal</span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Audit Metadata Log */}
            <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm text-xs">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
                <FileText size={12} className="text-accent-primary" /> Audit Metadata Log
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Document ID:</span>
                  <span className="font-mono text-[var(--text-main)] font-medium select-all">
                    {order.id.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Created At:</span>
                  <span className="text-[var(--text-main)] font-medium">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Last Updated:</span>
                  <span className="text-[var(--text-main)] font-medium">
                    {new Date(order.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Product Modal Dialog */}
      {createProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
          <div className="bg-card border border-color w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
              <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0">Create Catalog Product</h2>
              <button type="button" onClick={() => setCreateProductOpen(false)} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main cursor-pointer border-none bg-transparent">
                <XIcon size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Product SKU *</label>
                  <input type="text" required value={prodSku} onChange={(e) => setProdSku(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Serial Number</label>
                  <input type="text" value={prodSerial} onChange={(e) => setProdSerial(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Product Name *</label>
                <input type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Description</label>
                <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={3} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Std Price *</label>
                  <input type="number" required step="any" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Stock Qty</label>
                  <input type="number" value={prodStock} onChange={(e) => setProdStock(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">UOM</label>
                  <input type="text" value={prodUom} onChange={(e) => setProdUom(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Min Order Qty</label>
                  <input type="number" value={prodMinQty} onChange={(e) => setProdMinQty(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Lead Time Days</label>
                  <input type="number" value={prodLeadTime} onChange={(e) => setProdLeadTime(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="prodActive" checked={prodActive} onChange={(e) => setProdActive(e.target.checked)} className="cursor-pointer" />
                <label htmlFor="prodActive" className="text-xs text-[var(--text-main)] font-semibold select-none cursor-pointer">Product is active and visible</label>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-color pt-4 mt-2">
                <button type="button" onClick={() => setCreateProductOpen(false)} className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 py-2 px-5 bg-accent-primary text-white font-bold text-xs rounded-xl hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail & Edit Modal Dialog */}
      {productDetailOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
          <div className="bg-card border border-color w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
              <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                {isEditingProduct ? "Edit Catalog Product" : "Catalog Product Details"}
              </h2>
              <button type="button" onClick={() => setProductDetailOpen(false)} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main cursor-pointer border-none bg-transparent">
                <XIcon size={16} />
              </button>
            </div>
            
            {isEditingProduct ? (
              <form onSubmit={handleUpdateProduct} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Product SKU *</label>
                    <input type="text" required value={prodSku} onChange={(e) => setProdSku(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Serial Number</label>
                    <input type="text" value={prodSerial} onChange={(e) => setProdSerial(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Product Name *</label>
                  <input type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Description</label>
                  <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows={3} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] resize-none" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Std Price *</label>
                    <input type="number" required step="any" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Stock Qty</label>
                    <input type="number" value={prodStock} onChange={(e) => setProdStock(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">UOM</label>
                    <input type="text" value={prodUom} onChange={(e) => setProdUom(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Min Order Qty</label>
                    <input type="number" value={prodMinQty} onChange={(e) => setProdMinQty(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Lead Time Days</label>
                    <input type="number" value={prodLeadTime} onChange={(e) => setProdLeadTime(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="prodActiveUpdate" checked={prodActive} onChange={(e) => setProdActive(e.target.checked)} className="cursor-pointer" />
                  <label htmlFor="prodActiveUpdate" className="text-xs text-[var(--text-main)] font-semibold select-none cursor-pointer">Product is active and visible</label>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-color pt-4 mt-2">
                  <button type="button" onClick={() => setIsEditingProduct(false)} className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition">Back to Details</button>
                  <button type="submit" disabled={saving} className="flex items-center gap-1.5 py-2 px-5 bg-accent-primary text-white font-bold text-xs rounded-xl hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">SKU</span>
                    <strong className="text-[var(--text-main)] font-mono">{selectedProduct.sku}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Serial Number</span>
                    <strong className="text-[var(--text-main)]">{selectedProduct.serial_number || "None"}</strong>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Product Name</span>
                  <strong className="text-sm text-[var(--text-main)] font-extrabold">{selectedProduct.name}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Description</span>
                  <p className="text-[var(--text-main)] m-0 leading-relaxed">{selectedProduct.description || "No description provided."}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs border-t border-b border-color py-4">
                  <div>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Standard Price</span>
                    <strong className="text-[var(--text-main)]">${selectedProduct.standard_price.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Stock Level</span>
                    <strong className="text-[var(--text-main)]">{selectedProduct.stock_qty} ({selectedProduct.unit_of_measure})</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Status</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${selectedProduct.is_active ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}>
                      {selectedProduct.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Min Order Qty</span>
                    <span className="text-[var(--text-main)] font-semibold">{selectedProduct.min_order_qty} units</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Lead Time Days</span>
                    <span className="text-[var(--text-main)] font-semibold">{selectedProduct.lead_time_days} days</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-color pt-4 mt-2">
                  <button type="button" onClick={() => setProductDetailOpen(false)} className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition">Close</button>
                  <button type="button" onClick={() => setIsEditingProduct(true)} className="py-2 px-5 bg-accent-primary text-white font-bold text-xs rounded-xl hover:brightness-110 shadow-sm cursor-pointer transition">Edit Product</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Price List Modal Dialog */}
      {createPriceListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
          <div className="bg-card border border-color w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
              <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0">Create Price List</h2>
              <button type="button" onClick={() => setCreatePriceListOpen(false)} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main cursor-pointer border-none bg-transparent">
                <XIcon size={16} />
              </button>
            </div>
            <form onSubmit={handleCreatePriceList} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Price List Name *</label>
                <input type="text" required placeholder="e.g. Premium Customers, wholesale" value={plName} onChange={(e) => setPlName(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Currency *</label>
                <select value={plCurrency} onChange={(e) => setPlCurrency(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer">
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="plDefault" checked={plDefault} onChange={(e) => setPlDefault(e.target.checked)} className="cursor-pointer" />
                <label htmlFor="plDefault" className="text-xs text-[var(--text-main)] font-semibold select-none cursor-pointer">Set as Default Price List</label>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-color pt-4 mt-2">
                <button type="button" onClick={() => setCreatePriceListOpen(false)} className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-1.5 py-2 px-5 bg-accent-primary text-white font-bold text-xs rounded-xl hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : "Save Price List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price List Detail Modal Dialog */}
      {priceListDetailOpen && selectedPriceList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
          <div className="bg-card border border-color w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
              <div>
                <span className="text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-wider block">Price List Ledger</span>
                <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0 flex items-center gap-2">
                  {selectedPriceList.name}
                  {selectedPriceList.is_default && (
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">Default</span>
                  )}
                </h2>
              </div>
              <button type="button" onClick={() => setPriceListDetailOpen(false)} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main cursor-pointer border-none bg-transparent">
                <XIcon size={16} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-[var(--text-main)] m-0">Assigned Pricing Items</h3>
                <button
                  type="button"
                  onClick={() => {
                    setPliProductId("");
                    setPliPrice("0");
                    setAddPriceListItemOpen(true);
                  }}
                  className="flex items-center gap-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] rounded-lg cursor-pointer transition"
                >
                  <Plus size={8} /> Assign Product Price
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto border border-color rounded-xl text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-main/50 border-b border-color">
                      <th className="py-2 px-3 text-[9px] font-bold text-[var(--text-muted)] uppercase">Product Name</th>
                      <th className="py-2 px-3 text-[9px] font-bold text-[var(--text-muted)] uppercase">SKU</th>
                      <th className="py-2 px-3 text-[9px] font-bold text-[var(--text-muted)] text-right uppercase">Custom List Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPriceList.items?.map((item) => (
                      <tr key={item.id} className="border-b border-color/40 hover:bg-main/20">
                        <td className="py-2 px-3 text-[var(--text-main)] font-semibold">{item.product?.name || "Unknown Product"}</td>
                        <td className="py-2 px-3 text-[var(--text-muted)] font-mono">{item.product?.sku || "N/A"}</td>
                        <td className="py-2 px-3 text-right font-semibold text-[var(--text-main)]">
                          {selectedPriceList.currency === "NGN" ? "₦" : "$"}{Number(item.price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {(!selectedPriceList.items || selectedPriceList.items.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-xs text-[var(--text-muted)] italic">
                          No custom pricing assigned. Add a custom price using the button above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-end gap-2 border-t border-color pt-4">
                <button type="button" onClick={() => setPriceListDetailOpen(false)} className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Price List Item Modal Dialog */}
      {addPriceListItemOpen && selectedPriceList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
          <div className="bg-card border border-color w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
              <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0">Assign Product Price</h2>
              <button type="button" onClick={() => setAddPriceListItemOpen(false)} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main cursor-pointer border-none bg-transparent">
                <XIcon size={16} />
              </button>
            </div>
            <form onSubmit={handleAddPriceListItem} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Select Product *</label>
                <select required value={pliProductId} onChange={(e) => setPliProductId(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer">
                  <option value="">Choose a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku}: {p.name} (Std: ${p.standard_price})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">Price ({selectedPriceList.currency}) *</label>
                <input type="number" required step="any" value={pliPrice} onChange={(e) => setPliPrice(e.target.value)} className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold" />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-color pt-4 mt-2">
                <button type="button" onClick={() => setAddPriceListItemOpen(false)} className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition">Cancel</button>
                <button type="submit" disabled={saving || !pliProductId} className="flex items-center gap-1.5 py-2 px-5 bg-accent-primary text-white font-bold text-xs rounded-xl hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : "Assign Price"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}

function XIcon({ size }: { size: number }) {
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
