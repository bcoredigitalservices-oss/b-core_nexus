import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
// @ts-ignore
import AppShell from '../layouts/AppShell';
import TierZeroLayout from '../layouts/TierZeroLayout';
import TierOneLayout from '../layouts/TierOneLayout';
// @ts-ignore
import App from '../App';
// @ts-ignore
import Dashboard from '../pages/Dashboard';
// @ts-ignore
import Login from '../pages/Login';
import Onboarding from '../pages/Onboarding';
import SystemAdminDashboard from '../pages/dashboards/SystemAdminDashboard';
import ExecutiveDashboard from '../pages/dashboards/ExecutiveDashboard';
import OrganisationSetup from '../pages/settings/OrganisationSetup';
import ExecutiveHome from '../pages/dashboards/ExecutiveHome';
import Departments from '../pages/iam/Departments';
import Workspaces from '../pages/iam/Workspaces';
import UsersPage from '../pages/iam/Users';
// @ts-ignore
import UniversalDataGrid from '../components/ui/UniversalDataGrid';
import InventoryDashboard from '../pages/workspaces/inventory/InventoryDashboard';
import ItemMaster from '../pages/workspaces/inventory/ItemMaster';
import WarehouseMaster from '../pages/workspaces/inventory/WarehouseMaster';
import StockLedgerPage from '../pages/workspaces/inventory/StockLedger';
import CrmDashboard from '../pages/workspaces/crm/CrmDashboard';
import Customers from '../pages/workspaces/crm/Customers';
import SalesOrders from '../pages/workspaces/crm/SalesOrders';
import PipelineLeads from '../pages/workspaces/crm/PipelineLeads';
import Quotations from '../pages/workspaces/crm/Quotations';
import Contacts from '../pages/workspaces/crm/Contacts';
import TasksToDo from '../pages/workspaces/crm/TasksToDo';
import InteractionHistory from '../pages/workspaces/crm/InteractionHistory';
import Deals from '../pages/workspaces/crm/Deals';
import CallLog from '../pages/workspaces/crm/CallLog';
import FinanceDashboard from '../pages/workspaces/finance/FinanceDashboard';
import ChartOfAccounts from '../pages/workspaces/finance/ChartOfAccounts';
import HrDashboard from '../pages/workspaces/hr/HrDashboard';
import EmployeeDirectory from '../pages/workspaces/hr/EmployeeDirectory';
import OperationsDashboard from '../pages/workspaces/operations/OperationsDashboard';
import ActiveProjects from '../pages/workspaces/operations/ActiveProjects';

// ── AppShellOrTierZero Layout Router Wrapper ──────────────────────────────
export function AppShellOrTierZero() {
  const { currentUser, isBooting, token } = useAppContext();
  
  if (isBooting) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '200px', 
          color: 'var(--text-muted)',
          gap: '1rem'
        }}
      >
        <div className="appshell-boot__spinner" style={{ borderTopColor: 'var(--accent-blue)' }} />
        <span>Loading personal workspace...</span>
      </div>
    );
  }

  if (!token || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.role_tier === 0) {
    return <TierZeroLayout />;
  }
  if (currentUser?.role_tier === 1) {
    return <TierOneLayout />;
  }
  return <AppShell />;
}

// ── RoleBasedIndexRoute Component ──────────────────────────────────────────
export function RoleBasedIndexRoute() {
  const { currentUser, isBooting } = useAppContext();

  // If boot status is loading, render a standard loading panel
  if (isBooting) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '200px', 
          color: 'var(--text-muted)',
          gap: '1rem'
        }}
      >
        <div className="appshell-boot__spinner" style={{ borderTopColor: 'var(--accent-blue)' }} />
        <span>Loading personal workspace...</span>
      </div>
    );
  }

  // Redirect logic based on structural tier:
  // Tier 0 -> System Admin
  // Tier 1 -> Executive Boardroom
  // Other -> Default generic dashboard
  const tier = currentUser?.role_tier;
  if (tier === 0) {
    return <SystemAdminDashboard />;
  } else if (tier === 1) {
    return <ExecutiveHome />;
  } else {
    return <Dashboard />;
  }
}

