'use client';

import RefundPolicyManager from '@/components/finance/RefundPolicyManager';

export default function FinanceSettingsPage() {
    return (
        <div className="space-y-6 p-6 md:p-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage refund policies, tax rules, and payment gateways.</p>
                </div>
            </div>

            <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-6">Refund Policies</h2>
                <RefundPolicyManager />
            </div>
        </div>
    );
}
