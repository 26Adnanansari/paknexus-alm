'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, User, Mail, Phone, School, Briefcase, MapPin, GraduationCap, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'sonner';

export default function StaffPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [roleFilter, setRoleFilter] = useState('all');

    const [newStaff, setNewStaff] = useState({
        full_name: '',
        employee_id: '',
        email: '',
        phone: '',
        designation: '',
        department: '',
        role: 'teacher',
        address: '',
        qualifications: '',
        salary_amount: '',
        join_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchStaff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleFilter]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (roleFilter !== 'all') params.role = roleFilter;

            const res = await api.get('/staff', { params });
            setStaffList(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load staff list");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            ...newStaff,
            email: newStaff.email.trim() || null,
            phone: newStaff.phone.trim() || null,
            address: newStaff.address.trim() || null,
            qualifications: newStaff.qualifications.trim() || null,
            department: newStaff.department.trim() || null,
            designation: newStaff.designation.trim() || null,
            full_name: newStaff.full_name.trim(),
            employee_id: newStaff.employee_id.trim(),
            salary_amount: newStaff.salary_amount ? parseFloat(newStaff.salary_amount) : null
        };

        try {
            await api.post('/staff', payload);
            setIsAddOpen(false);
            setNewStaff({
                full_name: '', employee_id: '', email: '', phone: '',
                designation: '', department: '', role: 'teacher',
                address: '', qualifications: '', salary_amount: '',
                join_date: new Date().toISOString().split('T')[0]
            });
            fetchStaff();
            toast.success("Staff member added successfully");
        } catch (error: any) {
            console.error("Failed to add staff:", error);
            const msg = error?.response?.data?.detail
                || 'Failed to add staff. Check inputs.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900">
                        <Briefcase className="h-8 w-8 text-blue-600" />
                        Staff Directory
                    </h1>
                    <p className="text-slate-500 mt-1">Manage teachers, admins, and support staff.</p>
                </div>
                <div className="flex gap-3">
                    <select
                        className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:border-blue-500"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="teacher">Teachers</option>
                        <option value="admin">Admins</option>
                        <option value="accountant">Accountants</option>
                        <option value="principal">Principals</option>
                    </select>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Staff
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-3 text-center py-12 text-slate-500">Loading directory...</div>
                ) : staffList.length === 0 ? (
                    <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No staff members found</h3>
                        <p className="text-slate-500">Add your first teacher or staff member to get started.</p>
                    </div>
                ) : (
                    staffList.map((staff) => (
                        <div key={staff.staff_id} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-12 w-12 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg border border-blue-100">
                                    {staff.full_name?.[0]}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${staff.role === 'teacher' ? 'bg-indigo-50 text-indigo-700' :
                                        staff.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                                            'bg-slate-100 text-slate-600'
                                    }`}>
                                    {staff.role}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{staff.full_name}</h3>
                                <p className="text-sm text-slate-500 font-medium">{staff.designation || 'No Designation'}</p>
                                {staff.department && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><School size={12} /> {staff.department}</p>}
                            </div>

                            <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span className="truncate">{staff.email || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    <span>{staff.phone || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <User className="h-4 w-4 text-slate-400" />
                                    <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{staff.employee_id}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Staff Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setIsAddOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Add Staff Member</h2>
                                    <p className="text-sm text-slate-500">Create a new employee profile</p>
                                </div>
                                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                                        <input required className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={newStaff.full_name} onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })} placeholder="e.g. Sarah Connor" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Employee ID <span className="text-red-500">*</span></label>
                                        <input required className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono" value={newStaff.employee_id} onChange={e => setNewStaff({ ...newStaff, employee_id: e.target.value })} placeholder="EMP-001" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Role</label>
                                        <select className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
                                            <option value="teacher">Teacher</option>
                                            <option value="admin">Admin</option>
                                            <option value="accountant">Accountant</option>
                                            <option value="principal">Principal</option>
                                            <option value="support">Support Staff</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Designation</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={newStaff.designation} onChange={e => setNewStaff({ ...newStaff, designation: e.target.value })} placeholder="e.g. Senior Math Teacher" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Department</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={newStaff.department} onChange={e => setNewStaff({ ...newStaff, department: e.target.value })} placeholder="e.g. Science" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Join Date</label>
                                        <input type="date" required className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={newStaff.join_date} onChange={e => setNewStaff({ ...newStaff, join_date: e.target.value })} />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Mail size={14} /> Email Address</label>
                                        <input type="email" className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="staff@school.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Phone size={14} /> Phone Number</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} placeholder="+1 234 567 890" />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={14} /> Residential Address</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={newStaff.address} onChange={e => setNewStaff({ ...newStaff, address: e.target.value })} placeholder="Full address..." />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><GraduationCap size={14} /> Qualifications</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={newStaff.qualifications} onChange={e => setNewStaff({ ...newStaff, qualifications: e.target.value })} placeholder="e.g. MSc Mathematics, B.Ed" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><DollarSign size={14} /> Basic Salary</label>
                                        <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={newStaff.salary_amount} onChange={e => setNewStaff({ ...newStaff, salary_amount: e.target.value })} placeholder="0.00" />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-white border-t border-slate-100 -mx-6 md:-mx-8 p-4">
                                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200">
                                        {submitting ? 'Saving Profile...' : 'Create Staff Profile'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
