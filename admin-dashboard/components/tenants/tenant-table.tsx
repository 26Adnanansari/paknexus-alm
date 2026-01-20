'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tenant } from '@/types/tenant';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'pakainexus.com';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { Eye, CheckCircle } from 'lucide-react';
import { tenantsApi } from '@/lib/api';

interface TenantTableProps {
    tenants: Tenant[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pagination?: any;
    isLoading: boolean;
    onPageChange: (page: number) => void;
}

const statusColors = {
    trial: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    grace: 'bg-orange-100 text-orange-700',
    locked: 'bg-red-100 text-red-700',
    suspended: 'bg-purple-100 text-purple-700',
    churned: 'bg-gray-100 text-gray-700',
};

export function TenantTable({ tenants, pagination, isLoading, onPageChange }: TenantTableProps) {
    if (isLoading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (!tenants.length) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">No tenants found. Create your first tenant to get started!</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Mobile: Card view, Desktop: Table view */}
            <div className="block lg:hidden">
                {/* Mobile Card View */}
                <div className="divide-y">
                    {tenants.map((tenant) => (
                        <div key={tenant.tenant_id} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-medium">{tenant.name}</h3>
                                    <p className="text-xs font-mono text-blue-600">{tenant.subdomain}.{BASE_DOMAIN}</p>
                                    <p className="text-sm text-gray-600">{tenant.contact_email}</p>
                                </div>
                                <Badge className={statusColors[tenant.status as keyof typeof statusColors]}>
                                    {tenant.status}
                                </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>Expiry: {format(new Date(tenant.subscription_expiry), 'MMM dd, yyyy')}</p>
                                <p className={tenant.days_remaining < 7 ? 'text-red-600 font-medium' : ''}>
                                    {tenant.days_remaining || 0} days remaining
                                </p>
                            </div>
                            <Link href={`/dashboard/tenants/${tenant.tenant_id}`} className="mt-3 block">
                                <Button variant="outline" size="sm" className="w-full">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>URL / Subdomain</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Subscription Expiry</TableHead>
                            <TableHead>Days Remaining</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.map((tenant) => (
                            <TableRow key={tenant.tenant_id}>
                                <TableCell className="font-medium">{tenant.name}</TableCell>
                                <TableCell>
                                    <a
                                        href={`https://${tenant.subdomain}.${BASE_DOMAIN}`}
                                        target="_blank"
                                        className="text-blue-600 hover:underline text-sm font-medium"
                                    >
                                        {tenant.subdomain}
                                    </a>
                                </TableCell>
                                <TableCell>{tenant.contact_email}</TableCell>
                                <TableCell>
                                    <Badge className={statusColors[tenant.status as keyof typeof statusColors]}>
                                        {tenant.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(tenant.subscription_expiry), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                    <span className={tenant.days_remaining < 7 ? 'text-red-600 font-medium' : ''}>
                                        {tenant.days_remaining || 0} days
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/tenants/${tenant.tenant_id}`}>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View
                                        </Button>
                                    </Link>
                                    {tenant.status === 'trial' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={async () => {
                                                if (confirm(`Activate tenant ${tenant.name}?`)) {
                                                    try {
                                                        await tenantsApi.activate(tenant.tenant_id, 'MANUAL_APPROVAL', 'Activated from Dashboard');
                                                        window.location.reload(); // Simple reload to refresh data
                                                    } catch (_) {
                                                        alert('Failed to activate tenant');
                                                    }
                                                }
                                            }}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                    <p className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => onPageChange(pagination.page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === pagination.pages}
                            onClick={() => onPageChange(pagination.page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
