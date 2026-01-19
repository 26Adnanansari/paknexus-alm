-- Refund Policies Table
CREATE TABLE IF NOT EXISTS refund_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refund Tiers Table (The Rules)
CREATE TABLE IF NOT EXISTS refund_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES refund_policies(id) ON DELETE CASCADE,
    days_before INT NOT NULL, -- e.g., 7 days before
    refund_percentage INT NOT NULL CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
    fee_deduction DECIMAL(10, 2) DEFAULT 0.00, -- Optional fixed fee
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_refund_policies_tenant ON refund_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_refund_tiers_policy ON refund_tiers(policy_id);
