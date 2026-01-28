'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, Search, Printer, FileText, ChevronDown, ChevronRight
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface StudentResultSummary {
    student_id: string;
    full_name: string;
    grand_total: number;
    total_obtained: number;
    percentage: number;
    papers_count: number;
    fail_count: number;
}

interface Exam {
    exam_id: string;
    name: string;
}

export default function ResultsPage() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState(''); // Class Name as string for now based on API

    const [results, setResults] = useState<StudentResultSummary[]>([]);
    const [loading, setLoading] = useState(false);

    // Detailed Card State
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [reportCard, setReportCard] = useState<any | null>(null);
    const [cardLoading, setCardLoading] = useState(false);

    useEffect(() => {
        fetchMeta();
    }, []);

    const fetchMeta = async () => {
        try {
            const [e, c] = await Promise.all([
                api.get('/exams'),
                api.get('/classes?limit=100')
            ]);
            setExams(e.data);
            setClasses(c.data);
        } catch (e) { toast.error('Failed to init'); }
    };

    const fetchResults = async () => {
        if (!selectedExam || !selectedClass) return;
        setLoading(true);
        try {
            // Need class name if selectedClass is ID? 
            // The API expects `class_name` str.
            // Let's find name
            const clsName = classes.find(c => c.class_id === selectedClass)?.class_name || selectedClass;

            const res = await api.get(`/results/class-summary/${selectedExam}?class_name=${clsName}`);
            setResults(res.data);
        } catch (e) { toast.error('Failed to fetch results'); }
        finally { setLoading(false); }
    };

    const handleViewCard = async (studentId: string) => {
        setSelectedStudent(studentId);
        setCardLoading(true);
        try {
            const res = await api.get(`/results/card/student/${studentId}/exam/${selectedExam}`);
            setReportCard(res.data);
        } catch (e) { toast.error('Failed to load report card'); setSelectedStudent(null); }
        finally { setCardLoading(false); }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Award className="text-pink-600" size={32} />
                            Results & Reports
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Generate broadsheets and student report cards</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Select Exam</label>
                        <div className="relative">
                            <select
                                className="w-full p-4 bg-slate-50 border rounded-xl font-bold outline-none appearance-none"
                                value={selectedExam}
                                onChange={e => setSelectedExam(e.target.value)}
                            >
                                <option value="">Select Exam Event</option>
                                {exams.map(e => <option key={e.exam_id} value={e.exam_id}>{e.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={20} />
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Select Class</label>
                        <div className="relative">
                            <select
                                className="w-full p-4 bg-slate-50 border rounded-xl font-bold outline-none appearance-none"
                                value={selectedClass}
                                onChange={e => setSelectedClass(e.target.value)}
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={20} />
                        </div>
                    </div>

                    <button
                        onClick={fetchResults}
                        disabled={!selectedExam || !selectedClass || loading}
                        className="w-full md:w-auto px-8 py-4 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
                    >
                        {loading ? 'Loading...' : <><Search size={20} /> View Results</>}
                    </button>
                </div>

                {/* Results Table */}
                {results.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Class Broad Sheet</h3>
                            <button onClick={() => window.print()} className="text-slate-400 hover:text-slate-900 flex items-center gap-2 text-sm font-bold">
                                <Printer size={16} /> Print List
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Rank</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Student</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Total Marks</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Obtained</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Percentage</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">Result</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {results.map((r, i) => (
                                        <tr key={r.student_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900">#{i + 1}</td>
                                            <td className="px-6 py-4 font-medium text-slate-700">{r.full_name}</td>
                                            <td className="px-6 py-4 text-slate-500 font-bold">{r.grand_total}</td>
                                            <td className="px-6 py-4 text-slate-900 font-bold">{r.total_obtained}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900">{r.percentage}%</span>
                                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${r.percentage >= 80 ? 'bg-green-500' : r.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${r.percentage}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {r.fail_count === 0 ? (
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">PASS</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">{r.fail_count} Fails</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleViewCard(r.student_id)}
                                                    className="text-pink-600 hover:text-pink-800 font-bold text-xs flex items-center justify-end gap-1"
                                                >
                                                    Report Card <ChevronRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Report Card Modal */}
            <AnimatePresence>
                {selectedStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-2xl p-0 w-full max-w-2xl my-10 relative">
                            {/* Close Button */}
                            <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full text-slate-500 hover:text-slate-900 z-10">✕</button>

                            {cardLoading || !reportCard ? (
                                <div className="p-20 text-center"><div className="animate-spin w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full mx-auto" /></div>
                            ) : (
                                <div className="p-8" id="report-card-print">
                                    {/* Header */}
                                    <div className="text-center border-b-2 border-slate-900 pb-6 mb-6">
                                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Report Card</h1>
                                        <p className="text-slate-500 font-bold text-sm mt-1">{reportCard.exam_name} • Session 2025-26</p>
                                    </div>

                                    {/* Student Info */}
                                    <div className="bg-slate-50 p-4 rounded-lg mb-6 grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px]">Student Name</p>
                                            <p className="font-bold text-slate-900 text-lg">{reportCard.full_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px]">Admission No</p>
                                            <p className="font-bold text-slate-900 text-lg">{reportCard.admission_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px]">Class & Section</p>
                                            <p className="font-bold text-slate-900 text-lg">{reportCard.class_name} {reportCard.section}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px]">Rank</p>
                                            <p className="font-bold text-purple-600 text-lg">#{reportCard.rank}</p>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <table className="w-full mb-6 text-sm border-collapse">
                                        <thead className="bg-slate-900 text-white">
                                            <tr>
                                                <th className="p-3 text-left">Subject</th>
                                                <th className="p-3 text-center">Total</th>
                                                <th className="p-3 text-center">Pass</th>
                                                <th className="p-3 text-center">Obtained</th>
                                                <th className="p-3 text-center">Grade</th>
                                                <th className="p-3 text-left">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="border border-slate-200">
                                            {reportCard.subjects.map((sub: any, i: number) => (
                                                <tr key={i} className="border-b border-slate-100">
                                                    <td className="p-3 font-bold text-slate-700">{sub.subject_name}</td>
                                                    <td className="p-3 text-center text-slate-500">{sub.total_marks}</td>
                                                    <td className="p-3 text-center text-slate-400">{sub.passing_marks}</td>
                                                    <td className="p-3 text-center font-bold text-slate-900">{sub.obtained_marks}</td>
                                                    <td className={`p-3 text-center font-bold ${sub.status === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>{sub.grade}</td>
                                                    <td className="p-3 text-slate-500 italic text-xs">{sub.remarks}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border border-slate-200 font-bold">
                                            <tr>
                                                <td className="p-3 text-right uppercase">Grand Total</td>
                                                <td className="p-3 text-center">{reportCard.grand_total}</td>
                                                <td></td>
                                                <td className="p-3 text-center text-lg">{reportCard.total_obtained}</td>
                                                <td className="p-3 text-center text-white bg-slate-900">{reportCard.overall_grade}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <div className="flex justify-between items-end mt-10 pt-10 border-t border-slate-200">
                                        <div className="text-center">
                                            <div className="w-32 border-b border-slate-400 mb-2"></div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Class Teacher</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-32 border-b border-slate-400 mb-2"></div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Principal</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                                <button onClick={() => setSelectedStudent(null)} className="px-6 py-3 font-bold text-slate-500 hover:bg-white rounded-xl">Close</button>
                                <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2">
                                    <Printer size={18} /> Print Report
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
