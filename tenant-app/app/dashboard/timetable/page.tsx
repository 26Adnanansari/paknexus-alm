'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, Users, BookOpen, Plus,
    ChevronLeft, ChevronRight, Save, Trash2,
    AlertCircle, CheckCircle, Search, Filter
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

// --- Types ---
interface Period {
    period_id: string;
    name: string;
    start_time: string;
    end_time: string;
    is_break: boolean;
    order_index: number;
}

interface Allocation {
    allocation_id: string;
    period_id: string;
    day_of_week: string;
    subject_id: string;
    teacher_id: string;
    room_number: string;
    subject_name?: string;
    teacher_name?: string;
}

interface ClassItem {
    class_id: string;
    class_name: string;
    section: string;
}

interface Subject {
    subject_id: string;
    subject_name: string;
    code: string;
}

interface Teacher {
    staff_id: string;
    full_name: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetablePage() {
    // --- State ---
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [classes, setClasses] = useState<ClassItem[]>([]);

    // Data
    const [periods, setPeriods] = useState<Period[]>([]);
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    // UI
    const [loading, setLoading] = useState(false);
    const [activeDay, setActiveDay] = useState('Monday'); // Mobile view state
    const [modalOpen, setModalOpen] = useState(false);
    const [periodsModalOpen, setPeriodsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ day: string, period_id: string } | null>(null);

    // Form
    const [formData, setFormData] = useState({
        subject_id: '',
        teacher_id: '',
        room_number: ''
    });

    // --- Effects ---
    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchTimetable(selectedClass);
        }
    }, [selectedClass]);

    // --- Actions ---
    const fetchInitialData = async () => {
        try {
            const [clsRes, subjRes, teachRes, perRes] = await Promise.all([
                api.get('/curriculum/classes'),
                api.get('/curriculum/subjects'),
                api.get('/staff?role=teacher'), // Optimized filter
                api.get('/timetable/periods')
            ]);
            setClasses(clsRes.data);
            setSubjects(subjRes.data);
            setTeachers(teachRes.data);
            setPeriods(perRes.data || []); // Periods might be empty initially
        } catch (error) {
            console.error('Init Error:', error);
            toast.error('Failed to load initial data');
        }
    };

    const fetchTimetable = async (classId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/timetable/allocations/class/${classId}`);
            // Backend returns { periods: [], allocations: [] }
            // We update periods here too in case they changed
            if (res.data.periods) setPeriods(res.data.periods);
            setAllocations(res.data.allocations || []);
        } catch (error) {
            toast.error('Failed to fetch timetable');
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (day: string, period: Period) => {
        if (period.is_break) return;

        // Find existing allocation
        const existing = allocations.find(a => a.period_id === period.period_id && a.day_of_week === day);

        setFormData({
            subject_id: existing?.subject_id || '',
            teacher_id: existing?.teacher_id || '',
            room_number: existing?.room_number || ''
        });
        setSelectedSlot({ day, period_id: period.period_id });
        setModalOpen(true);
    };

    const handleSaveAllocation = async () => {
        if (!selectedSlot || !selectedClass) return;

        try {
            await api.post('/timetable/allocations', {
                class_id: selectedClass,
                period_id: selectedSlot.period_id,
                day_of_week: selectedSlot.day,
                subject_id: formData.subject_id || null,
                teacher_id: formData.teacher_id || null,
                room_number: formData.room_number || null
            });

            toast.success('Timetable updated');
            setModalOpen(false);
            fetchTimetable(selectedClass); // Refresh
        } catch (error: any) {
            // Handle 409 Conflict (Teacher Busy)
            if (error.response?.status === 409) {
                toast.error(error.response.data.detail || 'Schedule conflict detected');
            } else {
                toast.error('Failed to save allocation');
            }
        }
    };

    // --- Render Helpers ---
    const getAllocation = (day: string, periodId: string) =>
        allocations.find(a => a.day_of_week === day && a.period_id === periodId);

    // Initial Empty State
    if (classes.length === 0 && !loading) {
        // Maybe loading?
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-24">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Calendar className="text-blue-600" size={32} />
                            Class Timetable
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage weekly schedules and subject allocations</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full md:w-64 p-3 font-bold"
                        >
                            <option value="">Select a Class...</option>
                            {classes.map(c => (
                                <option key={c.class_id} value={c.class_id}>
                                    {c.class_name} - {c.section}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setPeriodsModalOpen(true)}
                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                            title="Configure Periods"
                        >
                            <Clock size={20} />
                        </button>
                    </div>
                </div>

                {!selectedClass ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                        <div className="bg-blue-50 p-6 rounded-full mb-4">
                            <BookOpen className="text-blue-500 w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No Class Selected</h3>
                        <p className="text-slate-500 mt-2 max-w-md text-center">
                            Please select a class from the dropdown above to view and edit its timetable.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile View: Day Tabs */}
                        <div className="md:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                            {DAYS.map(day => (
                                <button
                                    key={day}
                                    onClick={() => setActiveDay(day)}
                                    className={`
                                        px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all
                                        ${activeDay === day
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-white text-slate-600 border border-slate-200'}
                                    `}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>

                        {/* Mobile View: List */}
                        <div className="md:hidden space-y-4">
                            {periods.map(period => {
                                const alloc = getAllocation(activeDay, period.period_id);
                                return (
                                    <motion.div
                                        key={period.period_id}
                                        layout
                                        onClick={() => handleCellClick(activeDay, period)}
                                        className={`
                                            p-4 rounded-2xl border transition-all relative overflow-hidden active:scale-95
                                            ${period.is_break
                                                ? 'bg-amber-50 border-amber-100'
                                                : alloc
                                                    ? 'bg-white border-blue-100 shadow-sm'
                                                    : 'bg-slate-50 border-slate-100 border-dashed'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold px-2 py-1 bg-slate-900/5 rounded-md text-slate-600">
                                                {period.start_time.slice(0, 5)} - {period.end_time.slice(0, 5)}
                                            </span>
                                            {period.is_break && (
                                                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Break</span>
                                            )}
                                        </div>

                                        {period.is_break ? (
                                            <h3 className="font-bold text-slate-700 text-center py-2">{period.name}</h3>
                                        ) : alloc ? (
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900">{alloc.subject_name}</h3>
                                                <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                                                    <Users size={14} />
                                                    <span>{alloc.teacher_name}</span>
                                                </div>
                                                {alloc.room_number && (
                                                    <div className="absolute top-4 right-4 text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                                                        RM {alloc.room_number}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center py-4 text-slate-400 gap-2">
                                                <Plus size={20} />
                                                <span className="font-medium">Assign Subject</span>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Desktop View: Grid */}
                        <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="p-4 text-left font-bold text-slate-400 w-32 sticky left-0 bg-slate-50">Day</th>
                                            {periods.map(p => (
                                                <th key={p.period_id} className="p-4 text-center min-w-[160px]">
                                                    <div className="text-slate-900 font-bold text-sm">{p.name}</div>
                                                    <div className="text-slate-400 text-xs font-mono mt-1">
                                                        {p.start_time.slice(0, 5)} - {p.end_time.slice(0, 5)}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {DAYS.map(day => (
                                            <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-bold text-slate-700 sticky left-0 bg-white border-r border-slate-100">
                                                    {day}
                                                </td>
                                                {periods.map(period => {
                                                    const alloc = getAllocation(day, period.period_id);
                                                    if (period.is_break) {
                                                        // Only render break once per column effectively (since it's same for all days usually)
                                                        // But here we render a disabled cell
                                                        return (
                                                            <td key={period.period_id} className="p-2 bg-amber-50/30 border-r border-slate-100 text-center">
                                                                <span className="text-xs font-bold text-amber-300 rotate-45 block">///</span>
                                                            </td>
                                                        );
                                                    }
                                                    return (
                                                        <td key={period.period_id} className="p-2 border-r border-slate-100 relative group">
                                                            <motion.button
                                                                whileHover={{ scale: 0.98 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleCellClick(day, period)}
                                                                className={`
                                                                    w-full h-24 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 p-2
                                                                    ${alloc
                                                                        ? 'bg-white border-blue-100 hover:border-blue-400 hover:shadow-md'
                                                                        : 'bg-slate-50 border-dashed border-slate-200 hover:border-blue-300 text-slate-300 hover:text-blue-400'}
                                                                `}
                                                            >
                                                                {alloc ? (
                                                                    <>
                                                                        <span className="font-bold text-sm text-slate-900 text-center line-clamp-2">
                                                                            {alloc.subject_name}
                                                                        </span>
                                                                        <span className="text-xs text-slate-500 text-center line-clamp-1">
                                                                            {alloc.teacher_name || 'No Teacher'}
                                                                        </span>
                                                                        {alloc.room_number && (
                                                                            <span className="text-[10px] uppercase font-mono bg-slate-100 px-1.5 rounded text-slate-500">
                                                                                RM {alloc.room_number}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <Plus size={24} />
                                                                )}
                                                            </motion.button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Allocation Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="bg-slate-50 p-6 border-b border-slate-100">
                                <h3 className="font-bold text-xl text-slate-900">Assign Subject</h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    {selectedSlot?.day}, {periods.find(p => p.period_id === selectedSlot?.period_id)?.name}
                                </p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                                    <select
                                        value={formData.subject_id}
                                        onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(s => (
                                            <option key={s.subject_id} value={s.subject_id}>{s.subject_name} ({s.code})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Teacher</label>
                                    <select
                                        value={formData.teacher_id}
                                        onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => (
                                            <option key={t.staff_id} value={t.staff_id}>{t.full_name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Only showing staff with 'teacher' role
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Room (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.room_number}
                                        onChange={e => setFormData({ ...formData, room_number: e.target.value })}
                                        placeholder="e.g. 101"
                                        className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 py-3 px-4 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveAllocation}
                                    className="flex-1 py-3 px-4 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Periods Configuration Modal */}
            <AnimatePresence>
                {periodsModalOpen && (
                    <PeriodsConfigurationModal
                        isOpen={periodsModalOpen}
                        onClose={() => setPeriodsModalOpen(false)}
                        periods={periods}
                        onRefresh={fetchInitialData}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Sub-Components ---

function PeriodsConfigurationModal({ isOpen, onClose, periods, onRefresh }: { isOpen: boolean, onClose: () => void, periods: Period[], onRefresh: () => void }) {
    const [newPeriod, setNewPeriod] = useState({
        name: '',
        start_time: '',
        end_time: '',
        is_break: false,
        order_index: periods.length + 1
    });
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!newPeriod.name || !newPeriod.start_time || !newPeriod.end_time) {
            toast.error('Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            await api.post('/timetable/periods', {
                ...newPeriod,
                start_time: newPeriod.start_time, // Ensure HH:MM format from input[time]
                end_time: newPeriod.end_time
            });
            toast.success('Period added');
            setNewPeriod({ ...newPeriod, name: '', start_time: '', end_time: '', order_index: newPeriod.order_index + 1 });
            onRefresh();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to add period');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will delete all allocations for this period.')) return;
        try {
            await api.delete(`/timetable/periods/${id}`);
            toast.success('Period deleted');
            onRefresh();
        } catch (error) {
            toast.error('Failed to delete period');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-slate-900">Configure School Periods</h3>
                        <p className="text-slate-500 text-sm">Define the daily schedule structure</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <Plus className="rotate-45" size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Add New Form */}
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-4">
                        <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wide">Add New Period</h4>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-3">
                                <label className="text-xs font-bold text-slate-500 ml-1">Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Period 1"
                                    className="w-full p-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold"
                                    value={newPeriod.name}
                                    onChange={e => setNewPeriod({ ...newPeriod, name: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 ml-1">Start</label>
                                <input
                                    type="time"
                                    className="w-full p-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                    value={newPeriod.start_time}
                                    onChange={e => setNewPeriod({ ...newPeriod, start_time: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 ml-1">End</label>
                                <input
                                    type="time"
                                    className="w-full p-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                    value={newPeriod.end_time}
                                    onChange={e => setNewPeriod({ ...newPeriod, end_time: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 ml-1">Order</label>
                                <input
                                    type="number"
                                    className="w-full p-2 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                                    value={newPeriod.order_index}
                                    onChange={e => setNewPeriod({ ...newPeriod, order_index: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="md:col-span-1 flex items-center pb-3">
                                <label className="flex items-center gap-2 cursor-pointer" title="Is Break?">
                                    <input
                                        type="checkbox"
                                        checked={newPeriod.is_break}
                                        onChange={e => setNewPeriod({ ...newPeriod, is_break: e.target.checked })}
                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-slate-500 md:hidden">Is Break?</span>
                                </label>
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    onClick={handleAdd}
                                    disabled={loading}
                                    className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-2">
                            <h4 className="font-bold text-slate-900">Existing Periods ({periods.length})</h4>
                        </div>

                        {periods.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No periods defined yet. Add one above.
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                                {periods.sort((a, b) => a.order_index - b.order_index).map(p => (
                                    <div key={p.period_id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-mono text-xs text-slate-500 font-bold">
                                                {p.order_index}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                                    {p.name}
                                                    {p.is_break && <span className="text-[10px] uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Break</span>}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono">
                                                    {p.start_time.slice(0, 5)} - {p.end_time.slice(0, 5)}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(p.period_id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

