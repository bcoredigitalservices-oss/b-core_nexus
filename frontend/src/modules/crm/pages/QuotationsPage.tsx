import React, { useState, useMemo } from "react";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";
import { useAppContext } from "../../../context/AppContext";
import { useQuotations } from "../hooks/useQuotations";
import { Quotation } from "../types/types";

// Subcomponents
import { QuotationHeader } from "../components/quotations/QuotationHeader";
import { QuotationFilters } from "../components/quotations/QuotationFilters";
import { QuotationTable } from "../components/quotations/QuotationTable";
import { CreateQuotationModal } from "../components/quotations/CreateQuotationModal";
import { EditQuotationModal } from "../components/quotations/EditQuotationModal";
import { Pagination } from "../components/leads/Pagination";
import { Sliders, Loader2, CheckCircle } from "lucide-react";

export default function QuotationsPage() {
  const { authFetch } = useAppContext();
  
  const {
    quotations,
    setQuotations,
    customers,
    users,
    loading,
    errorMsg,
    setErrorMsg,
    addQuotationLocally,
  } = useQuotations();

  const [successMsg, setSuccessMsg] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);

  // Convert Quotation to Sales Order
  const handleConvertQuotation = async (id: string) => {
    setConvertingId(id);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await authFetch(`/sales/quotations/${id}/convert-to-order`, {
        method: "POST",
      });

      setSuccessMsg("Quotation successfully converted to active Sales Order!");
      
      // Update status locally to accepted
      setQuotations((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: "accepted" } : q))
      );

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to convert quotation to order.");
    } finally {
      setConvertingId(null);
    }
  };

  // Filtering Logic
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q: Quotation) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = (q.reference_number || "").toLowerCase().includes(query);
        const matchesNum = q.quotation_number.toLowerCase().includes(query);
        if (!matchesRef && !matchesNum) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "all" && q.status.toLowerCase() !== statusFilter) {
        return false;
      }

      // 3. Customer Filter
      if (customerFilter !== "all" && q.customer_id !== customerFilter) {
        return false;
      }

      return true;
    });
  }, [quotations, searchQuery, statusFilter, customerFilter]);

  // Paginated Results
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuotations.slice(start, start + itemsPerPage);
  }, [filteredQuotations, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / itemsPerPage));

  const handleEditSuccess = (updated: Quotation) => {
    setQuotations((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto animate-[fadeIn_0.2s_ease]">
        
        <QuotationHeader
          totalCount={filteredQuotations.length}
          onCreateClick={() => setCreateOpen(true)}
        />

        <QuotationFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          customerFilter={customerFilter}
          setCustomerFilter={setCustomerFilter}
          customers={customers}
        />

        {successMsg && (
          <div className="flex items-center gap-2 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-xs font-semibold animate-[fadeIn_0.2s_ease]">
            <CheckCircle size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="py-2.5 px-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 bg-card border border-color rounded-2xl">
            <Loader2 className="animate-spin text-accent-primary" size={32} />
            <span className="text-xs text-[var(--text-muted)]">Retrieving Quotations Dashboard…</span>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl">
            <div className="h-12 w-12 bg-main border border-color rounded-xl flex items-center justify-center text-[var(--text-muted)]">
              <Sliders size={20} />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">No quotations found</h3>
              <p className="text-xs text-[var(--text-muted)] mt-2 m-0 max-w-[280px] leading-relaxed">
                Adjust search filter inputs or write a new proposal for your customers.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <QuotationTable
              quotations={paginatedQuotations}
              customers={customers}
              users={users}
              onEditClick={(q) => setEditQuotation(q)}
              onConvertClick={handleConvertQuotation}
              convertingId={convertingId}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <CreateQuotationModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={addQuotationLocally}
          users={users}
          customers={customers}
          authFetch={authFetch}
        />

        <EditQuotationModal
          isOpen={!!editQuotation}
          onClose={() => setEditQuotation(null)}
          onSuccess={handleEditSuccess}
          quotationToEdit={editQuotation}
          users={users}
          customers={customers}
          authFetch={authFetch}
        />

      </div>
    </WorkspaceLayout>
  );
}
