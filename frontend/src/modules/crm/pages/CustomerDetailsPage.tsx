import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Home,
  UserPlus,
  FileText,
  DollarSign,
  MapPin,
  Save,
  Users,
  Receipt,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";
import { User, Contact } from "../types/types";
import { EntityChatBox } from "../../../components/ui/EntityChatBox";
import { RecordShareCard } from "../../../components/ui/RecordShareCard";

interface CustomerAddress {
  id: string;
  address_type: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip_code: string | null;
  is_default: boolean;
}

interface CustomerContact {
  id: string;
  contact_id: string;
  role_at_customer: string | null;
  contact: Contact;
}

interface CustomerDetails {
  id: string;
  reference_number: string;
  company_name: string;
  tax_id: string | null;
  payment_terms: string | null;
  credit_limit: number | null;
  owner_id: string | null;
  created_at: string;
  addresses: CustomerAddress[];
  contacts: CustomerContact[];
}

export default function CustomerDetailsPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const { token, authFetch, currentUser } = useAppContext();
  const navigate = useNavigate();

  // Data states
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [contactsDir, setContactsDir] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [associatedQuotations, setAssociatedQuotations] = useState<any[]>([]);
  const [associatedOrders, setAssociatedOrders] = useState<any[]>([]);

  // Loading/UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "address_contact" | "tax" | "connections" | "chat"
  >("details");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit fields
  const [companyName, setCompanyName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [creditLimit, setCreditLimit] = useState("");
  const [taxId, setTaxId] = useState("");

  // Modals
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(
    null,
  );
  const [addrType, setAddrType] = useState("billing");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrCountry, setAddrCountry] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [addrDefault, setAddrDefault] = useState(false);

  const [linkContactOpen, setLinkContactOpen] = useState(false);
  const [linkContactId, setLinkContactId] = useState("");
  const [linkRole, setLinkRole] = useState("");

  const paymentTermsList = [
    "Net 30",
    "Net 60",
    "Immediate",
    "COD",
    "Due on Receipt",
  ];

  const fetchData = async () => {
    if (!customerId || !token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [custData, usersData, contactsData, dealsData, allQuots, allOrders] = await Promise.all([
        authFetch(`/crm/customers/${customerId}`) as Promise<CustomerDetails>,
        authFetch("/auth/users").catch(() => []) as Promise<User[]>,
        authFetch("/crm/contacts").catch(() => []) as Promise<Contact[]>,
        authFetch(`/crm/deals?customer_id=${customerId}`).catch(
          () => [],
        ) as Promise<any[]>,
        authFetch("/sales/quotations").catch(() => []) as Promise<any[]>,
        authFetch("/sales/orders").catch(() => []) as Promise<any[]>,
      ]);

      if (custData) {
        setCustomer(custData);
        setCompanyName(custData.company_name);
        setOwnerId(custData.owner_id || "");
        setPaymentTerms(custData.payment_terms || "Net 30");
        setCreditLimit(
          custData.credit_limit !== null ? String(custData.credit_limit) : "",
        );
        setTaxId(custData.tax_id || "");

        // Filter associated sales documents
        setAssociatedQuotations(allQuots.filter((q: any) => q.customer_id === customerId));
        setAssociatedOrders(allOrders.filter((o: any) => o.customer_id === customerId));
      }
      setUsers(usersData);
      setContactsDir(contactsData);
      setDeals(dealsData);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load customer profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [customerId, token]);

  const handleSaveProfile = async () => {
    if (!customerId) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const updated = await authFetch(`/crm/customers/${customerId}`, {
        method: "PUT",
        body: JSON.stringify({
          company_name: companyName.trim(),
          tax_id: taxId.trim() || null,
          payment_terms: paymentTerms,
          credit_limit: creditLimit ? parseFloat(creditLimit) : null,
          owner_id: ownerId || null,
        }),
      });
      setSuccessMsg("Customer profile saved successfully.");
      setCustomer((prev) => (prev ? { ...prev, ...updated } : null));
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const payload = {
        address_type: addrType,
        address_line_1: addrLine1.trim(),
        address_line_2: addrLine2.trim() || null,
        city: addrCity.trim() || null,
        state: addrState.trim() || null,
        country: addrCountry.trim() || null,
        zip_code: addrZip.trim() || null,
        is_default: addrDefault,
      };

      let addressRes: CustomerAddress;
      if (editingAddress) {
        addressRes = await authFetch(
          `/crm/customers/${customerId}/addresses/${editingAddress.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
        setCustomer((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            addresses: prev.addresses.map((a) =>
              a.id === addressRes.id ? addressRes : a,
            ),
          };
        });
      } else {
        addressRes = await authFetch(`/crm/customers/${customerId}/addresses`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setCustomer((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            addresses: [...prev.addresses, addressRes],
          };
        });
      }

      setAddressModalOpen(false);
      setEditingAddress(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditAddress = (addr: CustomerAddress) => {
    setEditingAddress(addr);
    setAddrType(addr.address_type);
    setAddrLine1(addr.address_line_1);
    setAddrLine2(addr.address_line_2 || "");
    setAddrCity(addr.city || "");
    setAddrState(addr.state || "");
    setAddrCountry(addr.country || "");
    setAddrZip(addr.zip_code || "");
    setAddrDefault(addr.is_default);
    setAddressModalOpen(true);
  };

  const handleOpenAddAddress = () => {
    setEditingAddress(null);
    setAddrType("billing");
    setAddrLine1("");
    setAddrLine2("");
    setAddrCity("");
    setAddrState("");
    setAddrCountry("");
    setAddrZip("");
    setAddrDefault(false);
    setAddressModalOpen(true);
  };

  const handleLinkContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !linkContactId) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const linkRes = await authFetch(`/crm/customers/${customerId}/contacts`, {
        method: "POST",
        body: JSON.stringify({
          contact_id: linkContactId,
          role_at_customer: linkRole.trim() || null,
        }),
      });

      setCustomer((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          contacts: [...prev.contacts, linkRes],
        };
      });
      setLinkContactOpen(false);
      setLinkContactId("");
      setLinkRole("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to link contact.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkContact = async (contactId: string) => {
    if (!customerId) return;
    try {
      await authFetch(`/crm/customers/${customerId}/contacts/${contactId}`, {
        method: "DELETE",
      });
      setCustomer((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          contacts: prev.contacts.filter((c) => c.contact_id !== contactId),
        };
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to unlink contact.");
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

  if (loading) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center gap-3 py-32 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto">
          <Loader2 size={36} className="animate-spin text-accent-primary" />
          <span className="text-xs text-[var(--text-muted)]">
            Loading Customer Profile Ledger…
          </span>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!customer) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto">
          <AlertCircle size={36} className="text-rose-500" />
          <h3 className="text-md font-bold text-[var(--text-main)]">
            Customer Profile Not Found
          </h3>
          <Link
            to="/workspace/crm/customers"
            className="text-xs font-bold text-accent-primary hover:underline"
          >
            Return to Customers directory
          </Link>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-5 max-w-[1400px] mx-auto animate-[fadeIn_0.2s_ease]">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-color pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/workspace/crm/customers"
              className="p-2 border border-color bg-card hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl cursor-pointer transition"
            >
              <ArrowLeft size={14} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Customer Profile / {customer.reference_number}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${customer.is_active ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}
                >
                  {customer.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <h2 className="text-lg font-black text-[var(--text-main)] mt-1 mb-0 select-all">
                {customer.company_name}
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
              onClick={handleSaveProfile}
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

        {/* Form Tabs Layout */}
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
                onClick={() => setActiveTab("address_contact")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "address_contact" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Address & Contact
              </button>
              <button
                onClick={() => setActiveTab("tax")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer text-center ${activeTab === "tax" ? "bg-accent-primary text-white" : "text-[var(--text-muted)] hover:bg-main"}`}
              >
                Tax Info
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
                Chat
              </button>
            </div>

            {/* Tab: Details */}
            {activeTab === "details" && (
              <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center gap-2 border-b border-color pb-3 mb-1">
                  <Building className="text-accent-primary" size={16} />
                  <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                    Customer Profile Parameters
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Payment Terms
                    </label>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                    >
                      {paymentTermsList.map((term) => (
                        <option key={term} value={term}>
                          {term}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Credit Limit ($)
                    </label>
                    <div className="relative flex items-center">
                      <DollarSign
                        size={13}
                        className="absolute left-3 text-[var(--text-muted)]"
                      />
                      <input
                        type="number"
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(e.target.value)}
                        placeholder="Unlimited"
                        className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Address & Contact */}
            {activeTab === "address_contact" && (
              <div className="flex flex-col gap-5 animate-[fadeIn_0.15s_ease]">
                {/* Address Section */}
                <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-color pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-accent-primary" size={16} />
                      <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                        Address Directory
                      </h3>
                    </div>
                    <button
                      onClick={handleOpenAddAddress}
                      className="flex items-center gap-1 py-1.5 px-3 bg-accent-primary text-white rounded-lg text-xs font-bold hover:brightness-110 cursor-pointer transition shadow-xs"
                    >
                      <Plus size={12} /> Add Address
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => handleOpenEditAddress(addr)}
                        className="p-4 border border-color bg-main/30 rounded-xl hover:border-accent-primary/40 cursor-pointer transition flex flex-col gap-1.5 relative group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-accent-primary/10 text-accent-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            {addr.address_type}
                          </span>
                          {addr.is_default && (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-main)] font-semibold m-0 leading-relaxed">
                          {addr.address_line_1}
                        </p>
                        {addr.address_line_2 && (
                          <p className="text-xs text-[var(--text-muted)] m-0 leading-relaxed">
                            {addr.address_line_2}
                          </p>
                        )}
                        <p className="text-xs text-[var(--text-muted)] m-0 font-medium">
                          {addr.city ? `${addr.city}, ` : ""}
                          {addr.state ? `${addr.state}, ` : ""}
                          {addr.country || ""} {addr.zip_code || ""}
                        </p>
                      </div>
                    ))}
                    {customer.addresses.length === 0 && (
                      <span className="text-xs text-[var(--text-muted)] italic py-2 md:col-span-2 text-center">
                        No addresses registered for this customer.
                      </span>
                    )}
                  </div>
                </div>

                {/* Contacts Section */}
                <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-color pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="text-accent-primary" size={16} />
                      <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                        Linked Contacts
                      </h3>
                    </div>
                    <button
                      onClick={() => setLinkContactOpen(true)}
                      className="flex items-center gap-1 py-1.5 px-3 bg-accent-primary text-white rounded-lg text-xs font-bold hover:brightness-110 cursor-pointer transition shadow-xs"
                    >
                      <Plus size={12} /> Link Contact
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-color rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-main/50 border-b border-color">
                          <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                            Name
                          </th>
                          <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                            Job Title
                          </th>
                          <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                            Role at Customer
                          </th>
                          <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase text-right w-16">
                            Revoke
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {customer.contacts.map((link) => (
                          <tr
                            key={link.id}
                            className="border-b border-color/40 hover:bg-main/20 text-xs"
                          >
                            <td className="py-3 px-4 font-bold text-[var(--text-main)] hover:underline">
                              <Link
                                to={`/workspace/crm/contacts/${link.contact_id}`}
                              >
                                {link.contact.first_name}{" "}
                                {link.contact.last_name || ""}
                              </Link>
                            </td>
                            <td className="py-3 px-4 text-[var(--text-muted)]">
                              {link.contact.job_title || (
                                <span className="opacity-40 italic">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[var(--text-main)] font-medium">
                              {link.role_at_customer || (
                                <span className="opacity-40 italic">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() =>
                                  handleUnlinkContact(link.contact_id)
                                }
                                className="p-1 hover:bg-rose-500/10 text-rose-500 rounded border border-transparent hover:border-rose-500/20 cursor-pointer transition"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {customer.contacts.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-4 px-4 text-center text-xs text-[var(--text-muted)] italic"
                            >
                              No contacts linked yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Chat */}
            {activeTab === "chat" && (
              <div className="animate-[fadeIn_0.15s_ease]">
                <EntityChatBox
                  entityType="customer"
                  entityId={customerId || ""}
                  users={users}
                />
              </div>
            )}

            {/* Tab: Tax Info */}
            {activeTab === "tax" && (
              <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center gap-2 border-b border-color pb-3 mb-1">
                  <FileText className="text-accent-primary" size={16} />
                  <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                    Tax Ledger Identifications
                  </h3>
                </div>

                <div className="flex flex-col gap-1 max-w-sm">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Tax ID (GSTIN/VAT/EIN)
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g. GB123456789"
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                  />
                </div>
              </div>
            )}

            {/* Tab: Connections */}
            {activeTab === "connections" && (
              <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.15s_ease]">
                <div className="flex items-center gap-2 border-b border-color pb-3 mb-1">
                  <Building className="text-accent-primary" size={16} />
                  <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                    Active Connection Logs
                  </h3>
                </div>

                <div className="overflow-x-auto border border-color rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-main/50 border-b border-color">
                        <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                          Deal Ref
                        </th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                          Opportunity Name
                        </th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                          Pipeline Stage
                        </th>
                        <th className="py-2.5 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                          Expected Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {deals.map((deal) => (
                        <tr
                          key={deal.id}
                          className="border-b border-color/40 hover:bg-main/20"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-accent-primary hover:underline">
                            <Link to={`/workspace/crm/deals/${deal.id}`}>
                              {deal.reference_number || deal.id.substring(0, 8)}
                            </Link>
                          </td>
                          <td className="py-3 px-4 font-bold text-[var(--text-main)] hover:underline">
                            <Link to={`/workspace/crm/deals/${deal.id}`}>
                              {deal.deal_name}
                            </Link>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-main border border-color uppercase text-[10px] font-bold">
                              {deal.pipeline_stage}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--text-main)]">
                            ${Number(deal.expected_revenue).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {deals.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-4 px-4 text-center text-xs text-[var(--text-muted)] italic"
                          >
                            No associated deals linked.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Quick Actions */}
          <div className="flex flex-col gap-5">
            {/* Owner Box */}
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
              entityType="customer"
              entityId={customerId || ""}
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
                <FileText size={12} className="text-accent-primary" /> Metadata
                Audit
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Profile ID:</span>
                  <span className="font-mono text-[var(--text-main)] font-medium select-all">
                    {customer.id.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Created At:</span>
                  <span className="text-[var(--text-main)] font-medium">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Form Dialog Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
          <div className="bg-card border border-color w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
              <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                {editingAddress
                  ? "Modify Address Settings"
                  : "Add Address Record"}
              </h2>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSaveAddress}
              className="p-6 flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Address Type
                  </label>
                  <select
                    value={addrType}
                    onChange={(e) => setAddrType(e.target.value)}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
                  >
                    <option value="billing">Billing Address</option>
                    <option value="shipping">Shipping Address</option>
                    <option value="project_site">Project Site</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrLine1}
                    onChange={(e) => setAddrLine1(e.target.value)}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                  />
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={addrLine2}
                    onChange={(e) => setAddrLine2(e.target.value)}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    State / Province
                  </label>
                  <input
                    type="text"
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={addrCountry}
                    onChange={(e) => setAddrCountry(e.target.value)}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                    Zip / Postal Code
                  </label>
                  <input
                    type="text"
                    value={addrZip}
                    onChange={(e) => setAddrZip(e.target.value)}
                    className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                  />
                </div>

                <div className="flex items-center gap-2 col-span-2 mt-1">
                  <input
                    type="checkbox"
                    id="addrDefault"
                    checked={addrDefault}
                    onChange={(e) => setAddrDefault(e.target.checked)}
                    className="rounded text-accent-primary focus:ring-accent-primary"
                  />
                  <label
                    htmlFor="addrDefault"
                    className="text-xs text-[var(--text-muted)] font-semibold select-none cursor-pointer"
                  >
                    Set as default address for this customer
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-color pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 py-2 px-5 bg-accent-primary text-white font-bold text-xs rounded-xl hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition"
                >
                  {saving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Save Address"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Contact Dialog Modal */}
      {linkContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
          <div className="bg-card border border-color w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
              <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                Link Contact from Ledger
              </h2>
              <button
                onClick={() => setLinkContactOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleLinkContact}
              className="p-6 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                  Choose Contact *
                </label>
                <select
                  required
                  value={linkContactId}
                  onChange={(e) => setLinkContactId(e.target.value)}
                  className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer animate-[fadeIn_0.1s_ease]"
                >
                  <option value="">Select Contact</option>
                  {contactsDir.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name || ""} (
                      {contact.email || "No email"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                  Role at Customer (e.g. Finance, Buyer)
                </label>
                <input
                  type="text"
                  value={linkRole}
                  onChange={(e) => setLinkRole(e.target.value)}
                  placeholder="e.g. Purchasing Liaison"
                  className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-color pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setLinkContactOpen(false)}
                  className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !linkContactId}
                  className="flex items-center gap-1.5 py-2 px-5 bg-accent-primary text-white font-bold text-xs rounded-xl hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition"
                >
                  {saving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Link Contact"
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
