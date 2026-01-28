'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, Check, X, Search, Filter, MessageCircle, Clock
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Appeal {
    appeal_id: string;
    full_name: string;
    admission_number: string;
    current_class: string;
    appeal_reason: string;
    mistake_description: string;
    submitted_at: string;
    status: 'pending' | 'approved' | 'rejected';
}

export default function AppealsPage() {
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [reviewModal, setReviewModal] = useState<Appeal | null>(null);
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        fetchAppeals();
    }, [filter]);

    const fetchAppeals = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/id-cards/appeals?status=${filter}`);
            setAppeals(res.data);
        } catch (e) { toast.error('Failed to load appeals'); }
        finally { setLoading(false); }
    };

    const handleReview = async (action: 'approve' | 'reject') => {
        if (!reviewModal) return;
        try {
            await api.put(`/id-cards/appeals/${reviewModal.appeal_id}/review`, {
                action,
                admin_notes: adminNotes
            });
            toast.success(`Appeal ${action}d`);
            setReviewModal(null);
            setAdminNotes('');
            fetchAppeals();
        } catch (e) { toast.error(`Failed to ${action} appeal`); }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">ID Card Appeals</h1>
                        <p className="text-slate-500">Review request for corrections from students/parents</p>
                    </div>
                    <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border">
                        {['pending', 'approved', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all
                                    ${filter === status
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'text-slate-500 hover:bg-slate-50'}
                                `}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div>
                ) : appeals.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <Check className="mx-auto text-green-500 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-slate-400">No {filter} appeals found</h3>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {appeals.map(appeal => (
                            <motion.div
                                key={appeal.appeal_id}
                                layoutId={appeal.appeal_id}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                onClick={() => setReviewModal(appeal)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{appeal.full_name}</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase">{appeal.admission_number} • {appeal.current_class}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase
                                        ${appeal.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            appeal.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                    `}>
                                        {appeal.status}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Reason</p>
                                        <p className="text-sm font-medium text-slate-700">{appeal.appeal_reason}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Description</p>
                                        <p className="text-sm font-medium text-slate-700 line-clamp-2">{appeal.mistake_description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                    <Clock size={12} />
                                    <span>{new Date(appeal.submitted_at).toLocaleDateString()}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {reviewModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg">
                            <h2 className="text-2xl font-bold mb-6">Review Appeal</h2>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Student</label>
                                    <p className="text-lg font-bold text-slate-900">{reviewModal.full_name}</p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                    <label className="text-xs font-bold text-amber-600 uppercase">Mistake Claimed</label>
                                    <p className="text-slate-800 mt-1">{reviewModal.mistake_description}</p>
                                </div>
                                <textarea
                                    placeholder="Add notes for the student (optional)..."
                                    className="w-full p-4 bg-slate-50 border rounded-xl h-24 outline-none focus:border-purple-500"
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setReviewModal(null)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Close</button>
                                {reviewModal.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleReview('reject')} className="flex-1 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200">Reject</button>
                                        <button onClick={() => handleReview('approve')} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200">Approve & Unlock</button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
