-- Migration to add subdomain column for tenant resolution
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='subdomain') THEN
        ALTER TABLE tenants ADD COLUMN subdomain VARCHAR(63);
        ALTER TABLE tenants ADD CONSTRAINT tenants_subdomain_key UNIQUE (subdomain);
        CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
    END IF;
END $$;
