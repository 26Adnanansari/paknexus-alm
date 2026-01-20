'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, User, Mail, Phone, School } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeachersPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [newTeacher, setNewTeacher] = useState({
        full_name: '',
        employee_id: '',
        email: '',
        phone: '',
        designation: 'Teacher',
        join_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff', { params: { role: 'teacher' } });
            setTeachers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/staff', { ...newTeacher, role: 'teacher' });
            setIsAddOpen(false);
            setNewTeacher({
                full_name: '', employee_id: '', email: '', phone: '',
                designation: 'Teacher', join_date: new Date().toISOString().split('T')[0]
            });
            fetchTeachers();
        } catch {
            alert('Failed to add teacher');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <School className="h-8 w-8 text-blue-600" />
                        Teachers
                    </h1>
                    <p className="text-slate-500 mt-1">Manage school faculty and staff</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Teacher
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-3 text-center py-12 text-slate-500">Loading faculty...</div>
                ) : teachers.length === 0 ? (
                    <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-slate-200">
                        <p className="text-slate-500">No teachers found. Add your first teacher.</p>
                    </div>
                ) : (
                    teachers.map((teacher) => (
                        <div key={teacher.staff_id} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                                    {teacher.full_name?.[0]}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${teacher.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                    {teacher.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">{teacher.full_name}</h3>
                            <p className="text-sm text-blue-600 font-medium mb-4">{teacher.designation}</p>

                            <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span>{teacher.email || 'No email'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    <span>{teacher.phone || 'No phone'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" />
                                    <span className="font-mono text-xs">{teacher.employee_id}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Teacher Modal */}
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
                            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h2 className="text-lg font-bold">Add New Teacher</h2>
                                <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name</label>
                                    <input required className="w-full px-3 py-2 border rounded-lg" value={newTeacher.full_name} onChange={e => setNewTeacher({ ...newTeacher, full_name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Employee ID</label>
                                        <input required className="w-full px-3 py-2 border rounded-lg" value={newTeacher.employee_id} onChange={e => setNewTeacher({ ...newTeacher, employee_id: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Join Date</label>
                                        <input type="date" required className="w-full px-3 py-2 border rounded-lg" value={newTeacher.join_date} onChange={e => setNewTeacher({ ...newTeacher, join_date: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input type="email" className="w-full px-3 py-2 border rounded-lg" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input className="w-full px-3 py-2 border rounded-lg" value={newTeacher.phone} onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Designation</label>
                                    <input className="w-full px-3 py-2 border rounded-lg" value={newTeacher.designation} onChange={e => setNewTeacher({ ...newTeacher, designation: e.target.value })} />
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Add Teacher'}</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
