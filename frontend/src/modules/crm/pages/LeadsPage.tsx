import React, { useState, useMemo } from "react";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";

// Hooks
import { useLeads } from "../hooks/useLeads";

// Components
import { LeadHeader } from "../components/leads/LeadHeader";
import { LeadFilters } from "../components/leads/LeadFilters";
import { LeadTable } from "../components/leads/LeadTable";
import { CreateLeadModal } from "../components/leads/CreateLeadModal";
import { EditLeadModal } from "../components/leads/EditLeadModal";
import { DeleteLeadDialog } from "../components/leads/DeleteLeadDialog";
import { ConvertLeadDialog } from "../components/leads/ConvertLeadDialog";
import { Pagination } from "../components/leads/Pagination";
import { EmptyState } from "../components/leads/EmptyState";
import { useAppContext } from "../../../context/AppContext";

export default function LeadsPage() {
  const { authFetch } = useAppContext();
  const {
    leads,
    setLeads,
    contacts,
    users,
    loading,
    errorMsg,
    setErrorMsg,
    addLeadLocally,
    removeLeadLocally,
  } = useLeads();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Modal Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [convertId, setConvertId] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtered Leads Calculation
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search Query Match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = lead.title.toLowerCase().includes(query);
        const matchesCompany = (lead.company_name || "").toLowerCase().includes(query);
        const matchesRef = (lead.reference_number || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany && !matchesRef) return false;
      }

      // 2. Status Match
      if (statusFilter !== "all" && lead.pipeline_stage !== statusFilter) {
        return false;
      }

      // 3. Owner Match
      if (ownerFilter !== "all" && lead.owner_id !== ownerFilter) {
        return false;
      }

      // 4. Source Match
      if (sourceFilter !== "all" && (lead.lead_source || "Website") !== sourceFilter) {
        return false;
      }

      // 5. Date Match
      if (dateFilter !== "all") {
        const leadDate = new Date(lead.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - leadDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (dateFilter === "today" && diffDays > 1) return false;
        if (dateFilter === "7days" && diffDays > 7) return false;
        if (dateFilter === "30days" && diffDays > 30) return false;
      }

      return true;
    });
  }, [leads, searchQuery, statusFilter, ownerFilter, sourceFilter, dateFilter]);

  // Paginated leads
  const paginatedLeads = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / itemsPerPage));

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await authFetch(`/crm/leads/${deleteId}`, { method: "DELETE" });
      removeLeadLocally(deleteId);
      setDeleteId(null);
    } catch (err: any) {
      setErrorMsg("Failed to delete lead profile.");
    } finally {
      setDeleting(false);
    }
  };

  const handleConvertConfirm = async () => {
    if (!convertId) return;
    setConverting(true);
    try {
      await authFetch(`/crm/leads/${convertId}/convert`, { method: "POST" });
      setLeads((prev) =>
        prev.map((l) =>
          l.id === convertId ? { ...l, is_converted: true, pipeline_stage: "converted" } : l
        )
      );
      setConvertId(null);
    } catch (err: any) {
      setErrorMsg("Failed to convert lead profile.");
    } finally {
      setConverting(false);
    }
  };

  const handleEditSuccess = (updated: any) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        <LeadHeader
          totalCount={filteredLeads.length}
          onCreateClick={() => setCreateOpen(true)}
        />

        <LeadFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          ownerFilter={ownerFilter}
          setOwnerFilter={setOwnerFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          users={users}
        />

        {errorMsg && (
          <div className="flex items-center gap-2.5 py-3 px-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs">
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 bg-card border border-color rounded-xl">
            <div className="w-8 h-8 border-3 border-transparent border-t-accent-primary rounded-full animate-spin" />
            <span className="text-xs text-[var(--text-muted)]">Retrieving Leads Data Grid…</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4">
            <LeadTable
              leads={paginatedLeads}
              users={users}
              contacts={contacts}
              onEditClick={(lead) => setEditLead(lead)}
              onDeleteClick={(id) => setDeleteId(id)}
              onConvertClick={(id) => setConvertId(id)}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <CreateLeadModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={addLeadLocally}
          contacts={contacts}
          users={users}
        />

        <EditLeadModal
          isOpen={!!editLead}
          onClose={() => setEditLead(null)}
          onSuccess={handleEditSuccess}
          leadToEdit={editLead}
          users={users}
        />

        <DeleteLeadDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDeleteConfirm}
          submitting={deleting}
        />

        <ConvertLeadDialog
          isOpen={!!convertId}
          onClose={() => setConvertId(null)}
          onConfirm={handleConvertConfirm}
          submitting={converting}
        />
      </div>
    </WorkspaceLayout>
  );
}
