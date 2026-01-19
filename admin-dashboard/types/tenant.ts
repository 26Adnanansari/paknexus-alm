export interface Tenant {
    tenant_id: string;
    name: string;
    subdomain: string;
    contact_email: string;
    contact_phone?: string;
    status: 'active' | 'trial' | 'suspended' | 'churned' | 'locked' | 'grace';
    trial_start?: string;
    subscription_expiry: string;

    // Branding
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    website?: string;
    address?: string;

    created_at: string;
}

export interface TenantUpdate {
    name?: string;
    contact_email?: string;
    contact_phone?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    website?: string;
    address?: string;
}
