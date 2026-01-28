'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bus, MapPin, Plus, Users, Trash2, Phone,
    Navigation, AlertCircle, CheckCircle
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Route {
    route_id: string;
    name: string;
    driver_name: string;
    vehicle_number: string;
    capacity: number;
    allocated_count: number;
    monthly_fee: number;
}

export default function TransportPage() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        driver_name: '',
        vehicle_number: '',
        capacity: '30',
        monthly_fee: '0'
    });

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/transport/routes');
            setRoutes(res.data);
        } catch (e) { toast.error('Failed to load routes'); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!formData.name) return toast.error('Route name is required');
        try {
            await api.post('/transport/routes', {
                ...formData,
                capacity: parseInt(formData.capacity),
                monthly_fee: parseFloat(formData.monthly_fee)
            });
            toast.success('Route created successfully');
            setModalOpen(false);
            setFormData({ name: '', driver_name: '', vehicle_number: '', capacity: '30', monthly_fee: '0' });
            fetchRoutes();
        } catch (e) { toast.error('Failed to create route'); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;
        try {
            await api.delete(`/transport/routes/${id}`);
            toast.success('Route deleted');
            fetchRoutes();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete route');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Bus className="text-amber-500" size={32} />
                            Transport
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage bus routes, drivers, and allocations</p>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add New Route
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : routes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <Navigation className="text-slate-400 w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No Routes Found</h3>
                        <p className="text-slate-500 mt-2">Add your first transport route to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {routes.map(route => {
                            const occupancy = (route.allocated_count / route.capacity) * 100;
                            let statusColor = 'bg-green-100 text-green-700';
                            if (occupancy > 90) statusColor = 'bg-red-100 text-red-700';
                            else if (occupancy > 70) statusColor = 'bg-amber-100 text-amber-700';

                            return (
                                <motion.div
                                    key={route.route_id}
                                    whileHover={{ y: -4 }}
                                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                                            <Bus size={24} />
                                        </div>
                                        <button
                                            onClick={() => handleDelete(route.route_id, route.name)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{route.name}</h3>
                                    <p className="text-sm text-slate-500 font-bold mb-4">{route.vehicle_number || 'No Vehicle No.'}</p>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                            <Users size={16} className="text-slate-400" />
                                            <span>{route.driver_name || 'No Driver'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                            <MapPin size={16} className="text-slate-400" />
                                            <span>Monthly Fee: <span className="text-slate-900 font-bold">${route.monthly_fee}</span></span>
                                        </div>
                                    </div>

                                    {/* Occupancy Bar */}
                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex justify-between text-xs font-bold mb-2">
                                            <span className="text-slate-500">Occupancy</span>
                                            <span className={statusColor.split(' ')[1]}>{route.allocated_count} / {route.capacity}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${statusColor.replace('text', 'bg').replace('100', '500')}`}
                                                style={{ width: `${Math.min(occupancy, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Route</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Route Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Route 1 - Downtown"
                                        className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Driver Name</label>
                                        <input
                                            type="text"
                                            value={formData.driver_name}
                                            onChange={e => setFormData({ ...formData, driver_name: e.target.value })}
                                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Vehicle No.</label>
                                        <input
                                            type="text"
                                            value={formData.vehicle_number}
                                            onChange={e => setFormData({ ...formData, vehicle_number: e.target.value })}
                                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Capacity</label>
                                        <input
                                            type="number"
                                            value={formData.capacity}
                                            onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Fee ($)</label>
                                        <input
                                            type="number"
                                            value={formData.monthly_fee}
                                            onChange={e => setFormData({ ...formData, monthly_fee: e.target.value })}
                                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 py-3 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/30"
                                >
                                    Save Route
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
