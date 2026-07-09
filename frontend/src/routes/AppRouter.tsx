import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import AppShell from '../layouts/AppShell';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Onboarding from '../pages/Onboarding';
import SystemAdminDashboard from '../pages/dashboards/SystemAdminDashboard';
import ExecutiveDashboard from '../pages/dashboards/ExecutiveDashboard';
import UsersDashboard from '../pages/dashboards/UsersDashboard';
import CatalogDashboard from '../pages/dashboards/CatalogDashboard';
import EventEngineDashboard from '../pages/dashboards/EventEngineDashboard';
import SystemSettingsDashboard from '../pages/settings/SystemSettingsDashboard';
import OrganisationSetup from '../pages/settings/OrganisationSetup';
import MyProfileSettings from '../pages/settings/MyProfileSettings';
import ExecutiveHome from '../pages/dashboards/ExecutiveHome';
import AppLauncher from '../pages/dashboards/AppLauncher';
import UserHomeDashboard from '../pages/dashboards/UserHomeDashboard';
import Departments from '../pages/iam/Departments';
import Workspaces from '../pages/iam/Workspaces';
import UsersPage from '../pages/iam/Users';
import UserDetails from '../pages/iam/UserDetails';
import UniversalDataGrid from '../components/ui/UniversalDataGrid';
import InventoryDashboard from '../pages/workspaces/inventory/InventoryDashboard';
import ItemsWorkspace from '../pages/workspaces/inventory/ItemsWorkspace';
import ItemGroupWorkspace from '../pages/workspaces/inventory/ItemGroupWorkspace';
import ProductBundleWorkspace from '../pages/workspaces/inventory/ProductBundleWorkspace';
import ShippingRuleWorkspace from '../pages/workspaces/inventory/ShippingRuleWorkspace';
import ItemAlternativeWorkspace from '../pages/workspaces/inventory/ItemAlternativeWorkspace';
import ItemManufacturerWorkspace from '../pages/workspaces/inventory/ItemManufacturerWorkspace';
import ItemMaster from '../pages/workspaces/inventory/ItemMaster';
import ItemForm from '../pages/workspaces/inventory/ItemForm';
import WarehouseMaster from '../pages/workspaces/inventory/WarehouseMaster';
import StockLedgerPage from '../pages/workspaces/inventory/StockLedger';
import InventoryHub from '../pages/workspaces/InventoryHub';
import AssetsWorkspace from '../pages/workspaces/inventory/AssetsWorkspace';
import ProductsWorkspace from '../pages/workspaces/inventory/ProductsWorkspace';
import WarehouseWorkspace from '../pages/workspaces/inventory/WarehouseWorkspace';
import StockWorkspace from '../pages/workspaces/inventory/StockWorkspace';
import StockEntryForm from '../pages/workspaces/inventory/StockEntryForm';
import StockEntryList from '../pages/workspaces/inventory/StockEntryList';
import DeliveryNoteList from '../pages/workspaces/inventory/DeliveryNoteList';
import PickListPage from '../pages/workspaces/inventory/PickListPage';
import DeliveryNoteForm from '../pages/workspaces/inventory/DeliveryNoteForm';
import PickListForm from '../pages/workspaces/inventory/PickListForm';
import SerialNoWorkspace from '../pages/workspaces/inventory/SerialNoWorkspace';
import BatchWorkspace from '../pages/workspaces/inventory/BatchWorkspace';
import StockProjectedQty from '../pages/workspaces/inventory/StockProjectedQty';
import StockAgeing from '../pages/workspaces/inventory/StockAgeing';
import InventorySettings from '../pages/workspaces/inventory/InventorySettings';
import UOMWorkspace from '../pages/workspaces/inventory/UOMWorkspace';
import BuyingWorkspace from '../pages/workspaces/inventory/BuyingWorkspace';
import PurchaseAnalytics from '../pages/workspaces/inventory/PurchaseAnalytics';
import ProcurementModuleWorkspace from '../pages/workspaces/inventory/ProcurementModuleWorkspace';
import PosWorkspace from '../pages/workspaces/crm/PosWorkspace';
import SupportWorkspace from '../pages/workspaces/crm/SupportWorkspace';
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
import Invoicing from '../pages/workspaces/finance/Invoicing';
import Payments from '../pages/workspaces/finance/Payments';
import Banking from '../pages/workspaces/finance/Banking';
import Taxes from '../pages/workspaces/finance/Taxes';
import ReportsView from '../pages/workspaces/finance/ReportsView';
import Budget from '../pages/workspaces/finance/Budget';
import ShareManagement from '../pages/workspaces/finance/ShareManagement';
import HrDashboard from '../pages/workspaces/hr/HrDashboard';
import EmployeeDirectory from '../pages/workspaces/hr/EmployeeDirectory';
import OperationsDashboard from '../pages/workspaces/operations/OperationsDashboard';
import ActiveProjects from '../pages/workspaces/operations/ActiveProjects';
import Sandbox from '../pages/Sandbox';
import PermissionDenied from '../pages/PermissionDenied';

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

  return <AppShell />;
}

