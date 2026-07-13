import React, { useState, useMemo } from "react";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";
import { useAppContext } from "../../../context/AppContext";
import { useSalesOrders } from "../hooks/useSalesOrders";
import { SalesOrder } from "../types/types";

// Subcomponents
import { SalesOrderHeader } from "../components/sales_orders/SalesOrderHeader";
import { SalesOrderFilters } from "../components/sales_orders/SalesOrderFilters";
import { SalesOrderTable } from "../components/sales_orders/SalesOrderTable";
import { EditSalesOrderModal } from "../components/sales_orders/EditSalesOrderModal";
import { CreateSalesOrderModal } from "../components/sales_orders/CreateSalesOrderModal";
import { Pagination } from "../components/leads/Pagination";
import { Sliders, Loader2 } from "lucide-react";

export default function SalesOrdersPage() {
  const { authFetch } = useAppContext();
  
  const {
    salesOrders,
    setSalesOrders,
    customers,
    users,
    loading,
    errorMsg,
    setErrorMsg,
  } = useSalesOrders();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog States
  const [editOrder, setEditOrder] = useState<SalesOrder | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return salesOrders.filter((o: SalesOrder) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = (o.reference_number || "").toLowerCase().includes(query);
        const matchesNum = o.order_number.toLowerCase().includes(query);
        if (!matchesRef && !matchesNum) return false;
      }

      // 2. Status Filter
      if (statusFilter !== "all" && o.status.toLowerCase() !== statusFilter) {
        return false;
      }

      // 3. Customer Filter
      if (customerFilter !== "all" && o.customer_id !== customerFilter) {
        return false;
      }

      return true;
    });
  }, [salesOrders, searchQuery, statusFilter, customerFilter]);

  // Paginated Results
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));

  const handleEditSuccess = (updated: SalesOrder) => {
    setSalesOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleCreateSuccess = (newOrder: SalesOrder) => {
    setSalesOrders((prev) => [newOrder, ...prev]);
  };

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto animate-[fadeIn_0.2s_ease]">
        
        <SalesOrderHeader 
          totalCount={filteredOrders.length} 
          onCreateClick={() => setCreateModalOpen(true)}
        />

        <SalesOrderFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          customerFilter={customerFilter}
          setCustomerFilter={setCustomerFilter}
          customers={customers}
        />

        {errorMsg && (
          <div className="py-2.5 px-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 bg-card border border-color rounded-2xl">
            <Loader2 className="animate-spin text-accent-primary" size={32} />
            <span className="text-xs text-[var(--text-muted)]">Retrieving Sales Orders…</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl">
            <div className="h-12 w-12 bg-main border border-color rounded-xl flex items-center justify-center text-[var(--text-muted)]">
              <Sliders size={20} />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">No sales orders found</h3>
              <p className="text-xs text-[var(--text-muted)] mt-2 m-0 max-w-[280px] leading-relaxed">
                Convert an accepted quotation to generate a Sales Order.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SalesOrderTable
              salesOrders={paginatedOrders}
              customers={customers}
              users={users}
              onEditClick={(o) => setEditOrder(o)}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Edit Modal */}
        <EditSalesOrderModal
          isOpen={!!editOrder}
          onClose={() => setEditOrder(null)}
          onSuccess={handleEditSuccess}
          orderToEdit={editOrder}
          customers={customers}
          authFetch={authFetch}
        />

        {/* Create Modal */}
        <CreateSalesOrderModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          customers={customers}
          authFetch={authFetch}
        />

      </div>
    </WorkspaceLayout>
  );
}
