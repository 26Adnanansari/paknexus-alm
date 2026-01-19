-- Order Moments Table
CREATE TABLE IF NOT EXISTS order_moments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID UNIQUE, -- Link to an order (Optional if we want generic moments too, but plan says order-linked)
    image_url TEXT NOT NULL,
    caption TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, ARCHIVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_moments_tenant ON order_moments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_moments_order ON order_moments(order_id);
