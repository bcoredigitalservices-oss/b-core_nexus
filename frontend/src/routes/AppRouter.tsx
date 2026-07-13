import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

// ── Shared Layouts & Globals ───────────────────────────────────────────────
import AppShell from "../components/layouts/AppShell";
import UniversalDataGrid from "../components/ui/UniversalDataGrid";

// ── Auth Module ────────────────────────────────────────────────────────────
import Login from "../modules/auth/pages/Login";
import Onboarding from "../modules/auth/pages/Onboarding";

// ── Admin Module ───────────────────────────────────────────────────────────
import AdminDashboard from "../modules/admin/pages/AdminDashboard";
import WorkspaceHub from "../modules/admin/pages/WorkspaceHub";
import OrganisationSetup from "../modules/admin/pages/OrganisationSetup";
import OrganizationDashboard from "../modules/admin/pages/OrganizationDashboard";
import SystemSettingsDashboard from "../modules/admin/pages/SystemSettingsDashboard";

// ── IAM Module ─────────────────────────────────────────────────────────────
import UsersDashboard from "../modules/iam/pages/UsersDashboard";
import EditUserAccess from "../modules/iam/pages/EditUserAccess";

// ── User Module ────────────────────────────────────────────────────────────
import UserHomeDashboard from "../modules/users/pages/UserHomeDashboard";
import MyProfileSettings from "../modules/users/pages/MyProfileSettings";
import PermissionDenied from "../modules/users/pages/PermissionDenied";

// ── CRM Module Imports ──────────────────────────────────────────────────────
import CrmDashboard from "../modules/crm/pages/CrmDashboard";
import Leads from "../modules/crm/pages/LeadsPage";
import LeadDetails from "../modules/crm/pages/LeadDetailsPage";
import Customers from "../modules/crm/pages/CustomersPage";
import CustomerDetails from "../modules/crm/pages/CustomerDetailsPage";
import ContactDetails from "../modules/crm/pages/ContactDetailsPage";
import DealDetails from "../modules/crm/pages/DealDetailsPage";
import QuotationDetails from "../modules/crm/pages/QuotationDetailsPage";
import SalesOrders from "../modules/crm/pages/SalesOrdersPage";
import SalesOrderDetails from "../modules/crm/pages/SalesOrderDetailsPage";
import Quotations from "../modules/crm/pages/QuotationsPage";
import Contacts from "../modules/crm/pages/ContactsPage";
import Deals from "../modules/crm/pages/DealsPage";
import CallLog from "../modules/crm/pages/CallLog";
import TasksToDo from "../modules/crm/pages/TasksToDo";
import InteractionHistory from "../modules/crm/pages/InteractionHistory";
import PosWorkspace from "../modules/crm/pages/PosWorkspace";
import SupportWorkspace from "../modules/crm/pages/SupportWorkspace";

// ── Finance Module Imports ──────────────────────────────────────────────────
import FinanceDashboard from "../modules/finance/FinanceDashboard";
import ChartOfAccounts from "../modules/finance/ChartOfAccounts";
import Invoicing from "../modules/finance/Invoicing";
import Payments from "../modules/finance/Payments";
import Banking from "../modules/finance/Banking";
import Taxes from "../modules/finance/Taxes";
import ReportsView from "../modules/finance/ReportsView";
import Budget from "../modules/finance/Budget";
import ShareManagement from "../modules/finance/ShareManagement";

// ── HR Module Imports ───────────────────────────────────────────────────────
import HrDashboard from "../modules/hr/HrDashboard";
import EmployeeDirectory from "../modules/hr/EmployeeDirectory";

// ── Operations Module Imports ───────────────────────────────────────────────
import OperationsDashboard from "../modules/operations/OperationsDashboard";
import ActiveProjects from "../modules/operations/ActiveProjects";

