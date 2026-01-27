'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, Search, CreditCard, Printer, Calendar, User, CheckCircle2
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Student {
    student_id: string;
    full_name: string;
    admission_number: string;
    current_class: string;
    photo_url?: string;
}

interface Invoice {
    invoice_id: string;
    month_year: string;
    total_amount: number;
    scholarship_amount: number;
    payable_amount: number;
    paid_amount: number;
    status: string;
    due_date: string;
}

interface FeeStatus {
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

export default function FeeCollectionPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [feeStatus, setFeeStatus] = useState<FeeStatus | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);

    // Payment form
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentRemarks, setPaymentRemarks] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

    const searchStudent = async () => {
        if (!searchTerm.trim()) {
            toast.error('Please enter admission number or name');
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/students?search=${searchTerm}&limit=10`);
            const students = Array.isArray(res.data) ? res.data : (res.data.items || []);

            if (students.length === 0) {
                toast.error('No student found');
                return;
            }

            const student = students[0];
            setSelectedStudent(student);

            // Fetch fee status and invoices
            await Promise.all([
                fetchFeeStatus(student.student_id),
                fetchInvoices(student.student_id)
            ]);
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to search student');
        } finally {
            setLoading(false);
        }
    };

    const fetchFeeStatus = async (studentId: string) => {
        try {
            const res = await api.get(`/fees/status/${studentId}`);
            setFeeStatus(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchInvoices = async (studentId: string) => {
        try {
            const res = await api.get(`/fees/invoices/${studentId}`);
            setInvoices(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const recordPayment = async () => {
        if (!selectedInvoice) {
            toast.error('Please select an invoice');
            return;
        }

        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast.error('Please enter valid payment amount');
            return;
        }

        try {
            await api.post('/fees/collect', {
                invoice_id: selectedInvoice,
                amount: parseFloat(paymentAmount),
                method: paymentMethod,
                remarks: paymentRemarks
            });

            toast.success('Payment recorded successfully!');

            // Refresh data
            if (selectedStudent) {
                await Promise.all([
                    fetchFeeStatus(selectedStudent.student_id),
                    fetchInvoices(selectedStudent.student_id)
                ]);
            }

            // Reset form
            setPaymentAmount('');
            setPaymentRemarks('');
            setSelectedInvoice(null);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Failed to record payment');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <CreditCard className="text-green-600" size={36} />
                        Fee Collection
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Search student and record fee payments</p>
                </div>

                {/* Search Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchStudent()}
                                placeholder="Search by admission number or student name..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={searchStudent}
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>

                {/* Student Info & Fee Status */}
                {selectedStudent && feeStatus && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        {/* Student Card */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200">
                                    {selectedStudent.photo_url ? (
                                        <img src={selectedStudent.photo_url} alt={selectedStudent.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl">
                                            {selectedStudent.full_name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{selectedStudent.full_name}</h3>
                                    <p className="text-sm text-slate-500 font-mono">{selectedStudent.admission_number}</p>
                                    <p className="text-sm text-blue-600 font-bold">{selectedStudent.current_class}</p>
                                </div>
                            </div>
                        </div>

                        {/* Fee Summary Cards */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl shadow-lg text-white">
                            <p className="text-blue-100 text-sm font-bold mb-2">Total Fee</p>
                            <p className="text-4xl font-black">PKR {feeStatus.total_fee.toLocaleString()}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-3xl shadow-lg text-white">
                            <p className="text-green-100 text-sm font-bold mb-2">Total Paid</p>
                            <p className="text-4xl font-black">PKR {feeStatus.total_paid.toLocaleString()}</p>
                        </div>

                        <div className={`p-6 rounded-3xl shadow-lg text-white ${feeStatus.outstanding > 0
                                ? 'bg-gradient-to-br from-red-600 to-red-700'
                                : 'bg-gradient-to-br from-emerald-600 to-emerald-700'
                            }`}>
                            <p className={`text-sm font-bold mb-2 ${feeStatus.outstanding > 0 ? 'text-red-100' : 'text-emerald-100'}`}>
                                Outstanding
                            </p>
                            <p className="text-4xl font-black">PKR {feeStatus.outstanding.toLocaleString()}</p>
                            {feeStatus.outstanding === 0 && (
                                <p className="text-emerald-100 text-sm mt-2 flex items-center gap-2">
                                    <CheckCircle2 size={16} /> All Paid
                                </p>
                            )}
                        </div>

                        {feeStatus.last_payment_date && (
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-2">
                                <p className="text-slate-500 text-sm font-bold mb-1">Last Payment</p>
                                <p className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                    <Calendar size={24} className="text-blue-600" />
                                    {new Date(feeStatus.last_payment_date).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Invoices & Payment Section */}
                {selectedStudent && invoices.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Invoices List */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Invoices</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {invoices.map((invoice) => (
                                    <div
                                        key={invoice.invoice_id}
                                        onClick={() => {
                                            setSelectedInvoice(invoice.invoice_id);
                                            setPaymentAmount((invoice.payable_amount - invoice.paid_amount).toString());
                                        }}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedInvoice === invoice.invoice_id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-slate-900">{invoice.month_year}</p>
                                                <p className="text-xs text-slate-500">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${invoice.status === 'paid'
                                                    ? 'bg-green-100 text-green-700'
                                                    : invoice.status === 'partial'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                {invoice.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-slate-500">Payable</p>
                                                <p className="font-bold text-slate-900">PKR {invoice.payable_amount.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Paid</p>
                                                <p className="font-bold text-green-600">PKR {invoice.paid_amount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        {invoice.scholarship_amount > 0 && (
                                            <p className="text-xs text-blue-600 mt-2">
                                                Scholarship: PKR {invoice.scholarship_amount.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Record Payment</h3>

                            {!selectedInvoice ? (
                                <div className="text-center py-12 text-slate-500">
                                    Select an invoice to record payment
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Amount</label>
                                        <input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            placeholder="Enter amount"
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none font-mono text-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Payment Method</label>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="online">Online Payment</option>
                                            <option value="cheque">Cheque</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Remarks (Optional)</label>
                                        <textarea
                                            value={paymentRemarks}
                                            onChange={(e) => setPaymentRemarks(e.target.value)}
                                            placeholder="Add any notes..."
                                            rows={3}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none resize-none"
                                        />
                                    </div>

                                    <button
                                        onClick={recordPayment}
                                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <DollarSign size={24} />
                                        Record Payment
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!selectedStudent && (
                    <div className="text-center py-20 text-slate-400">
                        <Search size={64} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-bold">Search for a student to begin</p>
                    </div>
                )}
            </div>
        </div>
    );
}
