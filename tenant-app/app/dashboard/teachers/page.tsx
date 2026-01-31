'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, User, Mail, Phone, School, Briefcase, MapPin, GraduationCap, DollarSign, Edit, Trash2, X, Loader2, CreditCard, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'sonner';
import PhotoUpload from '@/components/PhotoUpload';
import IDCardPreview, { IDCardData } from '@/components/dashboard/id-cards/IDCardPreview';
import { useBranding } from '@/context/branding-context';

export default function StaffPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Auto-suggest Employee ID
    useEffect(() => {
        if (isAddOpen) {
            api.get('/staff/next-id')
                .then(res => {
                    if (res.data?.next_id) {
                        setNewStaff(prev => ({ ...prev, employee_id: res.data.next_id }));
                    }
                })
                .catch(err => console.error("Failed to suggest ID", err));
        }
    }, [isAddOpen]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingStaff, setEditingStaff] = useState<any>(null);
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
        photo_url: '',
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
            salary_amount: newStaff.salary_amount ? parseFloat(newStaff.salary_amount) : null,
            photo_url: newStaff.photo_url || null
        };

        try {
            await api.post('/staff', payload);
            setIsAddOpen(false);
            setNewStaff({
                full_name: '', employee_id: '', email: '', phone: '',
                designation: '', department: '', role: 'teacher',
                address: '', qualifications: '', salary_amount: '',
                photo_url: '',
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

    const handleEditClick = (staff: any) => {
        setEditingStaff({
            ...staff,
            // Map backend fields to frontend state if needed, though they seem aligned mainly
            salary_amount: staff.salary_amount !== undefined ? staff.salary_amount : staff.salary,
            join_date: staff.join_date || staff.joining_date
        });
        setIsEditOpen(true);
    };

    const handleEditChange = (field: string, value: any) => {
        setEditingStaff((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...editingStaff,
                salary_amount: editingStaff.salary_amount ? parseFloat(editingStaff.salary_amount) : null
            };
            await api.put(`/staff/${editingStaff.staff_id}`, payload);
            setIsEditOpen(false);
            fetchStaff();
            toast.success("Staff updated successfully");
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to update staff");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (staffId: string) => {
        if (!confirm("Are you sure you want to delete this staff member?")) return;
        try {
            await api.delete(`/staff/${staffId}`);
            fetchStaff();
            toast.success("Staff deleted successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete staff");
        }
    };

    // --- ID Card Logic ---
    const [isIDCardOpen, setIsIDCardOpen] = useState(false);
    const [idCardStaff, setIdCardStaff] = useState<any>(null);
    const [idCardData, setIdCardData] = useState<IDCardData | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const { branding } = useBranding();

    const handleIDCardClick = async (staff: any) => {
        setIdCardStaff(staff);
        setIsIDCardOpen(true);
        setIdCardData(null); // Reset while loading

        try {
            // 1. Fetch Templates if needed
            if (templates.length === 0) {
                const resTemp = await api.get('/id-cards/templates');
                setTemplates(resTemp.data);
                if (resTemp.data.length > 0) setSelectedTemplateId(resTemp.data[0].template_id);
            }

            // 2. Fetch Staff ID Data
            const resData = await api.get(`/staff/${staff.staff_id}/id-card-data`);
            setIdCardData(resData.data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load ID card data");
            setIsIDCardOpen(false);
        }
    };

    const activeTemplate = templates.find(t => t.template_id === selectedTemplateId) || templates[0];

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
                        <div key={staff.staff_id} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all group relative">
                            {/* Actions Overlay */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-slate-100 shadow-sm z-10">
                                <button onClick={(e) => { e.stopPropagation(); handleIDCardClick(staff); }} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Generate ID Card">
                                    <CreditCard size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleEditClick(staff); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                                    <Edit size={16} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(staff.staff_id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                {staff.photo_url ? (
                                    <img
                                        src={staff.photo_url}
                                        alt={staff.full_name}
                                        className="h-14 w-14 rounded-full object-cover border border-slate-200 shadow-sm"
                                    />
                                ) : (
                                    <div className="h-14 w-14 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg border border-blue-100 shadow-sm">
                                        {staff.full_name?.[0]}
                                    </div>
                                )}
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${staff.role === 'teacher' ? 'bg-indigo-50 text-indigo-700' :
                                    staff.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                    {staff.role}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    <Link href={`/dashboard/teachers/${staff.staff_id}`} className="hover:underline">
                                        {staff.full_name}
                                    </Link>
                                </h3>
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
                                <PhotoUpload
                                    currentPhotoUrl={newStaff.photo_url}
                                    onPhotoUploaded={(url) => setNewStaff({ ...newStaff, photo_url: url })}
                                    label="Staff Photo"
                                />
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

            {/* Edit Staff Modal */}
            <AnimatePresence>
                {isEditOpen && editingStaff && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setIsEditOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Edit Staff Profile</h2>
                                    <p className="text-sm text-slate-500">Update employee information</p>
                                </div>
                                <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto">
                                <PhotoUpload
                                    currentPhotoUrl={editingStaff.photo_url}
                                    onPhotoUploaded={(url) => handleEditChange('photo_url', url)}
                                    label="Staff Photo"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                                        <input required className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editingStaff.full_name} onChange={e => handleEditChange('full_name', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Employee ID <span className="text-red-500">*</span></label>
                                        <input required className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono" value={editingStaff.employee_id} onChange={e => handleEditChange('employee_id', e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Role</label>
                                        <select className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" value={editingStaff.role} onChange={e => handleEditChange('role', e.target.value)}>
                                            <option value="teacher">Teacher</option>
                                            <option value="admin">Admin</option>
                                            <option value="accountant">Accountant</option>
                                            <option value="principal">Principal</option>
                                            <option value="support">Support Staff</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Designation</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editingStaff.designation || ''} onChange={e => handleEditChange('designation', e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Department</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editingStaff.department || ''} onChange={e => handleEditChange('department', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Join Date</label>
                                        <input type="date" required className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editingStaff.join_date || ''} onChange={e => handleEditChange('join_date', e.target.value)} />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Mail size={14} /> Email Address</label>
                                        <input type="email" className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editingStaff.email || ''} onChange={e => handleEditChange('email', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Phone size={14} /> Phone Number</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editingStaff.phone || ''} onChange={e => handleEditChange('phone', e.target.value)} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><MapPin size={14} /> Residential Address</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editingStaff.address || ''} onChange={e => handleEditChange('address', e.target.value)} />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><GraduationCap size={14} /> Qualifications</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editingStaff.qualifications || ''} onChange={e => handleEditChange('qualifications', e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><DollarSign size={14} /> Basic Salary</label>
                                        <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={editingStaff.salary_amount || ''} onChange={e => handleEditChange('salary_amount', e.target.value)} />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-white border-t border-slate-100 -mx-6 md:-mx-8 p-4">
                                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200">
                                        {submitting ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Updating...</> : 'Update Staff Profile'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ID Card Generation Modal */}
            <AnimatePresence>
                {isIDCardOpen && idCardStaff && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                            onClick={() => setIsIDCardOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-transparent w-full max-w-5xl h-[85vh] flex flex-col md:flex-row gap-6 p-4 max-h-screen overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Sidebar Controls */}
                            <div className="w-full md:w-80 bg-white rounded-2xl p-6 shadow-2xl flex flex-col">
                                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <CreditCard className="text-blue-600" />
                                    Staff ID Card
                                </h2>

                                <div className="space-y-6 flex-1 overflow-y-auto">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                                                {idCardStaff.full_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{idCardStaff.full_name}</p>
                                                <p className="text-xs text-slate-500 font-mono">{idCardStaff.employee_id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Select Template</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {templates.map(t => (
                                                <button
                                                    key={t.template_id}
                                                    onClick={() => setSelectedTemplateId(t.template_id)}
                                                    className={`
                                                        rounded-lg overflow-hidden border-2 transition-all aspect-[2/3] relative group
                                                        ${selectedTemplateId === t.template_id ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'}
                                                    `}
                                                >
                                                    <img src={t.front_bg_url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] py-1 truncate px-1">
                                                        {t.template_name}
                                                    </div>
                                                </button>
                                            ))}
                                            {templates.length === 0 && <div className="text-xs text-slate-500 italic col-span-2">No templates found. Using default.</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 mt-auto border-t border-slate-100 flex flex-col gap-3">
                                    <Button onClick={() => window.print()} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
                                        <Printer size={16} className="mr-2" />
                                        Print ID Card
                                    </Button>
                                    <Button variant="outline" onClick={() => setIsIDCardOpen(false)} className="w-full">
                                        Close
                                    </Button>
                                </div>
                            </div>

                            {/* Preview Area */}
                            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 flex items-center justify-center relative overflow-hidden print-area">
                                {!idCardData ? (
                                    <Loader2 className="animate-spin text-white w-10 h-10" />
                                ) : (
                                    <div className="flex gap-8 print:gap-4 print:flex-row flex-col lg:flex-row items-center">
                                        {/* Wrappers to help with printing separation if needed */}
                                        <div className="print:m-2">
                                            <p className="text-white/50 text-xs font-bold uppercase mb-4 text-center print:hidden">Front Side</p>
                                            <IDCardPreview
                                                data={idCardData}
                                                frontBg={activeTemplate?.front_bg_url || null}
                                                backBg={null} // Only show front in this block
                                                branding={branding || undefined}
                                                isFlipped={false}
                                                className="shadow-2xl"
                                                showPlaceholder={true}
                                            />
                                        </div>

                                        <div className="print:m-2">
                                            <p className="text-white/50 text-xs font-bold uppercase mb-4 text-center print:hidden">Back Side</p>

                                            {/* Hack: Force IDCardPreview to show Back Side by tricking it or splitting it? 
                                                IDCardPreview is a flip card. For printing, we usually want side-by-side. 
                                                I'll render it twice, once flipped.
                                            */}
                                            <div className="relative w-[300px] h-[480px]">
                                                {/* Render Front logic but pass BackBG as FrontBG? No, that messes up content overlay.
                                                    Better: Just render the component with isFlipped=true.
                                                  */}
                                                <IDCardPreview
                                                    data={idCardData}
                                                    frontBg={null} // Hide front
                                                    backBg={activeTemplate?.back_bg_url || null}
                                                    branding={branding || undefined}
                                                    isFlipped={true} // Force show back
                                                    className="shadow-2xl"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <style jsx global>{`
                                    @media print {
                                        body * {
                                            visibility: hidden;
                                        }
                                        .print-area, .print-area * {
                                            visibility: visible;
                                        }
                                        .print-area {
                                            position: absolute;
                                            left: 0;
                                            top: 0;
                                            width: 100%;
                                            height: 100%;
                                            background: white;
                                            display: flex;
                                            justify-content: center;
                                            align-items: center;
                                        }
                                    }
                                `}</style>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
