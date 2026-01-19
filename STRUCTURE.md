# 📂 Project Structure

The **PakAi Nexus** repository is organized as a monorepo containing the Backend (FastAPI) and Frontend (Next.js).

## Root Directory (`d:\almsaas`)
| File/Folder | Description |
|---|---|
| 📂 `app` | **Backend API** (FastAPI) source code. |
| 📂 `admin-dashboard` | **Admin Frontend** (Next.js) for Super Admins & School Admins. |
| 📂 `tenant-app` | (Planned) Mobile App API or specific tenant frontend. |
| 📄 `docker-compose.yml` | Orchestrates the Postgres database and optional services. |
| 📄 `start_dev.ps1` | PowerShell script to launch both servers. |
| 📄 `requirements.txt` | Python dependencies for the backend. |
| 📄 `master_schema.sql` | Database schema located in `app/db/`. |

---

## 🐍 Backend Structure (`/app`)
Follows a **Service-Repository** pattern.

```
app/
├── api/             # API Route Handlers (Controllers)
│   └── v1/          # Versioned endpoints (admin.py, auth.py)
├── core/            # Core Configuration
│   ├── config.py    # Env vars and settings
│   ├── database.py  # DB pool handling
│   └── security.py  # JWT & Password logic
├── db/              # SQL Schemas
│   └── master_schema.sql # Main DB definition
├── middleware/      # Custom Middleware (Tenant isolation)
├── models/          # Pydantic Schemas (Data Validation)
├── services/        # Business Logic Layer (Provisioning, Auth)
└── main.py          # Application Entrypoint
```

## ⚛️ Frontend Structure (`/admin-dashboard`)
Built with **Next.js 15+ (App Router)** and **Server Actions**.

```
admin-dashboard/
├── app/                  # App Router Pages
│   ├── api/auth/         # NextAuth Route Handlers
│   ├── dashboard/        # Protected Admin Routes
│   ├── login/            # Public Login Page
│   └── lib/              # Server Actions (actions.ts)
├── components/           # UI Components
│   ├── ui/               # Shadcn/UI primitives (buttons, inputs)
│   └── tenants/          # Feature-specific components
├── auth.ts               # NextAuth Configuration
├── middleware.ts         # Route Protection Logic
└── public/               # Static assets (images, icons)
```

## 🗄️ Database Schema
*   **Table `tenants`**: Stores school information (Subdomain/ID, Name, Status).
*   **Table `admin_users`**: Super Admins (Platform owners).
*   **Table `tenant_users`**: School Staff & Students (linked to `tenants`).
