'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Calendar, Check, X, Clock, Save } from 'lucide-react';

export default function AttendancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // We fetch all students for now, in real app filtered by class
    useEffect(() => {
        fetchAttendance();
    }, [date]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await api.get('/attendance', { params: { date } });
            // If fetching attendance returns mixed student+attendance data
            setStudents(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const markStatus = (index: number, status: string) => {
        const newStudents = [...students];
        newStudents[index].status = status;
        setStudents(newStudents);
    };

    const saveAttendance = async () => {
        try {
            const records = students.map(s => ({
                student_id: s.student_id,
                status: s.status || 'present', // Default to present if untouched? Or force selection
                remarks: s.remarks
            })).filter(s => s.status); // Only send marked records? Or all? Let's send all with default.

            await api.post('/attendance/batch', { date, records });
            alert('Attendance saved successfully');
        } catch (e) { alert('Failed to save attendance'); }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Calendar className="h-8 w-8 text-blue-600" />
                        Daily Attendance
                    </h1>
                    <p className="text-slate-500 mt-1">Mark and view attendance records</p>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="date"
                        className="px-4 py-2 border rounded-lg font-medium"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <Button onClick={saveAttendance} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="h-4 w-4 mr-2" />
                        Save Attendance
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold text-sm">
                        <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Class</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No students found active for this date.</td></tr>
                        ) : (
                            students.map((student, idx) => (
                                <tr key={student.student_id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium">{student.full_name}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500">{student.current_class}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center bg-slate-100 rounded-lg p-1 w-fit mx-auto">
                                            {[
                                                { id: 'present', icon: Check, color: 'text-green-600', activeBg: 'bg-white shadow' },
                                                { id: 'absent', icon: X, color: 'text-red-600', activeBg: 'bg-white shadow' },
                                                { id: 'late', icon: Clock, color: 'text-orange-600', activeBg: 'bg-white shadow' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => markStatus(idx, opt.id)}
                                                    className={`p-2 rounded-md transition-all ${(student.status || 'present') === opt.id ? opt.activeBg : 'hover:bg-slate-200 text-slate-400'
                                                        }`}
                                                >
                                                    <opt.icon className={`h-4 w-4 ${(student.status || 'present') === opt.id ? opt.color : ''}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            className="w-full bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-sm"
                                            placeholder="Add remark..."
                                            value={student.remarks || ''}
                                            onChange={(e) => {
                                                const newStudents = [...students];
                                                newStudents[idx].remarks = e.target.value;
                                                setStudents(newStudents);
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
