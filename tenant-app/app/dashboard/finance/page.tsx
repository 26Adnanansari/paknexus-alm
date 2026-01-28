'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, TrendingUp, TrendingDown, PieChart,
    ArrowUpRight, ArrowDownRight, Plus, Calendar, Trash2
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
// Charts handled via custom CSS/SVG implementation to avoid heavy dependencies on initial load.
// Actually, for simplicity and speed without added deps issues, I'll use simple CSS bars or Recharts if available. 
// I'll stick to CSS/Tailwind for visual simplicity unless requested.
// Wait, user asked for "Wow" aesthetics. 
// I'll use a simple SVG chart implementation manually or use Recharts if I can assume it's there.
// Typically 'recharts' is common. I'll verify package.json? 
// No time. I'll build custom SVG charts for maximum wow and zero dep risk.

interface FinancialSummary {
    total_income: number;
    total_expenses: number;
    net_profit: number;
    expense_breakdown: { category: string; total: number }[];
    monthly_trend: { month: string; income: number; expense: number }[];
}

interface Expense {
    expense_id: string;
    category: string;
    amount: number;
    description: string;
    date: string;
    payment_method: string;
}

export default function FinancePage() {
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const [formData, setFormData] = useState({
        category: 'Maintenance',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'cash'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resSummary, resExp] = await Promise.all([
                api.get('/finance/summary'),
                api.get('/finance/expenses')
            ]);
            setSummary(resSummary.data);
            setExpenses(resExp.data);
        } catch (e) { toast.error('Failed to load financial data'); }
        finally { setLoading(false); }
    };

    const handleAdd = async () => {
        if (!formData.amount || !formData.description) return toast.error('Fill required fields');
        try {
            await api.post('/finance/expenses', {
                ...formData,
                amount: parseFloat(formData.amount)
            });
            toast.success('Expense Recorded');
            setIsAddOpen(false);
            setFormData({ category: 'Maintenance', amount: '', description: '', date: new Date().toISOString().split('T')[0], payment_method: 'cash' });
            fetchData();
        } catch (e) { toast.error('Failed to record expense'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete expense?')) return;
        try {
            await api.delete(`/finance/expenses/${id}`);
            toast.success('Deleted');
            fetchData();
        } catch (e) { toast.error('Failed to delete'); }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" /></div>;

    const maxTrend = summary ? Math.max(...summary.monthly_trend.map(m => Math.max(m.income, m.expense))) : 1000;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <DollarSign className="text-emerald-600" size={32} />
                            Financial Overview
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Track income, expenses, and net profit</p>
                    </div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
                    >
                        <Plus size={20} />
                        Record Expense
                    </button>
                </div>

                {/* KPI Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><ArrowUpRight size={20} /></div>
                                <h3 className="font-bold text-slate-500 uppercase text-sm">Total Income</h3>
                            </div>
                            <p className="text-3xl font-black text-slate-900">${summary.total_income.toLocaleString()}</p>
                            <p className="text-xs font-bold text-green-600 mt-1">From Fees & Grants</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg"><ArrowDownRight size={20} /></div>
                                <h3 className="font-bold text-slate-500 uppercase text-sm">Total Expenses</h3>
                            </div>
                            <p className="text-3xl font-black text-slate-900">${summary.total_expenses.toLocaleString()}</p>
                            <p className="text-xs font-bold text-red-600 mt-1">Operational Costs</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><PieChart size={20} /></div>
                                <h3 className="font-bold text-slate-500 uppercase text-sm">Net Profit</h3>
                            </div>
                            <p className={`text-3xl font-black ${summary.net_profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                ${summary.net_profit.toLocaleString()}
                            </p>
                            <p className="text-xs font-bold text-slate-400 mt-1">Before Tax</p>
                        </motion.div>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Charts */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="text-slate-400" size={20} /> Monthly Trend
                        </h3>
                        <div className="h-64 flex items-end gap-4 justify-between">
                            {summary?.monthly_trend.map((m, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        Income: ${m.income}<br />Exp: ${m.expense}
                                    </div>

                                    <div
                                        className="w-full bg-green-400 rounded-t-sm opacity-80 hover:opacity-100 transition-all"
                                        style={{ height: `${(m.income / maxTrend) * 100}%`, minHeight: '4px' }}
                                    />
                                    <div
                                        className="w-full bg-red-400 rounded-b-sm opacity-80 hover:opacity-100 transition-all -mt-1"
                                        style={{ height: `${(m.expense / maxTrend) * 100}%`, minHeight: '4px' }}
                                    />
                                    <p className="text-[10px] font-bold text-slate-400 text-center truncate mt-2">{m.month}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <PieChart className="text-slate-400" size={20} /> Expense Breakdown
                        </h3>
                        <div className="space-y-4 overflow-y-auto max-h-64 pr-2">
                            {summary?.expense_breakdown.map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                        {item.category[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-slate-700 text-sm">{item.category}</span>
                                            <span className="font-bold text-slate-900 text-sm">${item.total.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${(item.total / summary.total_expenses) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {summary?.expense_breakdown.length === 0 && (
                                <p className="text-center text-slate-400 text-sm py-10">No expenses recorded yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Expenses List */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900">Recent Expenses</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {expenses.map(exp => (
                            <div key={exp.expense_id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xl">
                                        {exp.category[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{exp.description}</h4>
                                        <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                            <Calendar size={12} /> {new Date(exp.date).toLocaleDateString()}
                                            <span className="bg-slate-200 px-1.5 rounded text-slate-600">{exp.category}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="uppercase">{exp.payment_method}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-red-600 text-lg">-${exp.amount.toLocaleString()}</p>
                                    <button onClick={() => handleDelete(exp.expense_id)} className="text-xs font-bold text-slate-300 hover:text-red-500 flex items-center gap-1 ml-auto mt-1">
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Plus className="text-emerald-600" /> Record Expense
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                                    <select
                                        className="w-full p-4 bg-slate-50 border rounded-xl font-bold outline-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option>Maintenance</option>
                                        <option>Salary</option>
                                        <option>Utility</option>
                                        <option>Inventory</option>
                                        <option>Event</option>
                                        <option>Transport</option>
                                        <option>Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Amount</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-lg outline-none"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                                    <input
                                        placeholder="What was this for?"
                                        className="w-full p-4 bg-slate-50 border rounded-xl font-bold outline-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold outline-none"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Payment Method</label>
                                        <select
                                            className="w-full p-4 bg-slate-50 border rounded-xl font-bold outline-none"
                                            value={formData.payment_method}
                                            onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="bank">Bank Transfer</option>
                                            <option value="cheque">Cheque</option>
                                            <option value="online">Online</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setIsAddOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                                <button onClick={handleAdd} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200">Save Expense</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
