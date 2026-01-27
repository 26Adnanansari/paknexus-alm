'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard, Download, CheckCircle2, Users, Search, Filter, ArrowLeft
} from 'lucide-react';
import { useBranding } from '@/context/branding-context';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Student {
    student_id: string;
    full_name: string;
    admission_number: string;
    current_class: string;
    photo_url?: string;
    father_name?: string;
    father_phone?: string;
}

export default function StudentSelectionPage() {
    const router = useRouter();
    const { branding } = useBranding();

    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [classes, setClasses] = useState<string[]>([]);

    useEffect(() => {
        fetchStudents();
    }, [classFilter]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params: any = { limit: 500 };
            if (classFilter) params.class_name = classFilter;

            const res = await api.get('/students', { params });
            const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
            setStudents(data);

            // Extract unique classes
            const uniqueClasses = [...new Set(data.map((s: Student) => s.current_class).filter(Boolean))];
            setClasses(uniqueClasses as string[]);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const toggleStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const toggleAll = () => {
        if (selectedStudents.size === filteredStudents.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(filteredStudents.map(s => s.student_id)));
        }
    };

    const generateIDCards = async () => {
        if (selectedStudents.size === 0) {
            toast.error("Please select at least one student");
            return;
        }

        try {
            const studentIds = Array.from(selectedStudents);
            const res = await api.post('/id-cards/bulk-generate', {
                student_ids: studentIds,
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: null
            });

            toast.success(`Generated ${res.data.successful} ID cards successfully!`);

            // Navigate to ID cards page
            router.push('/dashboard/id-cards');
        } catch (e: any) {
            console.error(e);
            toast.error(e.response?.data?.detail || "Failed to generate ID cards");
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.admission_number.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                            <CreditCard className="text-blue-600" size={36} />
                            Select Students for ID Cards
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">Choose students who need ID cards generated</p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/id-cards')}
                        className="flex items-center gap-2 font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft size={20} /> Back to Templates
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name or admission number..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <select
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer"
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                            >
                                <option value="">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleAll}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm transition-all"
                            >
                                {selectedStudents.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap">
                                {selectedStudents.size} Selected
                            </div>
                        </div>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                                            onChange={toggleAll}
                                            className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Photo</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Admission No.</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Class</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Father Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Contact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-slate-500">
                                            Loading students...
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-slate-500">
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr
                                            key={student.student_id}
                                            className={`transition-colors cursor-pointer hover:bg-slate-50 ${selectedStudents.has(student.student_id) ? 'bg-blue-50' : ''
                                                }`}
                                            onClick={() => toggleStudent(student.student_id)}
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.has(student.student_id)}
                                                    onChange={() => toggleStudent(student.student_id)}
                                                    className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                                                    {student.photo_url ? (
                                                        <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                                                            {student.full_name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{student.full_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-sm text-slate-600">{student.admission_number}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                                    {student.current_class || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {student.father_name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                                {student.father_phone || 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Action Button */}
                <div className="sticky bottom-6 flex justify-center">
                    <motion.button
                        onClick={generateIDCards}
                        disabled={selectedStudents.size === 0}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-2xl shadow-blue-300 hover:shadow-3xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3"
                        whileHover={{ scale: selectedStudents.size > 0 ? 1.05 : 1 }}
                        whileTap={{ scale: selectedStudents.size > 0 ? 0.95 : 1 }}
                    >
                        <Download size={24} />
                        Generate {selectedStudents.size} ID Card{selectedStudents.size !== 1 ? 's' : ''}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
