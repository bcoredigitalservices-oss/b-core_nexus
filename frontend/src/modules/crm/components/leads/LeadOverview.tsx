import React from "react";
import { User as UserIcon } from "lucide-react";

interface LeadOverviewProps {
  title: string;
  setTitle: (t: string) => void;
  companyName: string;
  setCompanyName: (c: string) => void;
  leadType: "person" | "company";
  setLeadType: (t: "person" | "company") => void;
  pipelineStage: string;
  setPipelineStage: (s: string) => void;
  leadSource: string;
  setLeadSource: (s: string) => void;
  priority: string;
  setPriority: (p: string) => void;
  ext: {
    firstName: string;
    lastName: string;
  };
  setExt: React.Dispatch<React.SetStateAction<any>>;
}

export function LeadOverview({
  title,
  setTitle,
  companyName,
  setCompanyName,
  leadType,
  setLeadType,
  pipelineStage,
  setPipelineStage,
  leadSource,
  setLeadSource,
  priority,
  setPriority,
  ext,
  setExt,
}: LeadOverviewProps) {
  const updateExt = (key: string, value: string) => {
    setExt((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center gap-2 border-b border-color pb-3">
        <UserIcon className="text-accent-primary" size={16} />
        <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
          General Specifications
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lead Title */}
        <div className="flex flex-col gap-1 md:col-span-3">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Lead Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] font-semibold"
          />
        </div>

        {/* First Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Primary Contact First Name
          </label>
          <input
            type="text"
            value={ext.firstName}
            onChange={(e) => updateExt("firstName", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] font-semibold"
          />
        </div>

        {/* Last Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Primary Contact Last Name
          </label>
          <input
            type="text"
            value={ext.lastName}
            onChange={(e) => updateExt("lastName", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] font-semibold"
          />
        </div>

        {/* Lead Type */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Lead Type
          </label>
          <select
            value={leadType}
            onChange={(e) => setLeadType(e.target.value as "person" | "company")}
            className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer font-semibold"
          >
            <option value="person">Individual (Person)</option>
            <option value="company">Organization (Company)</option>
          </select>
        </div>

        {/* Company Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Company Name
          </label>
          <input
            type="text"
            disabled={leadType !== "company"}
            placeholder={leadType !== "company" ? "N/A (Individual Lead)" : "e.g. Acme Corp"}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] disabled:opacity-50 font-semibold"
          />
        </div>

        {/* Lead Source */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Lead Source
          </label>
          <select
            value={leadSource}
            onChange={(e) => setLeadSource(e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer font-semibold"
          >
            <option value="Website">Website</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Referral">Referral</option>
            <option value="Trade Show">Trade Show</option>
            <option value="Partner">Partner</option>
            <option value="Email Campaign">Email Campaign</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer font-semibold"
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>
        </div>

        {/* Pipeline Stage */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Pipeline Stage
          </label>
          <select
            value={pipelineStage}
            onChange={(e) => setPipelineStage(e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer font-semibold"
          >
            <option value="lead">Lead</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won (Converted)</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>
    </div>
  );
}
