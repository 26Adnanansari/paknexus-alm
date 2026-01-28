# 🎯 Comprehensive Implementation & Fix Plan

> **📌 QUICK STATUS:** See `PROJECT_STATUS.md` for current state and completed features.  
> **Last Updated:** 2026-01-28 | **Completed:** ID Cards, Admissions, Timetable, Attendance, Exams, Results, Transport, Inventory, Library, Communication, Finance Reports ✅

## 🚨 **EMERGENCY BUG FIXES (IMMEDIATE PRIORITY)**

### 0. Critical Backend & Frontend Fixes
- [x] **FIX**: `GET /api/v1/students/next-id` 422 Error (Validation/Table missing)
- [x] **FIX**: `GET /api/v1/students` 500 Error (Crash on list)
- [x] **FIX**: `GET /api/v1/attendance/stats` 404 Error (Endpoint missing)
- [x] **FIX**: `POST /api/v1/attendance/system/init-tables` 404 Error (Alias missing)
- [x] **FIX**: `GET /api/v1/id-cards/templates` 422 Error (Schema validation)
- [ ] **FIX**: "Auto session creating" loop in Frontend (Login/Auth loop)
- [ ] **FIX**: ID Card Uploaded Templates not showing (Checkboxes/Table UI)
- [ ] **FIX**: Student List Filters (Class, Last Generated, Is Student)

## 🚨 **CRITICAL ISSUES (FIX IMMEDIATELY)**

### 1. Security & Authentication Issues ⚠️

#### 1.1 Login/Signup Page Issues
- [ ] **CRITICAL**: Login page missing "Sign Up" or "Register" link
  - Tenant users cannot self-register
  - No path for new schools to get started
- [ ] **UX ISSUE**: Password field missing eye icon for show/hide toggle
  - Poor UX for users entering passwords
  - Industry standard missing
- [ ] **MISSING**: Signup/Registration page for tenant app
  - Create complete registration flow
  - Include school information collection
  - Trial activation flow

#### 1.2 Trial Access Security 🔐
- [x] **SECURITY FLAW**: No access control on trial tenants
  - [x] Anyone can access trial accounts without proper authorization
  - [x] Need to implement proper trial signup flow with email verification
  - [x] Add CAPTCHA or rate limiting to prevent abuse
- [x] **MISSING**: Trial expiration enforcement
  - [x] System allows access even after trial expires
  - [x] Need automatic lockout mechanism
  - [x] Grace period implementation

#### 1.3 Tenant Schema Security Issues
- [ ] **CRITICAL**: Review tenant isolation implementation
  - Verify schema-level isolation is working correctly
  - Test cross-tenant data leakage scenarios
  - Implement additional RLS policies
- [ ] **MISSING**: Proper error handling for 403 Forbidden errors
  - Students not adding due to permission issues
  - Need better error messages and logging
  - Fix role-based access control (RBAC)

### 2. Student Management Issues 🎓

#### 2.1 Backend Issues
- [x] **BUG**: Students not adding properly
  - [x] Check backend validation errors
  - [x] Review database constraints (date_of_birth vs admission_date)
  - [x] Fix unique constraint handling
- [x] **MISSING**: admission_date field not in CREATE form
  - [x] Schema requires admission_date (NOT NULL)
  - [x] Frontend form missing this field
  - [x] Add admission_date to StudentCreate model and form

#### 2.2 Frontend Issues
- [x] **BUG**: Field mismatch between frontend and backend
  - [x] Frontend sends `contact_phone` 
  - [x] Backend expects `father_phone`
  - [x] Fix column mapping in students.py line 72-77
  - [x] Added Photo URL support
  - [x] Added Email and Address support
  - [x] Added Auto-ID Suggestion

### 3. Database Schema Discrepancies 🗄️

#### 3.1 Students Table Issues
- [ ] **MISMATCH**: tenant_schema_template.sql vs API expectations
  - Schema has: `supabase_project_url`, `supabase_service_key`
  - Code references: `supabase_url`
  - Update schema or code for consistency
- [ ] **MISSING**: Country default should be 'Pakistan' not 'USA'
  - Line 37 in tenant_schema_template.sql
  - Localization needed

#### 3.2 Neon vs Supabase Migration
- [ ] **UPDATE SCHEMA**: Remove Supabase-specific fields
  - Update master_schema.sql references
  - Change to generic `db_connection_url`
  - Update all documentation

