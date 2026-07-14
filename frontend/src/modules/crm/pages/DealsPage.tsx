import React, { useState, useMemo } from "react";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";
import { useAppContext } from "../../../context/AppContext";
import { useDeals } from "../hooks/useDeals";
import { Deal } from "../types/types";

// Subcomponents
import { DealHeader } from "../components/deals/DealHeader";
import { DealFilters } from "../components/deals/DealFilters";
import { DealTable } from "../components/deals/DealTable";
import { CreateDealModal } from "../components/deals/CreateDealModal";
import { EditDealModal } from "../components/deals/EditDealModal";
import { DeactivateDealDialog } from "../components/deals/DeactivateDealDialog";
import { Pagination } from "../components/leads/Pagination";
import { Sliders, Loader2 } from "lucide-react";

export default function DealsPage() {
  const { authFetch } = useAppContext();
  
  const {
    deals,
    setDeals,
    customers,
    leads,
    users,
    loading,
    errorMsg,
    setErrorMsg,
    addDealLocally,
  } = useDeals();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [revenueFilter, setRevenueFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("active");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [deactivateDeal, setDeactivateDeal] = useState<Deal | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  // Filtering Logic
  const filteredDeals = useMemo(() => {
    return deals.filter((d: Deal) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!d.deal_name.toLowerCase().includes(q) && !(d.reference_number || "").toLowerCase().includes(q)) {
          return false;
        }
      }

      // 2. Stage Filter
      if (stageFilter !== "all" && d.pipeline_stage !== stageFilter) {
        return false;
      }

      // 3. Expected Revenue (Numeric Filters)
      if (revenueFilter !== "all") {
        const val = d.expected_revenue;
        if (revenueFilter === "10k" && val <= 10000) return false;
        if (revenueFilter === "50k" && val <= 50000) return false;
        if (revenueFilter === "100k" && val <= 100000) return false;
        if (revenueFilter === "500k" && val <= 500000) return false;
      }

      // 4. Owner Filter
      if (ownerFilter !== "all" && d.owner_id !== ownerFilter) {
        return false;
      }

      // 5. Active Status Filter
      if (activeFilter === "active" && !d.is_active) {
        return false;
      }
      if (activeFilter === "inactive" && d.is_active) {
        return false;
      }

      return true;
    });
  }, [deals, searchQuery, stageFilter, revenueFilter, ownerFilter, activeFilter]);

  // Paginated Results
  const paginatedDeals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDeals.slice(start, start + itemsPerPage);
  }, [filteredDeals, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / itemsPerPage));

  const handleEditSuccess = (updated: Deal) => {
    setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateDeal) return;
    setDeactivating(true);
    try {
      await authFetch(`/crm/deals/${deactivateDeal.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: false }),
      });
      setDeals((prev) =>
        prev.map((d) => (d.id === deactivateDeal.id ? { ...d, is_active: false } : d))
      );
      setDeactivateDeal(null);
    } catch (err: any) {
      setErrorMsg("Failed to deactivate opportunity.");
    } finally {
      setDeactivating(false);
    }
  };

  const handleActivate = async (deal: Deal) => {
    setErrorMsg("");
    try {
      await authFetch(`/crm/deals/${deal.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: true }),
      });
      setDeals((prev) =>
        prev.map((d) => (d.id === deal.id ? { ...d, is_active: true } : d))
      );
    } catch (err: any) {
      setErrorMsg("Failed to reactivate opportunity.");
    }
  };

  const handleToggleActiveClick = (deal: Deal) => {
    if (deal.is_active) {
      setDeactivateDeal(deal);
    } else {
      handleActivate(deal);
    }
  };

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto animate-[fadeIn_0.2s_ease]">
        
        <DealHeader
          totalCount={filteredDeals.length}
          onCreateClick={() => setCreateOpen(true)}
        />

        <DealFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          stageFilter={stageFilter}
          setStageFilter={setStageFilter}
          revenueFilter={revenueFilter}
          setRevenueFilter={setRevenueFilter}
          ownerFilter={ownerFilter}
          setOwnerFilter={setOwnerFilter}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
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
            <span className="text-xs text-[var(--text-muted)]">Retrieving Pipeline Opportunities…</span>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl">
            <div className="h-12 w-12 bg-main border border-color rounded-xl flex items-center justify-center text-[var(--text-muted)]">
              <Sliders size={20} />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">No active opportunities</h3>
              <p className="text-xs text-[var(--text-muted)] mt-2 m-0 max-w-[280px] leading-relaxed">
                Try adjusting search query, filters, or convert a lead to initiate an opportunity.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <DealTable
              deals={paginatedDeals}
              users={users}
              customers={customers}
              leads={leads}
              onEditClick={(d) => setEditDeal(d)}
              onToggleActiveClick={handleToggleActiveClick}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <CreateDealModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={addDealLocally}
          users={users}
          customers={customers}
          leads={leads}
          authFetch={authFetch}
        />

        <EditDealModal
          isOpen={!!editDeal}
          onClose={() => setEditDeal(null)}
          onSuccess={handleEditSuccess}
          dealToEdit={editDeal}
          users={users}
          customers={customers}
          leads={leads}
          authFetch={authFetch}
        />

        <DeactivateDealDialog
          isOpen={!!deactivateDeal}
          onClose={() => setDeactivateDeal(null)}
          onConfirm={handleDeactivateConfirm}
          submitting={deactivating}
        />

      </div>
    </WorkspaceLayout>
  );
}
