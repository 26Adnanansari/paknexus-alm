# Deployment Guide - Multi-Tenant SaaS Control Plane

This guide provides instructions on how to deploy the Multi-Tenant SaaS Control Plane including the backend, admin dashboard, and tenant application.

## 🚀 Quick Start with Docker

The easiest way to get started is using Docker Compose.

### 1. Prerequisites
- Docker and Docker Compose installed
- A Neon.tech account (recommended for cloud database) or local Postgres
- A SMTP provider (e.g., Gmail, SendGrid) for emails

### 2. Configure Environment
Create a `.env` file in the root directory based on the following template:

```env
# Database
MASTER_DATABASE_URL=postgresql://user:pass@ep-ghost-rider.neon.tech/neondb?sslmode=require
VAULT_MASTER_KEY=your_32_byte_hex_key_here

# Security
SECRET_KEY=your_secure_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret

# Domain Configuration
APP_DOMAIN=yourdomain.com
CORS_ORIGINS=https://admin.yourdomain.com,https://app.yourdomain.com
```

### 3. Spin up Services
```bash
docker-compose up -d --build
```

This will start:
- **Backend API**: http://localhost:8000
- **Admin Dashboard**: http://localhost:3000
- **Tenant App**: http://localhost:3001
- **Local Postgres**: Port 5432 (fallback if no remote DB provided)
- **Redis**: Port 6379 (for caching)

---

## ☁️ Cloud Deployment Platforms

For a production-grade experience, we recommend the following platforms:

### 1. Frontend (Admin Dashboard & Tenant App)
**Recommended: [Vercel](https://vercel.com)**
- **Why**: Native support for Next.js, automatic subdomains, and best performance.
- **Setup**: 
    - Connect your Git repo.
    - Set environment variables in the Vercel dashboard.
    - Add a wildcard domain (e.g., `*.yourdomain.com`) to handle tenant subdomains.

### 2. Backend (FastAPI)
**Recommended: [Railway](https://railway.app) or [Render](https://render.com)**
- **Why**: Easy deployment of Python/Docker apps with managed Redis and Postgres.
- **Setup**:
    - Connect your Git repo.
    - Use the provided `Dockerfile`.
    - Set `APP_DOMAIN` and `CORS_ORIGINS` to point to your frontend URLs.

### 3. Database
**Recommended: [Neon.tech](https://neon.tech)**
- **Why**: Serverless Postgres with instant branching and auto-scaling.
- **Note**: You are already configured to use Neon. Ensure your `MASTER_DATABASE_URL` is correct.

---

## 🛠 Manual Deployment

### Backend (FastAPI)
1. **Install dependencies**: `pip install -r requirements.txt`
2. **Setup DB**: Run `app/db/master_schema.sql` on your master database.
3. **Run**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Frontend (Next.js)
Both `admin-dashboard` and `tenant-app` follow the standard Next.js deployment:
1. `npm install`
2. Configure `.env.local`
3. `npm run build`
4. `npm start`

---

## 🏗 Architecture Notes

### Multi-Tenancy Models Supported:
1. **Isolated Database**: Each tenant has their own Supabase/Neon project.
2. **Schema Isolation (Auto-Provisioning)**: Tenants share a physical database but are isolated into different PostgreSQL schemas (e.g., `tenant_school_a`, `tenant_school_b`).

### Routing:
- The Control Plane uses the `X-Tenant-ID` header or subdomain matching to route requests.
- Subdomain routing is configured via the `APP_DOMAIN` setting.

---

## 🔒 Security Best Practices
- **Credential Encryption**: All tenant database credentials are encrypted at rest using AES-256 via the `VAULT_MASTER_KEY`.
- **CORS**: Ensure `CORS_ORIGINS` is restricted to your production domains.
- **SSL**: Always run behind a reverse proxy (Nginx/Traefik) with SSL enabled for production.
