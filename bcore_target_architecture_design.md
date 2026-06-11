# B-Core Nexus - Target System Design Proposals

To evolve the V1 Beta into a scalable, enterprise-grade architecture, we must address the tight coupling and monolithic patterns currently in place. As a Cloud Architect, I propose the following High-Level Design (HLD) and Low-Level Design (LLD) improvements:

---

## 1. High-Level Design (HLD) Suggestions

### A. Event-Driven Architecture for Domain Decoupling
Currently, the Core and Workspaces (like CRM) are coupled. We should transition to an **Event-Driven Architecture (EDA)**.
*   **The Change:** Instead of the Core directly calling or importing CRM logic/models, use an internal message broker (like Redis Streams, RabbitMQ, or Apache Kafka).
*   **The Flow:** When a user is added to the Directory (Core), the Core emits a `DirectoryProfileCreated` event. The CRM workspace independently listens to this event and creates a linked `Customer` record. This ensures the Core can function perfectly even if the CRM module is disabled or fails.

### B. API Gateway & Microservice Readiness
The FastAPI app currently acts as the API Gateway, Authentication Provider, and Business Logic executor.
*   **The Change:** Introduce a dedicated API Gateway (e.g., Traefik, Kong, or Nginx API Gateway) in the `docker-compose.yml`.
*   **The Benefit:** Offload JWT validation, CORS, and rate limiting to the Gateway. This simplifies the FastAPI application and paves the way to easily split the Core and Workspaces into distinct containerized microservices in the future.

### C. Micro-Frontend (MFE) Architecture
The React frontend is currently a monolith (`App.jsx`).
*   **The Change:** Implement a **Module Federation** approach using Vite or Webpack.
*   **The Benefit:** Create a "Host Application" (the top navigation shell) and treat the Global Directory, Catalog, and Virtual Grid as independently deployable remote modules. This allows different engineering teams to update the CRM UI without redeploying the core Shell UI.

---

## 2. Low-Level Design (LLD) Suggestions

### A. Dynamic Plugin Registry for SQLAlchemy (Fixing Eager Imports)
To remove the anti-pattern of explicitly importing `Customer` and `Department` models in `main.py`, we need a dynamic registry.
*   **Implementation:** 
    *   Create a `PluginRegistry` singleton.
    *   Each workspace (e.g., `app.workspaces.crm`) has a `register.py` module.
    *   On FastAPI startup, the core dynamically scans the `workspaces/` directory, imports the `register.py` file of active plugins, and allows them to inject their models into the SQLAlchemy `Base.metadata` and bind their routers.
    *   **Result:** `main.py` becomes completely agnostic of what workspaces exist.

### B. Repository Pattern & Contextual Error Handling
The global `SQLAlchemyError` handler masks all database integrity issues.
*   **Implementation:**
    *   Implement the **Repository Pattern** to abstract database queries from the API route handlers.
    *   Within the repositories, explicitly catch `IntegrityError` (from `sqlalchemy.exc`).
    *   Map these specific database errors to Domain Exceptions (e.g., `DuplicateSKUException`, `InvalidDepartmentException`).
    *   **Result:** When a user tries to create a duplicate catalog item, the API returns a precise `400 Bad Request` with a helpful message, rather than a generic `500 Server Error`.

### C. Frontend Componentization & State Management
Refactoring the 900+ line `App.jsx` is critical for maintainability.
*   **Implementation:**
    *   **State:** Move the mock DB state (`localDirectory`, `localCatalog`) and websocket state into a robust state manager like **Zustand** or **Redux Toolkit**.
    *   **Data Fetching:** Use **React Query (@tanstack/react-query)** to handle API calls, caching, and loading states instead of manual `useEffect` and `fetch()`.
    *   **Components:** Split the UI into functional directories: `src/features/directory`, `src/features/catalog`, etc. The `App.jsx` should only contain the Router definitions.

### D. Asynchronous ContextVars Middleware
The current middleware uses blocking synchronous logic under load.
*   **Implementation:** Use Python's built-in `contextvars` to store the `X-Request-ID` asynchronously. Ensure all logging mechanisms are non-blocking or utilize background tasks (`BackgroundTasks` in FastAPI) to write audit logs without delaying the HTTP response sent back to the client.
