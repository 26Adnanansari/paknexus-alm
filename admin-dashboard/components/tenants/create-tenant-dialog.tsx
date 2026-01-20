'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

interface CreateTenantDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Default database password (same for all tenants)
const DEFAULT_DB_PASSWORD = 'npg_SLGA6opCf8Rb';

export function CreateTenantDialog({ open, onOpenChange }: CreateTenantDialogProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        contact_email: '',
        contact_phone: '',
    });

    const getSubdomain = (name: string) => {
        return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
    };

    const BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'pakainexus.com';

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await tenantsApi.create({
                ...data,
                supabase_url_raw: 'shared_database',
                supabase_key_raw: DEFAULT_DB_PASSWORD,
            }, true);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Tenant created successfully! Database was automatically created.');
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
            onOpenChange(false);
            setFormData({
                name: '',
                subdomain: '',
                contact_email: '',
                contact_phone: '',
            });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create tenant');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Tenant</DialogTitle>
                    <DialogDescription>
                        Add a new school/institution to the system. They will start with a 7-day trial.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">School/Institution Name *</Label>
                            <Input
                                id="name"
                                placeholder="Springfield Elementary"
                                value={formData.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    setFormData({
                                        ...formData,
                                        name: name,
                                        subdomain: formData.name === formData.subdomain ? getSubdomain(name) : formData.subdomain
                                    });
                                }}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subdomain">Subdomain / URL Prefix *</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="subdomain"
                                    placeholder="springfield"
                                    value={formData.subdomain}
                                    onChange={(e) => setFormData({ ...formData, subdomain: getSubdomain(e.target.value) })}
                                    required
                                />
                                <span className="text-sm font-medium text-gray-500 whitespace-nowrap">.{BASE_DOMAIN}</span>
                            </div>
                            {formData.subdomain && (
                                <div className="space-y-1 mt-2">
                                    <p className="text-xs text-gray-500">
                                        Database: <span className="font-mono font-medium text-gray-700">tenant_{formData.subdomain.replace(/-/g, '_')}</span>
                                    </p>
                                    <p className="text-xs text-blue-600 font-medium">
                                        Direct Link: <span className="underline italic">https://{formData.subdomain}.{BASE_DOMAIN}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Contact Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@school.com"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Contact Phone</Label>
                            <Input
                                id="phone"
                                placeholder="+1234567890"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                            />
                        </div>

                        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                            <div className="flex items-start gap-3">
                                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Shared Database Model</h4>
                                    <p className="text-xs text-blue-700">
                                        Tenant will be added to the shared database with:
                                    </p>
                                    <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc list-inside">
                                        <li>500 students limit</li>
                                        <li>50 teachers limit</li>
                                        <li>200 MB storage</li>
                                        <li>7-day free trial</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Creating...' : 'Create Tenant'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
