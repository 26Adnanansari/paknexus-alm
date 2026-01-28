'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Save, AlertTriangle, CheckCircle, Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface StudentMark {
    student_id: string;
    full_name: string;
    admission_number: string;
    photo_url?: string;
    marks_obtained: number; // default 0
    remarks?: string;
    // UI state
    is_changed?: boolean;
}

interface PaperDetails {
    paper_id: string;
    subject_name: string; // Joined in backend? or need separate fetch? Backend join
    class_name: string;
    date: string;
    total_marks: number;
    passing_marks: number;
}

export default function MarksEntryPage() {
    const params = useParams();
    const router = useRouter();
    const paperId = params.paperId as string;

    const [paper, setPaper] = useState<PaperDetails | null>(null);
    const [students, setStudents] = useState<StudentMark[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [paperId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/exams/papers/${paperId}/marks`);
            setPaper(res.data.paper);
            // Initialize students marks (handle nulls from backend)
            const mapped = res.data.students.map((s: any) => ({
                ...s,
                marks_obtained: s.marks_obtained !== null ? s.marks_obtained : 0,
                remarks: s.remarks || '',
                is_changed: false
            }));
            setStudents(mapped);
        } catch (e) { toast.error('Failed to load marks sheet'); }
        finally { setLoading(false); }
    };

    const handleMarkChange = (index: number, val: string) => {
        const num = parseFloat(val);
        const newStudents = [...students];
        newStudents[index].marks_obtained = isNaN(num) ? 0 : num;
        newStudents[index].is_changed = true;
        setStudents(newStudents);
    };

    const handleRemarkChange = (index: number, val: string) => {
        const newStudents = [...students];
        newStudents[index].remarks = val;
        newStudents[index].is_changed = true;
        setStudents(newStudents);
    };

    const handleSave = async () => {
        if (!paper) return;
        setSaving(true);
        try {
            const payload = {
                paper_id: paperId,
                entries: students.map(s => ({
                    student_id: s.student_id,
                    marks_obtained: s.marks_obtained,
                    remarks: s.remarks
                }))
            };
            await api.post('/exams/marks', payload);
            toast.success('Marks Saved Successfully');
            fetchData(); // Refresh to clear dirty state? or manual
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Failed to save marks');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
    if (!paper) return <div className="p-10 text-center">Paper not found</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900">
                        <ArrowLeft size={20} /> Back
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <h2 className="font-black text-slate-900 text-lg">{paper.class_name} • {paper.subject_name || 'Subject'}</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total: {paper.total_marks} | Pass: {paper.passing_marks}</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-200"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Save Marks
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Student</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Marks Obtained</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Remarks</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map((student, i) => {
                                const isFail = student.marks_obtained < paper.passing_marks;
                                const isInvalid = student.marks_obtained > paper.total_marks;

                                return (
                                    <tr key={student.student_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                                    {student.photo_url ? <img src={student.photo_url} className="w-full h-full object-cover" /> : null}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{student.full_name}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{student.admission_number}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                className={`w-24 p-2 border-2 rounded-lg font-bold outline-none text-center
                                                    ${isInvalid ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 focus:border-purple-500'}
                                                `}
                                                value={student.marks_obtained}
                                                onChange={e => handleMarkChange(i, e.target.value)}
                                                min={0}
                                                max={paper.total_marks}
                                            />
                                            {isInvalid && <p className="text-[10px] text-red-500 font-bold mt-1">Max {paper.total_marks}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
                                                placeholder="Excellent, Good, etc."
                                                value={student.remarks}
                                                onChange={e => handleRemarkChange(i, e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            {isFail ? (
                                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Fail</span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Pass</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {students.length === 0 && <div className="p-10 text-center text-slate-400">No students found in this class</div>}
                </div>
            </div>
        </div>
    );
}
