'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modulesApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { TenantModule } from '@/types/module';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ModulesManagerProps {
    tenantId: string;
}

export function ModulesManager({ tenantId }: ModulesManagerProps) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['tenant-modules', tenantId],
        queryFn: () => modulesApi.listTenantModules(tenantId),
    });

    const mutation = useMutation({
        mutationFn: (data: { module_id: string; is_enabled: boolean }) =>
            modulesApi.toggle(tenantId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-modules', tenantId] });
        },
    });

    if (isLoading) {
        return <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>;
    }

    const modules = data?.data || [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((tm: TenantModule) => (
                <Card key={tm.module.module_id} className={tm.status === 'active' ? 'border-primary/50' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {tm.module.name}
                        </CardTitle>
                        <Switch
                            checked={tm.status === 'active'}
                            onCheckedChange={(checked) =>
                                mutation.mutate({ module_id: tm.module.module_id, is_enabled: checked })
                            }
                            disabled={mutation.isPending}
                        />
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-2xl font-bold">
                                ${tm.price_override || tm.module.base_price}
                            </span>
                            <span className="text-xs text-muted-foreground">/ month</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                            {tm.module.description}
                        </p>

                        <div className="flex items-center space-x-2">
                            {tm.status === 'active' ? (
                                <Badge variant="default" className="bg-green-600">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                                </Badge>
                            ) : (
                                <Badge variant="outline">
                                    <AlertCircle className="w-3 h-3 mr-1" /> Disabled
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {modules.length === 0 && (
                <div className="col-span-full text-center p-8 text-gray-500">
                    No modules available. Check system configuration.
                </div>
            )}
        </div>
    );
}
