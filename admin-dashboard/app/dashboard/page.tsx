'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi, tenantsApi } from '@/lib/api';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Clock, Lock } from 'lucide-react';

export default function DashboardPage() {
    const { data: analytics } = useQuery({
        queryKey: ['analytics'],
        queryFn: () => analyticsApi.revenue(),
    });

    const { data: tenants } = useQuery({
        queryKey: ['tenants'],
        queryFn: () => tenantsApi.list({ per_page: 5 }),
    });

    const stats = tenants?.data?.stats || {
        total_active: 0,
        total_trial: 0,
        total_locked: 0,
        total_grace: 0,
    };

    const analyticsData = analytics?.data || {
        mrr: 0,
        churn_rate: 0,
        total_tenants: 0,
        active_tenants: 0,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Welcome to PakAi Nexus</h1>
                <p className="text-gray-600 mt-1">Multi-Tenant SaaS Control Plane</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Tenants"
                    value={analyticsData.total_tenants}
                    icon={<Users className="h-5 w-5" />}
                    trend="+12%"
                    trendUp={true}
                />
                <StatsCard
                    title="Active"
                    value={stats.total_active}
                    icon={<UserCheck className="h-5 w-5" />}
                    className="text-green-600"
                />
                <StatsCard
                    title="Trial"
                    value={stats.total_trial}
                    icon={<Clock className="h-5 w-5" />}
                    className="text-yellow-600"
                />
                <StatsCard
                    title="Locked"
                    value={stats.total_locked}
                    icon={<Lock className="h-5 w-5" />}
                    className="text-red-600"
                />
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Recurring Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${analyticsData.mrr.toLocaleString()}</div>
                        <p className="text-sm text-gray-600 mt-1">
                            From {analyticsData.active_tenants} active subscriptions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Churn Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{analyticsData.churn_rate}%</div>
                        <p className="text-sm text-gray-600 mt-1">Last 30 days</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Tenants */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Tenants</CardTitle>
                </CardHeader>
                <CardContent>
                    {tenants?.data?.tenants?.length ? (
                        <div className="space-y-4">
                            {tenants.data.tenants.slice(0, 5).map((tenant: any) => (
                                <div key={tenant.tenant_id} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{tenant.name}</p>
                                        <p className="text-sm text-gray-600">{tenant.contact_email}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${tenant.status === 'active' ? 'bg-green-100 text-green-700' :
                                            tenant.status === 'trial' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {tenant.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">No tenants yet. Create your first tenant to get started!</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
