'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Plus, FileText, Calendar,
    BookOpen, Percent, Users, ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Paper {
    paper_id: string;
    class_id: string;
    class_name: string;
    section: string;
    subject_id: string;
    subject_name: string;
    date: string;
    total_marks: number | string;
    marked_count: number;
}

interface ClassItem { class_id: string; class_name: string; section: string; }
interface Subject { subject_id: string; subject_name: string; }

export default function ExamPapersPage() {
    const { examId } = useParams();
    const router = useRouter();

    const [papers, setPapers] = useState<Paper[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        class_id: '',
        subject_id: '',
        date: '',
        total_marks: '100',
        passing_marks: '33'
    });

    useEffect(() => {
        if (examId) {
            fetchPapers();
            fetchMeta();
        }
    }, [examId]);

    const fetchMeta = async () => {
        try {
            const [cRes, sRes] = await Promise.all([
                api.get('/curriculum/classes'),
                api.get('/curriculum/subjects')
            ]);
            setClasses(cRes.data);
            setSubjects(sRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchPapers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/exams/${examId}/papers`);
            setPapers(res.data);
        } catch (error) {
            toast.error('Failed to load papers');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.class_id || !formData.subject_id || !formData.date) {
            toast.error('Required fields missing');
            return;
        }
        try {
            await api.post('/exams/papers', {
                exam_id: examId,
                ...formData
            });
            toast.success('Paper scheduled successfully');
            setModalOpen(false);
            fetchPapers();
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast.error('This subject is already scheduled for this class');
            } else {
                toast.error('Failed to schedule paper');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white rounded-full transition-colors"
                        >
                            <ChevronLeft size={24} className="text-slate-500" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                Exam Schedule
                            </h1>
                            <p className="text-slate-500 font-medium mt-1">Manage papers and marks entry</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Schedule Paper
                    </button>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : papers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <FileText className="text-slate-400 w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No Papers Scheduled</h3>
                        <p className="text-slate-500 mt-2">Schedule exam papers for classes to begin.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {papers.map(paper => (
                            <motion.div
                                key={paper.paper_id}
                                whileHover={{ y: -4 }}
                                onClick={() => router.push(`/dashboard/exams/marks/${paper.paper_id}`)}
                                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-50 text-slate-200 group-hover:text-blue-50 transition-colors">
                                    <FileText size={64} />
                                </div>

                                <div className="relative z-10">
                                    <div className="text-xs font-bold text-slate-400 font-mono mb-1">
                                        {new Date(paper.date).toDateString()}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-1">
                                        {paper.subject_name}
                                    </h3>
                                    <p className="font-bold text-blue-600 mb-4">
                                        {paper.class_name} <span className="font-normal text-slate-400">{paper.section}</span>
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-slate-500 font-bold">
                                        <div className="flex items-center gap-1">
                                            <Percent size={14} />
                                            {paper.total_marks} Marks
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users size={14} />
                                            {paper.marked_count} Marked
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-bold text-sm relative z-10">
                                    <span>Enter Marks</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        ))}
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
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Schedule Exam Paper</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Class</label>
                                        <select
                                            value={formData.class_id}
                                            onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(c => (
                                                <option key={c.class_id} value={c.class_id}>{c.class_name} ({c.section})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
                                        <select
                                            value={formData.subject_id}
                                            onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.map(s => (
                                                <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Exam Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Total Marks</label>
                                        <input
                                            type="number"
                                            value={formData.total_marks}
                                            onChange={e => setFormData({ ...formData, total_marks: e.target.value })}
                                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Passing Marks</label>
                                        <input
                                            type="number"
                                            value={formData.passing_marks}
                                            onChange={e => setFormData({ ...formData, passing_marks: e.target.value })}
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
                                    Save Schedule
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
