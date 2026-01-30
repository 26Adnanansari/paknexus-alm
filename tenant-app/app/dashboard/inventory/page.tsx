'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Plus, TrendingUp, TrendingDown,
    AlertTriangle, ShoppingCart, Search, Filter
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Item {
    item_id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    cost_per_unit: number;
    low_stock_threshold: number;
    supplier_name?: string;
}

export default function InventoryPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    // Forms
    const [createForm, setCreateForm] = useState({
        name: '', category: 'Stationary', quantity: 0,
        unit: 'pcs', cost_per_unit: 0, low_stock_threshold: 10, supplier_name: ''
    });

    const [adjustForm, setAdjustForm] = useState({
        type: 'in', quantity: 1, reason: ''
    });

    // History
    const [transactions, setTransactions] = useState<any[]>([]);
    const [view, setView] = useState<'items' | 'history'>('items');

    useEffect(() => {
        if (view === 'items') fetchItems();
        if (view === 'history') fetchTransactions();
    }, [view, categoryFilter, showLowStock]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (categoryFilter) params.category = categoryFilter;
            if (showLowStock) params.low_stock = true;

            const res = await api.get('/inventory/items', { params });
            setItems(res.data);
        } catch (e) { toast.error('Failed to load items'); }
        finally { setLoading(false); }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory/transactions');
            setTransactions(res.data);
        } catch (e) { toast.error('Failed to load history'); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!createForm.name) return toast.error('Name required');
        try {
            await api.post('/inventory/items', createForm);
            toast.success('Item created');
            setIsCreateOpen(false);
            setCreateForm({ name: '', category: 'Stationary', quantity: 0, unit: 'pcs', cost_per_unit: 0, low_stock_threshold: 10, supplier_name: '' });
            fetchItems();
        } catch (e) { toast.error('Failed to create item'); }
    };

    const handleAdjust = async () => {
        if (!selectedItem) return;
        try {
            await api.post('/inventory/adjust', {
                item_id: selectedItem.item_id,
                ...adjustForm
            });
            toast.success('Stock adjusted');
            setIsAdjustOpen(false);
            setAdjustForm({ type: 'in', quantity: 1, reason: '' });
            setSelectedItem(null);
            fetchItems();
        } catch (e: any) { toast.error(e.response?.data?.detail || 'Adjustment failed'); }
    };

    const openAdjust = (item: Item, type: string) => {
        setSelectedItem(item);
        setAdjustForm({ type, quantity: 1, reason: '' });
        setIsAdjustOpen(true);
    };

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Package className="text-blue-600" size={32} />
                            Inventory
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Track assets, stock levels, and procurement</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-white p-1 rounded-xl border border-slate-200 flex">
                            <button
                                onClick={() => setView('items')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'items' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Items
                            </button>
                            <button
                                onClick={() => setView('history')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'history' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                History
                            </button>
                        </div>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Add New Item
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {view === 'items' && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search items..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl w-full outline-none"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        >
                            <option value="">All Categories</option>
                            <option value="Stationary">Stationary</option>
                            <option value="Uniform">Uniform</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Electronics">Electronics</option>
                        </select>
                        <button
                            onClick={() => setShowLowStock(!showLowStock)}
                            className={`px-4 py-2 rounded-xl font-bold border transition-colors flex items-center gap-2
                            ${showLowStock ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-600'}
                        `}
                        >
                            <AlertTriangle size={16} />
                            Low Stock
                        </button>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : view === 'items' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map(item => {
                            const isLow = item.quantity <= item.low_stock_threshold;

                            return (
                                <motion.div
                                    key={item.item_id}
                                    whileHover={{ y: -4 }}
                                    className={`bg-white p-6 rounded-3xl border shadow-sm transition-all relative overflow-hidden
                                        ${isLow ? 'border-red-100' : 'border-slate-200'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${isLow ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                            <Package size={24} />
                                        </div>
                                        {isLow && (
                                            <div className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                                                <AlertTriangle size={12} />
                                                Low Stock
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-1">{item.name}</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4">{item.category}</p>

                                    <div className="flex items-end gap-2 mb-6">
                                        <span className="text-3xl font-black text-slate-900">{item.quantity}</span>
                                        <span className="text-sm font-bold text-slate-400 mb-1">{item.unit}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        <button
                                            onClick={() => openAdjust(item, 'in')}
                                            className="bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-xl font-bold flex justify-center items-center gap-1 text-sm"
                                        >
                                            <TrendingUp size={16} /> Stock In
                                        </button>
                                        <button
                                            onClick={() => openAdjust(item, 'out')}
                                            className="bg-slate-50 text-slate-700 hover:bg-slate-100 py-2 rounded-xl font-bold flex justify-center items-center gap-1 text-sm"
                                        >
                                            <TrendingDown size={16} /> Stock Out
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {filteredItems.length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-400">
                                <Package size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No items found.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Transaction History View
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Item</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Quantity</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Reason</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((t) => (
                                    <tr key={t.transaction_id} className="hover:bg-slate-50 cursor-default">
                                        <td className="p-4 text-sm text-slate-600 font-mono">
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 font-bold text-slate-900">{t.item_name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                ${t.type === 'in' ? 'bg-green-100 text-green-700' :
                                                    t.type === 'out' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-red-100 text-red-700'}
                                            `}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono font-bold">
                                            {t.type === 'in' ? '+' : '-'}{t.quantity} {t.unit}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 italic">
                                            {t.reason || '-'}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-700">
                                            {t.performed_by_name || 'System'}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400 font-bold">
                                            No recent transactions
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Item Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg">
                            <h2 className="text-2xl font-bold mb-6">New Inventory Item</h2>
                            <div className="space-y-4">
                                <input type="text" placeholder="Item Name" className="w-full p-3 bg-slate-50 border rounded-xl font-bold" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <select className="w-full p-3 bg-slate-50 border rounded-xl" value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })}>
                                        <option value="Stationary">Stationary</option>
                                        <option value="Uniform">Uniform</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Electronics">Electronics</option>
                                    </select>
                                    <input type="number" placeholder="Init Qty" className="w-full p-3 bg-slate-50 border rounded-xl" value={createForm.quantity} onChange={e => setCreateForm({ ...createForm, quantity: parseInt(e.target.value) })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Unit (pcs)" className="w-full p-3 bg-slate-50 border rounded-xl" value={createForm.unit} onChange={e => setCreateForm({ ...createForm, unit: e.target.value })} />
                                    <input type="number" placeholder="Cost/Unit" className="w-full p-3 bg-slate-50 border rounded-xl" value={createForm.cost_per_unit} onChange={e => setCreateForm({ ...createForm, cost_per_unit: parseFloat(e.target.value) })} />
                                </div>
                                <input type="number" placeholder="Low Stock Threshold" className="w-full p-3 bg-slate-50 border rounded-xl" value={createForm.low_stock_threshold} onChange={e => setCreateForm({ ...createForm, low_stock_threshold: parseInt(e.target.value) })} />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsCreateOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                                <button onClick={handleCreate} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Create</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Adjust Stock Modal */}
            <AnimatePresence>
                {isAdjustOpen && selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
                            <h2 className="text-xl font-bold mb-1">Adjust Stock</h2>
                            <p className="text-sm text-slate-500 mb-6 font-bold">{selectedItem.name} • {adjustForm.type === 'in' ? 'Adding' : 'Removing'} Stock</p>

                            <div className="space-y-4">
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    {['in', 'out', 'damage'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setAdjustForm({ ...adjustForm, type: t })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all
                                                ${adjustForm.type === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}
                                            `}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Quantity</label>
                                    <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-black text-2xl text-center" value={adjustForm.quantity} onChange={e => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 0 })} />
                                </div>

                                <input type="text" placeholder="Reason (Optional)" className="w-full p-3 bg-slate-50 border rounded-xl" value={adjustForm.reason} onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })} />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsAdjustOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                                <button onClick={handleAdjust} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