---

## 📱 **MOBILE UI/UX ISSUES**

### 4. Admin Dashboard Mobile Responsiveness 📲

#### 4.1 Dashboard Layout
- [ ] **POOR UX**: Dashboard not mobile-optimized
  - Stats cards not stacking properly on mobile
  - Text too small on mobile devices
  - Touch targets below 44x44px minimum
- [ ] **ACCESSIBILITY**: Missing proper mobile navigation
  - Hamburger menu issues
  - Sidebar overlap problems
  - Z-index conflicts

#### 4.2 Tenant App Mobile Issues
- [ ] **FIX**: Students page mobile card layout spacing
  - Improve touch targets (already partially done)
  - Better mobile typography
  - Optimize for one-handed use
- [ ] **MISSING**: Mobile-first CSS for all pages
  - Teachers page
  - Attendance page
  - Fees page
  - Dashboard home

---

## 🎨 **BRANDING & WHITELABELING**

### 5. School Branding System

#### 5.1 Database Schema
- [x] Logo URL field exists in tenants table
- [x] Primary/Secondary color fields exist
- [ ] **ADD**: Logo storage location field
  - Local storage path
  - Cloud storage URL
  - CDN configuration

#### 5.2 Backend API
- [ ] **CREATE**: Logo upload endpoint
  - `/api/v1/school/branding/upload-logo`
  - File validation (image types only)
  - Size limits (max 1MB)
  - Generate thumbnails for different sizes
- [ ] **CREATE**: Branding settings endpoint
  - GET `/api/v1/school/branding`
  - PUT `/api/v1/school/branding`
  - Return colors, logo, school name

#### 5.3 Frontend Implementation
- [ ] **CREATE**: Branding settings page in admin
  - Logo upload with preview
  - Color picker for primary/secondary
  - School name editor
  - Live preview panel
- [x] Branding context exists (branding-context.tsx)
- [ ] **UPDATE**: Apply branding throughout app
  - Use CSS variables for colors
  - Display logo in navbar
  - **CRITICAL**: Show logo on ID cards
  - Apply to all email templates

#### 5.4 ID Card Logo Integration
- [ ] **ADD**: Schema for ID card templates
  - Template design storage
  - Logo placement configuration
  - QR code positioning
- [ ] **IMPLEMENT**: Dynamic ID card generation
  - Use school logo from branding
  - Student photo
  - QR code with student ID URL
  - Batch generation for classes
  - Print-ready PDF export

---

## 👥 **ADMISSIONS & STUDENT MANAGEMENT**

### 6. Student Management (Current Issues)

#### 6.1 Fix Current Implementation
- [ ] **FIX**: Update StudentCreate model
  ```python
  class StudentCreate(BaseModel):
      full_name: str
      admission_number: str
      admission_date: date  # ADD THIS
      date_of_birth: date
      gender: str
      current_class: Optional[str] = None
      father_name: Optional[str] = None
      father_phone: Optional[str] = None  # Fix field name
  ```

- [x] **FIX**: Update frontend form
  - [x] Add admission_date date picker
  - [x] Rename contact_phone to father_phone
  - [x] Add validation messages

#### 6.2 Enhanced Student Features
- [x] **CREATE**: Student profile page
  - [x] View/edit student details
  - [x] Upload student photo
  - [x] Academic history (via documents)
  - [x] Attendance summary (placeholder)
  - [x] Fee payment history (placeholder)
  - [x] Exam results (placeholder)

- [x] **CREATE**: Bulk student import
  - [x] Excel/CSV upload
  - [x] Template download
  - [x] Data validation
  - [x] Duplicate detection (via backend unique check)
  - [x] Error reporting

- [x] **CREATE**: Document management
  - [x] Birth certificate upload
  - [x] Previous school documents
  - [x] Medical records
  - [x] ID proof (Aadhaar/B-Form)

### 7. Online Admissions System

### 7. Online Admissions System
- [x] **CREATE**: Public admission form
  - [x] No login required
  - [x] Progressive form (single-step for MVP)
  - [x] File uploads (Cloudinary integrated)
  - [x] Email/Phone collection

- [x] **CREATE**: Admission workflow
  - [x] Application submission
  - [x] Status tracking (pending/approved/rejected)
  - [x] Entry Test redirection optional

