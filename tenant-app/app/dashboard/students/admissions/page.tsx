'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    School, Calendar, Link as LinkIcon, Save, Settings,
    Share2, UserPlus, Check, X, Printer, Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useBranding } from '@/context/branding-context';
import { useSession } from 'next-auth/react';

export default function AdmissionAdminPage() {
    const { branding } = useBranding();
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'settings' | 'applications'>('applications');
    const [init, setInit] = useState(false);

    // Settings State
    const [settings, setSettings] = useState<any>({
        is_open: false,
        start_date: '',
        end_date: '',
        enable_entry_test: false,
        entry_test_link: '',
        instructions: ''
    });

    // Applications State
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkInit();
    }, []);

    const checkInit = async () => {
        try {
            // Try fetching settings, if 500/404 assume needs init
            await api.get('/admissions/settings');
            setInit(true);
            loadData();
        } catch (e) {
            console.log("Needs init");
            setInit(false);
        }
    };

    const initialize = async () => {
        try {
            await api.post('/admissions/system/init-tables');
            setInit(true);
            toast.success("System Initialized");
            loadData();
        } catch (e) { toast.error("Init failed"); }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [sRes, aRes] = await Promise.all([
                api.get('/admissions/settings'),
                api.get('/admissions/applications')
            ]);
            setSettings(sRes.data);
            setApps(aRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const saveSettings = async () => {
        try {
            await api.post('/admissions/settings', settings);
            toast.success("Settings Saved");
            loadData();
        } catch (e) { toast.error("Failed to save"); }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await api.post(`/admissions/applications/${id}/status`, { status });
            toast.success("Status updated");
            loadData(); // refresh
        } catch (e) { toast.error("Update failed"); }
    };

    const shareLink = () => {
        // Construct Link: current domain + /admission?school_id=TENANT_ID
        // We need tenant_id. It's in session usually or branding.
        const tid = (session?.user as any)?.tenant_id;
        // Using window.location.origin
        const url = `${window.location.origin}/admission?school_id=${tid || 'MISSING_ID'}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
    };

    if (!init) {
        return (
            <div className="p-12 text-center max-w-lg mx-auto">
                <School className="w-16 h-16 mx-auto text-blue-200 mb-4" />
                <h2 className="text-xl font-bold mb-2">Admission System Setup</h2>
                <button onClick={initialize} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Initialize Module</button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admissions</h1>
                    <p className="text-slate-500">Manage public admission form and applications.</p>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'applications' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}
                    >
                        Applications ({apps.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm ${activeTab === 'settings' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'}`}
                    >
                        Settings & Link
                    </button>
                </div>
            </div>

            {activeTab === 'settings' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Settings size={18} /> Configuration</h3>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-bold text-slate-900">Accepting Responses</p>
                                <p className="text-xs text-slate-500">Enable public form access</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={settings.is_open} onChange={e => setSettings({ ...settings, is_open: e.target.checked })} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">Start Date</label>
                                <input type="date" className="w-full p-2 border rounded-lg" value={settings.start_date || ''} onChange={e => setSettings({ ...settings, start_date: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">End Date</label>
                                <input type="date" className="w-full p-2 border rounded-lg" value={settings.end_date || ''} onChange={e => setSettings({ ...settings, end_date: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold mb-1">Instructions for Parents</label>
                            <textarea
                                className="w-full p-2 border rounded-lg h-24 text-sm"
                                placeholder="Documents required, timings, etc..."
                                value={settings.instructions || ''}
                                onChange={e => setSettings({ ...settings, instructions: e.target.value })}
                            />
                        </div>

                        <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="entry_test" checked={settings.enable_entry_test} onChange={e => setSettings({ ...settings, enable_entry_test: e.target.checked })} />
                                <label htmlFor="entry_test" className="font-bold text-sm">Enable Entry Test Redirection</label>
                            </div>
                            {settings.enable_entry_test && (
                                <input
                                    className="w-full p-2 border rounded-lg text-sm"
                                    placeholder="https://forms.google.com/..."
                                    value={settings.entry_test_link || ''}
                                    onChange={e => setSettings({ ...settings, entry_test_link: e.target.value })}
                                />
                            )}
                        </div>

                        <button onClick={saveSettings} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                            <Save size={18} /> Save Settings
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Share2 size={18} /> Public Link</h3>
                        <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                            <p className="text-sm text-slate-500 mb-4">Share this link with parents to accept online applications.</p>
                            <div className="flex gap-2">
                                <input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/admission?school_id=${(session?.user as any)?.tenant_id || ''}`} className="flex-1 p-2 border rounded-lg text-xs bg-white text-slate-500" />
                                <button onClick={shareLink} className="bg-blue-600 text-white p-2 rounded-lg"><LinkIcon size={18} /></button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'applications' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {apps.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">No applications yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-4">Applicant</th>
                                        <th className="p-4">Contact</th>
                                        <th className="p-4">Class</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {apps.map(app => (
                                        <tr key={app.application_id} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <p className="font-bold text-slate-900">{app.applicant_name}</p>
                                                <p className="text-xs text-slate-500">S/O {app.father_name}</p>
                                            </td>
                                            <td className="p-4">
                                                <p>{app.phone}</p>
                                                <p className="text-xs text-slate-500">{app.email}</p>
                                            </td>
                                            <td className="p-4 font-bold">{app.applied_class}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                        app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                {app.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => updateStatus(app.application_id, 'approved')} className="bg-green-50 text-green-600 p-2 rounded hover:bg-green-100" title="Approve"><Check size={16} /></button>
                                                        <button onClick={() => updateStatus(app.application_id, 'rejected')} className="bg-red-50 text-red-600 p-2 rounded hover:bg-red-100" title="Reject"><X size={16} /></button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
