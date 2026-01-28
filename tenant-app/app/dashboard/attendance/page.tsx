'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, CheckCircle, Clock, Save,
    ChevronLeft, Users, QrCode, Search, Filter, AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui exists or generic
// import QRScanner if available, or just use manual input for robustness now
// We'll trust the manual/barcode input logic from previous file as it's robust and simple

// --- Types ---
interface Session {
    allocation_id: string; // from timetable
    class_id: string;
    class_name: string;
    section: string;
    period_id: string;
    period_name: string;
    start_time: string;
    end_time: string;
    subject_name?: string;
    teacher_name?: string;
    session_id?: string; // If already marked
    session_status?: string;
    present_count?: number;
    absent_count?: number;
}

interface StudentRecord {
    student_id: string;
    full_name: string;
    admission_number: string;
    photo_url?: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
}

export default function AttendancePage() {
    // --- State ---
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [students, setStudents] = useState<StudentRecord[]>([]);

    // UI
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [qrMode, setQrMode] = useState(false);
    const [qrInput, setQrInput] = useState('');
    const qrInputRef = useRef<HTMLInputElement>(null);

    // --- Effects ---
    useEffect(() => {
        fetchSessions();
    }, [date]);

    useEffect(() => {
        if (qrMode && qrInputRef.current) {
            qrInputRef.current.focus();
        }
    }, [qrMode]);

    // --- Actions ---
    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/attendance/sessions?date=${date}`);
            setSessions(res.data);
        } catch (error) {
            toast.error('Failed to load schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleSessionSelect = async (session: Session) => {
        setSelectedSession(session);
        setLoading(true);
        try {
            let fetchedStudents: StudentRecord[] = [];

            if (session.session_id) {
                // Fetch existing records
                const res = await api.get(`/attendance/records/${session.session_id}`);
                // Map to interface
                fetchedStudents = res.data.map((r: any) => ({
                    student_id: r.student_id,
                    full_name: r.full_name,
                    admission_number: r.admission_number,
                    photo_url: r.photo_url,
                    status: r.status,
                    remarks: r.remarks
                }));
            } else {
                // Fetch class list and init as absent or present (default present?)
                // Default Present is faster for teachers
                const res = await api.get(`/students?class_name=${session.class_name}`); // Using class_name for filtering
                // Wait, class_name param in students.py expects just name. 
                // But class creation allows section. Filter in students.py is `current_class`.
                // For now assuming class_name matches `current_class`.

                fetchedStudents = res.data.map((s: any) => ({
                    student_id: s.student_id,
                    full_name: s.full_name,
                    admission_number: s.admission_number,
                    photo_url: s.photo_url,
                    status: 'present', // Default
                    remarks: ''
                }));
            }
            setStudents(fetchedStudents);
        } catch (error) {
            toast.error('Failed to load students');
            setSelectedSession(null); // Go back
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = (studentIndex: number) => {
        const newStudents = [...students];
        const current = newStudents[studentIndex].status;
        const next = current === 'present' ? 'absent' : (current === 'absent' ? 'late' : 'present');
        newStudents[studentIndex].status = next;
        setStudents(newStudents);
    };

    const handleSubmit = async () => {
        if (!selectedSession) return;
        setSaving(true);
        try {
            const payload = {
                session_details: {
                    class_id: selectedSession.class_id,
                    period_id: selectedSession.period_id,
                    date: date,
                    teacher_id: null, // Let backend handle or user context
                    subject_id: null, // Backend can infer from session logic or we pass it if needed (but session_id logic in backend handles updates)
                    // Wait, session_details in backend expects: class_id, period_id, date...
                    // Update: Backend logic uses these to find/create session.
                },
                records: students.map(s => ({
                    student_id: s.student_id,
                    status: s.status,
                    remarks: s.remarks
                }))
            };

            await api.post('/attendance/submit', payload);
            toast.success('Attendance saved successfully');
            setSelectedSession(null);
            fetchSessions(); // Refresh list status
        } catch (error) {
            toast.error('Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    // QR Logic
    const handleQrSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!qrInput.trim()) return;

        // Find student by ID or Admission Number
        const query = qrInput.trim().toLowerCase();
        const index = students.findIndex(s =>
            s.student_id.toLowerCase() === query ||
            s.admission_number.toLowerCase() === query
        );

        if (index !== -1) {
            const newStudents = [...students];
            newStudents[index].status = 'present';
            setStudents(newStudents);
            toast.success(`Marked Present: ${newStudents[index].full_name}`);
            setQrInput('');
        } else {
            toast.error('Student not found in this class');
            setQrInput('');
        }
    };

    // --- Render ---

    if (selectedSession) {
        // --- Marking View ---
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <div className="bg-white px-4 py-4 border-b border-slate-200 sticky top-0 z-10 flex justify-between items-center shadow-sm">
                    <button
                        onClick={() => setSelectedSession(null)}
                        className="flex items-center gap-2 text-slate-600 font-bold hover:bg-slate-100 p-2 rounded-lg"
                    >
                        <ChevronLeft size={20} />
                        Back
                    </button>
                    <div className="text-center">
                        <h2 className="font-bold text-slate-900">{selectedSession.class_name} - {selectedSession.section}</h2>
                        <p className="text-xs text-slate-500 font-mono">{selectedSession.period_name} ({selectedSession.start_time.slice(0, 5)})</p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={18} />}
                        Save
                    </button>
                </div>

                {/* QR Bar */}
                <div className="bg-blue-600 p-4 text-white shadow-inner">
                    <div className="max-w-md mx-auto relative">
                        <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" size={20} />
                        <form onSubmit={handleQrSubmit}>
                            <input
                                ref={qrInputRef}
                                type="text"
                                value={qrInput}
                                onChange={e => setQrInput(e.target.value)}
                                placeholder="Scan QR / Enter Admission No"
                                className="w-full bg-blue-700/50 border border-blue-500/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-white/20 font-mono"
                                autoFocus
                            />
                        </form>
                    </div>
                </div>

                <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3">
                        {students.map((student, idx) => (
                            <motion.div
                                key={student.student_id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`
                                    p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 select-none
                                    ${student.status === 'present'
                                        ? 'bg-white border-green-100 shadow-sm'
                                        : student.status === 'absent'
                                            ? 'bg-red-50 border-red-100'
                                            : 'bg-amber-50 border-amber-100'}
                                `}
                                onClick={() => toggleStatus(idx)}
                            >
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                                    ${student.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                `}>
                                    {student.full_name[0]}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900">{student.full_name}</h3>
                                    <p className="text-xs text-slate-500 font-mono">{student.admission_number}</p>
                                </div>
                                <div className={`
                                    px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${student.status === 'present' ? 'bg-green-100 text-green-700' :
                                        student.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                                `}>
                                    {student.status}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Session Selection View ---
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <CheckCircle className="text-green-600" size={32} />
                    Attendance
                </h1>

                {/* Date Picker */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto self-start">
                    <Calendar className="text-slate-400" size={20} />
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="font-bold text-slate-900 bg-transparent outline-none"
                    />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
                        <p className="text-slate-500 font-bold">Loading schedule...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <Clock className="text-slate-400 w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No Classes Scheduled</h3>
                        <p className="text-slate-500 mt-2">There are no timetable allocations for this date.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sessions.map(session => (
                            <motion.button
                                key={session.allocation_id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSessionSelect(session)}
                                className={`
                                    text-left p-6 rounded-3xl border-2 transition-all group relative overflow-hidden
                                    ${session.session_id
                                        ? 'bg-white border-green-100 shadow-sm'
                                        : 'bg-white border-slate-100 shadow-sm hover:border-blue-200'}
                                `}
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    {session.session_id ? (
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                            <CheckCircle size={12} />
                                            Submitted
                                        </span>
                                    ) : (
                                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                            Pending
                                        </span>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <div className="text-xs font-bold text-slate-400 font-mono mb-1">
                                        {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-1">
                                        {session.class_name} <span className="text-slate-400 font-normal">{session.section}</span>
                                    </h3>
                                    <p className="font-bold text-blue-600">{session.subject_name}</p>
                                </div>

                                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                    <Users size={16} />
                                    {session.teacher_name || 'No Teacher'}
                                </div>

                                {session.session_id && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4 text-xs font-bold">
                                        <div className="text-green-600">
                                            {session.present_count} Present
                                        </div>
                                        <div className="text-red-600">
                                            {session.absent_count} Absent
                                        </div>
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
