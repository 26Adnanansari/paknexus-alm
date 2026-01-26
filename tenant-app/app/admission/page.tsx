'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, School, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';

export default function PublicAdmissionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>}>
            <AdmissionContent />
        </Suspense>
    );
}

function AdmissionContent() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('school_id');
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<any>(null);
    const [formData, setFormData] = useState({
        applicant_name: '', father_name: '', phone: '', email: '',
        applied_class: '', previous_school: '', address: '', dob: '', gender: 'male'
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<any>(null);

    useEffect(() => {
        if (schoolId) checkStatus();
        else setLoading(false);
    }, [schoolId]);

    const checkStatus = async () => {
        try {
            const res = await api.get(`/public/admissions/check/${schoolId}`);
            setStatus(res.data);
        } catch (e) {
            console.error(e);
            setStatus({ is_open: false, message: "School not found or unavailable." });
        } finally {
            setLoading(false);
        }
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await api.post('/public/admissions/apply', {
                ...formData,
                tenant_id: schoolId
            });
            setSubmitted(res.data);
        } catch (e) {
            alert("Application failed. Please check inputs.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!schoolId) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">Invalid Link - No School ID</div>;

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;

    if (!status?.is_open) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                        <School size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Admissions Closed</h2>
                    <p className="text-slate-500 mb-6">{status?.message || "We are not accepting applications at the moment."}</p>

                    {status?.dates?.start && (
                        <div className="bg-slate-50 p-4 rounded-xl text-sm">
                            <p className="font-bold text-slate-700">Admission Cycle</p>
                            <p className="text-slate-500">{status.dates.start} — {status.dates.end}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <Check size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Application Received!</h2>
                    <p className="text-slate-500 mb-6">Your tracking ID is <span className="font-mono font-bold text-slate-900">#{submitted.application_id.slice(0, 8)}</span></p>

                    {submitted.next_step === 'take_test' && submitted.test_link && (
                        <div className="space-y-4">
                            <p className="text-orange-600 font-bold bg-orange-50 p-3 rounded-xl border border-orange-100">
                                Action Required: Online Entry Test
                            </p>
                            <a
                                href={submitted.test_link}
                                target="_blank"
                                className="block w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg"
                            >
                                Start Entry Test Now <ArrowRight className="inline ml-1" size={18} />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-200">
                    <div className="text-center mb-10">
                        <School className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admission Form</h1>
                        <p className="text-slate-500 font-medium">Please fill all details correctly.</p>
                    </div>

                    {status.instructions && (
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-8 text-sm text-blue-800 leading-relaxed">
                            <p className="font-bold mb-1">Instructions:</p>
                            {status.instructions}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Applicant Name <span className="text-red-500">*</span></label>
                                <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                                    value={formData.applicant_name} onChange={e => setFormData({ ...formData, applicant_name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Father/Guardian <span className="text-red-500">*</span></label>
                                <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                                    value={formData.father_name} onChange={e => setFormData({ ...formData, father_name: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Class Applying For <span className="text-red-500">*</span></label>
                                <select required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                                    value={formData.applied_class} onChange={e => setFormData({ ...formData, applied_class: e.target.value })}>
                                    <option value="">Select Class</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(c => <option key={c} value={`Grade ${c}`}>Grade {c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Gender</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                                    value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Date of Birth</label>
                                <input type="date" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                                    value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Phone</label>
                                <input required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                                    placeholder="0300..." value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500">Address</label>
                            <textarea required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 h-24"
                                value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
