export interface Module {
    module_id: string;
    code: string;
    name: string;
    description: string;
    base_price: string; // Decimal comes as string from JSON usually
    is_active: boolean;
    created_at: string;
}

export interface TenantModule {
    id: string;
    tenant_id: string;
    module: Module;
    status: 'active' | 'disabled';
    price_override?: string;
    enabled_at: string;
}

export interface TenantModuleUpdate {
    module_id: string;
    is_enabled: boolean;
    price_override?: number;
}
