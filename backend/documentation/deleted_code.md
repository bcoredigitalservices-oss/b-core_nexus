# Deleted Code Documentation

This document logs code that was actively deleted from the codebase during refactoring, explaining what it was and why it was removed to keep the system clean.

## 1. `POST /api/v1/auth/login/verify-totp`
**What it did:**
This endpoint was intended to verify a TOTP code using a temporary JWT token (`temp_token`) generated during an initial login attempt. 
**Why it was deleted:**
The primary `/login` endpoint handles TOTP codes directly via form data (`totp_code`). The backend does not issue temporary tokens during login, and the frontend simply resubmits the full credential payload to `/login` alongside the TOTP code. Therefore, this endpoint was dead, unused legacy code.

## 2. Duplicated `/token` Logic (`login_for_access_token`)
**What it did:**
It provided the OAuth2 standard `/token` alias. However, it was implemented by copy-pasting the entire 80+ line logic of the `/login` endpoint directly into the `/token` endpoint.
**Why it was deleted:**
Duplicating 80 lines of security and session logic is extremely bad practice (violating DRY principles) and makes maintenance hard. The duplicated logic was deleted, and the `/token` route was updated to simply `await login(...)`, reusing the existing, identical logic from the main login function.

## 3. `OAuth2AliasAPIRouter` Hack
**What it did:**
A custom APIRouter subclass that used Python's garbage collector (`gc`) and stack frame inspection (`inspect`) to violently force FastAPI to register an extra alias for `/api/core/auth/token`.
**Why it was deleted:**
It was fragile "spaghetti" code that bypassed standard routing mechanisms and risked breaking on FastAPI version upgrades. The standard `@auth_router.post("/token")` decorator achieves the exact same Swagger UI compatibility without any hacking.
