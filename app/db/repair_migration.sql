-- Database Repair Migration
-- Run this against the MASTER_DATABASE_URL to ensure all columns exist

-- 1. ENUMS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'grace', 'locked', 'suspended', 'churned');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
        CREATE TYPE payment_method_type AS ENUM ('manual', 'stripe');
    END IF;
END $$;

-- 2. TENANTS TABLE COLUMNS
DO $$ 
BEGIN 
    -- Basic Subscription Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='status') THEN
        ALTER TABLE tenants ADD COLUMN status subscription_status NOT NULL DEFAULT 'trial';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='trial_start') THEN
        ALTER TABLE tenants ADD COLUMN trial_start TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='subscription_expiry') THEN
        ALTER TABLE tenants ADD COLUMN subscription_expiry TIMESTAMPTZ NOT NULL DEFAULT NOW() + interval '7 days';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='last_payment_date') THEN
        ALTER TABLE tenants ADD COLUMN last_payment_date TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='payment_method') THEN
        ALTER TABLE tenants ADD COLUMN payment_method payment_method_type DEFAULT 'manual';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='created_by') THEN
        ALTER TABLE tenants ADD COLUMN created_by UUID;
    END IF;

    -- Branding Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='logo_url') THEN
        ALTER TABLE tenants ADD COLUMN logo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='primary_color') THEN
        ALTER TABLE tenants ADD COLUMN primary_color VARCHAR(7) DEFAULT '#0f172a';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='secondary_color') THEN
        ALTER TABLE tenants ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#3b82f6';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='website') THEN
        ALTER TABLE tenants ADD COLUMN website VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='address') THEN
        ALTER TABLE tenants ADD COLUMN address TEXT;
    END IF;
END $$;

-- 3. ADDITIONAL TABLES
CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS id_card_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    front_bg_url TEXT,
    back_bg_url TEXT,
    field_positions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);
