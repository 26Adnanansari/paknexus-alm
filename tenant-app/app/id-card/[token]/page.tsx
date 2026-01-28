'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2, Download, Edit2, Save, Lock, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';

interface StudentData {
    student_id: string;
    full_name: string;
    admission_number: string;
    date_of_birth: string;
    gender: string;
    current_class: string;
    father_name: string;
    father_phone: string;
    photo_url?: string;
    status: string;
}

interface IDCardStatus {
    status: 'draft' | 'submitted' | 'locked' | 'appeal_pending' | 'unlocked_for_edit';
    is_editable: boolean;
    submission_count: number;
    card_id: string;
}

export default function IDCardReviewPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [student, setStudent] = useState<StudentData | null>(null);
    const [cardStatus, setCardStatus] = useState<IDCardStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [appealModal, setAppealModal] = useState(false);
    const [appealData, setAppealData] = useState({ reason: '', description: '' });

    const [editedData, setEditedData] = useState<Partial<StudentData>>({});

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const studentId = atob(token); // In production, use secure token validation

            // 1. Fetch Student
            const resStudent = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/${studentId}`);
            if (!resStudent.ok) throw new Error('Student not found');
            const dataStudent = await resStudent.json();
            setStudent(dataStudent);
            setEditedData(dataStudent);

            // 2. Fetch Card Status
            try {
                const resCard = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/id-cards/student/${studentId}`);
                if (resCard.ok) {
                    const dataCard = await resCard.json();
                    setCardStatus(dataCard);
                }
            } catch (e) { console.warn('No card found, assuming draft'); }

        } catch (err: any) {
            setError(err.message || 'Failed to load information');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!student) return;
        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/${student.student_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...student, ...editedData })
            });

            if (!res.ok) throw new Error('Failed to save changes');

            setStudent({ ...student, ...editedData });
            setEditing(false);
            toast.success('Changes saved successfully');
        } catch (err: any) {
            toast.error(err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitLock = async () => {
        if (!cardStatus) return;
        if (!confirm("Are you sure? This will LOCK your ID card for printing. You won't be able to edit it immediately.")) return;

        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/id-cards/${cardStatus.card_id}/submit`, {
                method: 'POST'
            });
            if (!res.ok) throw new Error('Failed to submit');

            toast.success('ID Card Submitted & Locked');
            fetchData(); // Refresh status
        } catch (e) { toast.error('Submission failed'); }
        finally { setSaving(false); }
    };

    const handleAppeal = async () => {
        if (!cardStatus) return;
        if (!appealData.reason || !appealData.description) return toast.error('Fill all fields');

        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/id-cards/appeals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: student?.student_id,
                    card_id: cardStatus.card_id,
                    appeal_reason: appealData.reason,
                    mistake_description: appealData.description
                })
            });
            if (!res.ok) throw new Error('Failed to submit appeal');

            toast.success('Appeal Submitted. Admin will review.');
            setAppealModal(false);
            fetchData();
        } catch (e) { toast.error('Failed to submit appeal'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
    if (error || !student) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    const isLocked = cardStatus && !cardStatus.is_editable;
    const isPending = cardStatus && cardStatus.status === 'appeal_pending';

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">ID Card Review</h1>
                    <div className="flex justify-center gap-2">
                        {isLocked ? (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                                <Lock size={14} /> Only View Allowed
                            </span>
                        ) : (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                                <Edit2 size={14} /> Edit Enabled
                            </span>
                        )}
                        {cardStatus?.status === 'appeal_pending' && (
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                                <Loader2 size={14} className="animate-spin" /> Appeal Pending
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Preview (Left) */}
                    <div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
                            <h3 className="font-bold text-slate-400 uppercase text-xs mb-4 text-center">Live Preview</h3>
                            {/* Card Mockup */}
                            <div className="aspect-[1.586/1] bg-gradient-to-br from-blue-700 to-indigo-900 rounded-xl relative overflow-hidden text-white shadow-xl mx-auto max-w-sm">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                                <div className="relative z-10 p-6 h-full flex flex-col">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm font-bold text-xl">
                                            {student.full_name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg leading-tight">School Name</p>
                                            <p className="text-xs text-blue-200 uppercase tracking-widest">Student Identity</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 flex-1">
                                        <div className="w-24 bg-white/10 rounded-lg backdrop-blur-sm">
                                            {student.photo_url ? <img src={student.photo_url} className="w-full h-full object-cover rounded-lg" /> : <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>}
                                        </div>
                                        <div className="flex-1 space-y-1 text-sm">
                                            <div>
                                                <p className="text-[10px] text-blue-200 uppercase">Name</p>
                                                <p className="font-bold truncate">{student.full_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-blue-200 uppercase">Class</p>
                                                <p className="font-bold">{student.current_class}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-blue-200 uppercase">ID No</p>
                                                <p className="font-mono">{student.admission_number}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-2 flex justify-between items-end">
                                        <div className="bg-white p-1 rounded">
                                            <QRCode value={`verify:${student.admission_number}`} size={48} />
                                        </div>
                                        <p className="text-[10px] text-blue-300">Valid until 2026</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions (Right) */}
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    Student Details
                                    {!isLocked && !editing && <button onClick={() => setEditing(true)} className="text-blue-600 text-sm hover:underline ml-auto">Edit Info</button>}
                                </h2>

                                <div className="space-y-4">
                                    {[
                                        { label: 'Full Name', key: 'full_name' },
                                        { label: 'Date of Birth', key: 'date_of_birth', type: 'date' },
                                        { label: 'Class', key: 'current_class' },
                                        { label: 'Father Name', key: 'father_name' },
                                        { label: 'Phone', key: 'father_phone' }
                                    ].map(field => (
                                        <div key={field.key}>
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">{field.label}</p>
                                            {editing ? (
                                                <input
                                                    type={field.type || 'text'}
                                                    className="w-full p-2 border rounded-lg"
                                                    value={((editedData as any)[field.key]) || ''}
                                                    onChange={e => setEditedData({ ...editedData, [field.key]: e.target.value })}
                                                />
                                            ) : (
                                                <p className="font-medium text-slate-900">{(student as any)[field.key] || '-'}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {editing && (
                                    <div className="flex gap-2 pt-2">
                                        <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
                                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSaveChanges} disabled={saving}>
                                            {saving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Submit / Appeal Area */}
                        {!isLocked ? (
                            <Button className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200" onClick={handleSubmitLock} disabled={saving || editing}>
                                {saving ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                                Approve & Finalize ID Card
                            </Button>
                        ) : (
                            <div className="bg-slate-100 p-6 rounded-xl border border-slate-200 text-center">
                                <Lock className="mx-auto text-slate-400 mb-2" size={32} />
                                <h3 className="font-bold text-slate-600">ID Card is Locked</h3>
                                <p className="text-slate-500 text-sm mb-4">You cannot edit details anymore. If you made a mistake, request a correction.</p>
                                {isPending ? (
                                    <div className="bg-amber-100 text-amber-800 p-3 rounded-lg text-sm font-bold">
                                        Appeal Under Review
                                    </div>
                                ) : (
                                    <Button onClick={() => setAppealModal(true)} variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50">
                                        Request Correction (Appeal)
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Appeal Modal */}
            <AnimatePresence>
                {appealModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold mb-4">Request Correction</h2>
                            <div className="space-y-3">
                                <input
                                    placeholder="Reason (e.g. Typo in Name)"
                                    className="w-full p-3 border rounded-xl font-bold"
                                    value={appealData.reason}
                                    onChange={e => setAppealData({ ...appealData, reason: e.target.value })}
                                />
                                <textarea
                                    placeholder="Describe the mistake and correct value..."
                                    className="w-full p-3 border rounded-xl h-32"
                                    value={appealData.description}
                                    onChange={e => setAppealData({ ...appealData, description: e.target.value })}
                                />
                                <div className="flex gap-2 pt-2">
                                    <Button variant="ghost" onClick={() => setAppealModal(false)} className="flex-1">Cancel</Button>
                                    <Button onClick={handleAppeal} className="flex-1 bg-amber-500 hover:bg-amber-600">Submit Appeal</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