// ── AppRouter Component ────────────────────────────────────────────────────
export default function AppRouter() {
  return (
    <Routes>
      {/* ── Standalone pages (no shell) ──────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/onboard" element={<Onboarding />} />

      {/* ── Authenticated Shell ───────────────────────── */}
      <Route path="/" element={<AppShellOrTierZero />}>
        {/* Default index: role-based dashboard landing */}
        <Route index element={<RoleBasedIndexRoute />} />

        {/* Workspace Launcher */}
        <Route path="workspace" element={<ExecutiveHome />} />
        <Route 
          path="workspace/spedex"  
          element={
            <UniversalDataGrid 
              endpointUrl="/api/v1/directory" 
              title="SpedEx Cold Chain Logistics Hub"
              columns={[
                { key: 'name', label: 'Hub Station', sortable: true },
                { key: 'email', label: 'Dispatch Control', sortable: true },
                { key: 'phone', label: 'Secure Comms' },
                { key: 'is_active', label: 'Active Status', sortable: true }
              ]} 
            />
          } 
        />
        <Route 
          path="workspace/fleet"  
          element={
            <UniversalDataGrid 
              endpointUrl="/api/v1/events" 
              title="B-Core Motion Fleet Operations"
              columns={[
                { key: 'created_at', label: 'Last Telemetry Ping', sortable: true },
                { key: 'entity_type', label: 'Asset Class', sortable: true },
                { key: 'event_type', label: 'Vehicle Alert Status', sortable: true },
                { key: 'created_by', label: 'Operator Signed' }
              ]} 
            />
          } 
        />

        {/* Core module routes (outlets render inside AppShell / TierOneLayout) */}
        <Route path="directory" element={<UsersPage />} />
        <Route 
          path="catalog"    
          element={
            <UniversalDataGrid 
              endpointUrl="/api/v1/catalog" 
              title="Universal Catalog"
              columns={[
                { key: 'sku', label: 'SKU', sortable: true },
                { key: 'title', label: 'Title', sortable: true },
                { key: 'is_active', label: 'Active', sortable: true }
              ]} 
            />
          } 
        />
        <Route 
          path="events"     
          element={
            <UniversalDataGrid 
              endpointUrl="/api/v1/events" 
              title="Event History"
              columns={[
                { key: 'created_at', label: 'Timestamp', sortable: true },
                { key: 'entity_type', label: 'Entity Type', sortable: true },
                { key: 'event_type', label: 'Event Type', sortable: true },
                { key: 'entity_id', label: 'Entity ID' },
                { key: 'created_by', label: 'Created By' }
              ]} 
            />
          } 
        />
        <Route 
          path="customers"  
          element={
            <UniversalDataGrid 
              endpointUrl="/api/v1/directory" 
              title="Customers Ledger"
              columns={[
                { key: 'name', label: 'Customer Name', sortable: true },
                { key: 'email', label: 'Email', sortable: true },
                { key: 'phone', label: 'Phone' },
                { key: 'is_active', label: 'Status', sortable: true }
              ]} 
            />
          } 
        />
        <Route path="departments" element={<Departments />} />
        <Route path="workspaces" element={<Workspaces />} />

        {/* ── Pluggable Workspace Routes ────────────── */}
        <Route path="workspaces/inventory" element={<InventoryDashboard />} />
        <Route path="workspaces/inventory/items" element={<ItemMaster />} />
        <Route path="workspaces/inventory/warehouses" element={<WarehouseMaster />} />
        <Route path="workspaces/inventory/stock-ledger" element={<StockLedgerPage />} />
        <Route path="workspaces/crm" element={<CrmDashboard />} />
        <Route path="workspaces/crm/pipeline" element={<PipelineLeads />} />
        <Route path="workspaces/crm/customers" element={<Customers />} />
        <Route path="workspaces/crm/sales-orders" element={<SalesOrders />} />
        <Route path="workspaces/crm/quotations" element={<Quotations />} />
        <Route path="workspaces/crm/contacts" element={<Contacts />} />
        <Route path="workspaces/crm/deals" element={<Deals />} />
        <Route path="workspaces/crm/call-log" element={<CallLog />} />
        <Route path="workspaces/crm/tasks" element={<TasksToDo />} />
        <Route path="workspaces/crm/interactions" element={<InteractionHistory />} />
        <Route path="workspaces/finance" element={<FinanceDashboard />} />
        <Route path="workspaces/finance/accounts" element={<ChartOfAccounts />} />
        <Route path="workspaces/hr" element={<HrDashboard />} />
        <Route path="workspaces/hr/employees" element={<EmployeeDirectory />} />
        <Route path="workspaces/operations" element={<OperationsDashboard />} />
        <Route path="workspaces/operations/projects" element={<ActiveProjects />} />

        <Route 
          path="routes"  
          element={
            <UniversalDataGrid 
              endpointUrl="/api/v1/directory" 
              title="Cold Chain Dispatch Routes"
              columns={[
                { key: 'name', label: 'Route Corridor', sortable: true },
                { key: 'email', label: 'Dispatch Lead', sortable: true },
                { key: 'phone', label: 'Secure Comms' },
                { key: 'is_active', label: 'Route Status', sortable: true }
              ]} 
            />
          } 
        />
        <Route 
          path="maintenance"  
          element={
            <UniversalDataGrid 
              endpointUrl="/api/v1/events" 
              title="Preventative Maintenance Logs"
              columns={[
                { key: 'created_at', label: 'Scheduled / Logged At', sortable: true },
                { key: 'entity_type', label: 'Asset Class', sortable: true },
                { key: 'event_type', label: 'Maintenance Task', sortable: true },
                { key: 'created_by', label: 'Technician Signed' }
              ]} 
            />
          } 
        />
        <Route path="root"       element={<SystemAdminDashboard />} />
        <Route path="executive"  element={<ExecutiveDashboard />} />

        {/* Settings */}
        <Route path="settings/profile" element={<Dashboard />} />
        <Route path="settings/org"     element={<OrganisationSetup />} />
        <Route path="settings/config"  element={<SystemAdminDashboard />} />

        {/* Catch-all: redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
