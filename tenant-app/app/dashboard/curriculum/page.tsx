'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    BookOpen, Plus, Layers, Hash, Edit, Trash2, X, School,
    Users, MapPin, GraduationCap, ArrowRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'sonner';

export default function CurriculumPage() {
    const [activeTab, setActiveTab] = useState('classes');
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]); // For assignment
    const [loading, setLoading] = useState(true);

    // Modals
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

    // Forms State
    const [newClass, setNewClass] = useState({ class_name: '', section: '', class_teacher_id: '', room_number: '', capacity: 30, academic_year: '2024-2025' });
    const [newSubject, setNewSubject] = useState({ subject_name: '', code: '', department: '', credits: 1.0, is_optional: false });

    // Allocation State
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [allocatedSubjects, setAllocatedSubjects] = useState<any[]>([]);
    const [subjectToAssign, setSubjectToAssign] = useState('');
    const [teacherToAssign, setTeacherToAssign] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [classesRes, subjectsRes, staffRes] = await Promise.all([
                api.get('/curriculum/classes'),
                api.get('/curriculum/subjects'),
                api.get('/staff?role=teacher')
            ]);
            setClasses(classesRes.data);
            setSubjects(subjectsRes.data);
            setTeachers(staffRes.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load curriculum data");
        } finally {
            setLoading(false);
        }
    };

    // --- Class Handlers ---
    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...newClass, class_teacher_id: newClass.class_teacher_id || null };
            await api.post('/curriculum/classes', payload);
            toast.success("Class created successfully");
            setIsClassModalOpen(false);
            setNewClass({ class_name: '', section: '', class_teacher_id: '', room_number: '', capacity: 30, academic_year: '2024-2025' });
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create class");
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (!confirm("Delete this class?")) return;
        try {
            await api.delete(`/curriculum/classes/${id}`);
            setClasses(classes.filter(c => c.class_id !== id));
            toast.success("Class deleted");
        } catch (error) { toast.error("Failed to delete class"); }
    };

    // --- Subject Handlers ---
    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/curriculum/subjects', newSubject);
            toast.success("Subject created successfully");
            setIsSubjectModalOpen(false);
            setNewSubject({ subject_name: '', code: '', department: '', credits: 1.0, is_optional: false });
            fetchData();
        } catch (error) { toast.error("Failed to create subject"); }
    };

    const handleDeleteSubject = async (id: string) => {
        if (!confirm("Delete this subject?")) return;
        try {
            await api.delete(`/curriculum/subjects/${id}`);
            setSubjects(subjects.filter(s => s.subject_id !== id));
            toast.success("Subject deleted");
        } catch (error) { toast.error("Failed to delete subject"); }
    };

    // --- Allocation Handlers ---
    const openAllocationModal = async (cls: any) => {
        setSelectedClass(cls);
        try {
            const res = await api.get(`/curriculum/classes/${cls.class_id}/subjects`);
            setAllocatedSubjects(res.data);
            setIsAllocationModalOpen(true);
        } catch (error) { toast.error("Failed to load subjects"); }
    };

    const handleAssignSubject = async () => {
        if (!subjectToAssign) return;
        try {
            await api.post(`/curriculum/classes/${selectedClass.class_id}/subjects`, {
                class_id: selectedClass.class_id,
                subject_id: subjectToAssign,
                teacher_id: teacherToAssign || null
            });

            // Refresh list
            const res = await api.get(`/curriculum/classes/${selectedClass.class_id}/subjects`);
            setAllocatedSubjects(res.data);
            setSubjectToAssign('');
            setTeacherToAssign('');
            toast.success("Subject assigned");
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to assign subject");
        }
    };

    const handleRemoveAllocation = async (allocationId: string) => {
        try {
            await api.delete(`/curriculum/allocations/${allocationId}`);
            setAllocatedSubjects(prev => prev.filter(a => a.allocation_id !== allocationId));
            toast.success("Subject removed");
        } catch (error) { toast.error("Failed to remove subject"); }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        Curriculum Management
                    </h1>
                    <p className="text-slate-500 mt-1">Manage classes, subjects, and curriculum allocation.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsClassModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" /> Add Class
                    </Button>
                    <Button onClick={() => setIsSubjectModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4 mr-2" /> Add Subject
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('classes')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'classes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <School className="h-4 w-4" /> Classes
                </button>
                <button
                    onClick={() => setActiveTab('subjects')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'subjects' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <Hash className="h-4 w-4" /> Subjects
                </button>
            </div>

            {/* Content */}
            {activeTab === 'classes' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Class Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Teacher</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Room</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Capacity</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {classes.map(cls => (
                                <tr key={cls.class_id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{cls.class_name}</div>
                                        <div className="text-xs text-slate-500">Section {cls.section || 'A'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {cls.class_teacher_name ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{cls.class_teacher_name[0]}</div>
                                                <span className="text-sm text-slate-700">{cls.class_teacher_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{cls.room_number || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{cls.capacity}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button onClick={() => openAllocationModal(cls)} variant="outline" size="sm" className="h-8 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50">
                                                <Layers className="h-3 w-3" /> Subjects
                                            </Button>
                                            <button onClick={() => handleDeleteClass(cls.class_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {classes.length === 0 && <div className="p-12 text-center text-slate-500">No classes found. Add one to get started.</div>}
                </div>
            )}

            {activeTab === 'subjects' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Subject Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Code</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Department</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Credits</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {subjects.map(sub => (
                                <tr key={sub.subject_id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{sub.subject_name}</div>
                                        {sub.is_optional && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">OPTIONAL</span>}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm text-slate-600">{sub.code || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{sub.department || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{sub.credits}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDeleteSubject(sub.subject_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {subjects.length === 0 && <div className="p-12 text-center text-slate-500">No subjects found. Add one to get started.</div>}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {isClassModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
                            <h2 className="text-xl font-bold mb-4">Add New Class</h2>
                            <form onSubmit={handleAddClass} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Class Name</label>
                                        <input required className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Grade 10" value={newClass.class_name} onChange={e => setNewClass({ ...newClass, class_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Section</label>
                                        <input className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. A" value={newClass.section} onChange={e => setNewClass({ ...newClass, section: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700">Class Teacher</label>
                                    <select className="w-full px-3 py-2 border rounded-lg bg-white" value={newClass.class_teacher_id} onChange={e => setNewClass({ ...newClass, class_teacher_id: e.target.value })}>
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => <option key={t.staff_id} value={t.staff_id}>{t.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Room Number</label>
                                        <input className="w-full px-3 py-2 border rounded-lg" placeholder="101" value={newClass.room_number} onChange={e => setNewClass({ ...newClass, room_number: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Capacity</label>
                                        <input type="number" className="w-full px-3 py-2 border rounded-lg" value={newClass.capacity} onChange={e => setNewClass({ ...newClass, capacity: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button variant="ghost" onClick={() => setIsClassModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create Class</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isSubjectModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
                            <h2 className="text-xl font-bold mb-4">Add New Subject</h2>
                            <form onSubmit={handleAddSubject} className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700">Subject Name</label>
                                    <input required className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Advanced Mathematics" value={newSubject.subject_name} onChange={e => setNewSubject({ ...newSubject, subject_name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Subject Code</label>
                                        <input className="w-full px-3 py-2 border rounded-lg" placeholder="MATH101" value={newSubject.code} onChange={e => setNewSubject({ ...newSubject, code: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700">Department</label>
                                        <input className="w-full px-3 py-2 border rounded-lg" placeholder="Science" value={newSubject.department} onChange={e => setNewSubject({ ...newSubject, department: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <input type="checkbox" id="optional" className="w-4 h-4 text-blue-600 rounded" checked={newSubject.is_optional} onChange={e => setNewSubject({ ...newSubject, is_optional: e.target.checked })} />
                                    <label htmlFor="optional" className="text-sm text-slate-700">This is an optional subject</label>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button variant="ghost" onClick={() => setIsSubjectModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Create Subject</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isAllocationModalOpen && selectedClass && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                <div>
                                    <h2 className="text-xl font-bold">Manage Subjects</h2>
                                    <p className="text-sm text-slate-500">For {selectedClass.class_name} ({selectedClass.section})</p>
                                </div>
                                <button onClick={() => setIsAllocationModalOpen(false)}><X className="text-slate-400 hover:text-red-500" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                                <div className="space-y-2">
                                    {allocatedSubjects.map(alloc => (
                                        <div key={alloc.allocation_id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                            <div>
                                                <div className="font-semibold text-slate-900">{alloc.subject_name}</div>
                                                <div className="text-xs text-slate-500">Teacher: {alloc.teacher_name || 'Not assigned'}</div>
                                            </div>
                                            <button onClick={() => handleRemoveAllocation(alloc.allocation_id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {allocatedSubjects.length === 0 && <p className="text-center text-slate-400 italic">No subjects assigned yet.</p>}
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl">
                                <h3 className="text-sm font-bold text-slate-700 mb-2">Assign New Subject</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <select className="px-3 py-2 border rounded-lg text-sm bg-white" value={subjectToAssign} onChange={e => setSubjectToAssign(e.target.value)}>
                                        <option value="">Select Subject</option>
                                        {subjects.filter(s => !allocatedSubjects.find(a => a.subject_id === s.subject_id)).map(s => (
                                            <option key={s.subject_id} value={s.subject_id}>{s.subject_name} ({s.code})</option>
                                        ))}
                                    </select>
                                    <select className="px-3 py-2 border rounded-lg text-sm bg-white" value={teacherToAssign} onChange={e => setTeacherToAssign(e.target.value)}>
                                        <option value="">Select Subject Teacher</option>
                                        {teachers.map(t => <option key={t.staff_id} value={t.staff_id}>{t.full_name}</option>)}
                                    </select>
                                </div>
                                <Button
                                    onClick={handleAssignSubject}
                                    disabled={!subjectToAssign}
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-9 text-sm"
                                >
                                    Assign Subject
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