// ── ProtectedRoute Component ──────────────────────────────────────────────
interface ProtectedRouteProps {
  children: React.ReactNode;
  workspaceKey: string;
}

export function ProtectedRoute({ children, workspaceKey }: ProtectedRouteProps) {
  const { currentUser } = useAppContext();

  if (!currentUser) return null;

  const perms = currentUser.permissions || [];
  const roles = currentUser.functional_roles || [];
  const hasAccess =
    perms.includes('*:*') ||
    roles.includes('admin') ||
    perms.some((p) => {
      if (workspaceKey === 'operations') {
        const opsKeys = ['field_ops', 'maintenance', 'manufacturing', 'projects', 'qa', 'qt', 'logistics'];
        return opsKeys.some(ok => p.startsWith(`${ok}:`));
      }
      if (workspaceKey === 'finance') {
        const finKeys = ['accounting', 'invoicing', 'payments', 'banking', 'taxes', 'reports', 'budget', 'shares'];
        return finKeys.some(fk => p.startsWith(`${fk}:`));
      }
      return p.startsWith(`${workspaceKey}:`);
    });

  if (!hasAccess) {
    return <PermissionDenied moduleName={workspaceKey.toUpperCase()} requiredPermission={`${workspaceKey}:read`} />;
  }

  return children;
}

// ── RoleBasedIndexRoute Component ──────────────────────────────────────────
export function RoleBasedIndexRoute() {
  const { isBooting } = useAppContext();

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

  // All authenticated users land on the unified dashboard.
  // Admin sections are shown/hidden inside UserHomeDashboard based on permissions.
  return <UserHomeDashboard />;
}