- [x] **CREATE**: Admin admission dashboard
  - [x] Pending applications list
  - [x] Review interface
  - [x] Status updates
  - [x] Settings & Public Link Management

---

## 🪪 **ID CARD SYSTEM**

### 8. Student ID Card Generation

#### 8.1 Database Schema
- [x] **CREATE**: id_card_templates table
  - Created via `init-templates`
  - Supports multiple backgrounds (Front/Back)
  - Supports separate layouts logic

- [x] **CREATE**: student_id_cards table
  - Existing `student_id_cards` table used.

#### 8.2 Backend Implementation
- [x] **CREATE**: ID card generation service
  - [x] Dynamic template rendering (Frontend canvas)
  - [x] QR code generation (Frontend reacting)
  - [x] School logo integration
  - [x] PDF generation (Frontend `react-to-print` or similar)

- [x] **CREATE**: ID card endpoints
  - [x] POST `templates` (Create/Save)
  - [x] GET `templates` (List)
  - [x] POST `upload/image` (Cloudinary)

#### 8.3 Frontend Implementation
- [x] **CREATE**: ID card design tool
  - [x] Upload Front/Back images
  - [x] Preview with Flip animation
  - [x] Save custom templates

- [x] **CREATE**: ID card generation page
  - [x] Select Template
  - [x] Batch generation by class
  - [x] Print preview (Flip Card)

#### 8.4 ID Card Edit Restriction & Appeal System 🔒
- [x] **CRITICAL SECURITY**: Implement one-time edit restriction
  - [x] Public users can only edit ID card form ONCE before submission
  - [x] After submission, forms become READ-ONLY
  - [x] Appeal System implemented

- [x] **DATABASE SCHEMA**: Add tracking fields
  - [x] Status, submission_count, is_editable added

- [x] **CREATE**: Appeal system table
  - [x] `id_card_appeals` table created

- [x] **BACKEND**: Appeal workflow API
  - [x] POST/GET appeals endpoints created

- [x] **FRONTEND**: Appeal management
  - [x] Admin dashboard (Appeals tab)
  - [x] Student interaction flow

#### 8.5 Technologies
- [x] **INSTALL**: Required packages
  - [x] `react-qr-code`
  - [x] `cloudinary`
  - [x] `framer-motion`

---

## 👨‍🏫 **STAFF MANAGEMENT**

### 9. Teacher & Staff Module

#### 9.1 Current State
- [x] Staff table exists in schema
- [x] **PARTIAL**: Complete CRUD operations (List/Create done)
- [x] **PARTIAL**: Frontend pages (Directory done)

#### 9.2 Backend Development
- [x] **CREATE**: Staff API endpoints
  - [x] GET `/api/v1/staff` - List all staff
  - [x] POST `/api/v1/staff` - Add new staff
  - [x] PUT `/api/v1/staff/{id}` - Update staff
  - [x] DELETE `/api/v1/staff/{id}` - Remove staff
  - [ ] GET `/api/v1/staff/{id}/workload` - View teaching load

- [ ] **CREATE**: Payroll calculation service
  - Monthly salary calculation
  - Deductions (tax, advance)
  - Allowances
  - Generate pay slips

#### 9.3 Frontend Development
- [x] **CREATE**: Staff directory page
  - [x] List view with filters (department, role)
  - [x] Search by name/employee ID
  - [x] Add staff modal/page
  - [x] Staff profile cards

- [x] **CREATE**: Staff profile page
  - [x] Personal details
  - [x] Professional qualifications
  - [x] Assigned classes/subjects (placeholder)
  - [x] Attendance history (placeholder)
  - [x] Salary details (placeholder)

- [ ] **CREATE**: Staff attendance page
  - Mark daily attendance
  - View attendance reports
  - Leave management

- [ ] **CREATE**: Payroll management
  - Generate monthly payroll
  - Pay slip generation
  - Payment history

#### 9.4 RBAC Enhancement
- [ ] **IMPLEMENT**: Role-based permissions
  - Principal: Full access
  - Admin: All except financial
  - Teacher: Own data + assigned classes
  - Accountant: Financial modules only

---

## 📚 **ACADEMIC MANAGEMENT**

### 10. Classes & Subjects

#### 10.1 Current State
- [x] Classes table exists
- [x] Subjects table exists
- [x] class_subjects junction table exists
- [x] **MISSING**: Frontend implementation
- [x] **MISSING**: API endpoints

