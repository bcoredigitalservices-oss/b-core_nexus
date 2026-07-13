import React from "react";
import { Building, User as UserIcon } from "lucide-react";

interface LeadOverviewProps {
  title: string;
  setTitle: (t: string) => void;
  companyName: string;
  setCompanyName: (c: string) => void;
  ext: {
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    requestType: string;
    recontactInterval: string;
    leadPotential: string;
    leadType: string;
    phoneExt: string;
    whatsapp: string;
  };
  setExt: React.Dispatch<React.SetStateAction<any>>;
  pipelineStage: string;
  setPipelineStage: (s: string) => void;
  leadSource: string;
  setLeadSource: (s: string) => void;
}

export function LeadOverview({
  title,
  setTitle,
  companyName,
  setCompanyName,
  ext,
  setExt,
  pipelineStage,
  setPipelineStage,
  leadSource,
  setLeadSource,
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
        {/* Deal Title */}
        <div className="flex flex-col gap-1 md:col-span-3">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Deal/Lead Title *
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
            First Name
          </label>
          <input
            type="text"
            value={ext.firstName}
            onChange={(e) => updateExt("firstName", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
          />
        </div>

        {/* Middle Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Middle Name
          </label>
          <input
            type="text"
            value={ext.middleName}
            onChange={(e) => updateExt("middleName", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
          />
        </div>

        {/* Last Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Last Name
          </label>
          <input
            type="text"
            value={ext.lastName}
            onChange={(e) => updateExt("lastName", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Gender
          </label>
          <select
            value={ext.gender}
            onChange={(e) => updateExt("gender", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-Binary">Non-Binary</option>
            <option value="Rather Not Say">Rather Not Say</option>
          </select>
        </div>

        {/* Request Type */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Request Type
          </label>
          <select
            value={ext.requestType}
            onChange={(e) => updateExt("requestType", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
          >
            <option value="Information Request">Information Request</option>
            <option value="Product Demo">Product Demo</option>
            <option value="Quotation Quotation">Quotation Request</option>
            <option value="Support Setup">Support Setup</option>
          </select>
        </div>

        {/* Recontact Interval */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Recontact Interval
          </label>
          <select
            value={ext.recontactInterval}
            onChange={(e) => updateExt("recontactInterval", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
          >
            <option value="Every 3 Days">Every 3 Days</option>
            <option value="Weekly Ping">Weekly Ping</option>
            <option value="Bi-Weekly Audit">Bi-Weekly Audit</option>
            <option value="Monthly Retention">Monthly Retention</option>
          </select>
        </div>

        {/* Pipeline Stage */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Pipeline Status
          </label>
          <select
            value={pipelineStage}
            onChange={(e) => setPipelineStage(e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
          >
            <option value="lead">Lead</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won (Deal)</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {/* Lead Potential */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Lead Potential
          </label>
          <select
            value={ext.leadPotential}
            onChange={(e) => updateExt("leadPotential", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
          >
            <option value="High">High Potential</option>
            <option value="Medium">Medium Potential</option>
            <option value="Low">Low Potential</option>
          </select>
        </div>

        {/* Lead Type */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Lead Type
          </label>
          <select
            value={ext.leadType}
            onChange={(e) => updateExt("leadType", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
          >
            <option value="Client Partner">Client Partner</option>
            <option value="Integrator">Integrator</option>
            <option value="Reseller Channel">Reseller Channel</option>
            <option value="Consumer Direct">Consumer Direct</option>
          </select>
        </div>
      </div>
    </div>
  );
}
