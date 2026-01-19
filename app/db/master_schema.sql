-- Enable pgcrypto for potential database-level encryption features (good practice, though we handle app-level encryption too)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'grace', 'locked', 'suspended', 'churned');
CREATE TYPE payment_method_type AS ENUM ('manual', 'stripe');
CREATE TYPE notif_type AS ENUM ('email', 'sms', 'webhook');
CREATE TYPE notif_status AS ENUM ('pending', 'sent', 'failed');

-- Tenants Table
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- School Metadata
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    
    -- Branding & Display
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#0f172a', -- Default slate-900
    secondary_color VARCHAR(7) DEFAULT '#3b82f6', -- Default blue-500
    website VARCHAR(255),
    address TEXT,
    
    -- Isolation Credentials (Encrypted by App)
    supabase_project_url TEXT NOT NULL,
    supabase_service_key TEXT NOT NULL,
    
    -- Subscription State
    status subscription_status NOT NULL DEFAULT 'trial',
    trial_start TIMESTAMPTZ DEFAULT NOW(),
    subscription_expiry TIMESTAMPTZ NOT NULL,
    
    -- Billing Metadata
    last_payment_date TIMESTAMPTZ,
    payment_method payment_method_type DEFAULT 'manual',
    
    -- Audit Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID -- Reference to admin user
);

CREATE INDEX idx_tenants_subscription_expiry ON tenants(subscription_expiry);
CREATE INDEX idx_tenants_status ON tenants(status);

-- Constraint: Expiry cannot be in the past for ACTIVE or TRIAL tenants
-- (This is a simplified check, logic is mostly app-side, but DB constraint adds safety)
ALTER TABLE tenants 
ADD CONSTRAINT check_expiry_future 
CHECK (
    (status IN ('active', 'trial') AND subscription_expiry > '2000-01-01') -- Basic sanity check, precise logic in triggers if needed
);


-- Admin Users Table (Super Admins)
CREATE TABLE admin_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'admin', -- 'super_admin', 'support'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Audit Logs
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    actor_id UUID REFERENCES admin_users(user_id),
    action VARCHAR(100) NOT NULL, -- e.g., 'EXTEND_SUBSCRIPTION', 'LOCK_TENANT'
    details JSONB, -- Store old/new values
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);

-- Notification Queue
CREATE TABLE notification_queue (
    notification_id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(tenant_id),
    type notif_type NOT NULL,
    payload JSONB NOT NULL,
    status notif_status DEFAULT 'pending',
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE INDEX idx_notif_queue_pending ON notification_queue(status, scheduled_at) WHERE status = 'pending';

-- Row Level Security (RLS)
-- For the Control Plane, generally only Super Admins access it via API.
-- We enable RLS as a best practice.

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only application service role or super admins can do anything
-- In practice, the API connects with a service role that bypasses RLS, 
-- or a specific 'admin' user. For now, we allow full access to the 'authenticated' 
-- role if using Supabase Auth, or rely on service role. 
-- Assuming service role connection for backend API:
CREATE POLICY "Service Role Full Access" ON tenants FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SCHOOL MANAGEMENT SYSTEM SCHEMA
-- ============================================================================

-- User Roles
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');

-- Tenant Users (School Admins, Teachers, Students, Parents)
CREATE TABLE tenant_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Profile linkage (optional for now, will be linked to teachers/students tables)
    profile_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    
    -- Ensure email is unique within a tenant
    UNIQUE(email, tenant_id)
);

CREATE INDEX idx_tenant_users_email ON tenant_users(email);
CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_login ON tenant_users(email, tenant_id, is_active);

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

