'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Receipt, DollarSign, CreditCard, History, AlertCircle, Settings,
    Plus, Check, Loader2, Search, FileText, Zap, GraduationCap
} from 'lucide-react';
import api from '@/lib/api';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'sonner';

export default function FeesPage() {
    const [activeTab, setActiveTab] = useState<'structure' | 'generate' | 'collect'>('collect');
    const [isSystemReady, setIsSystemReady] = useState(true);
    const [initializing, setInitializing] = useState(false);

    useEffect(() => { checkSystem(); }, []);

    const checkSystem = async () => {
        try {
            await api.get('/fees/heads');
            setIsSystemReady(true);
        } catch (error: any) {
            console.warn("Fee system check failed", error);
            setIsSystemReady(false);
        }
    };

    const initializeSystem = async () => {
        setInitializing(true);
        try {
            await api.post('/fees/system/init-tables');
            toast.success("Fee System Initialized Successfully!");
            setIsSystemReady(true);
        } catch {
            toast.error("Failed to initialize system.");
        } finally {
            setInitializing(false);
        }
    };

    if (!isSystemReady) {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                <div className="bg-blue-50 p-6 rounded-full mb-6">
                    <Settings className="h-12 w-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Setup Fee Management</h2>
                <p className="text-slate-500 mb-8">Initialize database tables to start tracking fees.</p>
                <button onClick={initializeSystem} disabled={initializing} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2">
                    {initializing ? <Loader2 className="animate-spin" /> : <Check />}
                    Initialize System
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fee Management</h1>
                    <p className="text-slate-500">Manage structure, invoices, and payments.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
                    <TabButton active={activeTab === 'collect'} onClick={() => setActiveTab('collect')} label="Collection" icon={CreditCard} />
                    <TabButton active={activeTab === 'generate'} onClick={() => setActiveTab('generate')} label="Operations" icon={Zap} />
                    <TabButton active={activeTab === 'structure'} onClick={() => setActiveTab('structure')} label="Structure & Rules" icon={Settings} />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'collect' && <CollectionTab key="collect" />}
                {activeTab === 'generate' && <InvoicingTab key="generate" />}
                {activeTab === 'structure' && <StructureTab key="structure" />}
            </AnimatePresence>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
        >
            <Icon size={16} />
            <span>{label}</span>
        </button>
    );
}

// --- SUB COMPONENTS ---

