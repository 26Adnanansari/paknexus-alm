'use client';

import React, { useState, useEffect } from 'react';
import MomentsFeed from '@/components/social/MomentsFeed';
import { Camera, UploadCloud, Plus, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function MomentsPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('feed'); // feed, pending
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [pendingMoments, setPendingMoments] = useState<any[]>([]);
    const [loadingPending, setLoadingPending] = useState(false);

    // Initial Fetch for Pending if admin
    useEffect(() => {
        if (activeTab === 'pending') {
            fetchPending();
        }
    }, [activeTab]);

    const fetchPending = async () => {
        setLoadingPending(true);
        try {
            const res = await api.get('/moments', { params: { status: 'pending', limit: 50 } });
            setPendingMoments(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load pending moments");
        } finally {
            setLoadingPending(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.put(`/moments/${id}/status`, { status: 'approved' });
            setPendingMoments(prev => prev.filter(m => m.id !== id));
            toast.success("Moment approved & published!");
        } catch (e) { toast.error("Failed to approve"); }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Reject and delete this moment?")) return;
        try {
            await api.put(`/moments/${id}/status`, { status: 'rejected' }); // Or delete
            setPendingMoments(prev => prev.filter(m => m.id !== id));
            toast.success("Moment rejected");
        } catch (e) { toast.error("Failed to reject"); }
    };

    // Role Check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session as any)?.user?.role || 'student';
    const isAdmin = ['admin', 'super_admin'].includes(userRole);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">School Moments</h1>
                    <p className="text-slate-500">Highlights and memories from our campus.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Admin Toggle */}
                    {isAdmin && (
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('feed')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'feed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Live Feed
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Pending <span className="bg-orange-200 text-orange-800 text-[10px] px-1.5 rounded-full">{pendingMoments.length > 0 ? pendingMoments.length : ''}</span>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
                    >
                        <Camera size={20} />
                        <span>Share Moment</span>
                    </button>
                </div>
            </div>

            {/* Content Switch */}
            {activeTab === 'feed' ? (
                <MomentsFeed />
            ) : (
                <div className="space-y-6">
                    {loadingPending ? (
                        <div className="text-center py-20 text-slate-400">Loading pending approvals...</div>
                    ) : pendingMoments.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                            <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-slate-900 font-bold">All Caught Up!</h3>
                            <p className="text-slate-500">No pending moments to review.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingMoments.map(moment => (
                                <div key={moment.id} className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden flex flex-col">
                                    <div className="relative aspect-video bg-slate-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={moment.image_url} className="w-full h-full object-cover" alt="" />
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                                            {moment.author_name} ({moment.author_role})
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <p className="text-slate-700 text-sm font-medium mb-4">{moment.caption}</p>
                                        <div className="mt-auto grid grid-cols-2 gap-3">
                                            <Button onClick={() => handleApprove(moment.id)} className="bg-green-600 hover:bg-green-700 w-full">
                                                <CheckCircle2 size={16} className="mr-2" /> Approve
                                            </Button>
                                            <Button onClick={() => handleReject(moment.id)} variant="outline" className="text-red-600 hover:bg-red-50 border-red-100 w-full">
                                                <XCircle size={16} className="mr-2" /> Reject
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
        </div>
    );
}

function UploadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { data: session } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !caption) return;

        setUploading(true);
        try {
            // 1. Upload Image
            const formData = new FormData();
            formData.append('file', file);
            const uploadRes = await api.post('/upload/image', formData);
            const imageUrl = uploadRes.data.url;

            // 2. Create Moment
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const user = (session as any)?.user;
            await api.post('/moments', {
                image_url: imageUrl,
                caption: caption,
                author_name: user?.name || 'User',
                author_role: user?.role || 'student'
            });

            toast.success("Moment shared! It may require approval.");
            setFile(null);
            setCaption('');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload moment.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold">Share a Moment</h2>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Caption</label>
                                <textarea
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all min-h-[100px] resize-none"
                                    placeholder="What's happening?"
                                    value={caption}
                                    onChange={e => setCaption(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Photo</label>
                                <div className={`
                                    border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center 
                                    text-slate-400 hover:bg-slate-50 hover:border-violet-300 transition-all cursor-pointer relative
                                    ${file ? 'border-violet-500 bg-violet-50' : 'border-slate-200'}
                                `}>
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                                    {file ? (
                                        <div className="text-center">
                                            <CheckCircle2 className="h-10 w-10 mb-2 text-violet-600 mx-auto" />
                                            <p className="text-sm font-bold text-violet-700">{file.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="h-10 w-10 mb-2" />
                                            <p className="text-sm font-medium">Click to upload photo</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button disabled={uploading} type="submit" className="bg-violet-600 hover:bg-violet-700 w-full sm:w-auto">
                                    {uploading ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Posting...</> : 'Post Moment'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

