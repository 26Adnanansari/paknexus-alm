'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Printer, Download, GraduationCap,
    Trophy, XCircle, CheckCircle, FileText
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

// --- Types ---
interface Exam {
    exam_id: string;
    name: string;
    is_active: boolean;
}

interface ReportCard {
    student_id: string;
    full_name: string;
    admission_number: string;
    class_name: string;
    section: string;
    exam_name: string;
    subjects: {
        subject_name: string;
        total_marks: number;
        obtained_marks: number;
        percentage: number;
        grade: string;
        status: string;
        remarks: string;
    }[];
    grand_total: number;
    total_obtained: number;
    overall_percentage: number;
    overall_grade: string;
    rank?: number;
}

interface StudentSuggest {
    student_id: string;
    full_name: string;
    admission_number: string;
    current_class: string;
}

export default function ResultsPage() {
    // State
    const [exams, setExams] = useState<Exam[]>([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<StudentSuggest[]>([]);

    // Result Data
    const [reportCard, setReportCard] = useState<ReportCard | null>(null);
    const [loading, setLoading] = useState(false);

    // Print Ref
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchExams();
    }, []);

    // Debounce Search
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchQuery.length > 2) searchStudents(searchQuery);
            else setSuggestions([]);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const fetchExams = async () => {
        try {
            const res = await api.get('/exams');
            setExams(res.data);
            if (res.data.length > 0) setSelectedExamId(res.data[0].exam_id);
        } catch (e) { toast.error('Failed to load exams'); }
    };

    const searchStudents = async (q: string) => {
        try {
            // Need a search endpoint or filter
            const res = await api.get('/students', { params: { search: q, limit: 5 } });
            setSuggestions(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSelectStudent = async (studentId: string) => {
        setSuggestions([]); // Close dropdown
        if (!selectedExamId) {
            toast.error('Please select an exam first');
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/results/card/student/${studentId}/exam/${selectedExamId}`);
            setReportCard(res.data);
            setSearchQuery(''); // Clear search
        } catch (error) {
            toast.error('Report card not found or results pending');
            setReportCard(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-24 print:bg-white print:p-0">
            {/* Header (Hid on Print) */}
            <div className="max-w-4xl mx-auto space-y-8 print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Trophy className="text-amber-500" size={32} />
                            Results & Reports
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Generate and print student report cards</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-4 items-center">
                    <select
                        value={selectedExamId}
                        onChange={e => setSelectedExamId(e.target.value)}
                        className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none w-full md:w-64"
                    >
                        {exams.map(e => (
                            <option key={e.exam_id} value={e.exam_id}>{e.name}</option>
                        ))}
                    </select>

                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by Name or Admission No..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500 transition-all"
                        />
                        {/* Suggestions Dropdown */}
                        <AnimatePresence>
                            {suggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                                >
                                    {suggestions.map(s => (
                                        <div
                                            key={s.student_id}
                                            onClick={() => handleSelectStudent(s.student_id)}
                                            className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                        >
                                            <div className="font-bold text-slate-900">{s.full_name}</div>
                                            <div className="text-xs text-slate-500 font-mono">
                                                ID: {s.admission_number} • Class: {s.current_class}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-20 print:hidden">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
                </div>
            )}

            {/* Report Card (Visible on Print) */}
            {reportCard && !loading && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl mx-auto mt-8 bg-white p-10 md:p-12 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-0 print:p-0"
                    ref={componentRef}
                >
                    {/* Print Header */}
                    <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-widest mb-2">Report Card</h1>
                        <h2 className="text-xl font-bold text-slate-600">{reportCard.exam_name}</h2>
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                        <div>
                            <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Student Name</p>
                            <p className="text-xl font-bold text-slate-900">{reportCard.full_name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Admission No</p>
                            <p className="text-xl font-bold font-mono text-slate-900">{reportCard.admission_number}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Class / Section</p>
                            <p className="text-lg font-bold text-slate-900">{reportCard.class_name} <span className="text-slate-400">{reportCard.section}</span></p>
                        </div>
                        <div className="text-right">
                            {reportCard.rank && (
                                <>
                                    <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Class Rank</p>
                                    <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">
                                        <Trophy size={14} />
                                        #{reportCard.rank}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-8 overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4 text-left">Subject</th>
                                    <th className="px-6 py-4 text-center">Total</th>
                                    <th className="px-6 py-4 text-center">Obtained</th>
                                    <th className="px-6 py-4 text-center">Grade</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {reportCard.subjects.map((sub, i) => (
                                    <tr key={i} className="text-slate-700">
                                        <td className="px-6 py-4 font-bold">{sub.subject_name}</td>
                                        <td className="px-6 py-4 text-center font-mono">{sub.total_marks}</td>
                                        <td className="px-6 py-4 text-center font-mono font-bold">{sub.obtained_marks}</td>
                                        <td className="px-6 py-4 text-center font-bold">{sub.grade}</td>
                                        <td className="px-6 py-4 text-center">
                                            {sub.status === 'Pass' ? (
                                                <span className="text-green-600 font-bold flex justify-center items-center gap-1">P</span>
                                            ) : (
                                                <span className="text-red-600 font-bold flex justify-center items-center gap-1">F</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-900 text-white font-bold">
                                <tr>
                                    <td className="px-6 py-4">GRAND TOTAL</td>
                                    <td className="px-6 py-4 text-center">{reportCard.grand_total}</td>
                                    <td className="px-6 py-4 text-center text-lg">{reportCard.total_obtained}</td>
                                    <td className="px-6 py-4 text-center text-lg text-amber-400">{reportCard.overall_grade}</td>
                                    <td className="px-6 py-4 text-center">
                                        {reportCard.overall_percentage}%
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Remarks & Signatures */}
                    <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-slate-200">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Class Teacher Signature</p>
                            <div className="h-0.5 bg-slate-300 w-32"></div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Principal Signature</p>
                            <div className="h-0.5 bg-slate-300 w-32 ml-auto"></div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-slate-400">
                        Generated by PakNexus ALM • {new Date().toLocaleDateString()}
                    </div>

                    {/* Print Fab (Hidden on Print) */}
                    <button
                        onClick={handlePrint}
                        className="fixed bottom-10 right-10 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all print:hidden z-50 flex items-center gap-2 font-bold pr-6 pl-4"
                    >
                        <Printer size={24} />
                        Print Report
                    </button>
                </motion.div>
            )}
        </div>
    );
}