#### 10.2 Backend Development
- [x] **CREATE**: Classes API
  - [x] CRUD for classes
  - [x] Assign class teacher
  - [ ] Add students to class
  - [ ] Remove/transfer students

- [x] **CREATE**: Subjects API
  - [x] CRUD for subjects
  - [x] Assign subjects to classes
  - [x] Assign teachers to subjects

#### 10.3 Frontend Development
- [x] **CREATE**: Classes management page
  - [x] List all classes
  - [x] Add/edit class
  - [x] Assign teacher
  - [ ] View students in class
  - [ ] Bulk operations

- [x] **CREATE**: Subjects management page
  - [x] Subject catalog
  - [x] Subject allocation by class
  - [x] Teacher assignment

- [ ] **CREATE**: Curriculum planning tool
  - Academic year setup
  - Term/semester configuration
  - Syllabus management

---

## 🗓️ **TIMETABLE MANAGEMENT**

### 11. Class Scheduling

#### 11.1 Database Schema
- [ ] **CREATE**: timetable tables
  ```sql
  CREATE TABLE timetable_slots (
      slot_id UUID PRIMARY KEY,
      class_id UUID REFERENCES classes,
      subject_id UUID REFERENCES subjects,
      teacher_id UUID REFERENCES staff,
      day_of_week INTEGER, -- 1-7
      start_time TIME,
      end_time TIME,
      room_number VARCHAR(20),
      academic_year VARCHAR(20)
  );
  ```

- [ ] **ADD**: Conflict detection constraints
  - Teacher cannot be in two places
  - Room cannot be double-booked
  - Class cannot have overlapping periods

#### 11.2 Backend Development
- [ ] **CREATE**: Timetable generation algorithm
  - Constraint satisfaction
  - Conflict detection
  - Auto-scheduling with preferences

- [ ] **CREATE**: Timetable API
  - GET timetable by class/teacher
  - Save/update timetable
  - Detect conflicts

#### 11.3 Frontend Development
- [ ] **CREATE**: Timetable builder
  - Drag-and-drop interface using `@dnd-kit/core`
  - Weekly grid view
  - Color-coded subjects
  - Real-time conflict warnings

- [ ] **CREATE**: Timetable views
  - Class-wise view
  - Teacher-wise view
  - Room-wise view
  - Printable format

---

## 📝 **EXAMINATION & RESULTS**

### 12. Exam Management

#### 12.1 Current State
- [x] Examinations table exists
- [x] exam_schedule table exists
- [x] exam_results table exists
- [ ] **MISSING**: All implementation

#### 12.2 Backend Development
- [ ] **CREATE**: Exam management API
  - Create exam
  - Create schedule for exam
  - Enter marks
  - Calculate grades
  - Generate report cards

- [ ] **CREATE**: Grading system service
  - GPA calculation
  - Percentage calculation
  - Grade assignment (A+, A, B...)
  - Class rank calculation

#### 12.3 Frontend Development
- [ ] **CREATE**: Exam creation page
  - Exam details form
  - Schedule creation
  - Subject-wise configuration
  - Marking scheme

- [ ] **CREATE**: Marks entry page
  - Search by class/subject
  - Bulk marks entry
  - Individual student entry
  - Validation and save

- [ ] **CREATE**: Results publication
  - Generate result cards
  - Publish to students/parents
  - Email notifications
  - PDF report cards

- [ ] **CREATE**: Analytics dashboard
  - Class performance
  - Subject-wise analysis
  - Top performers
  - Improvement areas

---

## 📅 **ADVANCED ATTENDANCE SYSTEM**

### 13. QR Code Based Attendance

#### 13.1 Current State
- [x] Attendance table exists
- [ ] **MISSING**: QR code functionality
- [ ] **MISSING**: Mobile camera access

#### 13.2 Backend Development
- [ ] **CREATE**: QR code generation
  - Generate unique QR for each attendance session
  - Time-limited validity (expires after class)
  - Encrypted student ID in QR

- [ ] **CREATE**: Attendance API enhancements
  - POST `/api/v1/attendance/mark-qr` - Mark via QR scan
  - POST `/api/v1/attendance/generate-session-qr` - Teacher creates QR
  - GET `/api/v1/attendance/reports` - Analytics

