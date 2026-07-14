import React from "react";
import { Search, DollarSign, Sliders, Briefcase, Power } from "lucide-react";
import { User } from "../../types/types";

interface DealFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  stageFilter: string;
  setStageFilter: (s: string) => void;
  revenueFilter: string;
  setRevenueFilter: (r: string) => void;
  ownerFilter: string;
  setOwnerFilter: (o: string) => void;
  activeFilter: string;
  setActiveFilter: (a: string) => void;
  users: User[];
}

export function DealFilters({
  searchQuery,
  setSearchQuery,
  stageFilter,
  setStageFilter,
  revenueFilter,
  setRevenueFilter,
  ownerFilter,
  setOwnerFilter,
  activeFilter,
  setActiveFilter,
  users,
}: DealFiltersProps) {
  const stages = [
    { value: "discovery", label: "Discovery" },
    { value: "mature", label: "Mature" },
    { value: "negotiation", label: "Negotiation" },
    { value: "won", label: "Closed Won" },
    { value: "lost", label: "Closed Lost" },
  ];

  return (
    <div className="bg-card border border-color rounded-2xl p-5 shadow-sm flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-[var(--text-muted)]" size={14} />
          <input
            type="text"
            placeholder="Search opportunity name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] transition"
          />
        </div>

        {/* Pipeline Stage Filter */}
        <div className="relative flex items-center">
          <Briefcase className="absolute left-3 text-[var(--text-muted)]" size={14} />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer appearance-none transition"
          >
            <option value="all">All Stages</option>
            {stages.map((st) => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </div>

        {/* Expected Revenue Size Filter */}
        <div className="relative flex items-center">
          <DollarSign className="absolute left-3 text-[var(--text-muted)]" size={14} />
          <select
            value={revenueFilter}
            onChange={(e) => setRevenueFilter(e.target.value)}
            className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer appearance-none transition"
          >
            <option value="all">Any Expected Value</option>
            <option value="10k">&gt; $10,000</option>
            <option value="50k">&gt; $50,000</option>
            <option value="100k">&gt; $100,000</option>
            <option value="500k">&gt; $500,000</option>
          </select>
        </div>

        {/* Active Status Filter */}
        <div className="relative flex items-center">
          <Power className="absolute left-3 text-[var(--text-muted)]" size={14} />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer appearance-none transition"
          >
            <option value="active">Active Opportunities</option>
            <option value="inactive">Inactive Opportunities</option>
            <option value="all">All Opportunities</option>
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

