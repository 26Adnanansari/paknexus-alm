'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    CheckCircle, AlertCircle, Loader2, Download, Edit2, Save,
    Lock, Unlock, AlertTriangle, Clock, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';

interface IDCardStatus {
    card_id: string;
    status: 'draft' | 'submitted' | 'locked' | 'appeal_pending' | 'unlocked_for_edit';
    is_editable: boolean;
    submission_count: number;
    last_submitted_at?: string;
    can_submit: boolean;
    can_appeal: boolean;
    appeal_pending: boolean;
}

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
}

export default function IDCardReviewPage() {
    const params = useParams();
    const token = params.token as string;

    const [student, setStudent] = useState<StudentData | null>(null);
    const [cardStatus, setCardStatus] = useState<IDCardStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAppealModal, setShowAppealModal] = useState(false);

    const [editedData, setEditedData] = useState<Partial<StudentData>>({});

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Decode token to get student/card ID
            const studentId = atob(token);

            // Fetch student data
            const studentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/${studentId}`);
            if (!studentRes.ok) throw new Error('Failed to fetch student data');
            const studentData = await studentRes.json();
            setStudent(studentData);
            setEditedData(studentData);

            // Fetch ID card status
            const cardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/id-cards/student/${studentId}`);
            if (cardRes.ok) {
                const cardData = await cardRes.json();
                const statusRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/id-cards/${cardData.card_id}/status`);
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    setCardStatus(statusData);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!cardStatus) return;

        setSaving(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/id-cards/${cardStatus.card_id}/submit`,
                { method: 'POST' }
            );

            if (!response.ok) throw new Error('Failed to submit ID card');

            alert('ID Card submitted successfully! It is now locked for review.');
            await fetchData(); // Refresh status
        } catch (err: any) {
            alert(err.message || 'Failed to submit');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!student) return;

        setSaving(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/${student.student_id}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editedData)
                }
            );

            if (!response.ok) throw new Error('Failed to save changes');

            setStudent({ ...student, ...editedData });
            setEditing(false);
            alert('Changes saved successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    // Status Badge Component
    const StatusBadge = () => {
        if (!cardStatus) return null;

        const statusConfig = {
            draft: { icon: Edit2, color: 'blue', text: 'Draft - Editable' },
            submitted: { icon: Clock, color: 'yellow', text: 'Submitted - Under Review' },
            locked: { icon: Lock, color: 'red', text: 'Locked - No Changes Allowed' },
            appeal_pending: { icon: AlertTriangle, color: 'orange', text: 'Appeal Pending' },
            unlocked_for_edit: { icon: Unlock, color: 'green', text: 'Unlocked - Edit Now' }
        };

        const config = statusConfig[cardStatus.status];
        const Icon = config.icon;

        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-${config.color}-50 border border-${config.color}-200 rounded-xl p-4 mb-6 flex items-center gap-3`}
            >
                <Icon className={`h-6 w-6 text-${config.color}-600`} />
                <div className="flex-1">
                    <h3 className={`font-bold text-${config.color}-900`}>{config.text}</h3>
                    <p className={`text-sm text-${config.color}-700`}>
                        Submissions: {cardStatus.submission_count} |
                        {cardStatus.last_submitted_at && ` Last: ${new Date(cardStatus.last_submitted_at).toLocaleDateString()}`}
                    </p>
                </div>
            </motion.div>
        );
    };

    // Appeal Modal Component
    const AppealModal = () => {
        const [appealReason, setAppealReason] = useState('');
        const [mistakeDescription, setMistakeDescription] = useState('');
        const [submitting, setSubmitting] = useState(false);

        const handleSubmitAppeal = async () => {
            if (!cardStatus || !student) return;
            if (appealReason.length < 10 || mistakeDescription.length < 10) {
                alert('Please provide detailed reason and description (minimum 10 characters each)');
                return;
            }

            setSubmitting(true);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/id-cards/appeals`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            student_id: student.student_id,
                            card_id: cardStatus.card_id,
                            appeal_reason: appealReason,
                            mistake_description: mistakeDescription
                        })
                    }
                );

                if (!response.ok) throw new Error('Failed to submit appeal');

                alert('Appeal submitted successfully! An admin will review it soon.');
                setShowAppealModal(false);
                await fetchData();
            } catch (err: any) {
                alert(err.message || 'Failed to submit appeal');
            } finally {
                setSubmitting(false);
            }
        };

        return (
            <AnimatePresence>
                {showAppealModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowAppealModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 max-w-md w-full"
                        >
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Request Correction</h2>
                            <p className="text-slate-600 mb-4">
                                Found a mistake? Submit an appeal and an admin will review it.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Appeal Reason (Brief)
                                    </label>
                                    <input
                                        type="text"
                                        value={appealReason}
                                        onChange={(e) => setAppealReason(e.target.value)}
                                        placeholder="e.g., Wrong date of birth"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">{appealReason.length}/500</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Detailed Description
                                    </label>
                                    <textarea
                                        value={mistakeDescription}
                                        onChange={(e) => setMistakeDescription(e.target.value)}
                                        placeholder="Explain the mistake and what needs to be corrected..."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                        maxLength={1000}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">{mistakeDescription.length}/1000</p>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={() => setShowAppealModal(false)}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmitAppeal}
                                        disabled={submitting || appealReason.length < 10 || mistakeDescription.length < 10}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {submitting ? (
                                            <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Submitting...</>
                                        ) : (
                                            'Submit Appeal'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading ID card information...</p>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
                        <p className="text-red-700">{error || 'Student not found'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Student ID Card Review</h1>
                    <p className="text-slate-600">
                        Review your information carefully before submitting.
                    </p>
                </motion.div>

                {/* Status Badge */}
                <StatusBadge />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ID Card Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Card className="overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                                <h2 className="text-lg font-bold">ID Card Preview</h2>
                            </div>
                            <CardContent className="p-6">
                                <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-lg">
                                    {/* School Logo Area */}
                                    <div className="text-center mb-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="text-2xl font-bold text-blue-600">
                                                {student.full_name.charAt(0)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900">School Name</h3>
                                        <p className="text-xs text-slate-500">Student ID Card</p>
                                    </div>

                                    {/* Student Photo */}
                                    <div className="w-32 h-32 bg-slate-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                                        {student.photo_url ? (
                                            <img src={student.photo_url} alt="Student" className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <span className="text-4xl text-slate-400">👤</span>
                                        )}
                                    </div>

                                    {/* Student Details */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Name:</span>
                                            <span className="font-semibold text-slate-900">{student.full_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">ID No:</span>
                                            <span className="font-mono font-semibold text-slate-900">{student.admission_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Class:</span>
                                            <span className="font-semibold text-slate-900">{student.current_class || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">DOB:</span>
                                            <span className="font-semibold text-slate-900">{student.date_of_birth}</span>
                                        </div>
                                    </div>

                                    {/* QR Code */}
                                    <div className="mt-4 p-3 bg-white border border-slate-200 rounded-lg flex justify-center">
                                        <QRCode
                                            value={`${process.env.NEXT_PUBLIC_APP_URL}/verify/${student.admission_number}`}
                                            size={80}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Student Information Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Card>
                            <div className="bg-slate-100 p-4 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-900">Student Information</h2>
                                {cardStatus?.is_editable && !editing && (
                                    <Button
                                        onClick={() => setEditing(true)}
                                        variant="outline"
                                        size="sm"
                                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    >
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                )}
                            </div>
                            <CardContent className="p-6 space-y-4">
                                {/* Form fields - same as before but with editing logic */}
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Full Name</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={editedData.full_name || ''}
                                            onChange={(e) => setEditedData({ ...editedData, full_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-slate-900">{student.full_name}</p>
                                    )}
                                </div>

                                {/* Other fields... (abbreviated for brevity) */}

                                {/* Action Buttons */}
                                {editing && (
                                    <div className="flex gap-2 pt-4">
                                        <Button onClick={() => setEditing(false)} variant="outline" className="flex-1">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSaveChanges}
                                            disabled={saving}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                                        >
                                            {saving ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save</>}
                                        </Button>
                                    </div>
                                )}

                                {/* Submit Button */}
                                {cardStatus?.can_submit && !editing && (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="w-full bg-green-600 hover:bg-green-700 mt-6"
                                    >
                                        {saving ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Submitting...</> : <><CheckCircle className="h-4 w-4 mr-2" /> Submit ID Card</>}
                                    </Button>
                                )}

                                {/* Appeal Button */}
                                {cardStatus?.can_appeal && !editing && (
                                    <Button
                                        onClick={() => setShowAppealModal(true)}
                                        variant="outline"
                                        className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 mt-4"
                                    >
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Request Correction
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Appeal Modal */}
            <AppealModal />
        </div>
    );
}
