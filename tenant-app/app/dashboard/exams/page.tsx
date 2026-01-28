'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Plus, ChevronRight, FileText, ClipboardList, CheckCircle
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

interface Exam {
    exam_id: string;
    name: string;
    start_date: string;
    end_date: string;
    description: string;
    is_active: boolean;
}

export default function ExamsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Add Exam Form State
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        description: ''
    });

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const res = await api.get('/exams');
            setExams(res.data);
        } catch (e) { toast.error('Failed to load exams'); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.start_date || !formData.end_date) return toast.error('Fill required fields');
        try {
            await api.post('/exams', formData);
            toast.success('Exam Created');
            setIsAddOpen(false);
            fetchExams();
        } catch (e) { toast.error('Failed to create exam'); }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <ClipboardList className="text-purple-600" size={32} />
                            Examinations
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage exam schedules, papers, and results</p>
                    </div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-200"
                    >
                        <Plus size={20} />
                        New Exam
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div>
                ) : exams.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-slate-400">No exams found</h3>
                        <p className="text-slate-400 text-sm">Create your first exam to get started</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {exams.map((exam, i) => (
                            <Link href={`/dashboard/exams/${exam.exam_id}`} key={exam.exam_id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group cursor-pointer h-full"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                            <Calendar size={24} />
                                        </div>
                                        {exam.is_active && (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1">
                                                <CheckCircle size={10} /> Active
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{exam.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{exam.description || 'No description provided'}</p>

                                    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 text-xs font-bold text-slate-500">
                                        <div className="flex-1 text-center border-r border-slate-200">
                                            <span className="block text-slate-400 uppercase text-[10px] mb-1">Starts</span>
                                            {new Date(exam.start_date).toLocaleDateString()}
                                        </div>
                                        <div className="flex-1 text-center">
                                            <span className="block text-slate-400 uppercase text-[10px] mb-1">Ends</span>
                                            {new Date(exam.end_date).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end text-purple-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                                        Manage Papers & Marks <ChevronRight size={16} />
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-6">Create New Exam</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Exam Name</label>
                                    <input
                                        placeholder="e.g. Final Term 2026"
                                        className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Start Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none"
                                            value={formData.start_date}
                                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase">End Date</label>
                                        <input
                                            type="date"
                                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none"
                                            value={formData.end_date}
                                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                                    <textarea
                                        placeholder="Optional notes..."
                                        className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none h-24"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsAddOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                                <button onClick={handleCreate} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700">Create Exam</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
