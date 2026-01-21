'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Search, MoreHorizontal, GraduationCap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'sonner'; // Assuming sonner or react-hot-toast is installed, falling back to console if not

// Define interfaces for strict typing
interface Student {
    student_id: string;
    full_name: string;
    admission_number: string;
    date_of_birth?: string;
    gender: string;
    current_class?: string;
    father_name?: string;
    father_phone?: string;
    status: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Add Form State
    const [newStudent, setNewStudent] = useState({
        full_name: '',
        admission_number: '',
        date_of_birth: '',
        gender: 'Male',
        current_class: '',
        father_name: '',
        contact_phone: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/students', { params: { search } });
            setStudents(res.data);
        } catch (err: any) {
            console.error("Failed to fetch students", err);
            if (err?.response?.status === 403) {
                setError("You do not have permission to view students. Please check your role.");
            } else {
                setError("Failed to load students. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/students', newStudent);
            setIsAddOpen(false);
            setNewStudent({
                full_name: '', admission_number: '', date_of_birth: '',
                gender: 'Male', current_class: '', father_name: '', contact_phone: ''
            });
            fetchStudents();
            // Ideally: toast.success("Student added successfully");
            alert("Student added successfully!");
        } catch (err: any) {
            console.error(err);
            const msg = err?.response?.data?.detail || 'Failed to add student';
            alert(`Error: ${msg}`); // Replace with toast in future
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 tracking-tight">
                        <GraduationCap className="h-8 w-8 text-blue-600" />
                        Students Directory
                    </h1>
                    <p className="text-slate-500 mt-1">Manage student admissions, profiles and records.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    Enroll Student
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-3 top-2.5 text-slate-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            placeholder="Search by name or admission no..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Admission No</th>
                                <th className="px-6 py-4">Class</th>
                                <th className="px-6 py-4">Parent Info</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="animate-spin text-blue-500" />
                                        <span>Loading directory...</span>
                                    </div>
                                </td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-500">
                                    <p className="font-medium">No students found.</p>
                                    <p className="text-xs mt-1">Try adjusting your search or add a new student.</p>
                                </td></tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.student_id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shadow-sm border border-blue-200">
                                                    {student.full_name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{student.full_name}</div>
                                                    <div className="text-xs text-slate-500">{student.gender}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-600">{student.admission_number}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">
                                                {student.current_class || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="font-medium text-slate-900">{student.father_name || '-'}</div>
                                            <div className="text-slate-400 text-xs">{student.father_phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${student.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${student.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                {student.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors"><MoreHorizontal size={20} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Student Modal */}
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
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Add New Student</h2>
                                    <p className="text-sm text-slate-500">Enter the student's details below.</p>
                                </div>
                                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">✕</button>
                            </div>
                            <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                                        <input required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={newStudent.full_name} onChange={e => setNewStudent({ ...newStudent, full_name: e.target.value })} placeholder="John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Admission No <span className="text-red-500">*</span></label>
                                        <input required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={newStudent.admission_number} onChange={e => setNewStudent({ ...newStudent, admission_number: e.target.value })} placeholder="ADM-001" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Date of Birth <span className="text-red-500">*</span></label>
                                        <input type="date" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={newStudent.date_of_birth} onChange={e => setNewStudent({ ...newStudent, date_of_birth: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Gender</label>
                                        <select className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white" value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })}>
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Class</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={newStudent.current_class} onChange={e => setNewStudent({ ...newStudent, current_class: e.target.value })} placeholder="e.g. Grade 10-A" />
                                    </div>
                                </div>
                                <div className="h-px bg-slate-100" />
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Father&apos;s Name</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={newStudent.father_name} onChange={e => setNewStudent({ ...newStudent, father_name: e.target.value })} placeholder="Parent Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Contact Phone</label>
                                        <input className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={newStudent.contact_phone} onChange={e => setNewStudent({ ...newStudent, contact_phone: e.target.value })} placeholder="+1 234 567 890" />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                                        {submitting ? (
                                            <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Saving...</>
                                        ) : 'Add Student'}
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
