# B-Core Nexus - Frontend Workflow Documentation

This document describes the architectural lifecycle and execution workflows of the **B-Core Nexus React Frontend**. A developer reading this will understand how the client starts up, authenticates users, receives real-time updates, and manages workspace routing.

---

## 1. Application Startup & Bootstrapping Workflow

When a user loads the B-Core Nexus web application, the frontend follows a strict initialization (bootstrapping) sequence managed by [AppProvider](file:///c:/Users/KUNAL/OneDrive/Documents/Projects/B-core_Nexus/b-core_nexus/frontend/src/context/AppContext.jsx#L103).

### Bootstrapping Lifecycle Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Browser / User
    participant Provider as AppProvider (AppContext.jsx)
    participant API as Axios Client (client.ts)
    participant Backend as FastAPI Server

    User->>Provider: Mounts Application
    Provider->>Provider: Reads local/session storage for token
    alt Token is found
        Provider->>API: bootstrap(token)
        par Parallel Info Gathering
            API->>Backend: GET /api/v1/auth/me (User info, Roles, Perms)
            API->>Backend: GET /api/v1/system/preferences (UI Customizations)
            API->>Backend: GET /api/v1/system/profile (Organization settings)
            API->>Backend: GET /api/v1/shell/navigation (Fetch sidebar JSON)
            API->>Backend: GET /api/v1/workspace/config (Fetch active workspace)
        end
        alt Boot Successful (API is Live)
            Backend-->>Provider: Returns user profile & configurations
            Provider->>Provider: Set isBooting = false, isApiLive = true
            Provider->>User: Mount AppShell & redirect to AppLauncher
        else Boot Fails (401/403 Unauthorized)
            Backend-->>Provider: returns 401/403
            Provider->>Provider: trigger logout() (wipe token)
            Provider->>User: Redirect to /login
        else Backend Offline (Network Error)
            API--xBackend: Connection Refused
            Provider->>Provider: Set isApiLive = false
            Provider->>Provider: Populate mock data (Sandbox Mode)
            Provider->>User: Mount AppShell in Sandbox Mode
        end
    else No Token Found
        Provider->>User: Redirect to /login
    end
```

> [!IMPORTANT]
> If the API server is offline or unreachable, the frontend automatically degrades into **Offline Sandbox Mode**. It loads mock data from [OfflineCacheManager.js](file:///c:/Users/KUNAL/OneDrive/Documents/Projects/B-core_Nexus/b-core_nexus/frontend/src/services/OfflineCacheManager.js) so that developers can test UI layouts without a running backend.

---

## 2. Authentication & MFA Workflow

Authentication is implemented in [Login.tsx](file:///c:/Users/KUNAL/OneDrive/Documents/Projects/B-core_Nexus/b-core_nexus/frontend/src/pages/Login.tsx) and supports dynamic Multi-Factor Authentication (MFA) intercepts.

### Authenticating Flow

```mermaid
graph TD
    A[User enters Email/Password] --> B(POST to /api/v1/auth/login)
    B --> C{Backend check credentials}
    C -- Invalid --> D[Display Incorrect Email/Password]
    C -- Valid & No MFA Required --> E[Return JWT Access Token]
    C -- Valid & MFA Required --> F{Is TOTP configured?}
    
    F -- No (Admin/Manager Setup Required) --> G[Return 403 MFA_SETUP_REQUIRED with provisioning URI]
    G --> H[Show QR Code & input TOTP verification code]
    H --> I(Resubmit credentials + TOTP to /auth/login)
    
    F -- Yes (Code Required) --> J[Return 403 MFA_CODE_REQUIRED]
    J --> K[Prompt for 6-digit TOTP code]
    K --> I
    
    I --> L{Backend validates TOTP}
    L -- Valid --> E
    L -- Invalid --> M[Display Invalid Verification Code]
    E --> N[Save tokens to LocalStorage & redirect to index /]
```

> [!NOTE]
> Under the B-Core design system, administrators (`admin`) and system managers (`system_manager`) are forced into mandatory MFA. Other role classes can use optional MFA configurations.

---

## 3. User Onboarding Workflow

New users are registered through a secure onboarding workflow initiated by an admin and completed by the invitee.

```mermaid
flowchart TD
    A[Admin fills Invite form] --> B(POST /api/v1/iam/users/invite)
    B --> C[Backend generates secure JWT invitation token]
    C --> D[Email sent to invitee with onboarding URL: /onboard?token=...]
    D --> E[Invitee clicks link and loads Onboarding.tsx]
    E --> F(POST /api/v1/auth/onboard/verify)
    F --> G{Token Valid & Unclaimed?}
    G -- No --> H[Show Expired/Activated Error]
    G -- Yes --> I[Prompt invitee to enter new password]
    I --> J(POST /api/v1/auth/onboard/password)
    J --> K[Backend hashes password, creates EmployeeProfile, links Role]
    K --> L[Redirect user to /login]
```

---

## 4. Real-time Events & WebSockets Workflow

The application stays synchronized with backend data mutations and system alerts using two WebSocket channels established upon login.

### 1. Global State Mutation Listener
- **Provider**: [useGlobalWebSocket.js](file:///c:/Users/KUNAL/OneDrive/Documents/Projects/B-core_Nexus/b-core_nexus/frontend/src/providers/useGlobalWebSocket.js)
- **Path**: `ws://<host>/api/v1/stream?token=<token>&workspace=<key>`
- **Workflow**:
  1. The client establishes a persistent connection.
  2. When the backend mutates resource state (e.g. invoice updated, leave approved), it broadcasts a `STATE_MUTATION` payload containing details of the change.
  3. The hook catches this and fires a custom DOM event:
     ```javascript
     window.dispatchEvent(new CustomEvent('STATE_MUTATION', { detail: payload }));
     ```
  4. Active components (like [UniversalDataGrid](file:///c:/Users/KUNAL/OneDrive/Documents/Projects/B-core_Nexus/b-core_nexus/frontend/src/components/ui/UniversalDataGrid.jsx)) listen to this event and trigger data re-fetching to update tables in real time.

### 2. Emergency Broadcast Channel (Command Center)
- **Component**: [CommandCenter.tsx](file:///c:/Users/KUNAL/OneDrive/Documents/Projects/B-core_Nexus/b-core_nexus/frontend/src/components/admin/CommandCenter.tsx)
- **Path**: `ws://localhost:8001/api/v1/events/ws/00000000-0000-0000-0000-000000000000?token=<token>`
- **Workflow**:
  1. Administrative accounts can access the **Event Engine**.
  2. Submitting an emergency alert sends a `blocker_beacon` payload to the socket.
  3. The socket broadcasts a force-logout or alert banner payload to all affected client sessions.

---

## 5. UI Layouts & Role-Based Access Control (RBAC)

Routing in [AppRouter.jsx](file:///c:/Users/KUNAL/OneDrive/Documents/Projects/B-core_Nexus/b-core_nexus/frontend/src/routes/AppRouter.jsx) enforces security clearance layout boundaries using user permission strings.

```mermaid
graph TD
    A[Request Route] --> B{Is Route Public?}
    B -- Yes (/login, /onboard) --> C[Mount component directly]
    B -- No --> D{Does active JWT token exist?}
    D -- No --> E[Redirect to /login]
    D -- Yes --> F[Mount inside AppShell / AppShellOrTierZero]
    F --> G{Checks User clearance levels}
    G -- Tier 0: Root Admin --> H[Enable Event Engine / System Health settings]
    G -- Tier 1: Executive --> I[Enable Organization / Billing controls]
    G -- Tier 2/3/4: Workspace Operator --> J[Mount specific dashboard: CRM, HR, Finance, Operations]
```

### Layout guards mapping
- **`/root`**: Restricts access to System Admin dashboard (`SystemAdminDashboard.tsx`) using the `system:admin` permission guard.
- **`/executive`**: Restricts access to Executive Dashboard (`ExecutiveDashboard.tsx`) using the `organization:write` or `iam:manage` roles.
- **`/users` & `/roles`**: Restricted by layout check ensuring user has the `"iam:manage"` capability.
