'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tenant } from '@/types/tenant';
import { ExtendSubscriptionDialog } from '@/components/tenants/extend-subscription-dialog';
import { format } from 'date-fns';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'pakainexus.com';

export default function TenantDetailsPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;

    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['tenant', tenantId],
        queryFn: () => tenantsApi.get(tenantId),
    });

    if (isLoading) return <div className="p-8"><Skeleton className="h-12 w-full" /></div>;

    const tenantData = response?.data?.tenant as Tenant;

    if (!tenantData) return <div className="p-8 text-center text-gray-500">Tenant not found</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{tenantData.name}</h1>
                    <p className="text-gray-500">{tenantData.subdomain}.{BASE_DOMAIN}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={tenantData.status === 'active' ? 'default' : 'secondary'}>
                        {tenantData.status.toUpperCase()}
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="billing">Subscription & Billing</TabsTrigger>
                    <TabsTrigger value="modules">Modules</TabsTrigger>
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p>{tenantData.contact_email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Phone</p>
                                    <p>{tenantData.contact_phone || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Website</p>
                                    <p>{tenantData.website || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Application URL</p>
                                    <a
                                        href={`https://${tenantData.subdomain}.${BASE_DOMAIN}`}
                                        target="_blank"
                                        className="text-blue-600 hover:underline font-medium"
                                    >
                                        {tenantData.subdomain}.{BASE_DOMAIN}
                                    </a>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Subscription Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <ExtendSubscriptionDialog
                                        tenantId={tenantId}
                                        tenantName={tenantData.name}
                                        currentExpiry={tenantData.subscription_expiry}
                                        onSuccess={() => refetch()}
                                    />
                                    <Button variant="outline" size="sm">Manage Modules</Button>
                                    <Button className="bg-blue-600 hover:bg-blue-700" size="sm">Edit Tenant</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Plan Status</p>
                                        <Badge variant="outline">{tenantData.status}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Days Remaining</p>
                                        <p className="font-bold">6</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                                        <p>{format(new Date(tenantData.subscription_expiry), 'PPP')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Coming Soon</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500">Detailed billing history and payment methods will be displayed here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="modules">
                    {/* Modules content here */}
                </TabsContent>

                <TabsContent value="branding">
                    {/* Branding content here */}
                </TabsContent>
            </Tabs>
        </div>
    );
}
