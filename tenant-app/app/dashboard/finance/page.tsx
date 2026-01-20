'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, FileText, DollarSign } from 'lucide-react';
import RefundPolicyCard from '@/components/finance/RefundPolicyCard';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import CreateMomentModal from '@/components/social/CreateMomentModal';

export default function FinanceDashboard() {
    const router = useRouter();
    const [isMomentModalOpen, setIsMomentModalOpen] = React.useState(false);
    const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

    const handleOpenMomentModal = (orderId: string) => {
        setSelectedOrderId(orderId);
        setIsMomentModalOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 pb-24">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finance & Billing</h1>
                    <p className="text-slate-500">Manage fees, view history, and request refunds.</p>
                </div>
                <button
                    disabled // Placeholder functionality
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold opacity-50 cursor-not-allowed flex items-center gap-2"
                >
                    <CreditCard size={18} />
                    <span>Pay Fees</span>
                </button>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Stats / Billing */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Outstanding Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
                            <div>
                                <div className="flex items-center gap-2 text-slate-400 mb-2">
                                    <DollarSign size={18} />
                                    <span className="font-bold uppercase tracking-widest text-xs">Outstanding Balance</span>
                                </div>
                                <div className="text-5xl font-black tracking-tighter mb-1">$0.00</div>
                                <p className="text-slate-400 text-sm">No pending dues.</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Next Due Date</div>
                                <div className="font-bold">-</div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History Placeholder */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900">Recent Transactions</h3>
                            <button className="text-blue-600 text-sm font-bold hover:underline">View All</button>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">
                            {/* Mock Transaction Item */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">Term 1 Fees</div>
                                        <div className="text-xs text-slate-500">Paid on Jan 15, 2024</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">$1,200.00</div>
                                    <button
                                        onClick={() => handleOpenMomentModal('ord_123')}
                                        className="text-xs font-bold text-violet-600 hover:text-violet-700 mt-1 flex items-center gap-1"
                                    >
                                        <Camera size={12} />
                                        <span>Share Moment</span>
                                    </button>
                                </div>
                            </div>

                            <div className="text-center text-slate-500 text-sm mt-4">
                                <button className="text-blue-600 font-bold hover:underline">View All Transactions</button>
                            </div>
                        </div>

                        {selectedOrderId && (
                            <CreateMomentModal
                                isOpen={isMomentModalOpen}
                                onClose={() => setIsMomentModalOpen(false)}
                                orderId={selectedOrderId}
                            />
                        )}
                    </div>
                </div>

                {/* Sidebar: Policies */}
                <div className="space-y-6">
                    <RefundPolicyCard />

                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl">
                        <h4 className="font-bold text-slate-800 mb-2">Need Help?</h4>
                        <p className="text-sm text-slate-500 mb-4">
                            If you have questions about your bill or our refund policy, please contact school administration.
                        </p>
                        <button className="text-slate-900 font-bold text-sm bg-white border border-slate-200 px-4 py-2 rounded-lg w-full hover:bg-slate-100 transition-colors">
                            Contact Admin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
