'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Search, User, Filter, MoreHorizontal, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentsPage() {
    const [students, setStudents] = useState<any[]>([]);
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

    useEffect(() => {
        fetchStudents();
    }, [search]); // Debounce in production

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/students', { params: { search } });
            setStudents(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

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
        } catch (error) {
            alert('Failed to add student');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <GraduationCap className="h-8 w-8 text-blue-600" />
                        Students
                    </h1>
                    <p className="text-slate-500 mt-1">Manage student admissions and records</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Student
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 text-slate-400 h-5 w-5" />
                        <input
                            placeholder="Search by name or admission no..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold text-sm">
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
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading students...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No students found.</td></tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.student_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                                    {student.full_name?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{student.full_name}</div>
                                                    <div className="text-xs text-slate-500">{student.gender}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm">{student.admission_number}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                                                {student.current_class || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div>{student.father_name}</div>
                                            <div className="text-slate-400">{student.father_phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {student.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-blue-600"><MoreHorizontal size={20} /></button>
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
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h2 className="text-xl font-bold">Add New Student</h2>
                                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>
                            <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <input required className="w-full px-4 py-2 border rounded-lg" value={newStudent.full_name} onChange={e => setNewStudent({ ...newStudent, full_name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Admission No</label>
                                        <input required className="w-full px-4 py-2 border rounded-lg" value={newStudent.admission_number} onChange={e => setNewStudent({ ...newStudent, admission_number: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Date of Birth</label>
                                        <input type="date" required className="w-full px-4 py-2 border rounded-lg" value={newStudent.date_of_birth} onChange={e => setNewStudent({ ...newStudent, date_of_birth: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Gender</label>
                                        <select className="w-full px-4 py-2 border rounded-lg" value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })}>
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Class</label>
                                        <input className="w-full px-4 py-2 border rounded-lg" value={newStudent.current_class} onChange={e => setNewStudent({ ...newStudent, current_class: e.target.value })} placeholder="e.g. Grade 1" />
                                    </div>
                                </div>
                                <div className="h-px bg-slate-100" />
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Father's Name</label>
                                        <input className="w-full px-4 py-2 border rounded-lg" value={newStudent.father_name} onChange={e => setNewStudent({ ...newStudent, father_name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Contact Phone</label>
                                        <input className="w-full px-4 py-2 border rounded-lg" value={newStudent.contact_phone} onChange={e => setNewStudent({ ...newStudent, contact_phone: e.target.value })} />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Student'}</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