function StructureTab() {
    const [heads, setHeads] = useState<any[]>([]);
    const [newHead, setNewHead] = useState('');
    const [classes] = useState(['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']);
    const [selectedClass, setSelectedClass] = useState('Grade 1');
    const [classFee, setClassFee] = useState({ head_id: '', amount: '' });
    const [structure, setStructure] = useState<any[]>([]);

    // Scholarship State
    const [scholarship, setScholarship] = useState({ student_search: '', student_id: '', percent: '', type: 'merit' });
    const [stuResults, setStuResults] = useState<any[]>([]);

    useEffect(() => { loadHeads(); }, []);
    useEffect(() => { if (selectedClass) loadStructure(selectedClass); }, [selectedClass]);

    const loadHeads = async () => {
        try {
            const res = await api.get('/fees/heads');
            setHeads(res.data);
            if (res.data.length > 0) setClassFee(prev => ({ ...prev, head_id: res.data[0].head_id }));
        } catch (e) { console.error(e); }
    };

    const loadStructure = async (cls: string) => {
        try {
            const res = await api.get(`/fees/structure/${cls}`);
            setStructure(res.data);
        } catch (e) { console.error(e); }
    };

    const addHead = async () => {
        if (!newHead.trim()) return;
        await api.post('/fees/heads', { head_name: newHead });
        setNewHead('');
        loadHeads();
        toast.success("Fee Head Added");
    };

    const updateStructure = async () => {
        if (!classFee.head_id || !classFee.amount) return;
        await api.post('/fees/structure', {
            class_name: selectedClass,
            fee_head_id: classFee.head_id,
            amount: parseFloat(classFee.amount),
            frequency: 'monthly'
        });
        toast.success("Fee Updated");
        loadStructure(selectedClass);
        setClassFee({ ...classFee, amount: '' });
    };

    const searchStudentForScholarship = async (q: string) => {
        setScholarship({ ...scholarship, student_search: q });
        if (q.length > 2) {
            const res = await api.get('/students', { params: { search: q } });
            setStuResults(res.data);
        } else {
            setStuResults([]);
        }
    };

    const assignScholarship = async () => {
        if (!scholarship.student_id || !scholarship.percent) return;
        await api.post('/fees/scholarship', {
            student_id: scholarship.student_id,
            discount_percent: parseFloat(scholarship.percent),
            type: scholarship.type
        });
        toast.success("Scholarship Assigned!");
        setScholarship({ student_search: '', student_id: '', percent: '', type: 'merit' });
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={18} /> Define Fee Heads</h3>
                    <div className="flex gap-2 mb-4">
                        <input className="flex-1 px-3 py-2 border rounded-lg" placeholder="e.g. Tuition Fee, Exam Fee" value={newHead} onChange={e => setNewHead(e.target.value)} />
                        <button onClick={addHead} className="bg-slate-900 text-white px-4 rounded-lg font-medium">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {heads.map((h: any) => (
                            <span key={h.head_id} className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 border border-slate-200">{h.head_name}</span>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><GraduationCap size={18} /> Assign Scholarship</h3>
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-xs font-bold mb-1">Student</label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Search Name..."
                                value={scholarship.student_search}
                                onChange={e => searchStudentForScholarship(e.target.value)}
                            />
                            {stuResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-xl rounded-lg mt-1 z-10 max-h-40 overflow-y-auto">
                                    {stuResults.map(s => (
                                        <div key={s.student_id} onClick={() => { setScholarship({ ...scholarship, student_id: s.student_id, student_search: s.full_name }); setStuResults([]); }} className="p-2 hover:bg-blue-50 cursor-pointer text-sm">
                                            {s.full_name} ({s.current_class})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold mb-1">Discount %</label>
                                <input type="number" max="100" className="w-full px-3 py-2 border rounded-lg" value={scholarship.percent} onChange={e => setScholarship({ ...scholarship, percent: e.target.value })} placeholder="0-100" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold mb-1">Type</label>
                                <select className="w-full px-3 py-2 border rounded-lg" value={scholarship.type} onChange={e => setScholarship({ ...scholarship, type: e.target.value })}>
                                    <option value="merit">Merit</option>
                                    <option value="need">Need Based</option>
                                    <option value="staff_child">Staff Child</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={assignScholarship} className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold">Assign Discount</button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit">
                <h3 className="font-bold text-lg mb-4">Class Fee Structure</h3>
                <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Class</label>
                        <select className="w-full p-2 border rounded-lg" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-xs font-medium mb-1">Fee Head</label>
                            <select className="w-full p-2 border rounded-lg text-sm bg-white" value={classFee.head_id} onChange={e => setClassFee({ ...classFee, head_id: e.target.value })}>
                                {heads.map((h: any) => <option key={h.head_id} value={h.head_id}>{h.head_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Amount</label>
                            <input className="w-full p-2 border rounded-lg text-sm" type="number" placeholder="0.00" value={classFee.amount} onChange={e => setClassFee({ ...classFee, amount: e.target.value })} />
                        </div>
                    </div>
                    <button onClick={updateStructure} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Set Monthly Fee</button>
                </div>

                <div>
                    <h4 className="font-bold text-sm mb-2 text-slate-500">Current Fees for {selectedClass}</h4>
                    {structure.length === 0 ? <p className="text-slate-400 text-sm">No fees set.</p> : (
                        <div className="space-y-2">
                            {structure.map((s: any) => (
                                <div key={s.structure_id} className="flex justify-between p-3 bg-white border border-slate-100 rounded-lg text-sm shadow-sm">
                                    <span>{s.head_name}</span>
                                    <span className="font-bold text-slate-900">${s.amount} <span className="text-xs text-slate-400 font-normal">/mo</span></span>
                                </div>
                            ))}
                            <div className="flex justify-between p-3 bg-blue-50 text-blue-800 rounded-lg text-sm font-bold mt-2">
                                <span>Total Monthly</span>
                                <span>${structure.reduce((sum, item) => sum + parseFloat(item.amount), 0)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function InvoicingTab() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [loading, setLoading] = useState(false);

    // Ad-hoc
    const [adhoc, setAdhoc] = useState({ target_type: 'class', target_id: 'Grade 1', fee_head_id: '', amount: '', due_date: '', remarks: '' });
    const [heads, setHeads] = useState<any[]>([]);
    const [classes] = useState(['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);

    useEffect(() => {
        api.get('/fees/heads').then(res => {
            setHeads(res.data);
            if (res.data.length > 0) setAdhoc(prev => ({ ...prev, fee_head_id: res.data[0].head_id }));
        });
    }, []);

    const generate = async () => {
        setLoading(true);
        try {
            const res = await api.post('/fees/generate', {
                month_year: month,
                due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().slice(0, 10)
            });
            toast.success(res.data.message);
        } catch (e: any) {
            toast.error("Generation failed: " + (e.response?.data?.detail || e.message));
        } finally {
            setLoading(false);
        }
    };

    const assignAdhoc = async () => {
        if (!adhoc.amount || !adhoc.due_date) return;
        try {
            const res = await api.post('/fees/assign-adhoc', adhoc);
            toast.success(res.data.message);
        } catch (e: any) {
            toast.error("Failed to assign fee");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-2xl border border-slate-200">
                <FileText className="w-12 h-12 text-blue-100 bg-blue-50 p-2 rounded-xl mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Monthly Invoices</h2>
                <p className="text-slate-500 mb-6 text-sm">Generate repeating class invoices for all active students.</p>

                <div className="flex gap-4 items-center mb-6">
                    <input type="month" className="flex-1 p-3 border rounded-xl" value={month} onChange={e => setMonth(e.target.value)} />
                </div>

                <button
                    onClick={generate}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70"
                >
                    {loading ? 'Processing...' : 'Generate Batch Invoices'}
                </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-2xl border border-slate-200">
                <Zap className="w-12 h-12 text-purple-100 bg-purple-50 p-2 rounded-xl mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Ad-hoc Fees</h2>
                <p className="text-slate-500 mb-6 text-sm">Assign Picnic, Event, or Admission fees.</p>

                <div className="space-y-3">
                    <div className="flex gap-2">
                        <select className="p-2 border rounded-lg flex-1" value={adhoc.target_type} onChange={e => setAdhoc({ ...adhoc, target_type: e.target.value })}>
                            <option value="class">Whole Class</option>
                            <option value="student">One Student (ID)</option>
                        </select>
                        {adhoc.target_type === 'class' ? (
                            <select className="p-2 border rounded-lg flex-1" value={adhoc.target_id} onChange={e => setAdhoc({ ...adhoc, target_id: e.target.value })}>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        ) : (
                            <input className="p-2 border rounded-lg flex-1" placeholder="Student ID" value={adhoc.target_id} onChange={e => setAdhoc({ ...adhoc, target_id: e.target.value })} />
                        )}
                    </div>

                    <div className="flex gap-2">
                        <select className="p-2 border rounded-lg flex-1" value={adhoc.fee_head_id} onChange={e => setAdhoc({ ...adhoc, fee_head_id: e.target.value })}>
                            {heads.map((h: any) => <option key={h.head_id} value={h.head_id}>{h.head_name}</option>)}
                        </select>
                        <input className="p-2 border rounded-lg w-24" type="number" placeholder="$ Amount" value={adhoc.amount} onChange={e => setAdhoc({ ...adhoc, amount: e.target.value })} />
                    </div>

                    <div className="flex gap-2">
                        <input type="date" className="p-2 border rounded-lg flex-1" value={adhoc.due_date} onChange={e => setAdhoc({ ...adhoc, due_date: e.target.value })} />
                        <input className="p-2 border rounded-lg flex-1" placeholder="Remarks (opt)" value={adhoc.remarks} onChange={e => setAdhoc({ ...adhoc, remarks: e.target.value })} />
                    </div>

                    <button
                        onClick={assignAdhoc}
                        className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all"
                    >
                        Assign Fee
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function CollectionTab() {
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [payData, setPayData] = useState({ amount: '', method: 'cash', remarks: '', invoice_id: '' });
    const [openPayModal, setOpenPayModal] = useState(false);

    const doSearch = async () => {
        if (!search) return;
        const res = await api.get('/students', { params: { search } });
        setStudents(res.data);
    };

    const selectStudent = async (stu: any) => {
        setSelectedStudent(stu);
        setStudents([]);
        loadInvoices(stu.student_id);
    };

    const loadInvoices = async (id: string) => {
        try {
            const res = await api.get(`/fees/invoices/${id}`);
            setInvoices(res.data);
        } catch (e) { console.error(e); }
    };

    const initiatePay = (inv: any) => {
        const pending = inv.payable_amount - inv.paid_amount;
        setPayData({ amount: pending.toString(), method: 'cash', remarks: '', invoice_id: inv.invoice_id });
        setOpenPayModal(true);
    };

    const submitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/fees/collect', {
                invoice_id: payData.invoice_id,
                amount: parseFloat(payData.amount),
                method: payData.method,
                remarks: payData.remarks
            });
            toast.success("Payment Recorded!");
            setOpenPayModal(false);
            loadInvoices(selectedStudent.student_id);
        } catch (e: any) {
            toast.error("Payment failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input
                            className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                            placeholder="Search by name or admission ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && doSearch()}
                        />
                    </div>
                    <button onClick={doSearch} className="bg-slate-900 text-white px-6 rounded-xl font-bold">Search</button>
                </div>

                {students.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {students.map(s => (
                            <div key={s.student_id} onClick={() => selectStudent(s)} className="p-3 hover:bg-blue-50 cursor-pointer border rounded-lg flex justify-between items-center group">
                                <div>
                                    <p className="font-bold">{s.full_name}</p>
                                    <p className="text-xs text-slate-500">{s.admission_number} • {s.current_class}</p>
                                </div>
                                <Plus className="text-blue-600 opacity-0 group-hover:opacity-100" size={16} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedStudent && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="font-bold text-lg">{selectedStudent.full_name}'s Dues</h3>
                        <button onClick={() => setSelectedStudent(null)} className="text-sm text-slate-500 hover:text-red-500">Clear</button>
                    </div>

                    <div className="space-y-3">
                        {invoices.length === 0 ? <p className="text-center text-slate-400 py-8">No invoices found.</p> :
                            invoices.map(inv => {
                                const pending = inv.payable_amount - inv.paid_amount;
                                return (
                                    <div key={inv.invoice_id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div>
                                            <div className="flex gap-2 items-center mb-1">
                                                <span className="font-bold text-lg">{inv.month_year}</span>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span>
                                            </div>
                                            <p className="text-sm text-slate-500">Total: ${inv.total_amount} - Scholarship: ${inv.scholarship_amount}</p>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <p className="text-xs text-slate-400 font-bold uppercase">Balance Due</p>
                                                <p className={`text-xl font-black ${pending > 0 ? 'text-red-600' : 'text-green-600'}`}>${pending.toFixed(2)}</p>
                                            </div>
                                            {pending > 0 && (
                                                <button onClick={() => initiatePay(inv)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700">Pay Now</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </motion.div>
            )}

            <AnimatePresence>
                {openPayModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.form
                            onSubmit={submitPayment}
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl"
                        >
                            <h3 className="font-bold text-lg mb-4">Record Payment</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Amount</label>
                                    <input className="w-full p-2 border rounded-lg text-lg font-mono" type="number" required value={payData.amount} onChange={e => setPayData({ ...payData, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Method</label>
                                    <select className="w-full p-2 border rounded-lg" value={payData.method} onChange={e => setPayData({ ...payData, method: e.target.value })}>
                                        <option value="cash">Cash</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="online">Online Transfer</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setOpenPayModal(false)} className="flex-1 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700">Confirm Payment</button>
                                </div>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
