export interface Tenant {
    tenant_id: string;
    name: string;
    contact_email: string;
    contact_phone?: string;
    status: 'trial' | 'active' | 'grace' | 'locked' | 'suspended' | 'churned';
    trial_start?: string;
    subscription_expiry: string;
    last_payment_date?: string;
    payment_method?: string;
    created_at: string;
    updated_at?: string;
    days_remaining?: number;
}

export interface TenantDetails extends Tenant {
    subscription_history: AuditLog[];
}

export interface AuditLog {
    log_id: string;
    tenant_id: string;
    actor_id: string;
    action: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: Record<string, any>;
    created_at: string;
}

export interface TenantsResponse {
    tenants: Tenant[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        pages: number;
    };
    stats: {
        total_active: number;
        total_trial: number;
        total_locked: number;
        total_grace: number;
    };
}

export interface AnalyticsResponse {
    mrr: number;
    churn_rate: number;
    total_tenants: number;
    active_tenants: number;
}

export interface CreateTenantData {
    name: string;
    contact_email: string;
    contact_phone: string;
    supabase_url_raw: string;
    supabase_key_raw: string;
}

export interface ExtendSubscriptionData {
    extension_days: number;
    payment_reference: string;
    amount: number;
    notes?: string;
}
