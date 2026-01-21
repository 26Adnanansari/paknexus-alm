'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Calendar, Check, X, Clock, Save, Scan, QrCode, Smartphone } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'sonner';

interface AttendanceRecord {
    student_id: string;
    full_name: string;
    current_class: string;
    status: 'present' | 'absent' | 'late';
    remarks?: string;
    check_in_time?: string;
}

export default function AttendancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [students, setStudents] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // Scanner State
    const [scannerMode, setScannerMode] = useState<'manual' | 'barcode' | 'face'>('manual');
    const [barcodeInput, setBarcodeInput] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);

    // Auto-focus barcode input when in barcode mode
    useEffect(() => {
        if (scannerMode === 'barcode' && barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, [scannerMode]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await api.get('/attendance', { params: { date } });
            setStudents(res.data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load attendance list.");
        } finally { setLoading(false); }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markStatus = (index: number, status: 'present' | 'absent' | 'late') => {
        const newStudents = [...students];
        newStudents[index].status = status;
        newStudents[index].check_in_time = new Date().toLocaleTimeString();
        setStudents(newStudents);
    };

    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput) return;

        // Logic to find student by barcode (assuming barcode = admission_number or student_id)
        // This simulates a scan action. In real app, we might need a separate lookup if data isn't loaded.
        // For now, let's search in the loaded list.
        const studentIndex = students.findIndex(s =>
            // Mock matching logic: check against ID or simulate checking a field
            // In a real scenario, this would likely be specific metadata
            s.student_id.includes(barcodeInput) || s.full_name.toLowerCase().includes(barcodeInput.toLowerCase())
        );

        if (studentIndex >= 0) {
            markStatus(studentIndex, 'present');
            toast.success(`Marked Present: ${students[studentIndex].full_name}`);
            setBarcodeInput(''); // Clear for next scan
        } else {
            toast.error(`Student not found for code: ${barcodeInput}`);
            setBarcodeInput('');
        }
    };

    const saveAttendance = async () => {
        try {
            const records = students.map(s => ({
                student_id: s.student_id,
                status: s.status || 'present',
                remarks: s.remarks,
                check_in_time: s.check_in_time
            }));

            await api.post('/attendance/batch', { date, records });
            toast.success('Attendance synced successfully');
        } catch (e) {
            console.error(e);
            toast.error('Failed to sync to cloud');
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900">
                        <Calendar className="h-8 w-8 text-blue-600" />
                        Smart Attendance
                    </h1>
                    <p className="text-slate-500 mt-1">Real-time tracking via manual, barcode, or face ID.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setScannerMode('manual')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${scannerMode === 'manual' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Manual List
                    </button>
                    <button
                        onClick={() => setScannerMode('barcode')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${scannerMode === 'barcode' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
                    >
                        <Scan size={16} /> Barcode Mode
                    </button>
                    <button
                        onClick={() => setScannerMode('face')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${scannerMode === 'face' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-purple-600 hover:bg-purple-50'}`}
                    >
                        <Smartphone size={16} /> Face ID
                    </button>
                </div>
            </div>

            {/* Scanner Area */}
            {scannerMode === 'barcode' && (
                <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-200 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                        <QrCode size={48} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">Ready to Scan</h3>
                        <p className="text-blue-100">Ensure cursor is focused below and use your handheld scanner.</p>
                    </div>
                    <form onSubmit={handleBarcodeSubmit} className="w-full max-w-md relative">
                        <input
                            ref={barcodeInputRef}
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            className="w-full px-6 py-4 rounded-xl text-slate-900 font-mono text-lg font-bold outline-none ring-4 ring-white/20 focus:ring-white/40 transition-all placeholder:text-slate-300"
                            placeholder="Scan Barcode here..."
                            autoFocus
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
                            Code 128
                        </div>
                    </form>
                </div>
            )}

            {scannerMode === 'face' && (
                <div className="bg-purple-900 rounded-3xl p-8 text-white shadow-lg shadow-purple-200 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/demo/image/upload/v1675704176/samples/ecommerce/accessories-bag.jpg')] opacity-10 bg-cover bg-center blur-sm" />

                    <div className="relative z-10 w-full max-w-md aspect-video bg-black rounded-2xl border-4 border-white/20 shadow-2xl overflow-hidden flex items-center justify-center">
                        {/* Placeholder for camera stream */}
                        <Smartphone size={64} className="text-white/50 animate-pulse" />
                        <p className="absolute bottom-4 text-sm font-medium text-white/70">Initializing Camera Module...</p>

                        {/* Face Detection Overlay Simulation */}
                        <div className="absolute inset-0 border-2 border-green-400/50 m-12 rounded-lg animate-pulse" />
                        <div className="absolute top-4 left-4 bg-green-500/80 px-2 py-1 rounded text-[10px] font-bold">FACE_DETECT_ACTIVE</div>
                    </div>

                    <div className="relative z-10 space-y-2">
                        <h3 className="text-xl font-bold">Mobile Face Recognition</h3>
                        <p className="text-purple-200 text-sm max-w-xs mx-auto">
                            Point camera at student. AI will auto-mark attendance upon high-confidence match.
                        </p>
                        <Button variant="secondary" className="mt-4">Start Capture Session</Button>
                    </div>
                </div>
            )}


            {/* Main List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-slate-500 uppercase tracking-wider">Date Log:</span>
                        <input
                            type="date"
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                        <span>Present: <b className="text-green-600">{students.filter(s => s.status === 'present').length}</b></span>
                        <span>Absent: <b className="text-red-500">{students.filter(s => s.status === 'absent').length}</b></span>
                        <Button size="sm" onClick={saveAttendance} className="bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all active:scale-95">
                            <Save className="h-4 w-4 mr-2" />
                            Sync Cloud
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Student Name</th>
                                <th className="px-6 py-4">Class</th>
                                <th className="px-6 py-4 text-center">Check-in Time</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-500">Syncing roster...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-500">No records found for this date.</td></tr>
                            ) : (
                                students.map((student, idx) => (
                                    <tr key={student.student_id} className={`transition-colors ${student.status === 'present' ? 'bg-green-50/30' : 'hover:bg-slate-50'}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{student.full_name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{student.student_id.split('-')[0]}...</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{student.current_class}</td>
                                        <td className="px-6 py-4 text-center font-mono text-xs text-slate-600">
                                            {student.check_in_time || '--:--'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center bg-white border border-slate-200 rounded-lg p-1 w-fit mx-auto shadow-sm">
                                                {[
                                                    { id: 'present', icon: Check, color: 'text-green-600', activeBg: 'bg-green-100 shadow-inner' },
                                                    { id: 'absent', icon: X, color: 'text-red-500', activeBg: 'bg-red-100 shadow-inner' },
                                                    { id: 'late', icon: Clock, color: 'text-orange-500', activeBg: 'bg-orange-100 shadow-inner' },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => markStatus(idx, opt.id as any)}
                                                        className={`p-1.5 rounded-md transition-all mx-0.5 ${(student.status || 'present') === opt.id ? opt.activeBg : 'hover:bg-slate-100 text-slate-300'
                                                            }`}
                                                        title={opt.id}
                                                    >
                                                        <opt.icon className={`h-4 w-4 ${(student.status || 'present') === opt.id ? opt.color : ''}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                className="w-full bg-transparent border-b border-transparent focus:border-blue-300 outline-none text-sm placeholder:text-slate-300 transition-colors"
                                                placeholder="Add note..."
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
        </div>
    );
}
