'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    User, FileText, Calendar, DollarSign, GraduationCap,
    Upload, Trash2, ExternalLink, ArrowLeft, Loader2, Briefcase, Mail, Phone, MapPin, School, Plus, Download, Printer
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

    // Tab Data States
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [timetable, setTimetable] = useState<any>(null);
    const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
    const [payrollForm, setPayrollForm] = useState({
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        type: 'salary',
        payment_method: 'cash',
        description: ''
    });

    useEffect(() => {
        fetchStaff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchStaff = async () => {
        try {
            const res = await api.get(`/staff/${id}`);
            if (res.data) {
                setStaff(res.data);
                // Fetch other data in parallel or sequence
                fetchPayroll();
                fetchTimetable();
                fetchAttendance();
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

    const fetchPayroll = async () => {
        try {
            const res = await api.get(`/staff/${id}/payroll`);
            setPayrollHistory(res.data);
        } catch (error) {
            console.error("Payroll fetch error:", error);
        }
    };

    const fetchTimetable = async () => {
        try {
            const res = await api.get(`/timetable/allocations/teacher/${id}`);
            setTimetable(res.data);
        } catch (error) {
            console.error("Timetable fetch error:", error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const res = await api.get(`/attendance/staff/${id}/history`);
            setAttendanceHistory(res.data);
        } catch (error) {
            console.error("Attendance error:", error);
            setAttendanceHistory([]);
        }
    };

    const handlePayrollSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/staff/${id}/payroll`, {
                ...payrollForm,
                amount: parseFloat(payrollForm.amount)
            });
            toast.success("Payroll transaction recorded");
            setIsPayrollModalOpen(false);
            fetchPayroll();
            setPayrollForm({ ...payrollForm, amount: '', description: '' });
        } catch (error) {
            console.error(error);
            toast.error("Failed to record transaction");
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>;
    if (!staff) return null;

    // Derived State for Classes Tab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueClasses = timetable?.allocations ? Array.from(new Set(timetable.allocations.map((a: any) => a.class_name))).filter(Boolean) : [];

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

                <div className="flex flex-col gap-2">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center min-w-[140px]">
                        <span className="text-xs font-bold text-slate-400 uppercase">Base Salary</span>
                        <div className="text-xl font-black text-slate-900 mt-1">${staff.salary_amount?.toLocaleString() || '0'}</div>
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

                {activeTab === 'attendance' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Attendance History</h3>
                        </div>
                        {attendanceHistory && attendanceHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Check In</th>
                                            <th className="px-6 py-4">Check Out</th>
                                            <th className="px-6 py-4">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {attendanceHistory.map((att: any, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-900">{new Date(att.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 capitalize">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${att.status === 'present' ? 'bg-green-100 text-green-700' :
                                                        att.status === 'absent' ? 'bg-red-100 text-red-700' :
                                                            att.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {att.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{att.check_in || '-'}</td>
                                                <td className="px-6 py-4 text-slate-600">{att.check_out || '-'}</td>
                                                <td className="px-6 py-4 text-slate-500">{att.remarks || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-500">
                                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p>No attendance records found.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'classes' && (
                    <div className="space-y-6">
                        {uniqueClasses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {uniqueClasses.map((className: any, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                                        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                                            <School size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">{className}</h3>
                                        <p className="text-sm text-slate-500">Assigned Teacher</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                                <School className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-slate-900 font-medium">No Classes Assigned</h3>
                                <p className="text-slate-500">Assign this teacher to classes in the Timetable module.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'timetable' && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Weekly Schedule</h3>
                        </div>
                        {timetable && timetable.allocations.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4">Day</th>
                                            <th className="px-6 py-4">Period</th>
                                            <th className="px-6 py-4">Class</th>
                                            <th className="px-6 py-4">Subject</th>
                                            <th className="px-6 py-4">Room</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {timetable.allocations.map((alloc: any) => {
                                            // Find Period Name
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            const period = timetable.periods.find((p: any) => p.period_id === alloc.period_id);
                                            return (
                                                <tr key={alloc.allocation_id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-medium text-slate-900">{alloc.day_of_week}</td>
                                                    <td className="px-6 py-4 text-slate-600">
                                                        {period ? `${period.name} (${period.start_time.slice(0, 5)} - ${period.end_time.slice(0, 5)})` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-blue-600">{alloc.class_name}</td>
                                                    <td className="px-6 py-4">{alloc.subject_name || '-'}</td>
                                                    <td className="px-6 py-4">{alloc.room_number || '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-500">
                                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <p>No timetable allocations found.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'payroll' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Payment History</h3>
                            <Button onClick={() => setIsPayrollModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                                <Plus size={16} className="mr-2" /> Record Payment
                            </Button>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {payrollHistory.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4">Method</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                            <th className="px-6 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {payrollHistory.map((txn: any) => (
                                            <tr key={txn.transaction_id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">{new Date(txn.transaction_date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 capitalize">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${txn.type === 'salary' ? 'bg-green-100 text-green-700' :
                                                        txn.type === 'deduction' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {txn.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">{txn.description || '-'}</td>
                                                <td className="px-6 py-4 capitalize">{txn.payment_method}</td>
                                                <td className="px-6 py-4 text-right font-mono font-bold">${parseFloat(txn.amount).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900">
                                                        <Printer size={14} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-slate-500">
                                    <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <p>No payment history found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Payroll Modal */}
            <AnimatePresence>
                {isPayrollModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setIsPayrollModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden"
                        >
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Record Payroll Transaction</h3>
                            <form onSubmit={handlePayrollSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Amount</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                                        placeholder="0.00"
                                        value={payrollForm.amount}
                                        onChange={e => setPayrollForm({ ...payrollForm, amount: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Suggested from Base Salary: {staff.salary_amount}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Type</label>
                                        <select
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-white"
                                            value={payrollForm.type}
                                            onChange={e => setPayrollForm({ ...payrollForm, type: e.target.value })}
                                        >
                                            <option value="salary">Salary</option>
                                            <option value="bonus">Bonus</option>
                                            <option value="advance">Advance</option>
                                            <option value="deduction">Deduction</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                                            value={payrollForm.transaction_date}
                                            onChange={e => setPayrollForm({ ...payrollForm, transaction_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Description</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Note (optional)"
                                        value={payrollForm.description}
                                        onChange={e => setPayrollForm({ ...payrollForm, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Payment Method</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none bg-white"
                                        value={payrollForm.payment_method}
                                        onChange={e => setPayrollForm({ ...payrollForm, payment_method: e.target.value })}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setIsPayrollModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Transaction</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
