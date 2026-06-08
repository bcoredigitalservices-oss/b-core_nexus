# B-Core Nexus - Headless ERP Core

B-Core Nexus is a code-first, instance-isolated, headless ERP Core designed for high-velocity and autonomous agent interactions. 

---

## 🛠️ Architecture Overview

The codebase is split into two primary folders:
1. **`backend/`**: FastAPI engine featuring:
   - **Fail-Safe Startup Verification**: Checks if `DATABASE_URL` is PostgreSQL and terminates if missing or non-compliant to prevent volatile data loss.
   - **Immutable Core Layer (`app/core/`)**: Includes user auth (integer role tiers 1-4), directory profiles (Customer, Vendor, Site), universal catalog (SKU index), and the WebSocket/event-log system.
   - **Dynamic Workspaces Bootstrapper**: scans `app/workspaces/` on boot and mounts any plugin directories containing a `router.py` automatically.
   - **Hybrid Storage Layout**: Relational database columns for strict compliance coupled with a GIN-indexed `custom_attributes` JSONB column for custom workspace-level metadata.
2. **`frontend/`**: React application powered by Vite, featuring:
   - **Identity Switcher**: Easily toggle between Tier 1 (Admin), Tier 2 (Directional), Tier 3 (Supervisor), and Tier 4 (Executor) to test capability guards.
   - **Emergency Blocker Beacon**: Real-time beacon event streams where operators (Tier 4) trigger asset blockages and only Tier 1-3 users can resolve them.
   - **TanStack Virtual Grid**: Virtualizes rendering of up to 100,000 catalog SKUs smoothly at 60 FPS.
   - **Hybrid Connectivity**: Connects to the live FastAPI backend when active, or seamlessly falls back to a sandbox simulation (localStorage powered) for quick prototyping.

---

## 🚀 Getting Started

### 1. Spin up Infrastructure (Database & Redis)
In the root directory, start PostgreSQL 16 and Redis 7:
```bash
docker compose up -d
```

### 2. Configure and Boot Backend
Initialize a Python virtual environment and run the seeder:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations & seed default Tier 1 Admin
python3 -m app.init_db

# Start local server
uvicorn app.main:app --reload --port 8001
```
The backend API documentation will be available at [http://localhost:8001/docs](http://localhost:8001/docs).

### 3. Boot React Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to interact with the dashboard.

---

## 🛡️ Default Seeding Credentials
* **Admin Login**: `admin@bcore.local`
* **Admin Password**: `admin123`
