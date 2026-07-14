import React from "react";
import { Search, FileText, Sliders } from "lucide-react";
import { User } from "../../types/types";

interface CustomerFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  termsFilter: string;
  setTermsFilter: (t: string) => void;
  ownerFilter: string;
  setOwnerFilter: (o: string) => void;
  users: User[];
}

export function CustomerFilters({
  searchQuery,
  setSearchQuery,
  termsFilter,
  setTermsFilter,
  ownerFilter,
  setOwnerFilter,
  users,
}: CustomerFiltersProps) {
  const paymentTermsList = ["Net 30", "Net 60", "Immediate", "COD", "Due on Receipt"];

  return (
    <div className="bg-card border border-color rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-[var(--text-muted)]" size={14} />
          <input
            type="text"
            placeholder="Search company, reference, tax ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] transition"
          />
        </div>

        {/* Payment Terms Filter */}
        <div className="relative flex items-center">
          <FileText className="absolute left-3 text-[var(--text-muted)]" size={14} />
          <select
            value={termsFilter}
            onChange={(e) => setTermsFilter(e.target.value)}
            className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer appearance-none transition"
          >
            <option value="all">All Payment Terms</option>
            {paymentTermsList.map((term) => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
        </div>

        {/* Owner Filter */}
        <div className="relative flex items-center">
          <Sliders className="absolute left-3 text-[var(--text-muted)]" size={14} />
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer appearance-none transition"
          >
            <option value="all">All Owners</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.first_name} {u.last_name || ""}
              </option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
}
