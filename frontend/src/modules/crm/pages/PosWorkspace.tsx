import React from 'react';
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";

export default function PosWorkspace() {
  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="p-6 bg-card border border-color rounded-2xl max-w-[1200px] mx-auto mt-6">
        <h1 className="text-xl font-bold text-[var(--text-main)]">POS Workspace Module</h1>
        <p className="text-[var(--text-muted)] mt-2 text-xs">
          This module is queued for rebuild under the new string-based Roles & Permissions system.
        </p>
      </div>
    </WorkspaceLayout>
  );
}
