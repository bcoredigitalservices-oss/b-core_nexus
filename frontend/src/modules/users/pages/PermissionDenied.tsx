import React from 'react';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PermissionDeniedProps {
  moduleName?: string;
  requiredPermission?: string;
}

export default function PermissionDenied({ moduleName, requiredPermission }: PermissionDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] py-16 px-6 text-center animate-[fadeIn_0.2s_ease]">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-sm">
        <ShieldOff size={28} className="text-red-400" />
      </div>

      <h2 className="text-xl font-bold text-text-main mb-2">Access Restricted</h2>

      <p className="text-text-muted text-[0.88rem] max-w-[460px] leading-relaxed mb-2">
        Your current clearance profile does not include access to
        {moduleName ? <strong className="text-text-main"> {moduleName}</strong> : ' this module'}.
      </p>

      {requiredPermission && (
        <p className="text-[0.78rem] text-text-muted mb-6">
          Required permission:{' '}
          <code className="bg-card border border-color text-accent-primary px-2 py-0.5 rounded font-mono text-[0.75rem]">
            {requiredPermission}
          </code>
        </p>
      )}

      {!requiredPermission && <div className="mb-6" />}

      <p className="text-[0.78rem] text-text-muted max-w-[380px] leading-relaxed mb-8 bg-amber-500/5 border border-amber-500/15 rounded-xl py-3 px-4">
        Contact your <strong className="text-amber-400">System Administrator</strong> to request the required clearance for this workspace module.
      </p>

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 py-2 px-5 bg-card border border-color rounded-xl text-text-muted text-sm font-semibold cursor-pointer hover:text-text-main hover:bg-card-hover transition"
      >
        <ArrowLeft size={15} />
        Go Back
      </button>
    </div>
  );
}