// ── Inventory Module Imports ────────────────────────────────────────────────
import InventoryHub from "../modules/inventory/InventoryHub";
import AssetsWorkspace from "../modules/inventory/AssetsWorkspace";
import ProductsWorkspace from "../modules/inventory/ProductsWorkspace";
import ItemsWorkspace from "../modules/inventory/ItemsWorkspace";
import ItemMaster from "../modules/inventory/ItemMaster";
import ItemForm from "../modules/inventory/ItemForm";
import ItemGroupWorkspace from "../modules/inventory/ItemGroupWorkspace";
import ProductBundleWorkspace from "../modules/inventory/ProductBundleWorkspace";
import ShippingRuleWorkspace from "../modules/inventory/ShippingRuleWorkspace";
import ItemAlternativeWorkspace from "../modules/inventory/ItemAlternativeWorkspace";
import ItemManufacturerWorkspace from "../modules/inventory/ItemManufacturerWorkspace";
import WarehouseWorkspace from "../modules/inventory/WarehouseWorkspace";
import StockWorkspace from "../modules/inventory/StockWorkspace";
import StockEntryList from "../modules/inventory/StockEntryList";
import StockEntryForm from "../modules/inventory/StockEntryForm";
import DeliveryNoteList from "../modules/inventory/DeliveryNoteList";
import PickListPage from "../modules/inventory/PickListPage";
import DeliveryNoteForm from "../modules/inventory/DeliveryNoteForm";
import PickListForm from "../modules/inventory/PickListForm";
import SerialNoWorkspace from "../modules/inventory/SerialNoWorkspace";
import BatchWorkspace from "../modules/inventory/BatchWorkspace";
import StockProjectedQty from "../modules/inventory/StockProjectedQty";
import StockAgeing from "../modules/inventory/StockAgeing";
import InventorySettings from "../modules/inventory/InventorySettings";
import UOMWorkspace from "../modules/inventory/UOMWorkspace";
import BuyingWorkspace from "../modules/inventory/BuyingWorkspace";
import ProcurementModuleWorkspace from "../modules/inventory/ProcurementModuleWorkspace";
import PurchaseAnalytics from "../modules/inventory/PurchaseAnalytics";
import StockLedgerPage from "../modules/inventory/StockLedger";

// ── AppShell Operational Guard Interceptor ──────────────────────────────────
export function AppShellOrTierZero() {
  const { currentUser, isBooting, token } = useAppContext();

  if (isBooting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-[var(--text-muted)] bg-[var(--bg-main)]">
        <div className="w-10 h-10 border-3 border-transparent border-t-[var(--accent-blue)] rounded-full animate-spin" />
        <span>Loading personal workspace...</span>
      </div>
    );
  }

  if (!token || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

// ── RBAC Route Security Gatekeeper ──────────────────────────────────────────
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
    perms.includes("*:*") ||
    roles.includes("admin") ||
    perms.some((p) => {
      if (workspaceKey === "operations") {
        const opsKeys = ["field_ops", "maintenance", "manufacturing", "projects", "qa", "qt", "logistics"];
        return opsKeys.some((ok) => p.startsWith(`${ok}:`));
      }
      if (workspaceKey === "finance") {
        const finKeys = ["accounting", "invoicing", "payments", "banking", "taxes", "reports", "budget", "shares"];
        return finKeys.some((fk) => p.startsWith(`${fk}:`));
      }
      return p.startsWith(`${workspaceKey}:`);
    });

  if (!hasAccess) {
    return (
      <PermissionDenied
        moduleName={workspaceKey.toUpperCase()}
        requiredPermission={`${workspaceKey}:read`}
      />
    );
  }

  return children;
}

// ── Core Domain Dynamic Index Resolver ──────────────────────────────────────
export function RoleBasedIndexRoute() {
  const { currentUser } = useAppContext();

  // Note: iam:manage is deliberately excluded here — AdminDashboard pulls
  // /organization/profile and /auth/users, neither of which iam:manage
  // authorizes server-side. Sending an iam:manage-only user here would just
  // show them a half-empty dashboard. They land on UserHomeDashboard instead
  // and reach /users directly, where their access actually works.
  const isAdmin =
    currentUser?.permissions?.includes("*:*") ||
    currentUser?.functional_roles?.includes("admin") ||
    currentUser?.functional_roles?.includes("manager");

  return isAdmin ? <AdminDashboard /> : <UserHomeDashboard />;
}

