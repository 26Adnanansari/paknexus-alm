# 🏗️ Architecture & Development Roadmap

This document outlines the architectural standards and the plan to build **PakAi Nexus** as a robust, scalable, and responsive application.

## 🌟 Software Standards (The "Golden Rules")

To ensure the codebase remains maintainable (Phase 2 and beyond), we will adhere to:

### 1. Frontend (Next.js)
*   **Mobile-First Design**: always code for mobile screens first using Tailwind's default classes (e.g., `w-full`), then add breakpoints for larger screens (`md:w-1/2`).
*   **Component Composition**: Keep components small and focused (Single Responsibility). Use `shadcn/ui` for consistency.
*   **Server Actions**: Use Server Actions for all data mutations to keep business logic secure and close to the backend.
*   **Type Safety**: No `any`. Strict TypeScript interfaces for all API responses.

### 2. Backend (FastAPI)
*   **Service Layer Pattern**: Controllers (`api/`) should only handle HTTP req/res. Business logic goes into `services/`.
*   **Schema Validation**: All inputs/outputs must be validated with Pydantic models.
*   **Stateless Auth**: JWT for everything. No server-side sessions.

### 3. Database
*   **Hard Isolation**: Tenant data is logically isolated by `tenant_id`.
*   **Indexing**: Every foreign key (like `tenant_id`) MUST be indexed for speed.

---

## 📱 Responsiveness Strategy
We will strictly follow industry standard breakpoints:
*   **Mobile**: < 640px (1 column layouts, hamburger menus)
*   **Tablet**: 640px - 1024px (2 column grids, condensed tables)
*   **Desktop**: > 1024px (Full sidebars, complex data tables)

**Testing Plan**:
*   Every feature will be verified at 375px (iPhone SE) and 1920px (Desktop).

---

## 🧩 Modular Subscription Architecture

To support "Pay-Per-Module" pricing, the system will distinguish between **Core** and **Add-on** modules.

*   **Logic**: Tenants subscribe to specific modules. Each module has an associated cost that is added to the base subscription.
*   **Permissions**: The "PakAi Nexus" admin controls which modules are active for a tenant.
*   **Modules List**:
    1.  **Core** (Students, Staff, Attendance) - Base Price.
    2.  **Finance** (+ $X/mo).
    3.  **Transport** (+ $Y/mo).
    4.  **AI Chatbot** (+ $Z/mo) - Premium feature.

---

## 🗺️ Roadmap: Phase 2 (Comprehensive School Management)

We are now entering Phase 2. The system will be built module-by-module to ensure quality and scalability.

### 📍 Core Modules (Immediate Focus)

#### 1. School Branding 🎨
*   **Goal**: Whitelabeling (Logo, Colors, Name).
*   **Tech**: Dynamic CSS variables, Logo upload (Cloud/Local).

#### 2. Admissions & Student Management 👥
*   **Features**: Online application, Document verification, Enrollment workflow, Profile management.
*   **Tech**: Complex Forms (`react-hook-form`), Bulk Import (Excel).

#### 3. ID Card System 🪪
*   **Features**: Dynamic template generation, QR Code embedding (Student ID link), Batch printing (PDF).
*   **Tech**: `react-pdf`, `qrcode.react`, Canvas API.

### 📍 Academic & Staff Modules

#### 4. Staff Management 👨‍🏫
*   **Features**: Teacher profiles, Payroll calculation, Attendance tracking, Workload distribution.
*   **Tech**: RBAC (Role-Based Access Control) improvements.

#### 5. Academic Management 📚
*   **Features**: Curriculum planning, Class scheduling, Subject allocation.
*   **Tech**: Tree-based data structures for subjects/classes.

#### 6. Timetable Management 🗓️
*   **Features**: Automated conflict-free scheduling, Room allocation.
*   **Tech**: Drag-and-drop interface (`dnd-kit`).

#### 7. Examination & Results 📝
*   **Features**: Exam scheduling, Grading systems (GPA/Percentage), Result publication, Report Card generation.
*   **Tech**: Complex data aggregation queries.

#### 8. Attendance System 📅
*   **Features**: Daily/Subject-wise tracking, Late/Absent alerts, Analytics.
*   **Tech**: Fast bulk inserts, Calendar heatmap.

### 📍 Operations, Finance & AI

#### 9. Financial Management 💰
*   **Features**: Fee collection, Invoice generation, Expense tracking, Payment gateway integration.
*   **Tech**: ACID compliant transactions, PDF Invoicing.

#### 10. Transport Management 🚌
*   **Features**: Route planning, Vehicle tracking, Student-bus assignment.
*   **Tech**: Google Maps integration (optional).

#### 11. Library Management 📖
*   **Features**: Book catalog, Issue/Return tracking, Barcode scanning.
*   **Tech**: Search optimization.

#### 12. Communication Hub 📢
*   **Features**: SMS/Email notifications, Parent-Teacher chat, Announcements.
*   **Tech**: WebSocket (real-time chat), Twilio/SMTP integration.

#### 13. AI Chatbot (Premium Add-on) 🤖
*   **Goal**: 24/7 Assistant for all roles.
*   **Use Cases**:
    *   **Students**: "What is my homework?", "When is the next exam?".
    *   **Parents**: "Show me the fee receipt", "Is my child absent?".
    *   **Teachers**: "Mark attendance for Class 9B", "Generate usage report".
    *   **Admin**: "How many admissions today?".
*   **Tech**: RAG (Retrieval Augmented Generation) architecture using vector database (pgvector).

---

## 🚀 Execution Order
1.  **Modify DB** for Branding.
2.  **Update API** to accept file uploads (Logos).
3.  **Build UI** for School Settings.
4.  **Verify** responsiveness on mobile.
