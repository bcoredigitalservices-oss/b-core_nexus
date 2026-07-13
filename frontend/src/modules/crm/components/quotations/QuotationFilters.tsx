import React from "react";
import { Search, Sliders, Briefcase, Building } from "lucide-react";
import { Customer } from "../../types/types";

interface QuotationFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  customerFilter: string;
  setCustomerFilter: (c: string) => void;
  customers: Customer[];
}

export function QuotationFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  customerFilter,
  setCustomerFilter,
  customers,
}: QuotationFiltersProps) {
  const statuses = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "accepted", label: "Accepted" },
    { value: "declined", label: "Declined" },
    { value: "expired", label: "Expired" },
  ];

  return (
    <div className="bg-card border border-color rounded-2xl p-5 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-[var(--text-muted)]" size={14} />
          <input
            type="text"
            placeholder="Search quotation number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] transition"
          />
        </div>

        {/* Status Filter */}
        <div className="relative flex items-center">
          <Briefcase className="absolute left-3 text-[var(--text-muted)]" size={14} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer appearance-none transition"
          >
            <option value="all">All Statuses</option>
            {statuses.map((st) => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </div>

        {/* Customer Filter */}
        <div className="relative flex items-center">
          <Building className="absolute left-3 text-[var(--text-muted)]" size={14} />
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer appearance-none transition"
          >
            <option value="all">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
}
