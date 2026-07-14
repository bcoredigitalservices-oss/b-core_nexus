import React, { useState, useMemo } from "react";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";
import { useAppContext } from "../../../context/AppContext";
import { useCustomers } from "../hooks/useCustomers";
import { Customer } from "../types/types";

// Extracted Subcomponents
import { CustomerHeader } from "../components/customers/CustomerHeader";
import { CustomerFilters } from "../components/customers/CustomerFilters";
import { CustomerTable } from "../components/customers/CustomerTable";
import { CreateCustomerModal } from "../components/customers/CreateCustomerModal";
import { EditCustomerModal } from "../components/customers/EditCustomerModal";
import { Pagination } from "../components/leads/Pagination";
import { Sliders, Loader2 } from "lucide-react";

export default function CustomersPage() {
  const { authFetch } = useAppContext();
  
  const {
    customers,
    setCustomers,
    users,
    loading,
    errorMsg,
    setErrorMsg,
    addCustomerLocally,
  } = useCustomers();
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [termsFilter, setTermsFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  // Filtering Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((c: Customer) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.company_name.toLowerCase().includes(q);
        const matchesRef = c.reference_number.toLowerCase().includes(q);
        const matchesTax = (c.tax_id || "").toLowerCase().includes(q);
        if (!matchesName && !matchesRef && !matchesTax) return false;
      }
      
      // 2. Payment Terms
      if (termsFilter !== "all" && c.payment_terms !== termsFilter) return false;

      // 3. Assigned Owner
      if (ownerFilter !== "all" && c.owner_id !== ownerFilter) return false;

      return true;
    });
  }, [customers, searchQuery, termsFilter, ownerFilter]);

  // Pagination bounds
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));

  const handleEditSuccess = (updated: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto animate-[fadeIn_0.2s_ease]">
        
        <CustomerHeader
          totalCount={filteredCustomers.length}
          onCreateClick={() => setCreateOpen(true)}
        />

        <CustomerFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          termsFilter={termsFilter}
          setTermsFilter={setTermsFilter}
          ownerFilter={ownerFilter}
          setOwnerFilter={setOwnerFilter}
          users={users}
        />

        {errorMsg && (
          <div className="py-2.5 px-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 bg-card border border-color rounded-2xl">
            <Loader2 className="animate-spin text-accent-primary" size={32} />
            <span className="text-xs text-[var(--text-muted)]">Retrieving Customers Directory…</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl">
            <div className="h-12 w-12 bg-main border border-color rounded-xl flex items-center justify-center text-[var(--text-muted)]">
              <Sliders size={20} />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">No customers registered</h3>
              <p className="text-xs text-[var(--text-muted)] mt-2 m-0 max-w-[280px] leading-relaxed">
                Adjust filter configurations or convert an active pipeline lead.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <CustomerTable
              customers={paginatedCustomers}
              users={users}
              onEditClick={(c) => setEditCustomer(c)}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <CreateCustomerModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={addCustomerLocally}
          users={users}
          authFetch={authFetch}
        />

        <EditCustomerModal
          isOpen={!!editCustomer}
          onClose={() => setEditCustomer(null)}
          onSuccess={handleEditSuccess}
          customerToEdit={editCustomer}
          users={users}
          authFetch={authFetch}
        />

      </div>
    </WorkspaceLayout>
  );
}
