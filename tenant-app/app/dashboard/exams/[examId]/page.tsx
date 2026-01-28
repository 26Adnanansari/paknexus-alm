'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Calendar, FileText, Plus, CheckCircle, Clock
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ExamPaper {
    paper_id: string;
    subject_name: string;
    class_name: string;
    date: string;
    total_marks: number;
    passing_marks: number;
    marked_count: number;
}

export default function ExamDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId as string;

    const [papers, setPapers] = useState<ExamPaper[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // For Select dropdowns
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        class_id: '',
        subject_id: '',
        date: '',
        total_marks: '100',
        passing_marks: '33'
    });

    useEffect(() => {
        fetchPapers();
        fetchMeta();
    }, [examId]);

    const fetchPapers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/exams/${examId}/papers`);
            setPapers(res.data);
        } catch (e) { toast.error('Failed to load papers'); }
        finally { setLoading(false); }
    };

    const fetchMeta = async () => {
        try {
            const [c, s] = await Promise.all([
                api.get('/classes?limit=100'),
                api.get('/subjects?limit=100')
            ]);
            setClasses(c.data);
            setSubjects(s.data);
        } catch (e) { console.error(e); }
    };

    const handleAddPaper = async () => {
        if (!formData.class_id || !formData.subject_id || !formData.date) return toast.error('Fill all fields');
        try {
            await api.post('/exams/papers', {
                exam_id: examId,
                ...formData,
                total_marks: parseFloat(formData.total_marks),
                passing_marks: parseFloat(formData.passing_marks)
            });
            toast.success('Paper Added');
            setIsAddOpen(false);
            fetchPapers();
        } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed to add paper'); }
    };

    const groupedPapers = papers.reduce((acc, paper) => {
        const d = paper.date;
        if (!acc[d]) acc[d] = [];
        acc[d].push(paper);
        return acc;
    }, {} as Record<string, ExamPaper[]>);

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
                        <ArrowLeft size={20} /> Back to Exams
                    </button>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Paper
                    </button>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Exam Schedule & Papers</h1>
                    <p className="text-slate-500 font-medium">Manage specific subject tests for each class</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" /></div>
                ) : papers.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed text-slate-400">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-bold">No papers defined yet</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.keys(groupedPapers).sort().map(date => (
                            <div key={date}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar size={18} className="text-purple-600" />
                                    <h3 className="font-bold text-slate-900 text-lg">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {groupedPapers[date].map(paper => (
                                        <Link href={`/dashboard/exams/marks/${paper.paper_id}`} key={paper.paper_id}>
                                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-bold uppercase">{paper.class_name}</span>
                                                    {paper.marked_count > 0 ? (
                                                        <span className="text-green-600 flex items-center gap-1 text-[10px] uppercase font-bold"><CheckCircle size={12} /> Marked</span>
                                                    ) : (
                                                        <span className="text-amber-500 flex items-center gap-1 text-[10px] uppercase font-bold"><Clock size={12} /> Pending</span>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-lg group-hover:text-purple-600 transition-colors">{paper.subject_name}</h4>
                                                <div className="bg-slate-50 rounded-lg p-2 mt-4 flex justify-between text-xs font-bold text-slate-500">
                                                    <span>Total: {paper.total_marks}</span>
                                                    <span>Pass: {paper.passing_marks}</span>
                                                </div>
                                                <div className="mt-3 text-center text-purple-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Enter Marks
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Paper Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6">Schedule Exam Paper</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Class</label>
                                        <select
                                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none"
                                            value={formData.class_id}
                                            onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Subject</label>
                                        <select
                                            className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none"
                                            value={formData.subject_id}
                                            onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.subject_name} ({s.code || ''})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                                    <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Total Marks</label>
                                        <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase">Passing Marks</label>
                                        <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none" value={formData.passing_marks} onChange={e => setFormData({ ...formData, passing_marks: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setIsAddOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                                <button onClick={handleAddPaper} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Add Paper</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
