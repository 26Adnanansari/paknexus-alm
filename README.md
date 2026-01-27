# 🎓 PakNexus ALM - School Management SaaS

**Multi-tenant Academic Learning Management System for Pakistani Schools**

[![Status](https://img.shields.io/badge/status-production--ready-green)]()
[![Version](https://img.shields.io/badge/version-1.2.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-orange)]()

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (Neon account)
- Cloudinary account (optional)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/26Adnanansari/paknexus-alm.git
cd paknexus-alm

# 2. Backend setup
pip install -r requirements.txt
cp .env.example .env  # Configure DATABASE_URL, SECRET_KEY

# 3. Frontend setup
cd tenant-app
npm install
cp .env.local.example .env.local  # Configure API URLs

# 4. Run development servers
# Terminal 1 (Backend)
uvicorn app.main:app --reload

# Terminal 2 (Frontend)
cd tenant-app
npm run dev
```

Visit: http://localhost:3000

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** | 📊 Current state, completed features, architecture |
| **[COMPREHENSIVE_TODO.md](./COMPREHENSIVE_TODO.md)** | ✅ Detailed task checklist |
| **[COST_OPTIMIZATION.md](./COST_OPTIMIZATION.md)** | 💰 Cost-saving strategies |
| **[ID_CARD_RESTRICTION_PLAN.md](./ID_CARD_RESTRICTION_PLAN.md)** | 🔒 Security implementation |

---

## ✨ Features

### ✅ Completed
- 🎓 **Student Management** - CRUD, photos, class assignment
- 👨‍🏫 **Staff Directory** - Teacher profiles, departments
- 🪪 **ID Card System** - Template designer, QR codes, appeals
- 📝 **Admissions** - Public form, admin dashboard
- 📊 **Attendance** - Daily tracking, statistics
- 💰 **Fee Management** - Structure, payments, receipts
- 📚 **Curriculum** - Subject management
- 🎯 **Karma Points** - Gamification system
- 📸 **Moments** - School events feed

### 🚧 In Progress
- 📝 Exam management
- 🗓️ Timetable system
- 📄 Report cards
- 📧 Notifications

---

## 🏗️ Tech Stack

**Backend:**
- FastAPI (Python 3.11)
- PostgreSQL (Neon)
- asyncpg
- JWT authentication

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- NextAuth.js

**Infrastructure:**
- Render.com (Backend)
- Vercel (Frontend)
- Cloudinary (Images)

---

## 📁 Project Structure

```
paknexus-alm/
├── app/                    # FastAPI backend
│   ├── api/v1/            # API routes
│   ├── core/              # Config, DB, security
│   └── main.py            # App entry
├── tenant-app/            # Next.js frontend
│   ├── app/               # Pages (App Router)
│   ├── components/        # React components
│   └── lib/               # Utilities
├── static/                # File uploads
└── docs/                  # Documentation
```

---

## 🔐 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:pass@host/db
SECRET_KEY=your-secret-key-here
CLOUDINARY_URL=cloudinary://key:secret@cloud
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

---

## 🧪 Testing

```bash
# Backend
python -c "from app.api.v1 import students; print('✅ OK')"

# Frontend
cd tenant-app
npm run build
```

---

## 🚀 Deployment

**Automatic deployment on push to `main` branch**

- Backend: https://paknexus-alm.onrender.com
- Frontend: https://paknexus-alm-saas.vercel.app
- API Docs: https://paknexus-alm.onrender.com/docs

---

## 💡 Key Concepts

### Multi-Tenancy
Each school gets isolated database schema. Tenant ID extracted from JWT token.

### Authentication Flow
1. Login → JWT issued with `tenant_id`
2. API requests include token
3. Backend scopes queries to tenant

### File Uploads
- Primary: Cloudinary (auto-optimization)
- Fallback: Local storage (`static/uploads/`)

---

## 🤝 Contributing

1. Check `PROJECT_STATUS.md` for current state
2. Pick a task from `COMPREHENSIVE_TODO.md`
3. Create feature branch
4. Test: `npm run build` + Python imports
5. Submit PR

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/26Adnanansari/paknexus-alm/issues)
- **Docs:** See documentation files above
- **Live Demo:** https://paknexus-alm-saas.vercel.app

---

## 📄 License

MIT License - See LICENSE file

---

**Built with ❤️ for Pakistani Schools**

*Last updated: 2026-01-27*
