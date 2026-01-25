# 🎯 Comprehensive Implementation & Fix Plan

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
- [ ] **SECURITY FLAW**: No access control on trial tenants
  - Anyone can access trial accounts without proper authorization
  - Need to implement proper trial signup flow with email verification
  - Add CAPTCHA or rate limiting to prevent abuse
- [ ] **MISSING**: Trial expiration enforcement
  - System allows access even after trial expires
  - Need automatic lockout mechanism
  - Grace period implementation

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
- [ ] **BUG**: Students not adding properly
  - Check backend validation errors
  - Review database constraints (date_of_birth vs admission_date)
  - Fix unique constraint handling
- [ ] **MISSING**: admission_date field not in CREATE form
  - Schema requires admission_date (NOT NULL)
  - Frontend form missing this field
  - Add admission_date to StudentCreate model and form

#### 2.2 Frontend Issues
- [ ] **BUG**: Field mismatch between frontend and backend
  - Frontend sends `contact_phone` 
  - Backend expects `father_phone`
  - Fix column mapping in students.py line 72-77

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

- [ ] **FIX**: Update frontend form
  - Add admission_date date picker
  - Rename contact_phone to father_phone
  - Add validation messages

#### 6.2 Enhanced Student Features
- [ ] **CREATE**: Student profile page
  - View/edit student details
  - Upload student photo
  - Academic history
  - Attendance summary
  - Fee payment history
  - Exam results

- [ ] **CREATE**: Bulk student import
  - Excel/CSV upload
  - Template download
  - Data validation
  - Duplicate detection
  - Error reporting

- [ ] **CREATE**: Document management
  - Birth certificate upload
  - Previous school documents
  - Medical records
  - ID proof (Aadhaar/B-Form)

### 7. Online Admissions System

- [ ] **CREATE**: Public admission form
  - No login required
  - Progressive form (multi-step)
  - File uploads for documents
  - Email confirmation

- [ ] **CREATE**: Admission workflow
  - Application submission
  - Document verification status
  - Interview scheduling
  - Approval/rejection
  - Email notifications at each stage

- [ ] **CREATE**: Admin admission dashboard
  - Pending applications list
  - Review interface
  - Bulk approve/reject
  - Communication tools

---

## 🪪 **ID CARD SYSTEM**

### 8. Student ID Card Generation

#### 8.1 Database Schema
- [ ] **CREATE**: id_card_templates table
  ```sql
  CREATE TABLE id_card_templates (
      template_id UUID PRIMARY KEY,
      template_name VARCHAR(100),
      layout_json JSONB,
      is_default BOOLEAN,
      created_at TIMESTAMPTZ
  );
  ```

- [ ] **CREATE**: student_id_cards table
  ```sql
  CREATE TABLE student_id_cards (
      card_id UUID PRIMARY KEY,
      student_id UUID REFERENCES students,
      card_number VARCHAR(50) UNIQUE,
      qr_code_url TEXT,
      issue_date DATE,
      expiry_date DATE,
      status VARCHAR(20)
  );
  ```

#### 8.2 Backend Implementation
- [ ] **CREATE**: ID card generation service
  - Dynamic template rendering
  - QR code generation (student profile URL)
  - School logo integration
  - PDF generation (single and batch)

- [ ] **CREATE**: ID card endpoints
  - POST `/api/v1/students/{id}/generate-id-card`
  - POST `/api/v1/classes/{id}/generate-batch-ids`
  - GET `/api/v1/id-cards/{card_number}/verify`

#### 8.3 Frontend Implementation
- [ ] **CREATE**: ID card design tool
  - Drag-and-drop template editor
  - Field placement (name, photo, QR, logo)
  - Preview mode
  - Save custom templates

- [ ] **CREATE**: ID card generation page
  - Single student card generation
  - Batch generation by class
  - Print preview
  - Download PDF

- [ ] **CREATE**: Public ID verification page
  - Scan QR code
  - Display student info (limited)
  - Verify authenticity

#### 8.4 ID Card Edit Restriction & Appeal System 🔒
- [ ] **CRITICAL SECURITY**: Implement one-time edit restriction
  - Public users can only edit ID card form ONCE before submission
  - After submission, form becomes READ-ONLY for public users
  - Prevents unauthorized data tampering and fraud
  - Creates audit trail for all changes

- [ ] **DATABASE SCHEMA**: Add tracking fields to student_id_cards table
  ```sql
  ALTER TABLE student_id_cards ADD COLUMN IF NOT EXISTS
    status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, locked, appeal_pending, unlocked_for_edit
    submission_count INTEGER DEFAULT 0,
    last_submitted_at TIMESTAMPTZ,
    is_editable BOOLEAN DEFAULT TRUE,
    appeal_reason TEXT,
    appeal_submitted_at TIMESTAMPTZ,
    unlocked_by_admin_id UUID REFERENCES staff(staff_id),
    unlocked_at TIMESTAMPTZ,
    edit_history JSONB DEFAULT '[]'::jsonb;
  ```

