'use client';

import React from 'react';
import MomentsFeed from '@/components/social/MomentsFeed';
import { Camera, UploadCloud, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
// import api from '@/lib/api';

export default function MomentsPage() {
    const { data: session } = useSession();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isUploadOpen, setIsUploadOpen] = React.useState(false);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">School Moments</h1>
                    <p className="text-slate-500">Highlights and memories from our campus.</p>
                </div>

                {/* Only authorize admins or teachers to post */}
                {/* In real app check session.user.role === 'admin' || 'teacher' */}
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
                >
                    <Camera size={20} />
                    <span>Share Moment</span>
                </button>
            </div>

            <MomentsFeed />

            <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
        </div>
    );
}

function UploadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [files, setFiles] = React.useState<File[]>([]);
    const [caption, setCaption] = React.useState('');
    const [uploading, setUploading] = React.useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (files.length + newFiles.length > 3) {
                alert("You can only upload up to 3 images/videos.");
                return;
            }
            setFiles([...files, ...newFiles]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            // Simulation of upload logic
            // const formData = new FormData();
            // files.forEach(f => formData.append('files', f));
            // formData.append('caption', caption);
            // await api.post('/moments', formData);

            // Mock delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            alert("Moment shared successfully! (Mock)");
            setFiles([]);
            setCaption('');
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to upload moment.");
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
                                <label className="text-sm font-bold text-slate-700">Media (Max 3)</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-violet-300 transition-all cursor-pointer relative">
                                    <input type="file" multiple accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                                    <UploadCloud className="h-10 w-10 mb-2" />
                                    <p className="text-sm font-medium">Click to upload images or videos</p>
                                    <p className="text-xs mt-1">PNG, JPG, MP4 supported</p>
                                </div>
                                {files.length > 0 && (
                                    <div className="flex gap-2 mt-2">
                                        {files.map((f, i) => (
                                            <div key={i} className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-md border border-violet-100 truncate max-w-[150px]">
                                                {f.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-2">
                                <button disabled={uploading} type="submit" className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                    {uploading ? 'Posting...' : (
                                        <>
                                            <span>Post Moment</span>
                                            <Plus size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

