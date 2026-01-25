'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2, Download, Edit2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';

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

export default function IDCardReviewPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [approved, setApproved] = useState(false);

    const [editedData, setEditedData] = useState<Partial<StudentData>>({});

    useEffect(() => {
        fetchStudentData();
    }, [token]);

    const fetchStudentData = async () => {
        setLoading(true);
        try {
            // Decode token to get student ID (in real app, backend would validate token)
            const studentId = atob(token);

            // Fetch student data from API
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // In real app, this would be a special token
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch student data');
            }

            const data = await response.json();
            setStudent(data);
            setEditedData(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load student information');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!student) return;

        setSaving(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/${student.student_id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editedData)
            });

            if (!response.ok) {
                throw new Error('Failed to save changes');
            }

            setStudent({ ...student, ...editedData });
            setEditing(false);
            alert('Changes saved successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async () => {
        if (!student) return;

        setSaving(true);
        try {
            // Mark as approved in backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/${student.student_id}/approve-id-card`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to approve ID card');
            }

            setApproved(true);
            alert('ID Card approved! The school will process your ID card.');
        } catch (err: any) {
            alert(err.message || 'Failed to approve');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading student information...</p>
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
                        Please review the information below. You can request changes if needed.
                    </p>
                </motion.div>

                {approved && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center"
                    >
                        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-green-900 mb-2">ID Card Approved!</h3>
                        <p className="text-green-700">
                            Thank you for confirming. Your ID card will be printed and ready for collection soon.
                        </p>
                    </motion.div>
                )}

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

                                    {/* Student Photo Placeholder */}
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
                                {!editing && !approved && (
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
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Full Name</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={editedData.full_name || ''}
                                            onChange={(e) => setEditedData({ ...editedData, full_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <p className="text-slate-900">{student.full_name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Admission Number</label>
                                    <p className="text-slate-900 font-mono">{student.admission_number}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Date of Birth</label>
                                    {editing ? (
                                        <input
                                            type="date"
                                            value={editedData.date_of_birth || ''}
                                            onChange={(e) => setEditedData({ ...editedData, date_of_birth: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <p className="text-slate-900">{student.date_of_birth}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Gender</label>
                                    <p className="text-slate-900">{student.gender}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Class</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={editedData.current_class || ''}
                                            onChange={(e) => setEditedData({ ...editedData, current_class: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <p className="text-slate-900">{student.current_class || 'Not assigned'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Father's Name</label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={editedData.father_name || ''}
                                            onChange={(e) => setEditedData({ ...editedData, father_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <p className="text-slate-900">{student.father_name || 'N/A'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1 block">Father's Phone</label>
                                    {editing ? (
                                        <input
                                            type="tel"
                                            value={editedData.father_phone || ''}
                                            onChange={(e) => setEditedData({ ...editedData, father_phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <p className="text-slate-900">{student.father_phone || 'N/A'}</p>
                                    )}
                                </div>

                                {editing && (
                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            onClick={() => setEditing(false)}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSaveChanges}
                                            disabled={saving}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                                        >
                                            {saving ? (
                                                <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...</>
                                            ) : (
                                                <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {!editing && !approved && (
                                    <Button
                                        onClick={handleApprove}
                                        disabled={saving}
                                        className="w-full bg-green-600 hover:bg-green-700 mt-6"
                                    >
                                        {saving ? (
                                            <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Processing...</>
                                        ) : (
                                            <><CheckCircle className="h-4 w-4 mr-2" /> Approve ID Card</>
                                        )}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Download Option */}
                {approved && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 text-center"
                    >
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            size="lg"
                        >
                            <Download className="h-5 w-5 mr-2" />
                            Download ID Card (PDF)
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
