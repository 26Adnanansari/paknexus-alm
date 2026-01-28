'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Send, Users, Mail, MessageCircle,
    Plus, Trash2, Megaphone, Bell
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Announcement {
    announcement_id: string;
    title: string;
    content: string;
    target_audiences: string[];
    send_email: boolean;
    send_sms: boolean;
    is_urgent: boolean;
    created_at: string;
}

export default function CommunicationPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        target_audiences: [] as string[],
        send_email: false,
        send_sms: false,
        is_urgent: false
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await api.get('/communication/announcements');
            setAnnouncements(res.data);
        } catch (e) { toast.error('Failed to load announcements'); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        if (!formData.title || !formData.content) return toast.error('Title and Content required');
        if (formData.target_audiences.length === 0) return toast.error('Select at least one audience');

        try {
            await api.post('/communication/announcements', formData);
            toast.success('Announcement sent');
            setIsCreateOpen(false);
            setFormData({ title: '', content: '', target_audiences: [], send_email: false, send_sms: false, is_urgent: false });
            fetchAnnouncements();
        } catch (e) { toast.error('Failed to send announcement'); }
    };

    const toggleAudience = (role: string) => {
        setFormData(prev => {
            if (prev.target_audiences.includes(role)) {
                return { ...prev, target_audiences: prev.target_audiences.filter(r => r !== role) };
            } else {
                return { ...prev, target_audiences: [...prev.target_audiences, role] };
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete announcement?')) return;
        try {
            await api.delete(`/communication/announcements/${id}`);
            toast.success('Deleted');
            setAnnouncements(prev => prev.filter(a => a.announcement_id !== id));
        } catch (e) { toast.error('Failed to delete'); }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-24">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Megaphone className="text-purple-600" size={32} />
                            Communication Hub
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Broadcast announcements to students, teachers, and parents</p>
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-200"
                    >
                        <Send size={20} />
                        New Announcement
                    </button>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" /></div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
                        <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-slate-400">No announcements yet</h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map(ann => (
                            <motion.div
                                key={ann.announcement_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden group
                                    ${ann.is_urgent ? 'border-red-100 bg-red-50/10' : 'border-slate-200'}
                                `}
                            >
                                {ann.is_urgent && (
                                    <div className="absolute top-0 right-0 p-3">
                                        <span className="bg-red-100 text-red-600 text-xs font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1">
                                            <Bell size={12} fill="currentColor" /> Urgent
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex gap-2 mb-2">
                                        {ann.target_audiences.map(role => (
                                            <span key={role} className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-lg uppercase">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(ann.announcement_id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-2">{ann.title}</h3>
                                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{ann.content}</p>

                                <div className="mt-6 flex gap-4 text-xs font-bold text-slate-400 border-t pt-4 border-slate-100">
                                    <span>{new Date(ann.created_at).toLocaleString()}</span>
                                    <div className="flex gap-2">
                                        {ann.send_email && <div className="flex items-center gap-1 text-purple-600"><Mail size={14} /> Email Sent</div>}
                                        {ann.send_sms && <div className="flex items-center gap-1 text-blue-600"><MessageCircle size={14} /> SMS Sent</div>}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Send className="text-purple-600" /> New Announcement
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Audience</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['all', 'teacher', 'student', 'parent'].map(role => (
                                            <button
                                                key={role}
                                                onClick={() => toggleAudience(role)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all
                                                     ${formData.target_audiences.includes(role)
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105'
                                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}
                                                 `}
                                            >
                                                {role === 'all' ? 'Everyone' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <input
                                    placeholder="Title / Subject"
                                    className="w-full p-4 bg-slate-50 border rounded-xl font-bold text-lg outline-none focus:border-purple-500 transition-colors"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />

                                <textarea
                                    placeholder="Write your message here..."
                                    className="w-full p-4 bg-slate-50 border rounded-xl h-40 outline-none focus:border-purple-500 transition-colors resize-none"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                />

                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 flex-1 hover:bg-slate-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.send_email}
                                            onChange={e => setFormData({ ...formData, send_email: e.target.checked })}
                                            className="w-5 h-5 accent-purple-600"
                                        />
                                        <Mail size={18} className="text-slate-500" />
                                        <span className="font-bold text-slate-700">Send Email</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 flex-1 hover:bg-slate-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.send_sms}
                                            onChange={e => setFormData({ ...formData, send_sms: e.target.checked })}
                                            className="w-5 h-5 accent-purple-600"
                                        />
                                        <MessageCircle size={18} className="text-slate-500" />
                                        <span className="font-bold text-slate-700">Send SMS</span>
                                    </label>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_urgent}
                                        onChange={e => setFormData({ ...formData, is_urgent: e.target.checked })}
                                        className="w-4 h-4 accent-red-600"
                                    />
                                    <span className="text-sm font-bold text-red-600">Mark as Urgent</span>
                                </label>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setIsCreateOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                                <button onClick={handleCreate} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200">Broadcast</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
