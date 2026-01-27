'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, Plus, Edit2, Trash2, Save, X, BookOpen, Bus, Library, Utensils, Calendar
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface FeeHead {
    head_id: string;
    head_name: string;
}

interface FeeStructure {
    structure_id: string;
    class_name: string;
    fee_head_id: string;
    head_name: string;
    amount: number;
    frequency: string;
}

const COMMON_FEE_TYPES = [
    { name: 'Tuition Fee', icon: BookOpen },
    { name: 'Transport Fee', icon: Bus },
    { name: 'Library Fee', icon: Library },
    { name: 'Lunch Fee', icon: Utensils },
    { name: 'Admission Fee', icon: Calendar },
];

export default function FeeStructurePage() {
    const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
    const [structures, setStructures] = useState<FeeStructure[]>([]);
    const [loading, setLoading] = useState(false);

    // New Fee Head
    const [newHeadName, setNewHeadName] = useState('');
    const [showNewHead, setShowNewHead] = useState(false);

    // New Structure
    const [showNewStructure, setShowNewStructure] = useState(false);
    const [newStructure, setNewStructure] = useState({
        class_name: '',
        fee_head_id: '',
        amount: '',
        frequency: 'monthly'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [headsRes, structRes] = await Promise.all([
                api.get('/fees/heads'),
                api.get('/fees/structure')
            ]);

            setFeeHeads(headsRes.data);

            // Fetch structures for all classes
            const allStructures: FeeStructure[] = [];
            const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
                'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

            for (const cls of classes) {
                try {
                    const res = await api.get(`/fees/structure/${cls}`);
                    allStructures.push(...res.data);
                } catch (e) {
                    // Class might not have structure yet
                }
            }

            setStructures(allStructures);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load fee data');
        } finally {
            setLoading(false);
        }
    };

    const createFeeHead = async () => {
        if (!newHeadName.trim()) {
            toast.error('Please enter fee head name');
            return;
        }

        try {
            await api.post('/fees/heads', { head_name: newHeadName });
            toast.success('Fee head created successfully');
            setNewHeadName('');
            setShowNewHead(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create fee head');
        }
    };

    const createStructure = async () => {
        if (!newStructure.class_name || !newStructure.fee_head_id || !newStructure.amount) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            await api.post('/fees/structure', {
                class_name: newStructure.class_name,
                fee_head_id: newStructure.fee_head_id,
                amount: parseFloat(newStructure.amount),
                frequency: newStructure.frequency
            });
            toast.success('Fee structure created successfully');
            setNewStructure({ class_name: '', fee_head_id: '', amount: '', frequency: 'monthly' });
            setShowNewStructure(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create structure');
        }
    };

    // Group structures by class
    const structuresByClass = structures.reduce((acc, struct) => {
        if (!acc[struct.class_name]) {
            acc[struct.class_name] = [];
        }
        acc[struct.class_name].push(struct);
        return {};
    }, {} as Record<string, FeeStructure[]>);

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                            <DollarSign className="text-green-600" size={36} />
                            Fee Structure Management
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">Configure fee heads and class-wise fee structures</p>
                    </div>
                </div>

                {/* Fee Heads Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-900">Fee Heads</h2>
                        <button
                            onClick={() => setShowNewHead(!showNewHead)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Fee Head
                        </button>
                    </div>

                    {showNewHead && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200"
                        >
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newHeadName}
                                    onChange={(e) => setNewHeadName(e.target.value)}
                                    placeholder="Fee Head Name (e.g., Tuition Fee)"
                                    className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                />
                                <button
                                    onClick={createFeeHead}
                                    className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                                >
                                    <Save size={16} /> Save
                                </button>
                                <button
                                    onClick={() => setShowNewHead(false)}
                                    className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-300 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {COMMON_FEE_TYPES.map((type, idx) => {
                            const Icon = type.icon;
                            const exists = feeHeads.find(h => h.head_name === type.name);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (!exists) {
                                            setNewHeadName(type.name);
                                            createFeeHead();
                                        }
                                    }}
                                    disabled={!!exists}
                                    className={`p-4 rounded-xl border-2 transition-all ${exists
                                            ? 'bg-green-50 border-green-200 cursor-default'
                                            : 'bg-white border-slate-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                                        }`}
                                >
                                    <Icon className={`mx-auto mb-2 ${exists ? 'text-green-600' : 'text-slate-400'}`} size={24} />
                                    <p className="font-bold text-sm text-slate-700">{type.name}</p>
                                    {exists && <p className="text-xs text-green-600 mt-1">✓ Added</p>}
                                </button>
                            );
                        })}
                    </div>

                    {feeHeads.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm font-bold text-slate-600 mb-2">All Fee Heads:</p>
                            <div className="flex flex-wrap gap-2">
                                {feeHeads.map((head) => (
                                    <span
                                        key={head.head_id}
                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold"
                                    >
                                        {head.head_name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Fee Structure Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-900">Class-wise Fee Structure</h2>
                        <button
                            onClick={() => setShowNewStructure(!showNewStructure)}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Structure
                        </button>
                    </div>

                    {showNewStructure && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-4 p-4 bg-green-50 rounded-xl border border-green-200"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                <input
                                    type="text"
                                    value={newStructure.class_name}
                                    onChange={(e) => setNewStructure({ ...newStructure, class_name: e.target.value })}
                                    placeholder="Class Name"
                                    className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                                />
                                <select
                                    value={newStructure.fee_head_id}
                                    onChange={(e) => setNewStructure({ ...newStructure, fee_head_id: e.target.value })}
                                    className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                                >
                                    <option value="">Select Fee Head</option>
                                    {feeHeads.map((head) => (
                                        <option key={head.head_id} value={head.head_id}>
                                            {head.head_name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={newStructure.amount}
                                    onChange={(e) => setNewStructure({ ...newStructure, amount: e.target.value })}
                                    placeholder="Amount"
                                    className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                                />
                                <select
                                    value={newStructure.frequency}
                                    onChange={(e) => setNewStructure({ ...newStructure, frequency: e.target.value })}
                                    className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="annually">Annually</option>
                                    <option value="one-time">One-time</option>
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={createStructure}
                                    className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                                >
                                    <Save size={16} /> Save Structure
                                </button>
                                <button
                                    onClick={() => setShowNewStructure(false)}
                                    className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-300 transition-all"
                                >
                                    <X size={16} /> Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading structures...</div>
                    ) : structures.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No fee structures configured yet. Click "Add Structure" to get started.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Class</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Fee Head</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Frequency</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {structures.map((struct) => (
                                        <tr key={struct.structure_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900">{struct.class_name}</td>
                                            <td className="px-6 py-4 text-slate-600">{struct.head_name}</td>
                                            <td className="px-6 py-4 font-mono text-green-600 font-bold">PKR {struct.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold capitalize">
                                                    {struct.frequency}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
