-- ============================================================================
-- FINAL PHASE 2 SCHEMA UPDATE
-- Includes:
-- 1. School Branding (Logo, Colors)
-- 2. Module Management (Dynamic Pricing)
-- 3. AI Chatbot Support
-- ============================================================================

-- 1. SCHOOL BRANDING
-- Adding columns to 'tenants' table if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='logo_url') THEN
        ALTER TABLE tenants ADD COLUMN logo_url TEXT;
        ALTER TABLE tenants ADD COLUMN primary_color VARCHAR(7) DEFAULT '#0f172a';
        ALTER TABLE tenants ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#3b82f6';
        ALTER TABLE tenants ADD COLUMN website VARCHAR(255);
        ALTER TABLE tenants ADD COLUMN address TEXT;
    END IF;
END $$;

-- 2. MODULE MANAGEMENT
-- Define available modules in the system
CREATE TABLE IF NOT EXISTS modules (
    module_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'CORE', 'FINANCE', 'CHATBOT'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price NUMERIC(10, 2) DEFAULT 0.00, -- Monthly add-on price
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active modules per tenant
CREATE TABLE IF NOT EXISTS tenant_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(module_id),
    status VARCHAR(20) DEFAULT 'active', -- active, disabled
    price_override NUMERIC(10, 2), -- Custom price for this tenant
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, module_id)
);

-- Seed Default Modules
INSERT INTO modules (code, name, base_price, description) 
VALUES 
    ('CORE', 'Core Academic & Student', 0.00, 'Students, Attendance, Staff, Timetable'),
    ('FINANCE', 'Financial Management', 20.00, 'Fee collection, Expenses, Invoicing'),
    ('TRANSPORT', 'Transport Management', 15.00, 'Route planning, Vehicle tracking'),
    ('LIBRARY', 'Library Management', 10.00, 'Book catalog, Issue tracking'),
    ('CHATBOT', 'AI Assistant', 50.00, '24/7 AI Chatbot for Students, Parents, Teachers')
ON CONFLICT (code) DO NOTHING;

-- 3. AI CHATBOT LOGS
-- Store chat history for analytics and improvement
CREATE TABLE IF NOT EXISTS chatbot_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    user_id UUID, -- Link to tenant_users if authenticated
    role VARCHAR(20), -- student, parent, teacher
    query TEXT,
    response TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_tenant ON chatbot_logs(tenant_id);

-- Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for now - Service Role Access)
CREATE POLICY "Service Role Full Access Modules" ON modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Tenant Modules" ON tenant_modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Full Access Chatbot" ON chatbot_logs FOR ALL USING (true) WITH CHECK (true);
