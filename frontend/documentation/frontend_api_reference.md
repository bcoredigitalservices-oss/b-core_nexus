# B-Core Nexus — Frontend API Reference
**Last Updated:** 2026-07-09  
**Version:** 1.2.1-alpha  
**Base URL:** `/api/v1` (proxied via Vite dev server from `VITE_API_URL`)

This file is the **single canonical list** of every API endpoint called from the frontend codebase. Endpoints are grouped by domain. For each entry you'll find the HTTP method, the path, which frontend file makes the call, and the current status.

**Legend:**
- ✅ **Implemented** — Backend endpoint exists and is functional
- ⚠️ **Partial** — Endpoint exists but has known limitations
- ❌ **Missing** — Frontend calls this path, backend has no handler for it

---

## 1. Authentication & Session

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `POST` | `/auth/login` | [Login.tsx](../src/pages/Login.tsx) | ✅ |
| `POST` | `/auth/token` | [AppContext.tsx](../src/context/AppContext.tsx) (OAuth2 form) | ✅ |
| `POST` | `/auth/refresh` | [client.ts](../src/services/api/client.ts) (Axios interceptor) | ✅ |
| `POST` | `/auth/onboard/verify` | [Onboarding.tsx](../src/pages/Onboarding.tsx) | ✅ |
| `POST` | `/auth/onboard/password` | [Onboarding.tsx](../src/pages/Onboarding.tsx) | ✅ |
| `POST` | `/auth/totp/setup` | [MyProfileSettings.tsx](../src/pages/settings/MyProfileSettings.tsx) | ✅ |
| `GET` | `/auth/me` | [AppContext.tsx](../src/context/AppContext.tsx) (bootstrap) | ✅ |
| `GET` | `/auth/users` | [Users.tsx](../src/pages/iam/Users.tsx), [UserDetails.tsx](../src/pages/iam/UserDetails.tsx), [TasksToDo.tsx](../src/pages/workspaces/crm/TasksToDo.tsx), [CreateTaskModal.tsx](../src/components/iam/CreateTaskModal.tsx) | ✅ |
| `POST` | `/init/bootstrap` | [Sandbox.tsx](../src/pages/Sandbox.tsx) | ✅ |
| `POST` | `/bootstrap` | [Bootstrap.tsx](../src/modules/auth/pages/Bootstrap.tsx) | ✅ |

---

## 2. User Profile & Preferences

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `GET` | `/system/preferences` | [AppContext.tsx](../src/context/AppContext.tsx) (fetchPreferences) | ✅ |
| `PUT` | `/system/preferences/personal` | [AppContext.tsx](../src/context/AppContext.tsx) (updatePersonalPreference) | ✅ |
| `PUT` | `/system/preferences/global` | [AppContext.tsx](../src/context/AppContext.tsx) (updateGlobalPreference) | ✅ |
| `GET` | `/system/profile` | [AppContext.tsx](../src/context/AppContext.tsx), [SystemSettingsDashboard.tsx](../src/pages/settings/SystemSettingsDashboard.tsx) | ✅ |
| `POST` | `/system/modules/{moduleKey}/toggle` | [SystemSettingsDashboard.tsx](../src/pages/settings/SystemSettingsDashboard.tsx) | ✅ |

---

## 3. System Telemetry & Health

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `GET` | `/system/health` | [SystemAdminDashboard.tsx](../src/pages/dashboards/SystemAdminDashboard.tsx) | ✅ |
| `GET` | `/system/telemetry/hardware` | [SystemAdminDashboard.tsx](../src/pages/dashboards/SystemAdminDashboard.tsx) | ✅ |
| `GET` | `/system/telemetry/traffic` | [SystemAdminDashboard.tsx](../src/pages/dashboards/SystemAdminDashboard.tsx) | ✅ |
| `GET` | `/system/telemetry/pulse` | [SystemAdminDashboard.tsx](../src/pages/dashboards/SystemAdminDashboard.tsx) | ⚠️ Returns empty list |

