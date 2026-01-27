'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, TrendingUp, Users, AlertCircle, Settings, CreditCard, FileText, ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface FeeReport {
    total_expected: number;
    total_collected: number;
    total_outstanding: number;
    collection_percentage: number;
    total_students: number;
    paying_students: number;
    defaulter_count: number;
}

export default function FeesDashboardPage() {
    const router = useRouter();
    const [report, setReport] = useState<FeeReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('/fees/report');
            setReport(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load fee report');
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        {
            title: 'Collect Fees',
            description: 'Record student fee payments',
            icon: CreditCard,
            color: 'from-green-600 to-green-700',
            path: '/dashboard/fees/collect'
        },
        {
            title: 'Fee Structure',
            description: 'Configure class-wise fees',
            icon: Settings,
            color: 'from-blue-600 to-blue-700',
            path: '/dashboard/fees/structure'
        },
        {
            title: 'Outstanding Report',
            description: 'View pending payments',
            icon: FileText,
            color: 'from-red-600 to-red-700',
            path: '/dashboard/fees/outstanding'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <DollarSign className="text-green-600" size={36} />
                        Fee Management
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Complete fee collection and reporting system</p>
                </div>

                {/* Stats Cards */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 animate-pulse">
                                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                                <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : report && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl shadow-lg text-white"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-blue-100 text-sm font-bold">Total Expected</p>
                                <TrendingUp className="text-blue-200" size={20} />
                            </div>
                            <p className="text-3xl font-black">PKR {report.total_expected.toLocaleString()}</p>
                            <p className="text-blue-100 text-xs mt-2">{report.total_students} students</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-3xl shadow-lg text-white"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-green-100 text-sm font-bold">Total Collected</p>
                                <DollarSign className="text-green-200" size={20} />
                            </div>
                            <p className="text-3xl font-black">PKR {report.total_collected.toLocaleString()}</p>
                            <p className="text-green-100 text-xs mt-2">{report.collection_percentage.toFixed(1)}% collected</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-3xl shadow-lg text-white"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-red-100 text-sm font-bold">Outstanding</p>
                                <AlertCircle className="text-red-200" size={20} />
                            </div>
                            <p className="text-3xl font-black">PKR {report.total_outstanding.toLocaleString()}</p>
                            <p className="text-red-100 text-xs mt-2">{report.defaulter_count} defaulters</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-3xl shadow-lg text-white"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-purple-100 text-sm font-bold">Paying Students</p>
                                <Users className="text-purple-200" size={20} />
                            </div>
                            <p className="text-3xl font-black">{report.paying_students}</p>
                            <p className="text-purple-100 text-xs mt-2">
                                {((report.paying_students / report.total_students) * 100).toFixed(1)}% of total
                            </p>
                        </motion.div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <motion.button
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * (index + 1) }}
                                    onClick={() => router.push(action.path)}
                                    className={`bg-gradient-to-br ${action.color} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all text-left group`}
                                >
                                    <Icon className="text-white mb-4" size={32} />
                                    <h3 className="text-xl font-bold text-white mb-2">{action.title}</h3>
                                    <p className="text-white/80 text-sm mb-4">{action.description}</p>
                                    <div className="flex items-center text-white font-bold text-sm group-hover:gap-3 transition-all">
                                        Get Started <ArrowRight size={16} className="ml-2" />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Collection Progress */}
                {report && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Collection Progress</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-bold text-slate-700">Overall Collection</span>
                                    <span className="text-sm font-bold text-green-600">{report.collection_percentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${report.collection_percentage}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                                    <p className="text-xs font-bold text-blue-600 mb-1">Expected</p>
                                    <p className="text-2xl font-black text-blue-900">PKR {report.total_expected.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                    <p className="text-xs font-bold text-green-600 mb-1">Collected</p>
                                    <p className="text-2xl font-black text-green-900">PKR {report.total_collected.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                                    <p className="text-xs font-bold text-red-600 mb-1">Pending</p>
                                    <p className="text-2xl font-black text-red-900">PKR {report.total_outstanding.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