// ── Master System Routing Matrix ────────────────────────────────────────────
export default function AppRouter() {
  const { currentUser } = useAppContext();
  const isAdmin =
    currentUser?.permissions?.includes("*:*") ||
    currentUser?.functional_roles?.includes("admin") ||
    currentUser?.functional_roles?.includes("manager");

  // Backend's require_iam_privilege only guards /iam/* endpoints (users, roles,
  // departments, permissions) — iam:manage grants no access to workspace or
  // system settings routers. Keep the frontend gate matching that scope exactly.
  const canAccessIAM = isAdmin || currentUser?.permissions?.includes("iam:manage");

  return (
    <Routes>
      {/* ── Standalone Gateway Entries ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/onboard" element={<Onboarding />} />

      {/* ── Authenticated System Viewport Wrapper ── */}
      <Route path="/" element={<AppShellOrTierZero />}>
        <Route index element={<RoleBasedIndexRoute />} />

        {/* ── Core Infrastructure Tracks ── */}
        <Route path="workspace" element={isAdmin ? <WorkspaceHub /> : <Navigate to="/" replace />} />
        <Route path="users" element={canAccessIAM ? <UsersDashboard /> : <Navigate to="/userhomedashboard" replace />} />
        <Route path="users/:userId" element={canAccessIAM ? <EditUserAccess /> : <Navigate to="/" replace />} />
        <Route path="org/*" element={isAdmin ? <OrganizationDashboard /> : <Navigate to="/" replace />} />
        <Route path="settings/config" element={isAdmin ? <SystemSettingsDashboard /> : <Navigate to="/" replace />} />
        <Route path="userhomedashboard" element={<UserHomeDashboard />} />
        <Route path="settings/profile" element={<MyProfileSettings />} />
        <Route path="executive" element={<AdminDashboard />} />

        {/* ── Global Auditing Tool Grids ── */}
        <Route
          path="events"
          element={
            <ProtectedRoute workspaceKey="iam">
              <UniversalDataGrid
                endpointUrl="/api/v1/events"
                title="Event Security Audit Trail"
                columns={[
                  { key: "created_at", label: "Timestamp", sortable: true },
                  { key: "entity_type", label: "Entity Layer", sortable: true },
                  { key: "event_type", label: "Action Fired", sortable: true },
                  { key: "entity_id", label: "Target ID" },
                  { key: "created_by", label: "Operator" },
                ]}
              />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="customers"
          element={
            <ProtectedRoute workspaceKey="crm">
              <UniversalDataGrid
                endpointUrl="/api/v1/directory"
                title="Global Customers Directory Ledger"
                columns={[
                  { key: "name", label: "Account Name", sortable: true },
                  { key: "email", label: "Primary Communication", sortable: true },
                  { key: "phone", label: "Contact Phone" },
                  { key: "is_active", label: "Operational State", sortable: true },
                ]}
              />
            </ProtectedRoute>
          }
        />

        {/* ── Unified Logistics & Telemetry Grids ── */}
        <Route
          path="workspace/spedex"
          element={
            <UniversalDataGrid
              endpointUrl="/api/v1/directory"
              title="SpedEx Cold Chain Logistics Hub"
              columns={[
                { key: "name", label: "Hub Station", sortable: true },
                { key: "email", label: "Dispatch Control", sortable: true },
                { key: "phone", label: "Secure Comms" },
                { key: "is_active", label: "Active Status", sortable: true },
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
                { key: "created_at", label: "Last Telemetry Ping", sortable: true },
                { key: "entity_type", label: "Asset Class", sortable: true },
                { key: "event_type", label: "Vehicle Alert Status", sortable: true },
                { key: "created_by", label: "Operator Signed" },
              ]}
            />
          }
        />
        <Route
          path="routes"
          element={
            <UniversalDataGrid
              endpointUrl="/api/v1/directory"
              title="Cold Chain Dispatch Routes"
              columns={[
                { key: "name", label: "Route Corridor", sortable: true },
                { key: "email", label: "Dispatch Lead", sortable: true },
                { key: "phone", label: "Secure Comms" },
                { key: "is_active", label: "Route Status", sortable: true },
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
                { key: "created_at", label: "Scheduled / Logged At", sortable: true },
                { key: "entity_type", label: "Asset Class", sortable: true },
                { key: "event_type", label: "Maintenance Task", sortable: true },
                { key: "created_by", label: "Technician Signed" },
              ]}
            />
          }
        />

        {/* ── Inventory Module Workspace Track ── */}
        <Route path="workspace/inventory" element={<InventoryHub />} />
        <Route path="workspace/inventory/assets" element={<AssetsWorkspace />} />
        <Route path="workspace/inventory/products" element={<ProductsWorkspace />} />
        <Route path="workspace/inventory/warehouses" element={<WarehouseWorkspace />} />
        <Route path="workspace/inventory/stock" element={<StockWorkspace />} />
        <Route path="workspace/inventory/stock-entries" element={<StockEntryList />} />
        <Route path="workspace/inventory/stock-entries/new" element={<StockEntryForm />} />
        <Route path="workspace/inventory/stock-entries/:id" element={<StockEntryForm />} />
        <Route path="workspaces/inventory/stock-entries" element={<StockEntryList />} />
        <Route path="workspaces/inventory/stock-entries/new" element={<StockEntryForm />} />
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

        {/* Nested Items Configuration Workspace */}
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

        {/* ── CRM Module Workspace Track ── */}
        <Route path="workspace/crm" element={<ProtectedRoute workspaceKey="crm"><CrmDashboard /></ProtectedRoute>} />
        <Route path="workspace/crm/leads" element={<ProtectedRoute workspaceKey="crm"><Leads /></ProtectedRoute>} />
        <Route path="workspace/crm/leads/:leadId" element={<ProtectedRoute workspaceKey="crm"><LeadDetails /></ProtectedRoute>} />
        <Route path="workspace/crm/customers" element={<ProtectedRoute workspaceKey="crm"><Customers /></ProtectedRoute>} />
        <Route path="workspace/crm/customers/:customerId" element={<ProtectedRoute workspaceKey="crm"><CustomerDetails /></ProtectedRoute>} />
        <Route path="workspace/crm/sales-orders" element={<ProtectedRoute workspaceKey="crm"><SalesOrders /></ProtectedRoute>} />
        <Route path="workspace/crm/sales-orders/:orderId" element={<ProtectedRoute workspaceKey="crm"><SalesOrderDetails /></ProtectedRoute>} />
        <Route path="workspace/crm/sales" element={<ProtectedRoute workspaceKey="crm"><SalesOrders /></ProtectedRoute>} />
        <Route path="workspace/crm/quotations" element={<ProtectedRoute workspaceKey="crm"><Quotations /></ProtectedRoute>} />
        <Route path="workspace/crm/quotations/:quotationId" element={<ProtectedRoute workspaceKey="crm"><QuotationDetails /></ProtectedRoute>} />
        <Route path="workspace/crm/contacts" element={<ProtectedRoute workspaceKey="crm"><Contacts /></ProtectedRoute>} />
        <Route path="workspace/crm/contacts/:contactId" element={<ProtectedRoute workspaceKey="crm"><ContactDetails /></ProtectedRoute>} />
        <Route path="workspace/crm/deals" element={<ProtectedRoute workspaceKey="crm"><Deals /></ProtectedRoute>} />
        <Route path="workspace/crm/deals/:dealId" element={<ProtectedRoute workspaceKey="crm"><DealDetails /></ProtectedRoute>} />
        <Route path="workspace/crm/call-log" element={<ProtectedRoute workspaceKey="crm"><CallLog /></ProtectedRoute>} />
        <Route path="workspace/crm/tasks" element={<ProtectedRoute workspaceKey="crm"><TasksToDo /></ProtectedRoute>} />
        <Route path="workspace/crm/meetings" element={<ProtectedRoute workspaceKey="crm"><TasksToDo /></ProtectedRoute>} />
        <Route path="workspace/crm/emails" element={<ProtectedRoute workspaceKey="crm"><InteractionHistory /></ProtectedRoute>} />
        <Route path="workspace/crm/interactions" element={<ProtectedRoute workspaceKey="crm"><InteractionHistory /></ProtectedRoute>} />
        <Route path="workspace/crm/reports" element={<ProtectedRoute workspaceKey="crm"><CrmDashboard /></ProtectedRoute>} />
        <Route path="workspace/crm/settings" element={<ProtectedRoute workspaceKey="crm"><CrmDashboard /></ProtectedRoute>} />
        <Route path="workspace/crm/pos" element={<ProtectedRoute workspaceKey="pos"><PosWorkspace /></ProtectedRoute>} />
        <Route path="workspace/crm/support" element={<ProtectedRoute workspaceKey="support"><SupportWorkspace /></ProtectedRoute>} />

        {/* ── Finance Module Workspace Track ── */}
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

        {/* ── HR Module Workspace Track ── */}
        <Route path="workspaces/hr" element={<ProtectedRoute workspaceKey="hr"><HrDashboard /></ProtectedRoute>} />
        <Route path="workspaces/hr/employees" element={<ProtectedRoute workspaceKey="hr"><EmployeeDirectory /></ProtectedRoute>} />

        {/* ── Operations Module Workspace Track ── */}
        <Route path="workspaces/operations" element={<ProtectedRoute workspaceKey="operations"><OperationsDashboard /></ProtectedRoute>} />
        <Route path="workspaces/operations/projects" element={<ProtectedRoute workspaceKey="operations"><ActiveProjects /></ProtectedRoute>} />

        {/* ── Standard Security Catch-all Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}