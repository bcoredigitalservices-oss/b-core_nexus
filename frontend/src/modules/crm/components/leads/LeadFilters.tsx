import React from "react";
import { Search, ChevronDown } from "lucide-react";
import { User } from "../../types/types";

interface LeadFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  ownerFilter: string;
  setOwnerFilter: (o: string) => void;
  sourceFilter: string;
  setSourceFilter: (s: string) => void;
  dateFilter: string;
  setDateFilter: (d: string) => void;
  users: User[];
}

export function LeadFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  ownerFilter,
  setOwnerFilter,
  sourceFilter,
  setSourceFilter,
  dateFilter,
  setDateFilter,
  users,
}: LeadFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-card border border-color p-4 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.015)] animate-[fadeIn_0.25s_ease]">
      {/* Search */}
      <div className="relative flex items-center md:col-span-2">
        <Search size={14} className="absolute left-3.5 text-[var(--text-muted)]" />
        <input
          type="search"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-main border border-color rounded-lg text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
        />
      </div>

      {/* Status */}
      <div className="relative flex items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full bg-main border border-color rounded-lg py-2 px-3 text-xs outline-none focus:border-accent-primary cursor-pointer text-[var(--text-main)] appearance-none"
        >
          <option value="all">All Statuses</option>
          <option value="lead">Lead</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="negotiation">Negotiation</option>
          <option value="won">Won (Deal)</option>
          <option value="lost">Lost</option>
        </select>
        <ChevronDown size={12} className="absolute right-3.5 pointer-events-none text-[var(--text-muted)]" />
      </div>

      {/* Source */}
      <div className="relative flex items-center">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="w-full bg-main border border-color rounded-lg py-2 px-3 text-xs outline-none focus:border-accent-primary cursor-pointer text-[var(--text-main)] appearance-none"
        >
          <option value="all">All Sources</option>
          <option value="Website">Website</option>
          <option value="Email">Email</option>
          <option value="Cold Call">Cold Call</option>
          <option value="Referral">Referral</option>
          <option value="Partner">Partner</option>
          <option value="Other">Other</option>
        </select>
        <ChevronDown size={12} className="absolute right-3.5 pointer-events-none text-[var(--text-muted)]" />
      </div>

      {/* Owner */}
      <div className="relative flex items-center">
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="w-full bg-main border border-color rounded-lg py-2 px-3 text-xs outline-none focus:border-accent-primary cursor-pointer text-[var(--text-main)] appearance-none"
        >
          <option value="all">All Owners</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.first_name} {user.last_name || ""}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-3.5 pointer-events-none text-[var(--text-muted)]" />
      </div>

      {/* Created Date */}
      <div className="relative flex items-center">
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full bg-main border border-color rounded-lg py-2 px-3 text-xs outline-none focus:border-accent-primary cursor-pointer text-[var(--text-main)] appearance-none"
        >
          <option value="all">All Created Dates</option>
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
        <ChevronDown size={12} className="absolute right-3.5 pointer-events-none text-[var(--text-muted)]" />
      </div>
    </div>
  );
}