// ── AppRouter Component ────────────────────────────────────────────────────
export default function AppRouter() {
  return (
    <Routes>
      {/* ── Standalone pages (no shell) ──────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/onboard" element={<Onboarding />} />
      <Route path="/sandbox" element={<Sandbox />} />

      {/* ── Authenticated Shell ───────────────────────── */}
      <Route path="/" element={<AppShellOrTierZero />}>
        {/* Default index: role-based dashboard landing */}
        <Route index element={<RoleBasedIndexRoute />} />

        {/* Workspace Launcher (accessible by all) */}
        <Route path="workspaces" element={<AppLauncher />} />
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
        <Route path="catalog" element={<CatalogDashboard />} />
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

        <Route path="workspace/inventory" element={<InventoryHub />} />
        <Route path="workspace/inventory/assets" element={<AssetsWorkspace />} />
        <Route path="workspace/inventory/products" element={<ProductsWorkspace />} />
        
        <Route path="workspace/items" element={<ItemsWorkspace />}>
          <Route index element={<Navigate to="item" replace />} />
          <Route path="item" element={<ItemMaster />} />
          <Route path="item/new" element={<ItemForm />} />
          <Route path="item/:id" element={<ItemForm />} />
          <Route path="item-group" element={<ItemGroupWorkspace />} />
          <Route path="product-bundle" element={<ProductBundleWorkspace />} />
          <Route path="shipping-rule" element={<ShippingRuleWorkspace />} />
          <Route path="item-alternative" element={<ItemAlternativeWorkspace />} />
          <Route path="item-manufacturer" element={<ItemManufacturerWorkspace />} />
        </Route>

        <Route path="workspace/inventory/warehouses" element={<WarehouseWorkspace />} />
        <Route path="workspace/inventory/stock" element={<StockWorkspace />} />
        {/* Stock Entry list + detail/new */}
        <Route path="workspace/inventory/stock-entries" element={<StockEntryList />} />
        <Route path="workspace/inventory/stock-entries/new" element={<StockEntryForm />} />
        <Route path="workspace/inventory/stock-entries/:id" element={<StockEntryForm />} />
        <Route path="workspaces/inventory/stock-entries" element={<StockEntryList />} />
        <Route path="workspaces/inventory/stock-entries/new" element={<StockEntryForm />} />
        {/* Delivery Note & Pick List */}
        <Route path="workspace/inventory/delivery-notes" element={<DeliveryNoteList />} />
        <Route path="workspace/inventory/pick-list" element={<PickListPage />} />
        <Route path="workspace/inventory/delivery-notes/new" element={<DeliveryNoteForm />} />
        <Route path="workspace/inventory/pick-list/new" element={<PickListForm />} />
        <Route path="workspace/inventory/serial-no" element={<SerialNoWorkspace />} />
        <Route path="workspace/inventory/batch" element={<BatchWorkspace />} />
        <Route path="workspace/inventory/reports/stock-projected-qty" element={<StockProjectedQty />} />
        <Route path="workspace/inventory/reports/stock-ageing" element={<StockAgeing />} />
        <Route path="workspace/inventory/settings" element={<InventorySettings />} />
        <Route path="workspace/inventory/uom" element={<UOMWorkspace />} />
        {/* Stock Reports */}
        <Route path="workspace/inventory/reports/stock-ledger" element={<StockLedgerPage />} />
        <Route path="workspace/inventory/reports/stock-balance" element={<StockLedgerPage />} />
        <Route path="workspace/inventory/buying" element={<Navigate to="/workspaces/procurement" replace />} />
        <Route path="workspaces/procurement" element={<BuyingWorkspace />} />
        <Route path="workspaces/procurement/material-requests" element={<ProcurementModuleWorkspace type="material-requests" />} />
        <Route path="workspaces/procurement/purchase-orders" element={<ProcurementModuleWorkspace type="purchase-orders" />} />
        <Route path="workspaces/procurement/purchase-invoices" element={<ProcurementModuleWorkspace type="purchase-invoices" />} />
        <Route path="workspaces/procurement/suppliers" element={<ProcurementModuleWorkspace type="suppliers" />} />
        <Route path="workspaces/procurement/contacts" element={<ProcurementModuleWorkspace type="contacts" />} />
        <Route path="workspaces/procurement/rfq" element={<ProcurementModuleWorkspace type="rfq" />} />
        <Route path="workspaces/procurement/settings" element={<ProcurementModuleWorkspace type="settings" />} />
        <Route path="workspaces/procurement/taxes" element={<ProcurementModuleWorkspace type="taxes" />} />
        <Route path="workspaces/procurement/analytics" element={<PurchaseAnalytics />} />

        <Route path="workspace/crm" element={<ProtectedRoute workspaceKey="crm"><CrmDashboard /></ProtectedRoute>} />
        <Route path="workspace/crm/pipeline" element={<ProtectedRoute workspaceKey="crm"><PipelineLeads /></ProtectedRoute>} />
        <Route path="workspace/crm/customers" element={<ProtectedRoute workspaceKey="crm"><Customers /></ProtectedRoute>} />
        <Route path="workspace/crm/sales-orders" element={<ProtectedRoute workspaceKey="crm"><SalesOrders /></ProtectedRoute>} />
        <Route path="workspace/crm/sales" element={<ProtectedRoute workspaceKey="crm"><SalesOrders /></ProtectedRoute>} />
        <Route path="workspace/crm/quotations" element={<ProtectedRoute workspaceKey="crm"><Quotations /></ProtectedRoute>} />
        <Route path="workspace/crm/contacts" element={<ProtectedRoute workspaceKey="crm"><Contacts /></ProtectedRoute>} />
        <Route path="workspace/crm/deals" element={<ProtectedRoute workspaceKey="crm"><Deals /></ProtectedRoute>} />
        <Route path="workspace/crm/call-log" element={<ProtectedRoute workspaceKey="crm"><CallLog /></ProtectedRoute>} />
        <Route path="workspace/crm/tasks" element={<ProtectedRoute workspaceKey="crm"><TasksToDo /></ProtectedRoute>} />
        <Route path="workspace/crm/interactions" element={<ProtectedRoute workspaceKey="crm"><InteractionHistory /></ProtectedRoute>} />
        <Route path="workspace/crm/pos" element={<ProtectedRoute workspaceKey="pos"><PosWorkspace /></ProtectedRoute>} />
        <Route path="workspace/crm/support" element={<ProtectedRoute workspaceKey="support"><SupportWorkspace /></ProtectedRoute>} />
        <Route path="workspaces/finance" element={<ProtectedRoute workspaceKey="finance"><FinanceDashboard /></ProtectedRoute>} />
        <Route path="workspaces/finance/dashboard" element={<ProtectedRoute workspaceKey="finance"><FinanceDashboard /></ProtectedRoute>} />
        <Route path="workspaces/finance/accounting" element={<ProtectedRoute workspaceKey="finance"><ChartOfAccounts /></ProtectedRoute>} />
        <Route path="workspaces/finance/accounts" element={<ProtectedRoute workspaceKey="finance"><ChartOfAccounts /></ProtectedRoute>} />
        <Route path="workspaces/finance/invoicing" element={<ProtectedRoute workspaceKey="finance"><Invoicing /></ProtectedRoute>} />
        <Route path="workspaces/finance/payments" element={<ProtectedRoute workspaceKey="finance"><Payments /></ProtectedRoute>} />
        <Route path="workspaces/finance/banking" element={<ProtectedRoute workspaceKey="finance"><Banking /></ProtectedRoute>} />
        <Route path="workspaces/finance/taxes" element={<ProtectedRoute workspaceKey="finance"><Taxes /></ProtectedRoute>} />
        <Route path="workspaces/finance/reports" element={<ProtectedRoute workspaceKey="finance"><ReportsView /></ProtectedRoute>} />
        <Route path="workspaces/finance/budgets" element={<ProtectedRoute workspaceKey="finance"><Budget /></ProtectedRoute>} />
        <Route path="workspaces/finance/shares" element={<ProtectedRoute workspaceKey="finance"><ShareManagement /></ProtectedRoute>} />
        <Route path="workspaces/hr" element={<ProtectedRoute workspaceKey="hr"><HrDashboard /></ProtectedRoute>} />
        <Route path="workspaces/hr/employees" element={<ProtectedRoute workspaceKey="hr"><EmployeeDirectory /></ProtectedRoute>} />
        <Route path="workspaces/operations" element={<ProtectedRoute workspaceKey="operations"><OperationsDashboard /></ProtectedRoute>} />
        <Route path="workspaces/operations/projects" element={<ProtectedRoute workspaceKey="operations"><ActiveProjects /></ProtectedRoute>} />

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

        {/* Tier 0 Admin Dashboards */}
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:userId" element={<UserDetails />} />
        <Route path="roles" element={<Navigate to="/users?tab=roles" replace />} />
        <Route path="event-engine" element={<EventEngineDashboard />} />

        {/* Settings */}
        <Route path="settings/profile" element={<MyProfileSettings />} />
        <Route path="settings/org"     element={<OrganisationSetup />} />
        <Route path="settings/config"  element={<SystemSettingsDashboard />} />

        {/* Catch-all: redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
