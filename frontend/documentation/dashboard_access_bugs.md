# Dashboard Access & Backend Authentication Bugs

This document details the issues found within the backend authentication and role-mapping services that prevent newly provisioned Administrators from landing on the correct administrative dashboards, defaulting them to the Operator layout instead.

---

## 1. Issue Overview
When a new Administrator account is created and configured via the IAM panel, logging in directs the user to the standard **Operator Workspace Hub** (`/`) rather than the **Administrative Control Center** (`/root` or `/executive`).

---

## 2. Root Cause Analysis (Backend Bugs)

The React frontend relies on two properties from the `currentUser` object (loaded via `GET /api/v1/auth/me`) to determine layout clearance:
1. **`currentUser.permissions`**: Must contain the superuser permission (`*:*`) or directory management permission (`iam:manage`).
2. **`currentUser.functional_roles`**: Must contain the string `"admin"` or `"manager"`.

Both of these properties are empty (`[]`) for newly provisioned users due to the following backend bugs:

### Bug A: Inherited Role Permissions are Ignored during JWT Generation
When a user logs in, the backend encodes their authorized permissions directly into the JWT token claims. However, in the token generation function, the query **only** retrieves direct, user-level permission overrides and completely ignores permissions linked to their assigned database roles (such as the `*:*` permission linked to the `admin` role).

* **Source File:** [app/core/auth/security.py](file:///c:/Users/KUNAL/OneDrive/Documents/Projects/B-core_Nexus/b-core_nexus/backend/app/core/auth/security.py#L30-L37)
* **Code snippet:**
  ```python
  from app.models.user import user_permissions, Permission
  # Bug: Queries ONLY direct user permissions; role permissions are forgotten
  stmt = (
      select(Permission.name)
      .join(user_permissions, Permission.id == user_permissions.c.permission_id)
      .where(user_permissions.c.user_id == user_uuid)
  )
  ```

### Bug B: `functional_roles` is Missing on the User Database Model
The Pydantic output schema `UserRead` defines `functional_roles: list[str] = Field(default_factory=list)`. However, the SQLAlchemy database model class `User` has no property or column named `functional_roles`.
When Pydantic serializes the user object:
- It attempts to fetch `user.functional_roles`, which throws an `AttributeError` on the SQL model.
- Pydantic catches this and falls back to its default value, always returning an empty list (`[]`).

* **Source File:** [app/models/user.py](file:///c:/Users/KUNAL/OneDrive/Documents/Projects/B-core_Nexus/b-core_nexus/backend/app/models/user.py)

---

## 3. Required Fixes (Backend)

To resolve the dashboard access mismatch, the following two changes must be applied to the backend codebase:

### Fix A: Query Both Direct and Role Permissions
Update `create_access_token` in `backend/app/core/auth/security.py` to union the direct permissions with role-based permissions:

```python
async def create_access_token(data: dict, db: AsyncSession) -> str:
    user_id = data.get("sub")
    permissions = []
    if user_id:
        try:
            user_uuid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
            from app.models.user import user_permissions, Permission, user_roles, role_permissions
            
            # 1. Query direct permissions
            direct_res = await db.execute(
                select(Permission.name)
                .join(user_permissions, Permission.id == user_permissions.c.permission_id)
                .where(user_permissions.c.user_id == user_uuid)
            )
            direct_perms = direct_res.scalars().all()

            # 2. Query inherited role permissions
            role_res = await db.execute(
                select(Permission.name)
                .join(role_permissions, Permission.id == role_permissions.c.permission_id)
                .join(user_roles, role_permissions.c.role_id == user_roles.c.role_id)
                .where(user_roles.c.user_id == user_uuid)
            )
            role_perms = role_res.scalars().all()

            # Union both lists
            permissions = list(set(direct_perms).union(set(role_perms)))
        except Exception as e:
            print(f"[JWT] Failed to query user permissions: {e}")

    to_encode = data.copy()
    to_encode["permissions"] = permissions
    # ... rest of token encoding ...
```

### Fix B: Add `functional_roles` Property to User Model
Add the following `@property` to the `User` class in `backend/app/models/user.py` to expose role names to Pydantic:

```python
    @property
    def functional_roles(self) -> list[str]:
        return [role.name for role in self.roles]
```
