'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AlertCircle, Download, Filter, Search, Mail, Phone
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface StudentFeeStatus {
    student_id: string;
    student_name: string;
    admission_number: string;
    current_class: string;
    total_fee: number;
    total_paid: number;
    outstanding: number;
    last_payment_date?: string;
    is_defaulter: boolean;
}

export default function OutstandingFeesPage() {
    const [students, setStudents] = useState<StudentFeeStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [classFilter, setClassFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOutstanding();
    }, [classFilter]);

    const fetchOutstanding = async () => {
        setLoading(true);
        try {
            const params = classFilter ? `?class_name=${classFilter}` : '';
            const res = await api.get(`/fees/outstanding${params}`);
            setStudents(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load outstanding fees');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalOutstanding = filteredStudents.reduce((sum, s) => sum + s.outstanding, 0);

    const exportToCSV = () => {
        const headers = ['Admission No', 'Student Name', 'Class', 'Total Fee', 'Paid', 'Outstanding', 'Last Payment'];
        const rows = filteredStudents.map(s => [
            s.admission_number,
            s.student_name,
            s.current_class,
            s.total_fee,
            s.total_paid,
            s.outstanding,
            s.last_payment_date || 'Never'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `outstanding-fees-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success('Report exported successfully');
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                            <AlertCircle className="text-red-600" size={36} />
                            Outstanding Fees Report
                        </h1>
                        <p className="text-slate-500 font-medium mt-2">Track pending fee payments and defaulters</p>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                    >
                        <Download size={20} />
                        Export CSV
                    </button>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-red-600 to-red-700 p-8 rounded-3xl shadow-lg text-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-red-100 text-sm font-bold mb-2">Total Defaulters</p>
                            <p className="text-5xl font-black">{filteredStudents.length}</p>
                        </div>
                        <div>
                            <p className="text-red-100 text-sm font-bold mb-2">Total Outstanding</p>
                            <p className="text-5xl font-black">PKR {totalOutstanding.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-red-100 text-sm font-bold mb-2">Average Per Student</p>
                            <p className="text-5xl font-black">
                                PKR {filteredStudents.length > 0 ? Math.round(totalOutstanding / filteredStudents.length).toLocaleString() : 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or admission number..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <select
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">All Classes</option>
                                {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
                                    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Admission No</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Student Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Class</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Total Fee</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Paid</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Outstanding</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Last Payment</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-slate-500">
                                            Loading outstanding fees...
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-12 text-center text-slate-500">
                                            No outstanding fees found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.student_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-sm text-slate-600">{student.admission_number}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">{student.student_name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                                    {student.current_class}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-600">PKR {student.total_fee.toLocaleString()}</td>
                                            <td className="px-6 py-4 font-mono text-green-600">PKR {student.total_paid.toLocaleString()}</td>
                                            <td className="px-6 py-4 font-mono text-red-600 font-bold">PKR {student.outstanding.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {student.last_payment_date
                                                    ? new Date(student.last_payment_date).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => toast.info('Email reminder feature coming soon')}
                                                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Send Email Reminder"
                                                    >
                                                        <Mail size={16} className="text-blue-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => toast.info('SMS reminder feature coming soon')}
                                                        className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Send SMS Reminder"
                                                    >
                                                        <Phone size={16} className="text-green-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
