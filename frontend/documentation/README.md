# B-Core Nexus Frontend API Mapping Documentation

This folder contains the official documentation mapping the **React Frontend** components and pages to their corresponding **FastAPI Backend** API endpoints.

## Directory Contents

1. **[api_mapping.md](file:///c:/Users/KUNAL/OneDrive/Documents/Projects/B-core_Nexus/b-core_nexus/frontend/documentation/api_mapping.md)**:
   A comprehensive register of all API endpoints referenced by the frontend, categorized by functional areas. It highlights:
   - Frontend files making the call and their line numbers.
   - The HTTP method and URL endpoints.
   - The corresponding Python handler files in the backend.
   - Discrepancies, missing endpoints, or legacy stubs requiring backend resolution.
2. **[frontend_workflow.md](file:///c:/Users/KUNAL/OneDrive/Documents/Projects/B-core_Nexus/b-core_nexus/frontend/documentation/frontend_workflow.md)**:
   A guide explaining the high-level workflows of the React frontend, detailing:
   - The app bootstrapping lifecycle sequence.
   - Authentication, MFA intercepts, and onboarding steps.
   - Real-time updates via WebSockets.
   - Layout boundaries and RBAC access routing.

## Key Purpose
This documentation serves as a development blueprint to bridge the frontend views with the stateless backend core. Since some pluggable workspace controllers (like Finance, HR, Operations, CRM, and Catalog/Directory Core) are in the process of migration to the new string-based Roles & Permissions model, this mapping explicitly marks which endpoints are currently handled by the backend and which ones are placeholders (relying on frontend cache/sandbox fallbacks).
