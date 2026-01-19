'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, Users, UserCheck } from 'lucide-react';
import { RevenueChart } from '@/components/analytics/revenue-chart';

export default function AnalyticsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['analytics'],
        queryFn: () => analyticsApi.revenue(),
    });

    if (isLoading) {
        return <div className="text-center py-12">Loading analytics...</div>;
    }

    const analytics = data?.data || {
        mrr: 0,
        churn_rate: 0,
        total_tenants: 0,
        active_tenants: 0,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Analytics</h1>
                <p className="text-gray-600 mt-1">Revenue and performance metrics</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Monthly Recurring Revenue"
                    value={`$${analytics.mrr.toLocaleString()}`}
                    icon={<DollarSign className="h-5 w-5" />}
                    className="text-green-600"
                />
                <StatsCard
                    title="Total Tenants"
                    value={analytics.total_tenants}
                    icon={<Users className="h-5 w-5" />}
                    className="text-blue-600"
                />
                <StatsCard
                    title="Active Subscriptions"
                    value={analytics.active_tenants}
                    icon={<UserCheck className="h-5 w-5" />}
                    className="text-green-600"
                />
                <StatsCard
                    title="Churn Rate"
                    value={`${analytics.churn_rate}%`}
                    icon={<TrendingDown className="h-5 w-5" />}
                    className="text-red-600"
                />
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Active Subscriptions</span>
                                <span className="font-semibold">${(analytics.active_tenants * 100).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Average Revenue Per User</span>
                                <span className="font-semibold">
                                    ${analytics.total_tenants > 0 ? (analytics.mrr / analytics.total_tenants).toFixed(2) : '0'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total MRR</span>
                                <span className="font-semibold text-green-600">${analytics.mrr.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Retention Rate</span>
                                <span className="font-semibold text-green-600">
                                    {(100 - analytics.churn_rate).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Churn Rate</span>
                                <span className="font-semibold text-red-600">{analytics.churn_rate}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Active Rate</span>
                                <span className="font-semibold">
                                    {analytics.total_tenants > 0
                                        ? ((analytics.active_tenants / analytics.total_tenants) * 100).toFixed(1)
                                        : '0'}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <RevenueChart />
                </CardContent>
            </Card>
        </div>
    );
}
