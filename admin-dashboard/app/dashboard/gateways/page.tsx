'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, CreditCard, ShieldCheck, Banknote, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface GatewayConfig {
    id: string;
    name: string;
    provider: 'stripe' | 'paypal' | 'razorpay' | 'manual';
    isEnabled: boolean;
    isTestMode: boolean;
    apiKey: string;
    secretKey: string;
    webhookSecret: string;
}

export default function GatewaysPage() {
    const [gateways, setGateways] = useState<GatewayConfig[]>([
        {
            id: '1',
            name: 'Stripe Payments',
            provider: 'stripe',
            isEnabled: true,
            isTestMode: true,
            apiKey: 'pk_test_...',
            secretKey: 'sk_test_...',
            webhookSecret: 'whsec_...'
        },
        {
            id: '2',
            name: 'Razorpay',
            provider: 'razorpay',
            isEnabled: false,
            isTestMode: true,
            apiKey: '',
            secretKey: '',
            webhookSecret: ''
        }
    ]);

    const handleSave = (id: string) => {
        // Simulate API call
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Securing keys...',
                success: 'Gateway configuration updated securely.',
                error: 'Failed to update settings.'
            }
        );
    };

    const toggleGateway = (id: string) => {
        setGateways(prev => prev.map(g => g.id === id ? { ...g, isEnabled: !g.isEnabled } : g));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <ShieldCheck className="text-blue-600" />
                    Secure Gateway Manager
                </h1>
                <p className="text-muted-foreground">
                    Configure payment providers, subscription gates, and fee collection channels.
                    Sensitive keys are encrypted at rest.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Overview */}
                <Card className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-slate-900 dark:to-slate-800 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            <Lock className="h-5 w-5" /> Security Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                            <CheckCircle2 className="text-green-600 h-5 w-5" />
                            <div>
                                <p className="font-semibold text-sm">Encryption Active</p>
                                <p className="text-xs text-muted-foreground">AES-256 enabled for keys</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                            <AlertCircle className="text-amber-600 h-5 w-5" />
                            <div>
                                <p className="font-semibold text-sm">Test Mode</p>
                                <p className="text-xs text-muted-foreground">Stripe is running in test mode</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Configuration Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="stripe" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="stripe" className="flex gap-2"><CreditCard className="h-4 w-4" /> Stripe</TabsTrigger>
                            <TabsTrigger value="razorpay" className="flex gap-2"><Wallet className="h-4 w-4" /> Razorpay</TabsTrigger>
                            <TabsTrigger value="manual" className="flex gap-2"><Banknote className="h-4 w-4" /> Manual/Bank</TabsTrigger>
                        </TabsList>

                        {/* Stripe Tab */}
                        <TabsContent value="stripe">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Stripe Configuration</CardTitle>
                                            <CardDescription>Handle credit cards and subscriptions securely.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="stripe-mode" className="text-xs">Test Mode</Label>
                                            <Switch id="stripe-mode" checked={gateways[0].isTestMode} />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Publishable Key</Label>
                                        <div className="relative">
                                            <Input type="text" className="font-mono pl-9" placeholder="pk_test_..." defaultValue={gateways[0].apiKey} />
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Secret Key</Label>
                                        <div className="relative">
                                            <Input type="password" className="font-mono pl-9" placeholder="sk_test_..." defaultValue={gateways[0].secretKey} />
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Webhook Secret</Label>
                                        <Input type="password" className="font-mono" placeholder="whsec_..." defaultValue={gateways[0].webhookSecret} />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={gateways[0].isEnabled}
                                            onCheckedChange={() => toggleGateway('1')}
                                        />
                                        <Label>{gateways[0].isEnabled ? 'Gateway Active' : 'Gateway Disabled'}</Label>
                                    </div>
                                    <Button onClick={() => handleSave('1')}>Save Securely</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        {/* Razorpay Tab */}
                        <TabsContent value="razorpay">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Razorpay Configuration</CardTitle>
                                            <CardDescription>Ideal for Indian payment methods and UPI.</CardDescription>
                                        </div>
                                        <Switch checked={gateways[1].isEnabled} onCheckedChange={() => toggleGateway('2')} />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Key ID</Label>
                                        <Input type="text" className="font-mono" placeholder="rzp_test_..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Key Secret</Label>
                                        <Input type="password" className="font-mono" placeholder="Secret..." />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end border-t px-6 py-4">
                                    <Button onClick={() => handleSave('2')}>Save Securely</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="manual">
                            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 border-2 border-dashed rounded-xl">
                                <Banknote className="h-12 w-12 text-muted-foreground" />
                                <h3 className="text-xl font-semibold">Manual Bank Transfer</h3>
                                <p className="text-muted-foreground max-w-md">
                                    Configure bank account details here. Parents will upload receipts manually for admin verification.
                                </p>
                                <Button variant="outline">Configure Bank Details</Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
