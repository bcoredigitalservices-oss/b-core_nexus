# B-Core Nexus — Frontend Documentation

This folder contains the official developer documentation for the **B-Core Nexus** React frontend.

---

## 📁 Files in this Folder

### 1. [frontend_api_reference.md](./frontend_api_reference.md) ⭐ New
> **Start here for API information.**

A complete, up-to-date list of **every API endpoint called by the frontend**, organized by domain. For each endpoint you'll see:
- HTTP method and path
- Which frontend file(s) make the call
- Implementation status (✅ Working / ⚠️ Partial / ❌ Missing backend handler)

**Total endpoints documented: 70** — 47 implemented, 2 partial, 21 missing.

---

### 2. [api_mapping.md](./api_mapping.md)
The older, detailed mapping document that cross-references frontend components with their backend Python handler files. Includes line number references and notes on discrepancies. Use this when you need to trace a specific call to its exact backend implementation line.

---

### 3. [frontend_workflow.md](./frontend_workflow.md)
High-level guide explaining frontend architecture and workflows:
- App bootstrap lifecycle (token → `/auth/me` → preferences → navigation matrix)
- MFA login intercept logic (mandatory for Admin/Manager, optional for Operators)
- RBAC routing and permission checks
- WebSocket real-time subscription patterns

---

### 4. [dashboard_access_bugs.md](./dashboard_access_bugs.md)
Tracks known issues and bugs related to dashboard routing and role-based access control.

---

## Recent Changes (2026-07-09)

| Area | Change |
|:---|:---|
| **My Profile Settings** | New page at `/settings/profile` with TOTP/MFA Security PIN setup via `POST /auth/totp/setup` |
| **Provision Operator Modal** | Fixed empty dropdown bug — now accepts pre-fetched `departments` and `roles` as props |
| **User Home Dashboard** | Connected to `/organization/profile`, `/tasks/my`, `/iam/departments` with permission-gated UI |
| **Email Dispatch** | Resend API key injected into Docker; `email.py` switched to `http.client` to fix Cloudflare WAF blocking |
| **AppShell Menu** | "System Settings" menu item renamed to "My Profile" to correctly reflect the route |
| **IAM Users Page** | Role column label corrected from "Operator" to actual role name |

---

## Architecture Notes

- **Auth flow**: All authenticated requests go through the Axios client in [`src/services/api/client.ts`](../src/services/api/client.ts) which automatically attaches `Bearer` tokens and handles 401 → refresh → retry.
- **Base URL**: `VITE_API_URL/api/v1` (set in `.env` or passed as Docker build arg)
- **Context provider**: [`AppContext.jsx`](../src/context/AppContext.jsx) is the single source of truth for `currentUser`, `token`, `preferences`, and the `authFetch` helper.
