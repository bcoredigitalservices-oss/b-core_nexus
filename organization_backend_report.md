# Single-Company ERP: Organization Setup Backend Architecture Report

## 1. Executive Summary

This document outlines the backend architectural blueprint for the **Organization Setup** module in a single-company ERP system. 

Unlike multi-tenant systems, this architecture treats the Organization profile as the **Global System Preferences** (a Singleton). Furthermore, it employs a **Decoupled Engine Architecture** for sub-components (like Email, Invoice, and Quotation formats), treating them as independent micro-services or isolated modules that provide rendering services to transactional core modules (like Sales and Finance).

---

## 2. Database Schema Design

The core organization data resides in a strictly enforced singleton table.

### Table: `organizations`
This table must be constrained at the application or database level to only ever hold one record (e.g., `id = 1`).

| Column Name | Data Type | Description / UI Mapping |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Forced to `1`. |
| **General Profile** | | |
| `company_name` | VARCHAR(255) | Legal name of the entity. (Required) |
| `trading_name` | VARCHAR(255) | DBA / Trading name. |
| `registration_date` | DATE | Date of incorporation. |
| `primary_industry` | VARCHAR(100) | |
| `logo_url` | VARCHAR(500) | Cloud storage URL for the company logo. |
| `favicon_url` | VARCHAR(500) | Cloud storage URL for the browser icon. |
| **Legal & Contact** | | |
| `cin_number` | VARCHAR(100) | Corporate Identification Number. |
| `tax_id` | VARCHAR(100) | Primary Tax ID (GSTIN/VAT). |
| `official_email` | VARCHAR(255) | e.g., info@company.com. |
| `phone_number` | VARCHAR(50) | |
| `street_address` | TEXT | |
| `city` | VARCHAR(100) | |
| `state_province` | VARCHAR(100) | |
| `country` | VARCHAR(100) | |
| `zip_code` | VARCHAR(20) | |
| **System & Financial** | | |
| `base_currency` | VARCHAR(3) | e.g., 'USD'. **Critical: Immutable if transactions exist.** |
| `date_format` | VARCHAR(20) | e.g., 'DD-MM-YYYY'. |
| `fiscal_year_start` | VARCHAR(50) | e.g., 'January 1st'. |
| `number_format` | VARCHAR(20) | e.g., '1,234,567.89'. |
| `timezone` | VARCHAR(100) | Global default for rendering timestamps. |
| **Operational Defaults**| | |
| `default_bank_account_id` | UUID/INT (FK)| References `bank_accounts` table. |
| `default_dispatch_warehouse_id`| UUID/INT (FK)| References `warehouses` table. |
| `default_receiving_warehouse_id`| UUID/INT (FK)| References `warehouses` table. |
| `standard_terms` | TEXT | Rich text content for standard T&Cs. |

### Table: `organization_audit_logs`
Used to power the "Recent Organizational Activity" feed on the dashboard.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/INT (PK) | |
| `entity` | VARCHAR(100) | e.g., 'Organization Info', 'Tax Configuration' |
| `action` | VARCHAR(100) | e.g., 'Address Change', 'Base Currency Update Attempt' |
| `user_id` | UUID/INT (FK) | References `users` table. |
| `status` | VARCHAR(50) | 'Completed', 'Pending', 'Flagged' |
| `created_at` | TIMESTAMP | |

> [!CAUTION]
> Backend validation must strictly prevent updates to `base_currency` if any records exist in the general ledger or financial transaction tables. Modifying this mid-lifecycle will corrupt financial reporting.

---

## 3. Core Organization APIs

These REST APIs power the main setup UI tabs and the global state of the frontend.

### A. Configuration Endpoints
*   `GET /api/v1/organization`
    *   Fetches the singleton record. Used to populate the setup form and hydrate global frontend state (Redux/Context) on app load.
*   `PUT /api/v1/organization`
    *   Updates the singleton record. Handles the data from all four UI tabs. Includes validation logic for immutable fields.
*   `POST /api/v1/organization/upload-asset`
    *   Accepts `multipart/form-data` for logo and favicon uploads. Returns cloud storage URLs.

### B. Dashboard Endpoints
*   `GET /api/v1/organization/dashboard-stats`
    *   Aggregates data for KPI cards (Active modules, System status).
*   `GET /api/v1/organization/audit-logs`
    *   Returns paginated records from `organization_audit_logs`.

---

## 4. The "Builder Engine" Architecture (App Selection Menu)

The apps listed at the bottom of the Organization UI (Email Template, Quotation Format, etc.) operate as **Decoupled Engines**. They do not contain business logic related to transactions; they strictly handle layout definition and document compilation.

### The Standardized Engine API Contract
Every engine follows a two-part API contract: Management (for the Admin UI) and Execution (for the internal ERP modules).

#### 1. Management APIs (Admin Builder UI)
Used to create and design the templates.
*   `POST /api/v1/engines/{engine_name}/templates` (Create metadata)
*   `GET /api/v1/engines/{engine_name}/templates` (List templates)
*   `GET /api/v1/engines/{engine_name}/templates/:id` (Fetch raw layout blocks)
*   `PUT /api/v1/engines/{engine_name}/templates/:id` (Save layout edits)
*   `PUT /api/v1/engines/{engine_name}/templates/:id/set-default` (Mark as global default)

#### 2. Execution APIs (Consumer Modules)
Used by operational modules (like Sales) to request a finished document.
*   `POST /api/v1/engines/{engine_name}/templates/:id/render`
    *   **Payload:** Raw JSON data (e.g., Quotation details, Customer info).
    *   **Response:** Compiled file (HTML, PDF, or String) with data merged into the template layout.

> [!TIP]
> By forcing all transactional modules to use the `/render` endpoint, the engines become highly reusable. The Sales module never needs to load a PDF library or understand HTML structure.

---

## 5. Conceptual Backend File Structure

To implement this architecture in a standard MVC or layered backend framework (e.g., Node.js/Express, Python/Django, Java/Spring), the following files and directories will need to be created or modified:

### A. Core Organization Module
*   **Models / Entities:**
    *   `Organization.model.ts` (Defines the singleton schema and constraints).
    *   `OrganizationAuditLog.model.ts`
*   **Controllers / Handlers:**
    *   `OrganizationController.ts` (Handles `GET` and `PUT` HTTP requests).
    *   `OrganizationDashboardController.ts` (Handles KPI and Audit log requests).
*   **Services / Business Logic:**
    *   `OrganizationService.ts` (Contains the critical logic: enforcing singleton rule, validating currency changes against financial ledger, orchestrating file uploads).
*   **Routes:**
    *   `organization.routes.ts`

### B. Builder Engine Sub-Systems
For *each* engine (e.g., Quotation, Email), a dedicated directory structure should be created to ensure isolation:

*   **`modules/engines/quotation-format/`**
    *   `models/QuotationTemplate.model.ts`
    *   `controllers/QuotationTemplateController.ts` (Management APIs)
    *   `controllers/QuotationRenderController.ts` (Execution APIs)
    *   `services/PdfRenderService.ts` (The logic that merges JSON data into the template and generates the PDF).
    *   `routes.ts`

### C. Middleware & Utilities
*   **`middleware/auditLogger.ts`**: A middleware to intercept changes to `/api/v1/organization` and automatically write to the `organization_audit_logs` table.
*   **`utils/storageService.ts`**: Abstraction layer for AWS S3 / GCP Cloud Storage to handle logo and favicon uploads.