#### 13.3 Frontend Development
- [ ] **CREATE**: QR code generation (Teacher)
  - Select class and period
  - Generate time-limited QR code
  - Display on screen
  - Auto-refresh

- [ ] **CREATE**: QR scanner (Student mobile)
  - Request camera permission
  - Scan QR code
  - Mark attendance
  - Confirmation feedback

- [ ] **CREATE**: Manual attendance page
  - Class-wise list
  - Quick mark all present
  - Individual status selection
  - Save attendance

- [ ] **CREATE**: Attendance analytics
  - Calendar heatmap
  - Student-wise percentage
  - Class-wise summary
  - Late/absent alerts

#### 13.4 Technologies
- [ ] **INSTALL**: Required packages
  - `qrcode.react` - Generate QR
  - `react-qr-scanner` or `@zxing/browser` - Scan QR
  - Camera permissions handling

---

## 💰 **FINANCIAL MANAGEMENT**

### 14. Fee Collection System

#### 14.1 Current State
- [x] fee_structure table exists
- [x] fee_payments table exists
- [ ] **PARTIAL**: Frontend exists but incomplete
- [ ] **MISSING**: Payment gateway integration

#### 14.2 Backend Development
- [ ] **CREATE**: Fee structure management
  - Define fee types by class
  - Set due dates
  - Late fee calculation
  - Discount management

- [ ] **CREATE**: Payment processing
  - Record payment
  - Generate receipt
  - Update Outstanding balance
  - Payment history

- [ ] **CREATE**: Payment gateway integration
  - Stripe integration (future)
  - JazzCash/EasyPaisa (Pakistan)
  - Bank transfer recording
  - Payment verification webhooks

#### 14.3 Frontend Development
- [ ] **CREATE**: Fee structure setup
  - Define fees by class/category
  - Set installment plans
  - Configure late fees

- [ ] **CREATE**: Fee collection page
  - Search student
  - View outstanding
  - Record payment
  - Print receipt

- [ ] **CREATE**: Invoice generation
  - Generate fee invoices
  - Email to parents
  - Payment reminders
  - PDF format

- [ ] **CREATE**: Financial reports
  - Daily collection
  - Outstanding fees
  - Collection vs target
  - Defaulter list

#### 14.4 Additional Features
- [ ] **CREATE**: Expense tracking
  - Record school expenses
  - Categorize expenses
  - Monthly expense reports
  - Profit/loss analysis

---

## 🚌 **TRANSPORT MANAGEMENT**

### 15. Vehicle & Route Management

#### 15.1 Database Schema
- [ ] **CREATE**: Transport tables
  ```sql
  CREATE TABLE vehicles (
      vehicle_id UUID PRIMARY KEY,
      vehicle_number VARCHAR(50) UNIQUE,
      vehicle_type VARCHAR(50),
      capacity INTEGER,
      driver_name VARCHAR(100),
      driver_phone VARCHAR(20),
      status VARCHAR(20) -- active, maintenance, inactive
  );
  
  CREATE TABLE routes (
      route_id UUID PRIMARY KEY,
      route_name VARCHAR(100),
      route_description TEXT,
      vehicle_id UUID REFERENCES vehicles,
      fare_amount DECIMAL(10,2)
  );
  
  CREATE TABLE route_stops (
      stop_id UUID PRIMARY KEY,
      route_id UUID REFERENCES routes,
      stop_name VARCHAR(100),
      stop_sequence INTEGER,
      pickup_time TIME
  );
  
  CREATE TABLE student_transport (
      student_id UUID REFERENCES students,
      route_id UUID REFERENCES routes,
      stop_id UUID REFERENCES route_stops,
      PRIMARY KEY (student_id)
  );
  ```

#### 15.2 Backend Development
- [ ] **CREATE**: Transport API
  - Vehicle CRUD
  - Route CRUD
  - Assign students to routes
  - Generate transport fee

#### 15.3 Frontend Development
- [ ] **CREATE**: Vehicle management
  - Add/edit vehicles
  - Assign drivers
  - Maintenance tracking

- [ ] **CREATE**: Route management
  - Create routes with stops
  - Assign vehicle to route
  - Set fare
  - Map view (Google Maps integration - optional)

- [ ] **CREATE**: Student assignment
  - Assign student to route
  - Select pickup stop
  - Generate transport fee automatically

---

## 📖 **LIBRARY MANAGEMENT**

### 16. Book Catalog & Issue/Return

