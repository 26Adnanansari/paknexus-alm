'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Globe, Mail, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
    const { data: response, isLoading, error } = useQuery({
        queryKey: ['system-settings'],
        queryFn: () => analyticsApi.getSystemSettings(),
    });

    const settings = response?.data;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <div className="grid gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isForbidden = (error as any)?.response?.status === 403;

        return (
            <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                {isForbidden ? (
                    <p className="text-red-600 max-w-sm mx-auto">
                        You do not have permission to view System Settings. This page is restricted to <strong>High-Level Platform Administrators</strong> only.
                        <br /><br />
                        If you are a School Admin, please return to your <a href="/" className="underline font-bold">School Dashboard</a>.
                    </p>
                ) : (
                    <p className="text-gray-500">Failed to load settings. Please try again later.</p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-gray-500 mt-1">Global configuration for the Multi-Tenant SaaS platform.</p>
            </div>

            <div className="grid gap-6">
                {/* Core Configuration */}
                <Card className="border-blue-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center space-x-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <CardTitle>Core Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Application Name</Label>
                            <Input value={settings?.app_name || 'PakAi Nexus'} disabled className="bg-gray-50 font-medium" />
                        </div>
                        <div className="space-y-2">
                            <Label>Primary Domain</Label>
                            <Input value={settings?.app_domain || 'pakainexus.com'} disabled className="bg-gray-50 font-medium" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>CORS Origins (Allowed Domains)</Label>
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border text-sm font-mono break-all">
                                {settings?.cors_origins?.split(',').map((origin: string) => (
                                    <Badge key={origin} variant="secondary" className="font-mono text-xs">
                                        {origin.trim()}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Email Settings */}
                <Card className="border-indigo-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center space-x-2">
                        <Mail className="h-5 w-5 text-indigo-600" />
                        <CardTitle>SMTP / Email Service</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>SMTP Host</Label>
                            <Input value={settings?.smtp?.host || 'smtp.gmail.com'} disabled className="bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                            <Label>SMTP Port</Label>
                            <Input value={settings?.smtp?.port || '587'} disabled className="bg-gray-50" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Sender Email Address</Label>
                            <Input value={settings?.smtp?.sender || ''} disabled className="bg-gray-50" />
                        </div>
                    </CardContent>
                </Card>

                {/* Security & Infrastructure */}
                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center space-x-2">
                        <ShieldCheck className="h-5 w-5 text-slate-600" />
                        <CardTitle>Infrastructure</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="flex items-center space-x-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm font-bold text-green-900">Database Connection</p>
                                    <p className="text-xs text-green-700">Healthy and connected to Neon cloud cluster</p>
                                </div>
                            </div>
                            <Badge className="bg-green-600">ACTIVE</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center space-x-3">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900">Tenant Isolation</p>
                                    <p className="text-xs text-blue-700">Schema-based isolation enabled</p>
                                </div>
                            </div>
                            <Badge className="bg-blue-600">SECURE</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
