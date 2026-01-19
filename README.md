# PakAi Nexus

PakAi Nexus is a multi-tenant school management system with a Super Admin Control Plane and individual Tenant (School) Dashboards.

## 🚀 Easy Start (Development)

To launch the entire platform (Backend, Admin, and Tenant App) with one command:

### Windows
1. Double-click `start_dev.bat` in the root directory.
2. Or run in PowerShell: `.\start_dev.ps1`

This will automatically:
- Clean up any old processes running on ports 8000, 3000, and 3001.
- Start the **Backend** on `http://localhost:8000`
- Start the **Admin Dashboard** on `http://localhost:3000`
- Start the **Tenant App** on `http://localhost:3001`

### Docker (Production-ready)
Full containerization is also available:
```bash
docker-compose up -d --build
```

---

## 🛠 Project Structure

## 🚀 Quick Start (Fastest Way to Run)

Use the automated launcher script to start everything at once.

1.  Open **PowerShell** in the project root (`d:\almsaas`).
2.  Run the launcher:
    ```powershell
    .\start_dev.ps1
    ```
    *(Note: The `.\` is important if the script is in your current directory)*

This will:
*   Install Python packages.
*   Start the **FastAPI Backend** on `http://localhost:8000`.
*   Start the **Next.js Frontend** on `http://localhost:3000`.

---

## 🛠️ Detailed Setup

If you need to set up the environment manually or for the first time:

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)
*   Docker & Docker Compose (for Database)

### 1. Database Setup
Start the Postgres database using Docker:
```powershell
docker-compose up -d postgres
```
This runs Postgres on port **5433** (to avoid conflicts with any local Postgres).

### 2. Backend Setup (`/app`)
```powershell
# Create virtual environment (optional but recommended)
python -m venv .venv
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup (`/admin-dashboard`)
```powershell
cd admin-dashboard
npm install
```

---

## 🗄️ Database Management (SQL)

To run SQL scripts or check the database:

### Option A: Using Docker Command
You can execute SQL directly inside the container:
```powershell
docker exec -it almsaas-postgres psql -U postgres -d control_plane
```
Once inside `psql`, you can run commands like:
```sql
\dt                  -- List tables
SELECT * FROM tenants; -- View tenants
```

### Option B: Applying Schema Changes
If you modified `master_schema.sql`, re-apply it (WARNING: Deletes data):
```powershell
docker-compose down -v
docker-compose up -d postgres
```
Or manually run the file:
```powershell
cat app/db/master_schema.sql | docker exec -i almsaas-postgres psql -U postgres -d control_plane
```

### Option C: Creating Superuser
To create the initial admin account (`admin@pakainexus.com` / `admin`):
```powershell
$env:LOCAL_DATABASE_URL='postgresql://postgres:postgres@localhost:5433/control_plane'; python create_superuser.py
```

---

## 🚀 Starting the App (Manual)

If you don't use `start_dev.ps1`, run these in **two separate terminals**:

**Terminal 1: Backend**
```powershell
uvicorn app.main:app --reload --port 8000
```

**Terminal 2: Frontend**
```powershell
cd admin-dashboard
npm run dev
```

---

## ☁️ Deployment Guide

### Backend (FastAPI)
Deploy to **Railway**, **Render**, or **DigitalOcean App Platform**.
1.  **Build Command**: `pip install -r requirements.txt`
2.  **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3.  **Environment Variables**:
    *   `MASTER_DATABASE_URL`: Your production Postgres URL (e.g., NeonDB, Supabase).
    *   `VAULT_MASTER_KEY`: A clean 32-byte hex string.
    *   `SECRET_KEY`: A strong random string.

### Frontend (Next.js)
Deploy to **Vercel** (Recommended).
1.  Connect your GitHub repository to Vercel.
2.  Set Root Directory to `admin-dashboard`.
3.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: Your production Backend URL (e.g., `https://api.pakainexus.com`).
    *   `AUTH_SECRET`: Generate using `npx auth secret`.

### Database
Use a managed Postgres provider like **NeonDB**, **Supabase**, or **Railway**.
1.  Get the Connection String.
2.  Set it as `MASTER_DATABASE_URL` in your Backend environment variables.
