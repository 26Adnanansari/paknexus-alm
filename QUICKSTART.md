# 🚀 Quick Start Guide

## Current Deployed URLs

🌐 **Backend API**: https://paknexus-alm.onrender.com  
📊 **API Docs**: https://paknexus-alm.onrender.com/docs  
👨‍💼 **Admin Dashboard**: https://paknexus-alm.vercel.app  
🏫 **Tenant App**: https://paknexus-alm-saas.vercel.app

---

## ⚡ Local Development Quick Start

### 1. Backend (FastAPI)
```bash
cd d:\almsaas

# Activate virtual environment
.venv\Scripts\activate  # Windows

# Install dependencies (if needed)
pip install -r requirements.txt

# Run backend
uvicorn app.main:app --reload --port 8000

# API will be available at: http://localhost:8000
# Docs at: http://localhost:8000/docs
```

### 2. Admin Dashboard (Next.js)
```bash
cd d:\almsaas\admin-dashboard

# Install dependencies (if needed)
npm install

# Run dev server
npm run dev

# Dashboard at: http://localhost:3000
```

### 3. Tenant App (Next.js)
```bash
cd d:\almsaas\tenant-app

# Install dependencies (if needed)
npm install

# Run dev server
npm run dev

# App at: http://localhost:3000
```

---

## 🧪 Test the System

### Option A: Use Deployed Apps (Recommended)

**Step 1: Create a School**
1. Visit: https://paknexus-alm-saas.vercel.app/signup
2. Fill in school information
3. Create admin account
4. Note the subdomain assigned

**Step 2: Login**
1. Visit: https://paknexus-alm-saas.vercel.app/login
2. Use your admin email and password
3. Explore the dashboard

**Step 3: Test Features**
- Go to Students → Click "Enroll Student"
- Fill the form (admission date required!)
- View the student list

### Option B: Test Locally

**Prerequisites**:
- Backend running on port 8000
- Tenant app running on port 3000
- Database connected (check `.env` file has `DATABASE_URL`)

**Test Flow**:
1. Open http://localhost:3000/signup
2. Register a school
3. Login at http://localhost:3000/login
4. Navigate to Students
5. Add a test student

---

## 🔧 Quick Fixes if Something Breaks

### Issue: "Failed to fetch students" or 403 Error
**Solution**: Check if you're logged in and token is valid
```bash
# Clear browser localStorage
# Re-login to get fresh token
```

### Issue: "Student not adding"
**Check**:
1. Backend updated with `admission_date` field?
2. Frontend sending correct field names?
3. Database has `admission_date` column with default?

### Issue: "Registration failed"
**Check**:
1. Backend URL correct in `.env.local`?
2. Verify: `NEXT_PUBLIC_API_URL=https://paknexus-alm.onrender.com`

---

## 📦 Deploy Your Changes

### Backend to Render:
```bash
git add .
git commit -m "feat: Your changes description"
git push origin main
# Render auto-deploys in ~5 minutes
```

### Frontend to Vercel:
```bash
# Will auto-deploy on push to main
git push origin main
# Or use Vercel CLI:
npx vercel --prod
```

---

## 🎯 What to Build Next

**Choose one based on priority**:

### 1. School Branding UI (2-3 hours)
**What**: Allow schools to upload logo and set colors
**Files to create**:
- `tenant-app/app/dashboard/settings/branding/page.tsx`
- Upload component for logo
- Color picker for primary/secondary colors

### 2. ID Card Generation (3-4 hours)
**What**: Generate student ID cards with QR codes
**Files to create**:
- `tenant-app/app/dashboard/students/[id]/id-card/page.tsx`
- PDF generation using `@react-pdf/renderer`
- QR code generation
- Template configuration

### 3. Mobile Dashboard Fix (1-2 hours)
**What**: Fix admin dashboard mobile responsiveness
**Files to modify**:
- `admin-dashboard/app/dashboard/page.tsx`
- Improve grid layouts
- Larger text and touch targets

### 4. QR Code Attendance (4-5 hours)
**What**: Mark attendance by scanning QR codes
**Files to create**:
- `tenant-app/app/dashboard/attendance/scan/page.tsx`
- Camera access and QR scanner
- Session QR generation for teachers

---

## 📚 Helpful Commands

### Check Backend Logs (Render):
Visit: https://dashboard.render.com → Select service → Logs

### Check Frontend Logs (Vercel):
Visit: https://vercel.com/dashboard → Select project → Deployment logs

### Database Access (Neon):
Visit: https://console.neon.tech → Select project → SQL Editor

### Test API Endpoints:
```bash
# Using curl:
curl https://paknexus-alm.onrender.com/health

# Test registration:
curl -X POST https://paknexus-alm.onrender.com/api/v1/public/register \
  -H "Content-Type: application/json" \
  -d '{
    "school_name": "Test School",
    "subdomain": "test-school",
    "admin_email": "admin@test.com",
    "admin_password": "password123"
  }'
```

---

## 🔐 Environment Variables Checklist

### Backend (.env):
```bash
DATABASE_URL=postgresql://...neon.tech/...
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Admin Dashboard (.env.local):
```bash
NEXT_PUBLIC_API_URL=https://paknexus-alm.onrender.com
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://paknexus-alm.vercel.app
```

### Tenant App (.env.local):
```bash
NEXT_PUBLIC_API_URL=https://paknexus-alm.onrender.com
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://paknexus-alm-saas.vercel.app
```

---

## 🎨 UI Components Available

Your apps use **shadcn/ui**. Add new components:

```bash
cd tenant-app  # or admin-dashboard

# Add a component:
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select

# View all available:
npx shadcn-ui@latest add
```

---

## 📖 Documentation Files Created Today

1. **COMPREHENSIVE_TODO.md** - Full feature roadmap (200+ items)
2. **FIXES_APPLIED.md** - What was fixed today
3. **DEPLOYMENT_STATUS.md** - Deployment analysis
4. **SESSION_SUMMARY.md** - Complete session overview
5. **QUICKSTART.md** - This file

**Read these in order** for full context!

---

## 💡 Pro Tips

### Debugging:
```bash
# Backend logs:
tail -f logs/app.log  # if you set up file logging

# Frontend errors:
# Open browser DevTools → Console

# Database queries:
# Check Neon SQL Editor for query results
```

### Performance:
```bash
# Check API response times:
curl -w "@-" -o /dev/null -s https://paknexus-alm.onrender.com/health << 'EOF'
\ntime_total: %{time_total}s\n
EOF

# Check frontend load time:
# Use Chrome Lighthouse (DevTools → Lighthouse)
```

### Security:
```bash
# Test for SQL injection:
# Try: admin@test.com' OR '1'='1
# Should be blocked by parameterized queries ✅

# Test password strength:
# Try weak passwords - should reject if < 8 chars ✅
```

---

## 🚨 Support

If stuck:
1. Check API docs: `/docs` endpoint
2. Review error messages in browser console
3. Check backend logs on Render
4. Verify environment variables
5. Test with Postman/curl first

---

## 🎯 Success Checklist

- [ ] Backend running successfully
- [ ] Frontend apps load without errors
- [ ] Can register a new school
- [ ] Can login with created account
- [ ] Can access dashboard
- [ ] Can add a student
- [ ] Student appears in list

**If all checked** ✅ - System is working!

---

**Last Updated**: January 25, 2026  
**Version**: 1.0  
**Status**: Ready for Development 🚀

---

💬 **Need help?** Just ask! I'm here to assist with any feature you want to build next.
