'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Save, FileText, CheckCircle,
    AlertCircle, Search, Percent
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface StudentMark {
    student_id: string;
    full_name: string;
    admission_number: string;
    photo_url?: string;
    marks_obtained: number | null; // Nullable for input
    remarks?: string;
}

interface PaperDetails {
    subject_name: string;
    class_name: string;
    section: string;
    total_marks: number;
    passing_marks: number;
}

export default function MarksEntryPage() {
    const { paperId } = useParams();
    const router = useRouter();

    const [students, setStudents] = useState<StudentMark[]>([]);
    const [paper, setPaper] = useState<PaperDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        if (paperId) fetchMarksSheet();
    }, [paperId]);

    const fetchMarksSheet = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/exams/papers/${paperId}/marks`);
            setPaper(res.data.paper);
            // Map existing marks or default 0/null
            setStudents(res.data.students.map((s: any) => ({
                student_id: s.student_id,
                full_name: s.full_name,
                admission_number: s.admission_number,
                photo_url: s.photo_url,
                marks_obtained: s.marks_obtained !== null ? parseFloat(s.marks_obtained) : null,
                remarks: s.remarks || ''
            })));
        } catch (error) {
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (index: number, value: string) => {
        const val = parseFloat(value);
        if (paper && val > paper.total_marks) {
            toast.warning(`Marks cannot exceed ${paper.total_marks}`);
            return;
        }

        const newStudents = [...students];
        newStudents[index].marks_obtained = value === '' ? null : val;
        setStudents(newStudents);
    };

    const handleRemarkChange = (index: number, value: string) => {
        const newStudents = [...students];
        newStudents[index].remarks = value;
        setStudents(newStudents);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Filter only marked entries? Or save all "0" too?
            // Usually save all non-null.
            const entries = students
                .filter(s => s.marks_obtained !== null)
                .map(s => ({
                    student_id: s.student_id,
                    marks_obtained: s.marks_obtained,
                    remarks: s.remarks
                }));

            if (entries.length === 0) {
                toast.info('No marks to save');
                setSaving(false);
                return;
            }

            await api.post('/exams/marks', {
                paper_id: paperId,
                entries
            });

            toast.success('Marks saved successfully');
            router.back();
        } catch (error) {
            toast.error('Failed to save marks');
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(filter.toLowerCase()) ||
        s.admission_number.includes(filter)
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-24">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-4 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                        >
                            <ChevronLeft size={24} className="text-slate-500" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                {paper?.subject_name || 'Loading...'}
                            </h1>
                            <p className="text-slate-500 font-medium text-sm">
                                {paper?.class_name} - {paper?.section} • Max Marks: {paper?.total_marks}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                placeholder="Search student..."
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 w-48"
                            />
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={18} />}
                            Save Marks
                        </button>
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-40">Obtained</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((student, idx) => {
                                    // Calculate simple status
                                    let status = 'Pending';
                                    let statusColor = 'bg-slate-100 text-slate-500';

                                    if (student.marks_obtained !== null && paper) {
                                        if (student.marks_obtained >= paper.passing_marks) {
                                            status = 'Pass';
                                            statusColor = 'bg-green-100 text-green-700';
                                        } else {
                                            status = 'Fail';
                                            statusColor = 'bg-red-100 text-red-700';
                                        }
                                    }

                                    return (
                                        <tr key={student.student_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{student.full_name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{student.admission_number}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={student.marks_obtained ?? ''}
                                                        onChange={(e) => handleMarkChange(idx, e.target.value)}
                                                        placeholder="0"
                                                        className="w-full p-2 pl-3 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:border-blue-500 outline-none"
                                                        max={paper?.total_marks}
                                                        min={0}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                                        / {paper?.total_marks}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={student.remarks}
                                                    onChange={(e) => handleRemarkChange(idx, e.target.value)}
                                                    placeholder="Add remark..."
                                                    className="w-full bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-sm text-slate-600 py-1"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
