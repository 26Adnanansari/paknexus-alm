'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, DollarSign, CreditCard, History, AlertCircle } from 'lucide-react';

export default function FeesPage() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fee Management</h1>
                    <p className="text-slate-500">Track payments, manage invoices, and collect fees.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <History size={18} />
                        <span>History</span>
                    </button>
                    <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2">
                        <Receipt size={18} />
                        <span>Collect Fee</span>
                    </button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Collected Today</p>
                        <h3 className="text-2xl font-bold text-slate-900">$0.00</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Pending Dues</p>
                        <h3 className="text-2xl font-bold text-slate-900">$0.00</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Defaulters</p>
                        <h3 className="text-2xl font-bold text-slate-900">0</h3>
                    </div>
                </div>
            </div>

            {/* Empty State / Coming Soon */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-200"
            >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Receipt className="text-slate-300" size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Fee Module Coming Soon</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    We are currently building a secure and robust fee collection system involving offline entry, online gateways, and automated invoicing.
                </p>
                <div className="mt-8 flex justify-center gap-2 text-sm text-slate-400">
                    <span className="px-3 py-1 bg-white rounded-full border">Offline Collection</span>
                    <span className="px-3 py-1 bg-white rounded-full border">Online Gateways</span>
                    <span className="px-3 py-1 bg-white rounded-full border">Invoices</span>
                </div>
            </motion.div>
        </div>
    );
}