#### 16.1 Database Schema
- [ ] **CREATE**: Library tables
  ```sql
  CREATE TABLE books (
      book_id UUID PRIMARY KEY,
      isbn VARCHAR(20) UNIQUE,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255),
      publisher VARCHAR(255),
      category VARCHAR(100),
      total_copies INTEGER,
      available_copies INTEGER,
      shelf_location VARCHAR(50)
  );
  
  CREATE TABLE book_issues (
      issue_id UUID PRIMARY KEY,
      book_id UUID REFERENCES books,
      student_id UUID REFERENCES students,
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      return_date DATE,
      fine_amount DECIMAL(10,2),
      status VARCHAR(20) -- issued, returned, overdue
  );
  ```

#### 16.2 Backend Development
- [ ] **CREATE**: Library API
  - Book CRUD
  - Issue book
  - Return book
  - Calculate fine for overdue
  - Search books

#### 16.3 Frontend Development
- [ ] **CREATE**: Book catalog
  - Add/edit books
  - Track inventory
  - Barcode generation

- [ ] **CREATE**: Issue/Return page
  - Search student/book
  - Issue book
  - Return and calculate fine
  - History view

- [ ] **CREATE**: Reports
  - Currently issued books
  - Overdue books
  - Most popular books
  - Student reading history

---

## 📢 **COMMUNICATION HUB**

### 17. Notifications & Messaging

#### 17.1 Database Schema
- [ ] **CREATE**: Communication tables
  ```sql
  CREATE TABLE announcements (
      announcement_id UUID PRIMARY KEY,
      title VARCHAR(255),
      message TEXT,
      target_audience VARCHAR(50), -- all, students, parents, teachers
      created_by UUID REFERENCES staff,
      created_at TIMESTAMPTZ,
      is_published BOOLEAN
  );
  
  CREATE TABLE notifications (
      notification_id UUID PRIMARY KEY,
      user_id UUID REFERENCES tenant_users,
      notification_type VARCHAR(50),
      title VARCHAR(255),
      message TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ
  );
  
  CREATE TABLE messages (
      message_id UUID PRIMARY KEY,
      sender_id UUID REFERENCES tenant_users,
      receiver_id UUID REFERENCES tenant_users,
      message_content TEXT,
      sent_at TIMESTAMPTZ,
      is_read BOOLEAN DEFAULT FALSE
  );
  ```

#### 17.2 Backend Development
- [ ] **CREATE**: Announcement API
  - Create announcement
  - Publish to target audience
  - Send email/SMS notifications

- [ ] **CREATE**: Real-time chat (WebSocket)
  - Parent-Teacher messaging
  - Group discussions
  - File sharing

- [ ] **CREATE**: Email service
  - SMTP configuration
  - Email templates
  - Bulk email sending
  - Email tracking

- [ ] **CREATE**: SMS service (Future)
  - Twilio integration (when available)
  - SMS templates
  - Important alerts via SMS

#### 17.3 Frontend Development
- [ ] **CREATE**: Announcements page
  - Create/edit announcements
  - Rich text editor
  - Target audience selection
  - Schedule publication

- [ ] **CREATE**: Notification center
  - Notification bell icon
  - Dropdown list
  - Mark as read
  - Clear all

- [ ] **CREATE**: Messaging interface
  - Chat list
  - Conversation view
  - Send message
  - Real-time updates

---

## 🤖 **AI CHATBOT (PREMIUM)**

### 18. RAG-based School Assistant

#### 18.1 Database Schema
- [ ] **CREATE**: Vector database setup
  - Install pgvector extension
  - Create embeddings table
  ```sql
  CREATE EXTENSION vector;
  
  CREATE TABLE document_embeddings (
      embedding_id UUID PRIMARY KEY,
      content TEXT,
      metadata JSONB,
      embedding vector(1536), -- OpenAI ada-002
      created_at TIMESTAMPTZ
  );
  
  CREATE INDEX ON document_embeddings 
  USING ivfflat (embedding vector_cosine_ops);
  ```

#### 18.2 Backend Development
- [ ] **CREATE**: Data ingestion pipeline
  - Index student records
  - Index fee records
  - Index exam records
  - Index timetables
  - Update on data changes

- [ ] **CREATE**: RAG service
  - Query vectorization
  - Similarity search
  - Context retrieval
  - LLM integration (OpenAI GPT-4)
  - Response generation