---

## 4. Organization

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `GET` | `/organization/profile` | [OrganisationSetup.tsx](../src/pages/settings/OrganisationSetup.tsx), [UserHomeDashboard.tsx](../src/pages/dashboards/UserHomeDashboard.tsx) | ✅ |
| `PUT` | `/organization/profile` | [OrganisationSetup.tsx](../src/pages/settings/OrganisationSetup.tsx) | ✅ |

---

## 5. IAM — Identity & Access Management

### Users

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `POST` | `/iam/users/invite` | [ProvisionUserModal.tsx](../src/components/iam/ProvisionUserModal.tsx), [InviteUserModal.tsx](../src/components/admin/InviteUserModal.tsx) | ✅ |
| `GET` | `/iam/users/{id}/details` | [UserDetails.tsx](../src/pages/iam/UserDetails.tsx), [EditUserAccessModal.tsx](../src/components/iam/EditUserAccessModal.tsx) | ✅ |
| `PUT` | `/iam/users/{id}/access` | [UserDetails.tsx](../src/pages/iam/UserDetails.tsx), [EditUserAccessModal.tsx](../src/components/iam/EditUserAccessModal.tsx) | ✅ |
| `PUT` | `/iam/users/{id}/status` | [Users.tsx](../src/pages/iam/Users.tsx), [UserDetails.tsx](../src/pages/iam/UserDetails.tsx), [UsersDashboard.tsx](../src/pages/dashboards/UsersDashboard.tsx) | ✅ |
| `PUT` | `/iam/users/{id}/roles` | [UserDetails.tsx](../src/pages/iam/UserDetails.tsx) | ✅ |
| `GET` | `/iam/users/{id}/permissions` | [UserDetails.tsx](../src/pages/iam/UserDetails.tsx) | ✅ |
| `PUT` | `/iam/users/{id}/permissions` | [UserDetails.tsx](../src/pages/iam/UserDetails.tsx), [EditUserAccessModal.tsx](../src/components/iam/EditUserAccessModal.tsx) | ✅ |
| `POST` | `/iam/users/{id}/copy-permissions` | [UserDetails.tsx](../src/pages/iam/UserDetails.tsx) | ✅ |

### Roles

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `GET` | `/iam/roles` | [Users.tsx](../src/pages/iam/Users.tsx), [UserDetails.tsx](../src/pages/iam/UserDetails.tsx), [ProvisionUserModal.tsx](../src/components/iam/ProvisionUserModal.tsx), [EditUserAccessModal.tsx](../src/components/iam/EditUserAccessModal.tsx), [InviteUserModal.tsx](../src/components/admin/InviteUserModal.tsx) | ✅ |
| `POST` | `/iam/roles` | [Users.tsx](../src/pages/iam/Users.tsx) | ✅ |
| `PUT` | `/iam/roles/{id}` | [Users.tsx](../src/pages/iam/Users.tsx) | ✅ |
| `GET` | `/iam/roles/{id}/permissions` | [Users.tsx](../src/pages/iam/Users.tsx) | ✅ |
| `PUT` | `/iam/roles/{id}/permissions` | [Users.tsx](../src/pages/iam/Users.tsx) | ✅ |

### Permissions & Departments

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `GET` | `/iam/permissions` | [UserDetails.tsx](../src/pages/iam/UserDetails.tsx), [EditUserAccessModal.tsx](../src/components/iam/EditUserAccessModal.tsx) | ✅ |
| `GET` | `/iam/departments` | [Users.tsx](../src/pages/iam/Users.tsx), [UserDetails.tsx](../src/pages/iam/UserDetails.tsx), [ProvisionUserModal.tsx](../src/components/iam/ProvisionUserModal.tsx), [EditUserAccessModal.tsx](../src/components/iam/EditUserAccessModal.tsx), [UserHomeDashboard.tsx](../src/pages/dashboards/UserHomeDashboard.tsx) | ✅ |
| `POST` | `/iam/departments` | [departments.ts](../src/services/api/departments.ts) | ✅ |
| `GET` | `/iam/workspaces` | [Workspaces.tsx](../src/pages/iam/Workspaces.tsx), [Users.tsx](../src/pages/iam/Users.tsx) | ✅ |

