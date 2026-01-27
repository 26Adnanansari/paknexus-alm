'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, Plus, Edit2, Trash2, Save, X, BookOpen, Bus, Library, Utensils, Calendar, Loader2, Search
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
    { name: 'Tuition Fee', icon: BookOpen, color: 'blue' },
    { name: 'Transport Fee', icon: Bus, color: 'green' },
    { name: 'Library Fee', icon: Library, color: 'purple' },
    { name: 'Lunch Fee', icon: Utensils, color: 'orange' },
    { name: 'Admission Fee', icon: Calendar, color: 'pink' },
];

export default function FeeStructurePage() {
    const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
    const [structures, setStructures] = useState<FeeStructure[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
            const [headsRes] = await Promise.all([
                api.get('/fees/heads')
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

    const createFeeHead = async (headName?: string) => {
        const name = headName || newHeadName;
        if (!name.trim()) {
            toast.error('Please enter fee head name');
            return;
        }

        try {
            await api.post('/fees/heads', { head_name: name });
            toast.success(`${name} created successfully`);
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

    // Filter structures based on search
    const filteredStructures = structures.filter(struct =>
        struct.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        struct.head_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group structures by class
    const structuresByClass = filteredStructures.reduce((acc, struct) => {
        if (!acc[struct.class_name]) {
            acc[struct.class_name] = [];
        }
        acc[struct.class_name].push(struct);
        return acc;
    }, {} as Record<string, FeeStructure[]>);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                            <DollarSign className="text-white" size={28} />
                        </div>
                        Fee Structure Management
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Configure fee heads and class-wise fee structures</p>
                </div>
            </div>

            {/* Fee Heads Section */}
            <div className="glass p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Fee Heads</h2>
                    <button
                        onClick={() => setShowNewHead(!showNewHead)}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <Plus size={16} /> Add Fee Head
                    </button>
                </div>

                <AnimatePresence>
                    {showNewHead && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
                        >
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newHeadName}
                                    onChange={(e) => setNewHeadName(e.target.value)}
                                    placeholder="Fee Head Name (e.g., Tuition Fee)"
                                    className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    onKeyPress={(e) => e.key === 'Enter' && createFeeHead()}
                                />
                                <button
                                    onClick={() => createFeeHead()}
                                    className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                                >
                                    <Save size={16} /> Save
                                </button>
                                <button
                                    onClick={() => setShowNewHead(false)}
                                    className="bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-300 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Quick Add Common Fee Types */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {COMMON_FEE_TYPES.map((type, idx) => {
                        const Icon = type.icon;
                        const exists = feeHeads.find(h => h.head_name === type.name);
                        return (
                            <motion.button
                                key={idx}
                                whileHover={{ scale: exists ? 1 : 1.02 }}
                                whileTap={{ scale: exists ? 1 : 0.98 }}
                                onClick={() => {
                                    if (!exists) {
                                        createFeeHead(type.name);
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
                            </motion.button>
                        );
                    })}
                </div>

                {/* All Fee Heads Display */}
                {feeHeads.length > 0 && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm font-bold text-slate-600 mb-3">All Fee Heads ({feeHeads.length}):</p>
                        <div className="flex flex-wrap gap-2">
                            {feeHeads.map((head) => (
                                <span
                                    key={head.head_id}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold shadow-md"
                                >
                                    {head.head_name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Fee Structure Section */}
            <div className="glass p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Class-wise Fee Structure</h2>
                    <div className="flex gap-3">
                        <div className="relative flex-1 md:flex-none md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search class or fee..."
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setShowNewStructure(!showNewStructure)}
                            className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-200"
                        >
                            <Plus size={16} /> Add Structure
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showNewStructure && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                <input
                                    type="text"
                                    value={newStructure.class_name}
                                    onChange={(e) => setNewStructure({ ...newStructure, class_name: e.target.value })}
                                    placeholder="Class Name (e.g., Class 10-A)"
                                    className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                                />
                                <select
                                    value={newStructure.fee_head_id}
                                    onChange={(e) => setNewStructure({ ...newStructure, fee_head_id: e.target.value })}
                                    className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white"
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
                                    placeholder="Amount (PKR)"
                                    className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                                />
                                <select
                                    value={newStructure.frequency}
                                    onChange={(e) => setNewStructure({ ...newStructure, frequency: e.target.value })}
                                    className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white"
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
                                    className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                                >
                                    <Save size={16} /> Save Structure
                                </button>
                                <button
                                    onClick={() => setShowNewStructure(false)}
                                    className="bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-300 transition-all"
                                >
                                    <X size={16} /> Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" />
                        <p className="text-slate-500">Loading structures...</p>
                    </div>
                ) : filteredStructures.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl">
                        <DollarSign className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 font-bold text-lg">No fee structures configured yet</p>
                        <p className="text-slate-500 text-sm mt-2">Click "Add Structure" to get started</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(structuresByClass).map(([className, classStructures]) => (
                            <motion.div
                                key={className}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border border-slate-200 rounded-xl overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3">
                                    <h3 className="font-bold text-white text-lg">{className}</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {classStructures.map((struct) => (
                                        <div
                                            key={struct.structure_id}
                                            className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between"
                                        >
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900">{struct.head_name}</p>
                                                <p className="text-sm text-slate-500 capitalize">{struct.frequency} payment</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono text-2xl font-black text-green-600">
                                                    PKR {struct.amount.toLocaleString()}
                                                </p>
                                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold capitalize mt-1">
                                                    {struct.frequency}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
