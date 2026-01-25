# 💰 Fee Management System Implementation Plan

## 1. Core Concepts
per your requirements:
1.  **Class-Level Fees**: You define standard fees (e.g., Tuition, Lab, Sports) for an entire class (e.g., "Grade 10").
2.  **Individual Scholarships**: You can assign a discount percentage (0-100%) to specific students.
3.  **Real-Time Due Calculation**: `Total Due = (Class Fee - Scholarship) - Paid Amount`.

## 2. Database Schema Updates
We will modify the existing schema to support class-based defaults and scholarships.

### New & Modified Tables
1.  **`fee_heads` (New)**: Defines types of fees (Tuition, Transport, Exam).
2.  **`class_fee_structure` (New)**: Links Fee Head to Class with an Amount.
    *   `class_id`, `fee_head_id`, `amount`, `frequency` (Monthly/One-time).
3.  **`student_scholarships` (New)**:
    *   `student_id`, `scholarship_percent`, `reason`.
4.  **`fee_invoices` (New)**: Generated monthly/termly for students.
    *   snapshots the formatting at generation time.
    *   `student_id`, `total_amount`, `scholarship_amount`, `payable_amount`, `due_date`, `status` (PAID/UNPAID/PARTIAL).
5.  **`fee_payments` (Existing)**: Records actual transactions.

## 3. Workflow

### A. Setup (Admin)
1.  Create Fee Heads (e.g., "Monthly Tuition").
2.  Assign to Classes (e.g., "Grade 5" -> "Monthly Tuition" = $200).
3.  (Optional) Assign Scholarship to bright/needy students (e.g., "Ali" -> 50% Off).

### B. Monthly Cycle (Automated/Manual)
1.  **Generate Invoices**: System runs for "September 2026".
2.  It looks at all active students in Grade 5.
3.  Calculates: `$200 (Class Fee) - 50% (Scholarship) = $100`.
4.  Creates an **Unpaid Invoice** for $100.

### C. Collection (Accountant)
1.  Parent comes to pay.
2.  Accountant searches Student Name.
3.  System shows "September Invoice: $100 Pending".
4.  Accountant collects cash/cheque.
5.  System marks Invoice as **PAID**.
6.  Prints Receipt.

## 4. Implementation Steps

### Step 1: Backend - Schema & APIs
*   `POST /api/v1/fees/setup` (Configure Heads & Class Fees).
*   `POST /api/v1/fees/scholarship` (Give Discount).
*   `POST /api/v1/fees/generate` (Create Invoices for a month).
*   `GET /api/v1/fees/student/{id}` (Get Outstanding Dues).
*   `POST /api/v1/fees/collect` (Record Payment).

### Step 2: Frontend - Fee Dashboard
*   **Structure Tab**: Manage Class Fees.
*   **Collection Tab**: Search Student -> Pay.
*   **Reports Tab**: Daily Collection Report.

---
**Ready to proceed?** I will start by updating the Database Schema and creating the Backend APIs.