---

## 6. Tasks

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `GET` | `/tasks` | [TasksToDo.tsx](../src/pages/workspaces/crm/TasksToDo.tsx) | ✅ |
| `GET` | `/tasks/my` | [UserHomeDashboard.tsx](../src/pages/dashboards/UserHomeDashboard.tsx) | ✅ |
| `POST` | `/tasks` | [CreateTaskModal.tsx](../src/components/iam/CreateTaskModal.tsx) | ✅ |
| `PUT` | `/tasks/{id}` | [CreateTaskModal.tsx](../src/components/iam/CreateTaskModal.tsx), [TasksToDo.tsx](../src/pages/workspaces/crm/TasksToDo.tsx), [UserHomeDashboard.tsx](../src/pages/dashboards/UserHomeDashboard.tsx) | ✅ |

---

## 7. Navigation & Shell

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `GET` | `/shell/navigation` | [AppContext.tsx](../src/context/AppContext.tsx) (bootstrap) | ✅ |
| `GET` | `/workspace/config` | [AppContext.tsx](../src/context/AppContext.tsx) (bootstrap) | ⚠️ May 404 on some roles |

---

## 8. CRM & Sales (Implemented Backend)

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `GET` | `/crm/contacts` | CRM workspace pages | ✅ |
| `POST` | `/crm/contacts` | CRM workspace pages | ✅ |
| `PUT` | `/crm/contacts/{id}` | CRM workspace pages | ✅ |
| `GET` | `/crm/leads` | CRM workspace pages | ✅ |
| `POST` | `/crm/leads` | CRM workspace pages | ✅ |
| `PUT` | `/crm/leads/{id}` | CRM workspace pages | ✅ |
| `POST` | `/crm/leads/{id}/convert` | CRM workspace pages | ✅ |
| `POST` | `/crm/leads/{id}/activities` | CRM workspace pages | ✅ |
| `GET` | `/crm/customers` | CRM workspace pages | ✅ |
| `POST` | `/crm/customers` | CRM workspace pages | ✅ |
| `PUT` | `/crm/customers/{id}` | CRM workspace pages | ✅ |
| `GET` | `/crm/deals` | [DealsPage.tsx](../src/modules/crm/pages/DealsPage.tsx) | ✅ |
| `POST` | `/crm/deals` | [CreateDealModal.tsx](../src/modules/crm/components/deals/CreateDealModal.tsx) | ✅ |
| `GET` | `/crm/deals/{id}` | [DealDetailsPage.tsx](../src/modules/crm/pages/DealDetailsPage.tsx) | ✅ |
| `PUT` | `/crm/deals/{id}` | [EditDealModal.tsx](../src/modules/crm/components/deals/EditDealModal.tsx), [DealsPage.tsx](../src/modules/crm/pages/DealsPage.tsx) (for activation) | ✅ |
| `DELETE` | `/crm/deals/{id}` | [DealsPage.tsx](../src/modules/crm/pages/DealsPage.tsx) (for deactivation) | ✅ |
| `POST` | `/crm/share` | [RecordShareCard.tsx](../src/components/ui/RecordShareCard.tsx) | ✅ |
| `DELETE` | `/crm/share/{id}` | [RecordShareCard.tsx](../src/components/ui/RecordShareCard.tsx) | ✅ |
| `GET` | `/search` | [AppShell.tsx](../src/components/layouts/AppShell.tsx) | ✅ |
| `GET` | `/messages/mentions/unread` | [AppShell.tsx](../src/components/layouts/AppShell.tsx) | ✅ |
| `POST` | `/messages/{id}/read` | [EntityChatBox.tsx](../src/components/ui/EntityChatBox.tsx), [AppShell.tsx](../src/components/layouts/AppShell.tsx) | ✅ |
| `GET` | `/messages/{entity_type}/{entity_id}` | [EntityChatBox.tsx](../src/components/ui/EntityChatBox.tsx) | ✅ |
| `POST` | `/messages/{entity_type}/{entity_id}` | [EntityChatBox.tsx](../src/components/ui/EntityChatBox.tsx) | ✅ |
| `GET` | `/sales/products` | Sales workspace | ✅ |
| `POST` | `/sales/products` | Sales workspace | ✅ |
| `GET` | `/sales/quotations` | Sales workspace | ✅ |
| `POST` | `/sales/quotations` | Sales workspace | ✅ |
| `PUT` | `/sales/quotations/{id}` | Sales workspace | ✅ |
| `POST` | `/sales/quotations/{id}/convert-to-order` | Sales workspace | ✅ |
| `POST` | `/sales/quotations/{id}/messages` | Sales workspace | ✅ |
| `GET` | `/sales/price-lists` | Sales workspace | ✅ |
| `POST` | `/sales/price-lists` | Sales workspace | ✅ |

