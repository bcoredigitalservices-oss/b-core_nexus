import React from 'react';
import { Terminal } from 'lucide-react';
import CommandCenter from '../../components/admin/CommandCenter';

export default function EventEngineDashboard() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#00f2fe]/5 to-[#9d4edd]/5 border border-color rounded-2xl py-7 px-8 flex justify-between items-center flex-wrap gap-6 relative overflow-hidden">
        <div className="flex items-center gap-5 z-10">
          <div className="bg-[#00f2fe]/10 border border-[#00f2fe]/20 rounded-xl p-3 flex items-center justify-center">
            <Terminal size={28} className="text-accent-blue" />
          </div>
          <div>
            <h1 className="text-[1.6rem] font-bold text-text-main font-display mb-1">
              Event Engine Control
            </h1>
            <p className="text-text-muted text-[0.875rem]">
              Broadcast events and inspect system message backplanes.
            </p>
          </div>
        </div>
      </div>

      <CommandCenter />
      
      <div className="glass-panel p-6 flex flex-col gap-4 border border-color rounded-xl">
        <h3 className="text-[1.1rem] font-semibold text-text-main">Live Audit Stream & IP Tracking</h3>
        <p className="text-text-muted text-[0.85rem]">
          Real-time event logs and audit streams will display here. IP geolocations and routing headers are tracked automatically.
        </p>
      </div>
    </div>
  );
}
