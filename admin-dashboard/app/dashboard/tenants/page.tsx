'use client';

import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TenantTable } from '@/components/tenants/tenant-table';
import { useState } from 'react';
import { CreateTenantDialog } from '@/components/tenants/create-tenant-dialog';

export default function TenantsPage() {
    const [page, setPage] = useState(1);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['tenants', page],
        queryFn: () => tenantsApi.list({ page, per_page: 20 }),
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Tenants</h1>
                    <p className="text-gray-600 mt-1">Manage all your tenants</p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tenant
                </Button>
            </div>

            <TenantTable
                tenants={data?.data?.tenants || []}
                pagination={data?.data?.pagination}
                isLoading={isLoading}
                onPageChange={setPage}
            />

            <CreateTenantDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />
        </div>
    );
}
