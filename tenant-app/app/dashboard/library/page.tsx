'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book, BookOpen, User, Plus, Search,
    Calendar, AlertCircle, CheckCircle, Repeat
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

// --- Types ---
interface BookItem {
    book_id: string;
    title: string;
    author: string;
    isbn: string;
    category: string;
    total_copies: number;
    available_copies: number;
    shelf_location: string;
}

interface Loan {
    transaction_id: string;
    student_name: string;
    admission_number: string;
    title: string;
    issued_date: string;
    due_date: string;
    status: string;
    is_overdue: boolean;
}

export default function LibraryPage() {
    const [activeTab, setActiveTab] = useState<'books' | 'loans'>('books');
    const [books, setBooks] = useState<BookItem[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modals
    const [isAddBookOpen, setIsAddBookOpen] = useState(false);
    const [isIssueOpen, setIsIssueOpen] = useState(false);

    // Forms
    const [bookForm, setBookForm] = useState({
        title: '', author: '', isbn: '', category: 'General',
        total_copies: 1, shelf_location: ''
    });

    const [issueForm, setIssueForm] = useState({
        student_id: '', book_id: '', days: 14
    });

    // Students Search (for issuing)
    const [studentSearch, setStudentSearch] = useState('');
    const [studentResults, setStudentResults] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'books') fetchBooks();
        else fetchLoans();
    }, [activeTab, search]);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/library/books', { params: { search } });
            setBooks(res.data);
        } catch (e) { toast.error('Failed to load books'); }
        finally { setLoading(false); }
    };

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const res = await api.get('/library/loans');
            setLoans(res.data);
        } catch (e) { toast.error('Failed to load loans'); }
        finally { setLoading(false); }
    };

    const handleAddBook = async () => {
        if (!bookForm.title) return toast.error('Title required');
        try {
            await api.post('/library/books', bookForm);
            toast.success('Book created');
            setIsAddBookOpen(false);
            setBookForm({ title: '', author: '', isbn: '', category: 'General', total_copies: 1, shelf_location: '' });
            fetchBooks();
        } catch (e) { toast.error('Failed to add book'); }
    };

    const handleSearchStudent = async (q: string) => {
        setStudentSearch(q);
        if (q.length > 2) {
            try {
                const res = await api.get('/students', { params: { search: q, limit: 5 } });
                setStudentResults(res.data);
            } catch (e) { }
        } else {
            setStudentResults([]);
        }
    };

    const handleIssue = async () => {
        if (!issueForm.student_id || !issueForm.book_id) return toast.error('Select student and book');
        try {
            await api.post('/library/issue', issueForm);
            toast.success('Book issued');
            setIsIssueOpen(false);
            fetchBooks(); // Update availability
        } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed to issue'); }
    };

    const handleReturn = async (txId: string) => {
        if (!confirm('Confirm return?')) return;
        try {
            const res = await api.post('/library/return', { transaction_id: txId, condition: 'Good' });
            if (res.data.fine > 0) toast.warning(`Returned with Fine: $${res.data.fine}`);
            else toast.success('Returned successfully');
            fetchLoans();
        } catch (e) { toast.error('Failed to return'); }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <BookOpen className="text-emerald-600" size={32} />
                            Library
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage catalog and circulation</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-white p-1 rounded-xl border border-slate-200 flex">
                            <button
                                onClick={() => setActiveTab('books')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'books' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Catalog
                            </button>
                            <button
                                onClick={() => setActiveTab('loans')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'loans' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Circulation
                            </button>
                        </div>
                        {activeTab === 'books' && (
                            <button onClick={() => setIsAddBookOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all">
                                <Plus size={18} /> Add Book
                            </button>
                        )}
                        {activeTab === 'loans' && (
                            <button onClick={() => setIsIssueOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
                                <Repeat size={18} /> Issue Book
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" /></div>
                ) : activeTab === 'books' ? (
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by Title, Author, ISBN..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-emerald-500"
                            />
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {books.map(book => (
                                <motion.div key={book.book_id} whileHover={{ y: -4 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                        <Book size={100} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{book.title}</h3>
                                        <p className="text-sm text-slate-500 mb-4">by {book.author}</p>

                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                            <div>
                                                <p className="text-xs text-slate-400 font-bold uppercase">Category</p>
                                                <p className="font-bold text-slate-700">{book.category}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 font-bold uppercase">Shelf</p>
                                                <p className="font-bold text-slate-700">{book.shelf_location || '-'}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                                            <div>
                                                <p className="text-xs text-slate-400 font-bold uppercase">Availability</p>
                                                <p className={`text-xl font-black ${book.available_copies > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {book.available_copies} <span className="text-sm text-slate-400 font-bold">/ {book.total_copies}</span>
                                                </p>
                                            </div>
                                            {book.available_copies > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setIssueForm(prev => ({ ...prev, book_id: book.book_id }));
                                                        setIsIssueOpen(true);
                                                    }}
                                                    className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-100"
                                                >
                                                    Issue
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Student</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Book</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Due Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loans.map(loan => (
                                    <tr key={loan.transaction_id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{loan.student_name}</div>
                                            <div className="text-xs text-slate-500 font-mono">{loan.admission_number}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">{loan.title}</td>
                                        <td className="px-6 py-4 font-mono text-sm">{new Date(loan.due_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            {loan.is_overdue ? (
                                                <span className="text-red-600 bg-red-50 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
                                                    <AlertCircle size={12} /> Overdue
                                                </span>
                                            ) : (
                                                <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit">
                                                    <Calendar size={12} /> On Time
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleReturn(loan.transaction_id)}
                                                className="text-emerald-600 font-bold hover:underline text-sm"
                                            >
                                                Return
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Book Modal */}
            <AnimatePresence>
                {isAddBookOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-3xl w-full max-w-lg">
                            <h2 className="text-2xl font-bold mb-4">Add Book</h2>
                            <div className="space-y-4">
                                <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Title" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} />
                                <input className="w-full p-3 bg-slate-50 border rounded-xl" placeholder="Author" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="p-3 bg-slate-50 border rounded-xl" placeholder="Category" value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })} />
                                    <input className="p-3 bg-slate-50 border rounded-xl" placeholder="Shelf Location" value={bookForm.shelf_location} onChange={e => setBookForm({ ...bookForm, shelf_location: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="p-3 bg-slate-50 border rounded-xl" placeholder="ISBN" value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })} />
                                    <input type="number" className="p-3 bg-slate-50 border rounded-xl" placeholder="Copies" value={bookForm.total_copies} onChange={e => setBookForm({ ...bookForm, total_copies: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsAddBookOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                                <button onClick={handleAddBook} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700">Save Book</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Issue Modal */}
            <AnimatePresence>
                {isIssueOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white p-6 rounded-3xl w-full max-w-lg h-[80vh] flex flex-col">
                            <h2 className="text-2xl font-bold mb-4">Issue Book</h2>

                            <div className="flex-1 space-y-6 overflow-y-auto">
                                {/* Student Search */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-1">Select Student</label>
                                    <input
                                        className="w-full p-3 bg-slate-50 border rounded-xl"
                                        placeholder="Start typing name..."
                                        value={studentSearch}
                                        onChange={e => handleSearchStudent(e.target.value)}
                                    />
                                    {studentResults.length > 0 && (
                                        <div className="mt-2 bg-white border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                            {studentResults.map(s => (
                                                <div
                                                    key={s.student_id}
                                                    onClick={() => {
                                                        setIssueForm({ ...issueForm, student_id: s.student_id });
                                                        setStudentSearch(s.full_name);
                                                        setStudentResults([]);
                                                    }}
                                                    className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                                                >
                                                    <div className="font-bold">{s.full_name}</div>
                                                    <div className="text-xs text-slate-500">{s.admission_number}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {issueForm.student_id && <div className="text-emerald-600 text-xs font-bold mt-1 flex items-center gap-1"><CheckCircle size={12} /> Student Selected</div>}
                                </div>

                                {/* Book ID */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-1">Book ID / Selection</label>
                                    <input
                                        className="w-full p-3 bg-slate-50 border rounded-xl font-mono"
                                        value={issueForm.book_id}
                                        onChange={e => setIssueForm({ ...issueForm, book_id: e.target.value })}
                                        placeholder="Paste Book UUID or Select from Catalog"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-1">Days</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-slate-50 border rounded-xl"
                                        value={issueForm.days}
                                        onChange={e => setIssueForm({ ...issueForm, days: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsIssueOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                                <button onClick={handleIssue} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Confirm Issue</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