- [ ] **CREATE**: Appeal system table
  ```sql
  CREATE TABLE id_card_appeals (
    appeal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(student_id),
    card_id UUID REFERENCES student_id_cards(card_id),
    appeal_reason TEXT NOT NULL,
    mistake_description TEXT NOT NULL,
    requested_changes JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES staff(staff_id),
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT
  );
  ```

- [ ] **BACKEND**: Appeal workflow API
  - POST `/api/v1/id-cards/{id}/submit` - Lock card after submission
  - POST `/api/v1/id-cards/{id}/appeal` - Submit correction appeal
  - GET `/api/v1/admin/id-card-appeals` - List pending appeals
  - PUT `/api/v1/admin/id-card-appeals/{id}/approve` - Unlock for edit
  - PUT `/api/v1/admin/id-card-appeals/{id}/reject` - Reject appeal
  - Automatic email notifications at each stage

- [ ] **FRONTEND**: Public user workflow
  - Show "Submit" button when status is 'draft'
  - After submit: Lock form, show "Submitted" badge
  - Add "Request Correction" button on locked forms
  - Appeal modal with reason textarea
  - Display appeal status (pending/approved/rejected)
  - If approved: Allow ONE MORE edit, then re-lock

- [ ] **FRONTEND**: Admin appeal management
  - Appeals dashboard with pending count badge
  - Review interface showing:
    - Student details
    - Current ID card data
    - Requested changes
    - Appeal reason
  - Approve/Reject buttons
  - Admin notes field
  - Bulk approve/reject functionality

- [ ] **SECURITY**: Validation & audit trail
  - Log all edit attempts in edit_history JSONB
  - Track IP addresses for submissions
  - Prevent direct API manipulation
  - Rate limiting on appeal submissions
  - Email verification before unlocking

- [ ] **NOTIFICATIONS**: Email alerts
  - User: "ID Card submitted successfully"
  - User: "Appeal received, under review"
  - User: "Appeal approved - You can edit now"
  - User: "Appeal rejected - Contact admin"
  - Admin: "New ID card appeal received"

#### 8.5 Technologies
- [ ] **INSTALL**: Required packages
  - `@react-pdf/renderer` or `pdfmake`
  - `qrcode.react`
  - `html2canvas` for preview

---

## 👨‍🏫 **STAFF MANAGEMENT**

### 9. Teacher & Staff Module

#### 9.1 Current State
- [x] Staff table exists in schema
- [ ] **MISSING**: Complete CRUD operations
- [ ] **MISSING**: Frontend pages

#### 9.2 Backend Development
- [ ] **CREATE**: Staff API endpoints
  - GET `/api/v1/staff` - List all staff
  - POST `/api/v1/staff` - Add new staff
  - PUT `/api/v1/staff/{id}` - Update staff
  - DELETE `/api/v1/staff/{id}` - Remove staff
  - GET `/api/v1/staff/{id}/workload` - View teaching load

- [ ] **CREATE**: Payroll calculation service
  - Monthly salary calculation
  - Deductions (tax, advance)
  - Allowances
  - Generate pay slips

#### 9.3 Frontend Development
- [ ] **CREATE**: Staff directory page
  - List view with filters (department, role)
  - Search by name/employee ID
  - Add staff modal/page
  - Staff profile cards

- [ ] **CREATE**: Staff profile page
  - Personal details
  - Professional qualifications
  - Assigned classes/subjects
  - Attendance history
  - Salary details (encrypted display)

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
- [ ] **MISSING**: Frontend implementation
- [ ] **MISSING**: API endpoints

#### 10.2 Backend Development
- [ ] **CREATE**: Classes API
  - CRUD for classes
  - Assign class teacher
  - Add students to class
  - Remove/transfer students

- [ ] **CREATE**: Subjects API
  - CRUD for subjects
  - Assign subjects to classes
  - Assign teachers to subjects

#### 10.3 Frontend Development
- [ ] **CREATE**: Classes management page
  - List all classes
  - Add/edit class
  - Assign teacher
  - View students in class
  - Bulk operations

- [ ] **CREATE**: Subjects management page
  - Subject catalog
  - Subject allocation by class
  - Teacher assignment

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
1. Classes & subjects
2. Timetable management
3. Examination system
4. Attendance with QR codes
5. Results & report cards

### Phase 4: Operations (Weeks 9-12)
1. Transport management
2. Library management
3. Communication hub
4. Financial reports

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
