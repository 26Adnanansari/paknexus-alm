'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap, Plus, Calendar, ChevronRight,
    BookOpen, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Exam {
    exam_id: string;
    name: string;
    start_date: string;
    end_date: string;
    description?: string;
    is_active: boolean;
}

export default function ExamsListPage() {
    const router = useRouter();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    // Form
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
        } catch (error) {
            toast.error('Failed to load exams');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.start_date || !formData.end_date) {
            toast.error('Please fill required fields');
            return;
        }
        try {
            await api.post('/exams', formData);
            toast.success('Exam created successfully');
            setModalOpen(false);
            setFormData({ name: '', start_date: '', end_date: '', description: '' });
            fetchExams();
        } catch (error) {
            toast.error('Failed to create exam');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <GraduationCap className="text-blue-600" size={32} />
                            Examinations
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage exam terms, schedules, and result cards</p>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        New Exam Term
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : exams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <GraduationCap className="text-slate-400 w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No Exams Found</h3>
                        <p className="text-slate-500 mt-2">Create your first exam term to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map(exam => {
                            // Determine status
                            const now = new Date();
                            const start = new Date(exam.start_date);
                            const end = new Date(exam.end_date);
                            let status = 'Upcoming';
                            let color = 'bg-blue-100 text-blue-700';

                            if (now >= start && now <= end) {
                                status = 'Ongoing';
                                color = 'bg-green-100 text-green-700';
                            } else if (now > end) {
                                status = 'Completed';
                                color = 'bg-slate-100 text-slate-600';
                            }

                            return (
                                <motion.div
                                    key={exam.exam_id}
                                    whileHover={{ y: -4 }}
                                    onClick={() => router.push(`/dashboard/exams/${exam.exam_id}`)}
                                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${color}`}>
                                            {status}
                                        </div>
                                        {status === 'Ongoing' && (
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {exam.name}
                                    </h3>

                                    <div className="space-y-2 text-sm text-slate-500 mb-6">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} />
                                            <span>{new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}</span>
                                        </div>
                                        {exam.description && (
                                            <p className="line-clamp-2 text-slate-400 text-xs">{exam.description}</p>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-bold text-sm">
                                        <span>View Schedules</span>
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Exam</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Exam Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Mid-Term 2026"
                                        className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optional)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none h-24 resize-none"
                                    />
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
                                    Create Exam
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
