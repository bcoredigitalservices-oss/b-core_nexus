import React from "react";
import { Globe, Phone, Mail } from "lucide-react";

interface LeadContactsProps {
  email: string;
  setEmail: (e: string) => void;
  phone: string;
  setPhone: (p: string) => void;
  ext: {
    phoneExt: string;
    whatsapp: string;
    website: string;
  };
  setExt: React.Dispatch<React.SetStateAction<any>>;
}

export function LeadContacts({
  email,
  setEmail,
  phone,
  setPhone,
  ext,
  setExt,
}: LeadContactsProps) {
  const updateExt = (key: string, value: string) => {
    setExt((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-color pb-3">
        <Mail className="text-accent-primary" size={16} />
        <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
          Contact Details & Organisation
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email Address */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail size={13} className="absolute left-3 text-[var(--text-muted)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
            />
          </div>
        </div>

        {/* Primary Phone */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Primary Phone
          </label>
          <div className="relative flex items-center">
            <Phone size={13} className="absolute left-3 text-[var(--text-muted)]" />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
            />
          </div>
        </div>

        {/* Phone Extension */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Phone Extension (Ext)
          </label>
          <input
            type="text"
            value={ext.phoneExt}
            onChange={(e) => updateExt("phoneExt", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
          />
        </div>

        {/* WhatsApp Mobile */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            WhatsApp Mobile
          </label>
          <input
            type="text"
            value={ext.whatsapp}
            onChange={(e) => updateExt("whatsapp", e.target.value)}
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
          />
        </div>

        {/* Job Title */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Job Title
          </label>
          <input
            type="text"
            value={ext.jobTitle || ""}
            onChange={(e) => updateExt("jobTitle", e.target.value)}
            placeholder="e.g. Purchase Manager"
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
          />
        </div>

        {/* Department */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Department
          </label>
          <input
            type="text"
            value={ext.department || ""}
            onChange={(e) => updateExt("department", e.target.value)}
            placeholder="e.g. Procurement"
            className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
          />
        </div>

        {/* Website URL */}
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
            Website URL
          </label>
          <div className="relative flex items-center">
            <Globe size={13} className="absolute left-3 text-[var(--text-muted)]" />
            <input
              type="text"
              value={ext.website}
              onChange={(e) => updateExt("website", e.target.value)}
              className="w-full rounded-lg border border-color bg-main py-2 pl-9 pr-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
