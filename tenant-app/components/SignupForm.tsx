'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { Loader2, CheckCircle2, AlertCircle, School, Globe, Mail, Lock, Phone } from 'lucide-react';

export default function SignupForm({ onClose }: { onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        school_name: '',
        subdomain: '',
        admin_email: '',
        admin_password: '',
        contact_phone: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Basic validation
            if (!formData.subdomain.match(/^[a-z0-9-]+$/)) {
                throw new Error("Subdomain must be lowercase letters, numbers, and hyphens only.");
            }

            await api.post('/public/register', formData);
            setSuccess(true);
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorMessage = (err as any).response?.data?.detail || (err as Error).message || "Registration failed. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Registration Successful!</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                    Your school <strong>{formData.school_name}</strong> has been registered.
                    <br />
                    You can now login with your admin credentials.
                </p>
                <div className="pt-4">
                    <button
                        onClick={onClose}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        Close & Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-1">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Start your Free Trial</h2>
                <p className="text-slate-500">Transform your school management today.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                    <div className="relative">
                        <School className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input
                            required
                            name="school_name"
                            placeholder="School Name"
                            value={formData.school_name}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                        />
                    </div>

                    <div className="relative">
                        <Globe className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <div className="flex">
                            <input
                                required
                                name="subdomain"
                                placeholder="subdomain"
                                value={formData.subdomain}
                                onChange={handleChange}
                                className="flex-1 pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-l-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            />
                            <div className="bg-slate-100 border-y border-r border-slate-200 px-4 py-3 rounded-r-xl text-slate-500 font-medium select-none">
                                .pakai.com
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 ml-1">Lowercase letters & hyphens only</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input
                                required
                                type="email"
                                name="admin_email"
                                placeholder="Admin Email"
                                value={formData.admin_email}
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-4 top-3.5 text-slate-400" size={20} />
                            <input
                                name="contact_phone"
                                placeholder="Phone (Optional)"
                                value={formData.contact_phone}
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input
                            required
                            type="password"
                            name="admin_password"
                            placeholder="Create Password"
                            value={formData.admin_password}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" />}
                        <span>{loading ? 'Registering...' : 'Create School Account'}</span>
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4">
                        By registering, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </form>
        </div>
    );
}
