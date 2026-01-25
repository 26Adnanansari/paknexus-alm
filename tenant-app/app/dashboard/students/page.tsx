'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Search, MoreHorizontal, GraduationCap, Loader2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BulkUploadModal from '@/components/BulkUploadModal';
import ShareIDCardLink from '@/components/ShareIDCardLink';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'sonner';

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
    email?: string;
    address?: string;
    photo_url?: string;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

    // Add Form State
    const [newStudent, setNewStudent] = useState({
        full_name: '',
        admission_number: '',
        admission_date: new Date().toISOString().split('T')[0],
        date_of_birth: '',
        gender: 'Male',
        current_class: '',
        father_name: '',
        father_phone: '',
        photo_url: '',
        email: '',
        address: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNextId = async () => {
        try {
            const res = await api.get('/students/next-id');
            if (res.data?.next_id) {
                setNewStudent(prev => ({ ...prev, admission_number: res.data.next_id }));
            }
        } catch (e) {
            console.error("Failed to suggest ID", e);
        }
    };

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
        setError(null);

        const payload = {
            ...newStudent,
            father_name: newStudent.father_name.trim() || null,
            father_phone: newStudent.father_phone.trim() || null,
            current_class: newStudent.current_class.trim() || null,
            photo_url: newStudent.photo_url.trim() || null,
            email: newStudent.email.trim() || null,
            address: newStudent.address.trim() || null,
            gender: newStudent.gender
        };

        try {
            await api.post('/students', payload);
            setIsAddOpen(false);
            setNewStudent({
                full_name: '', admission_number: '', admission_date: new Date().toISOString().split('T')[0], date_of_birth: '',
                gender: 'Male', current_class: '', father_name: '', father_phone: '', photo_url: '', email: '', address: ''
            });
            fetchStudents();
            toast.success("Student added successfully");
        } catch (err: any) {
            console.error("Failed to add student:", err);
            const msg = err?.response?.data?.detail || 'Failed to add student. Check inputs.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 md:top-0 z-20 bg-slate-50/95 backdrop-blur-sm py-2">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-slate-900 tracking-tight">
                        <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                        Students Directory
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">Manage student admissions, profiles and records.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        onClick={() => setIsBulkUploadOpen(true)}
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50 h-[44px] flex-1 md:flex-none"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Upload
                    </Button>
                    <Button
                        onClick={() => {
                            setIsAddOpen(true);
                            fetchNextId();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 h-[44px] flex-1 md:flex-none"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Enroll Student
                    </Button>
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-50 text-red-600 px-4 py-2.5 rounded-lg border border-red-100 flex items-center gap-2 text-sm"
                >
                    <span className="font-bold">Error:</span> {error}
                </motion.div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[60vh] flex flex-col">
                <div className="p-3 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50 sticky top-0 z-10">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            placeholder="Search by name or admission no..."
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-[44px] text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Search students"
                        />
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-8 flex flex-col items-center justify-center text-slate-500 gap-3">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                            <p>Loading directory...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-4">
                            <div className="bg-slate-100 p-4 rounded-full">
                                <Search className="h-8 w-8 text-slate-400" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-slate-700">No students found</p>
                                <p className="text-sm">Try adjusting your search criteria</p>
                            </div>
                        </div>
                    ) : (
                        students.map((student) => (
                            <div key={student.student_id} className="p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border border-blue-200 overflow-hidden">
                                            {student.photo_url ? (
                                                <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                student.full_name?.[0]
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-lg">{student.full_name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{student.admission_number}</span>
                                                <span className="text-xs text-slate-500">• {student.gender}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-slate-400 p-2 -mr-2 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"><MoreHorizontal size={20} /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Class</p>
                                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-sm font-bold border border-blue-100 inline-block">
                                            {student.current_class || 'Unassigned'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Status</p>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold ${student.status === 'active'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${student.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                            {student.status || 'Active'}
                                        </span>
                                    </div>
                                </div>
                                {(student.father_name || student.father_phone) && (
                                    <div className="pt-2 border-t border-slate-50 mt-2">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Parent Info</p>
                                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <span className="font-medium text-slate-700 text-sm">{student.father_name || 'N/A'}</span>
                                            <span className="text-slate-500 text-xs font-mono">{student.father_phone}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider sticky top-0">
                            <tr className="h-10">
                                <th className="px-6 py-2">Student Name</th>
                                <th className="px-6 py-2">Admission No</th>
                                <th className="px-6 py-2">Class</th>
                                <th className="px-6 py-2">Parent Info</th>
                                <th className="px-6 py-2">Status</th>
                                <th className="px-6 py-2">ID Card Share</th>
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
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center gap-3 py-4">
                                        <div className="bg-slate-50 p-4 rounded-full">
                                            <Search className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-base text-slate-800">No students found</p>
                                            <p className="text-slate-500 mt-1 text-sm">Try adjusting your search criteria or add a new student.</p>
                                        </div>
                                    </div>
                                </td></tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.student_id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shadow-sm border border-blue-200 overflow-hidden">
                                                    {student.photo_url ? (
                                                        <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        student.full_name?.[0]
                                                    )}
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
                                        <td className="px-6 py-4">
                                            <ShareIDCardLink
                                                studentId={student.student_id}
                                                admissionNumber={student.admission_number}
                                            />
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
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="px-6 md:px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Enroll Student</h2>
                                    <p className="text-sm text-slate-500">Fill in the student details below</p>
                                </div>
                                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors touch-target min-w-[44px] flex items-center justify-center">✕</button>
                            </div>
                            <form onSubmit={handleAddSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                                        <input required className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all touch-target" value={newStudent.full_name} onChange={e => setNewStudent({ ...newStudent, full_name: e.target.value })} placeholder="John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Admission No <span className="text-red-500">*</span></label>
                                        <input required className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all touch-target font-mono" value={newStudent.admission_number} onChange={e => setNewStudent({ ...newStudent, admission_number: e.target.value })} placeholder="ADM-001" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Admission Date <span className="text-red-500">*</span></label>
                                        <input type="date" required className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all touch-target" value={newStudent.admission_date} onChange={e => setNewStudent({ ...newStudent, admission_date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Date of Birth <span className="text-red-500">*</span></label>
                                        <input type="date" required className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all touch-target" value={newStudent.date_of_birth} onChange={e => setNewStudent({ ...newStudent, date_of_birth: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Gender</label>
                                        <select className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white touch-target" value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })}>
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Class</label>
                                        <input className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all touch-target" value={newStudent.current_class} onChange={e => setNewStudent({ ...newStudent, current_class: e.target.value })} placeholder="e.g. Grade 10-A" />
                                    </div>
                                </div>
                                <div className="h-px bg-slate-100" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Father&apos;s Name</label>
                                        <input className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all touch-target" value={newStudent.father_name} onChange={e => setNewStudent({ ...newStudent, father_name: e.target.value })} placeholder="Parent Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Father&apos;s Phone</label>
                                        <input className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all touch-target" value={newStudent.father_phone} onChange={e => setNewStudent({ ...newStudent, father_phone: e.target.value })} placeholder="+92 300 1234567" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Email Address</label>
                                        <input type="email" className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all touch-target" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} placeholder="student@example.com" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-slate-700">Residential Address</label>
                                        <textarea className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all touch-target resize-none h-20" value={newStudent.address} onChange={e => setNewStudent({ ...newStudent, address: e.target.value })} placeholder="Enter full address..." />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-slate-700">Student Photo URL</label>
                                        <input className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all touch-target" value={newStudent.photo_url} onChange={e => setNewStudent({ ...newStudent, photo_url: e.target.value })} placeholder="https://example.com/photo.jpg" />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-100 p-4 -mx-6 md:-mx-8">
                                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 touch-target min-w-[44px]">Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 touch-target min-w-[44px]">
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

            {/* Bulk Upload Modal */}
            <BulkUploadModal
                isOpen={isBulkUploadOpen}
                onClose={() => setIsBulkUploadOpen(false)}
                onSuccess={() => {
                    fetchStudents();
                }}
            />
        </div>
    );
}
