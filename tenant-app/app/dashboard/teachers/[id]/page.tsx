'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    User, FileText, Calendar, DollarSign, GraduationCap,
    Upload, Trash2, ExternalLink, ArrowLeft, Loader2, Briefcase, Mail, Phone, MapPin, School
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import PhotoUpload from '@/components/PhotoUpload';

export default function StaffProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { id } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [staff, setStaff] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchStaff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchStaff = async () => {
        try {
            // We need a specific GET endpoint for single staff. 
            // Currently list_staff returns all. I might need to add GET /{id} or filter list.
            // Let's assume GET /staff returns list, but maybe we can fetch all and find one, OR add GET /staff/{id}
            // Ideally backend should have GET /staff/{id}. 
            // Wait, looking at staff.py, there is NO GET /{id} endpoint!
            // I must add it to backend first.

            // For now, I'll fetch list and find (inefficient but works for MVP if list is small)
            // Or better, I will update staff.py to include GET /{id} in next step.
            // Let's write client assuming the endpoint exists or will exist.
            const res = await api.get(`/staff`);
            const found = res.data.find((s: any) => s.staff_id === id);

            if (found) {
                setStaff(found);
            } else {
                toast.error("Staff member not found");
                router.push('/dashboard/teachers');
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load staff profile");
            router.push('/dashboard/teachers');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>;
    if (!staff) return null;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                <ArrowLeft size={16} className="mr-2" /> Back to Staff Directory
            </button>

            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-32 h-32 rounded-2xl bg-slate-100 overflow-hidden border-4 border-white shadow-lg shrink-0">
                    {staff.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <User size={48} />
                        </div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900">{staff.full_name}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100 flex items-center gap-1">
                            <Briefcase size={14} />
                            {staff.designation || 'Staff'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold border border-indigo-100 flex items-center gap-1">
                            <School size={14} />
                            {staff.department || 'General'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${staff.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {staff.status?.toUpperCase()}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-500 mt-4 max-w-2xl">
                        <p className="flex items-center gap-2 justify-center md:justify-start"><span className="font-mono bg-slate-100 px-1 rounded">{staff.employee_id}</span></p>
                        <p className="flex items-center gap-2 justify-center md:justify-start"><Mail size={14} /> {staff.email || '-'}</p>
                        <p className="flex items-center gap-2 justify-center md:justify-start"><Phone size={14} /> {staff.phone || '-'}</p>
                        <p className="flex items-center gap-2 justify-center md:justify-start"><Calendar size={14} /> Joined: {staff.join_date}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200 flex gap-6 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'classes', label: 'Assigned Classes', icon: School },
                    { id: 'timetable', label: 'Timetable', icon: Calendar },
                    { id: 'payroll', label: 'Payroll Info', icon: DollarSign },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap px-1 ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 font-semibold'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Briefcase size={20} className="text-blue-500" /> Professional Details</h3>
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                                    <div>
                                        <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</dt>
                                        <dd className="text-slate-900 mt-1 capitalize">{staff.role}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</dt>
                                        <dd className="text-slate-900 mt-1">{staff.department || '-'}</dd>
                                    </div>
                                    <div className="md:col-span-2">
                                        <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Qualifications</dt>
                                        <dd className="text-slate-900 mt-1">{staff.qualifications || 'No qualifications listed'}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><MapPin size={20} className="text-blue-500" /> Personal & Contact</h3>
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                                    <div className="md:col-span-2">
                                        <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</dt>
                                        <dd className="text-slate-900 mt-1">{staff.address || '-'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Stats</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-sm text-slate-500 mb-1">Teaching Experience</div>
                                        <div className="font-bold text-slate-900 text-lg">
                                            {new Date().getFullYear() - new Date(staff.join_date).getFullYear()} Years
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-sm text-slate-500 mb-1">Status</div>
                                        <div className="font-bold text-green-600 text-lg capitalize">
                                            {staff.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'classes' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <School className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 font-medium">Assigned Classes</h3>
                        <p className="text-slate-500">Class assignments will appear here once Academic module is active.</p>
                    </div>
                )}

                {activeTab === 'timetable' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 font-medium">Weekly Timetable</h3>
                        <p className="text-slate-500">Timetable schedule will appear here.</p>
                    </div>
                )}

                {activeTab === 'payroll' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 font-medium">Payroll Information</h3>
                        <p className="text-slate-500">Salary history and payslips will appear here.</p>
                        <p className="text-xs text-slate-400 mt-2">Current Basic: {staff.salary_amount}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