---

## 9. Universal Core (Missing Backend)

These endpoints are called by the frontend but **have no backend handler**. They will return 404 in production until implemented.

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `GET` | `/directory` | AppRouter (page route) | ❌ Missing |
| `GET` | `/directory/profiles` | [UniversalDataGrid.tsx](../src/components/ui/UniversalDataGrid.tsx) | ❌ Missing |
| `GET` | `/events` | AppRouter (page route) | ❌ Missing |

---

## 10. Pluggable Workspace APIs (Missing Backend)

These endpoints are referenced in pluggable workspace dashboards. The workspace frontend shells exist but their backend routers have **not yet been implemented**.

| Method | Endpoint | Caller | Status |
|:---|:---|:---|:---|
| `GET` | `/workspaces/crm/customers` | [CrmDashboard.tsx](../src/pages/workspaces/crm/CrmDashboard.tsx) | ❌ Missing — use `/crm/customers` instead |
| `GET` | `/workspaces/inventory/items` | [InventoryDashboard.tsx](../src/pages/workspaces/inventory/InventoryDashboard.tsx) | ❌ Missing |
| `GET` | `/workspaces/inventory/warehouses` | [InventoryDashboard.tsx](../src/pages/workspaces/inventory/InventoryDashboard.tsx) | ❌ Missing |
| `GET` | `/workspaces/operations/projects` | [OperationsDashboard.tsx](../src/pages/workspaces/operations/OperationsDashboard.tsx) | ❌ Missing |
| `GET` | `/workspaces/operations/tasks` | [OperationsDashboard.tsx](../src/pages/workspaces/operations/OperationsDashboard.tsx) | ❌ Missing |
| `GET` | `/workspaces/finance/accounts` | [FinanceDashboard.tsx](../src/pages/workspaces/finance/FinanceDashboard.tsx) | ❌ Missing |
| `GET` | `/hr/employees` | [HrDashboard.tsx](../src/pages/workspaces/hr/HrDashboard.tsx) | ❌ Missing |
| `GET` | `/hr/payroll` | HR workspace pages | ❌ Missing |
| `GET` | `/hr/health` | HR workspace pages | ❌ Missing |

---

## 11. WebSocket Connections

| Connection | URI Pattern | Caller | Status |
|:---|:---|:---|:---|
| Global state stream | `ws://{host}/api/v1/stream?token={token}&workspace={key}` | [useGlobalWebSocket.js](../src/providers/useGlobalWebSocket.js) | ❌ Missing |

---

## Summary Counts

| Status | Count |
|:---|:---:|
| ✅ Fully Implemented | 60 |
| ⚠️ Partial / Known Issues | 2 |
| ❌ Missing Backend Handler | 21 |
| **Total endpoints referenced** | **83** |
