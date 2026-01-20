'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import RefundPolicyCard from '@/components/finance/RefundPolicyCard';

export default function RefundsPage() {
    const router = useRouter();

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6 pb-24">
            {/* Header */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors mb-4"
                >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </button>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Refund Requests</h1>
                <p className="text-slate-500">Manage cancellation requests and view policy details.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content: Request Form & History */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Active Requests Placeholder */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FileText size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No Active Requests</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mb-6">You haven't submitted any refund requests recently.</p>

                        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2">
                            <span>New Request</span>
                        </button>
                    </div>

                    {/* History Section (Empty for now) */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-4">History</h3>
                        <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-500 text-center">
                            No past records found.
                        </div>
                    </div>
                </div>

                {/* Sidebar: Policy & Info */}
                <div className="space-y-6">
                    <RefundPolicyCard />

                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
                        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <Calendar size={16} /> Note on Timelines
                        </h4>
                        <p className="text-sm text-blue-700 leading-relaxed">
                            Refunds are processed based on the date of request submission relative to the event date. Please verify your event date before submitting.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
