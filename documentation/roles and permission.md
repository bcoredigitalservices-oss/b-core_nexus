# B-Core Nexus - Roles and Permissions Documentation

This document describes the Roles and Permissions structure implemented in the FastAPI backend of B-Core Nexus, detailing the capabilities granted by specific permissions and the routes protected by them.

---

## 1. The Superuser Wildcard (`*:*`)
* **Behavior:** The wildcard permission acts as an absolute override. It bypasses any permission check defined via the `RequiresPermission` dependency guard (in [security.py](file:///d:/Dhruv_project/b-core_nexus/backend/app/core/auth/security.py)) or manual privilege checks.
* **Scope:** A user with `*:*` has complete access to **every protected endpoint** in the system.

---

## 2. IAM Management (`iam:manage`)
Enforced primarily through the `require_iam_privilege` guard in [iam/router.py](file:///d:/Dhruv_project/b-core_nexus/backend/app/core/iam/router.py).

* **User Provisioning & Directory Management:**
  * **Provision Users:** Provision a new user profile and generate/email an onboarding link (`POST /api/v1/iam/users/provision`).
  * **Update Access Control:** Modify user details such as designation, department, and base role (`PUT /api/v1/iam/users/{user_id}/access`).
  * **Manage Departments:** Create and register new departments (`POST /api/v1/iam/departments`).
  * **Promote User Roles:** Change the role assigned to a user (`PUT /api/v1/iam/users/{user_id}/roles`).
* **Role & Permission Configuration:**
  * **List Roles:** View all defined system roles (`GET /api/v1/iam/roles`).
  * **Create/Update Roles:** Add new roles or edit metadata of existing roles (`POST /api/v1/iam/roles`, `PUT /api/v1/iam/roles/{role_id}`).
  * **View/Modify Permissions:** Fetch permissions attached to a role or overwrite/replace permissions mapped to a specific role (`GET /api/v1/iam/roles/{role_id}/permissions`, `PUT /api/v1/iam/roles/{role_id}/permissions`).

---

## 3. System Configuration & Telemetry (`system:admin`, `system:write`)
Used to control operations on system-level settings and monitoring features in [system/router.py](file:///d:/Dhruv_project/b-core_nexus/backend/app/core/system/router.py).

* **Actions requiring `system:admin`:**
  * **System Health:** Query system health status, active JWT sessions, and memory usage (`GET /api/v1/system/health`).
  * **Toggle Modules:** Enable or disable core system modules dynamically (`POST /api/v1/system/modules/{module_key}/toggle`).
  * **System Profile:** Fetch the base system initialization configuration (`GET /api/v1/system/profile`).
  * **Hardware & Traffic Telemetry:** Read server hardware metrics (CPU, RAM, Disk) and traffic metrics (request/error counts over the last 60 minutes) (`GET /api/v1/system/telemetry/hardware`, `GET /api/v1/system/telemetry/traffic`, `GET /api/v1/system/telemetry/pulse`).
* **Actions requiring `system:write`:**
  * **Global Preferences:** Overwrite global UI configuration defaults (theme, fonts, dark/light mode, sound settings) for all users (`PUT /api/v1/system/preferences/global`).

---

## 4. User Directory Permissions (`user:invite`, `user:read`, `user:write`, `user:update`)
Specific user-centric permissions used in [auth/router.py](file:///d:/Dhruv_project/b-core_nexus/backend/app/core/auth/router.py) and [iam/router.py](file:///d:/Dhruv_project/b-core_nexus/backend/app/core/iam/router.py).

* **`user:invite`:**
  * **Invite Users:** Send a secure onboarding invitation token via email (`POST /api/v1/auth/invite`).
* **`user:read`:**
  * **List Users:** Query the register of all active users in the system (`GET /api/v1/auth/users`).
* **`user:write`:**
  * **Revoke Session (Force Logout):** Deactivate a user account and immediately broadcast a force logout event over WebSocket streams to terminate active sessions (`POST /api/v1/auth/users/{user_id}/revoke`).
* **`user:update`:**
  * **Promote User Roles:** Change the role assigned to a user (`PUT /api/v1/iam/users/{user_id}/roles` - also allowed by `iam:manage` or `*:*`).

---

## 5. General Authenticated Access (No specific permission required)
These actions only require a valid active JWT session (`get_current_user` dependency):

* **Organization Profile:** View and update the organization's legal name, primary contact details, base currency, and industry vertical (`GET /api/v1/organization/profile`, `PUT /api/v1/organization/profile`).
* **User Profile:** Fetch the currently authenticated user details (`GET /api/v1/auth/me`).
* **Personal Preferences:** Retrieve and update personal UI preferences (`GET /api/v1/system/preferences`, `PUT /api/v1/system/preferences/personal`).
* **MFA Configuration:** Initialize and retrieve TOTP secret setup keys (`POST /api/v1/auth/totp/setup`).
* **Departments View:** Read the hierarchy of departments and managers (`GET /api/v1/iam/departments`).