- [ ] **CREATE**: Chatbot API
  - POST `/api/v1/chatbot/query`
  - Conversation history
  - Role-based responses
  - Data access control

#### 18.3 Frontend Development
- [ ] **CREATE**: Chatbot widget
  - Floating chat button
  - Chat window
  - Message input
  - Typing indicator
  - Suggested queries

- [ ] **CREATE**: Use case examples
  - "What is my homework for tomorrow?"
  - "When is the next exam?"
  - "Show my fee receipt"
  - "Is my child absent today?"
  - "Mark attendance for Class 9B"
  - "Generate monthly report"

#### 18.4 Technologies
- [ ] **INSTALL**: AI packages
  - `openai` Python package
  - `langchain` for RAG
  - `pgvector` PostgreSQL extension

---

## 🔧 **INFRASTRUCTURE & DEPLOYMENT**

### 19. Environment Configuration

#### 19.1 Database Migration
- [ ] **UPDATE**: All references from Supabase to Neon
  - Connection strings
  - Environment variables
  - Documentation
- [ ] **CREATE**: Database backup strategy
  - Automated daily backups
  - Point-in-time recovery
  - Backup verification

#### 19.2 Security Enhancements
- [ ] **IMPLEMENT**: Rate limiting
  - Login attempts
  - API endpoints
  - Password reset
- [ ] **ADD**: CAPTCHA
  - Signup forms
  - Login (after failed attempts)
  - Public forms
- [ ] **IMPLEMENT**: Email verification
  - New user registration
  - Password reset
  - Important actions

---

## 📊 **TESTING & QUALITY**

### 20. Testing Strategy

- [ ] **CREATE**: Unit tests
  - Backend services
  - Utility functions
  - Validation logic

- [ ] **CREATE**: Integration tests
  - API endpoints
  - Database operations
  - Authentication flow

- [ ] **CREATE**: E2E tests
  - User registration
  - Student enrollment
  - Fee payment
  - Attendance marking

---

## 📝 **DOCUMENTATION**

### 21. Documentation Updates

- [ ] **UPDATE**: README.md
  - Installation instructions
  - Environment setup
  - Running locally
  - Deployment guide

- [ ] **CREATE**: API documentation
  - OpenAPI/Swagger specs
  - Endpoint descriptions
  - Request/response examples

- [ ] **CREATE**: User manuals
  - Admin guide
  - Teacher guide
  - Parent guide
  - Student guide

---

## 🎯 **PRIORITY MATRIX**

### Phase 1: Critical Fixes (Week 1)
1. Fix student creation bug (admission_date field)
2. Add signup/register page
3. Add password eye icon
4. Fix mobile UI issues
5. Implement trial security

### Phase 2: Core Features (Weeks 2-4)
1. Complete branding system
2. ID card generation
3. Staff management
4. Complete student management
5. Fee collection system

### Phase 3: Academic Features (Weeks 5-8)
1. [x] Classes & subjects
2. [x] Timetable management
3. [x] Examination system
4. [x] Attendance with QR codes
5. [x] Results & report cards

### Phase 4: Operations (Weeks 9-12)
1. [x] Transport management
2. [x] Inventory & Asset Management
3. [x] Library management
4. [ ] Communication hub
5. [ ] Financial reports

### Phase 5: Advanced Features (Weeks 13+)
1. AI Chatbot
2. Advanced analytics
3. Mobile apps
4. Integration APIs

---

## 📌 **NOTES**

- All features should be mobile-first
- Implement proper error handling and logging
- Use TypeScript strict mode
- Follow accessibility guidelines (WCAG 2.1)
- Implement proper loading states
- Add skeleton loaders for better UX
- Use optimistic updates where possible
- Implement proper caching strategies

---

**Last Updated**: January 25, 2026
**Status**: Initial Planning Phase
**Expected Completion**: Q2 2026

---

## 🔐 **ROLE-BASED PORTALS (STUDENT/PARENT)**

### 21. Student & Parent Dashboard
- [ ] **CREATE**: Student Portal
  - Login for Students
  - View Attendance History
  - View Timetable
  - View Exam Results
  - View Fee Status (Paid/Pending)
  - ID Card Request/Profile
- [ ] **CREATE**: Parent Portal
  - Login for Parents
  - Monitor Children's Progress
  - Pay Fees Online
  - Communication with Teachers
