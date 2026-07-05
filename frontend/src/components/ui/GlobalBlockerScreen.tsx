import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface GlobalBlockerScreenProps {
  message: string;
}

export default function GlobalBlockerScreen({ message }: GlobalBlockerScreenProps) {
  return (
    <div className="fixed inset-0 bg-[#120202]/95 backdrop-blur-[12px] z-[9999] flex flex-col items-center justify-center text-white font-sans p-8 text-center overflow-hidden">
      <style>{`
        @keyframes pulse-neon {
          0% {
            transform: scale(1);
            filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.6));
          }
          50% {
            transform: scale(1.08);
            filter: drop-shadow(0 0 25px rgba(239, 68, 68, 0.9));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.6));
          }
        }
        .neon-warning-icon {
          animation: pulse-neon 2s infinite ease-in-out;
        }
      `}</style>
      
      <div className="flex flex-col items-center max-w-[600px] gap-6">
        <div className="neon-warning-icon text-red-500 bg-red-500/10 border-2 border-red-500 rounded-full p-6 inline-flex items-center justify-center mb-4">
          <ShieldAlert size={64} />
        </div>
        
        <h1 className="text-[2.5rem] font-extrabold tracking-tight m-0 uppercase text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)] font-display">
          System Lockdown
        </h1>
        
        <div className="bg-white/3 border border-red-500/20 rounded-xl py-6 px-8 w-full box-border">
          <p className="text-[1.15rem] leading-relaxed m-0 text-red-400 font-medium">
            {message || 'An emergency system-wide broadcast has locked active nodes.'}
          </p>
        </div>
        
        <p className="text-gray-400/80 text-[0.875rem] mt-4">
          All operations are temporarily suspended. Please contact your Tier 0 Administrator for resolution details.
        </p>
      </div>
    </div>
  );
}
