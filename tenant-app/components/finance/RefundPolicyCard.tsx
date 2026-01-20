'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface RefundTier {
    days_before: number;
    refund_percentage: number;
    fee_deduction: number;
}

interface RefundPolicy {
    id: string;
    name: string;
    description: string;
    tiers: RefundTier[];
}

export default function RefundPolicyCard() {
    const [policy, setPolicy] = React.useState<RefundPolicy | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchPolicy = async () => {
            try {
                // Fetch the default policy
                const res = await api.get('/refunds/');
                if (res.data && res.data.length > 0) {
                    setPolicy(res.data[0]); // Assume first is active/default
                }
            } catch (err) {
                console.error("Failed to fetch refund policy", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicy();
    }, []);

    if (loading) return <div className="h-48 bg-slate-100 animate-pulse rounded-3xl" />;

    // Fallback if no policy set
    if (!policy) return (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
            <Receipt className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-slate-500 font-medium">No active refund policy</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Receipt size={80} />
            </div>

            <div className="flex items-center space-x-3 mb-4">
                <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600">
                    <Receipt size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900">{policy.name}</h3>
                    <p className="text-xs text-slate-500">Cancellation Policy</p>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                {policy.tiers.map((tier, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-600">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            {tier.days_before === 0 ? 'Anytime' : `> ${tier.days_before} days before`}
                        </span>
                        <span className="font-bold text-slate-900">{tier.refund_percentage}% Refund</span>
                    </div>
                ))}
            </div>

            <a
                href="/dashboard/finance/refunds"
                className="flex items-center justify-between w-full bg-slate-50 hover:bg-slate-100 p-3 rounded-xl transition-colors text-sm font-semibold text-slate-700"
            >
                <span>Request a Refund</span>
                <ArrowRight size={16} />
            </a>
        </motion.div>
    );
}
