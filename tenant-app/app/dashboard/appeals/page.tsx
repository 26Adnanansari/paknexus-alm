'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import {
    CheckCircle, XCircle, Clock, AlertTriangle, Loader2,
    User, Calendar, FileText, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Appeal {
    appeal_id: string;
    student_id: string;
    full_name: string;
    admission_number: string;
    current_class?: string;
    appeal_reason: string;
    mistake_description: string;
    status: 'pending' | 'approved' | 'rejected';
    card_status: string;
    submission_count: number;
    submitted_at: string;
    hours_pending?: number;
    reviewed_by?: string;
    reviewed_at?: string;
    admin_notes?: string;
}

interface AppealStats {
    total_appeals: number;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    avg_review_time_hours?: number;
    oldest_pending_hours?: number;
}

export default function AppealsManagementPage() {
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [stats, setStats] = useState<AppealStats | null>(null);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [loading, setLoading] = useState(true);
    const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch appeals
            const appealsUrl = filter === 'all'
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/id-cards/appeals`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/id-cards/appeals?status=${filter}`;

            const appealsRes = await fetch(appealsUrl, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (appealsRes.ok) {
                const appealsData = await appealsRes.json();
                setAppeals(appealsData);
            }

            // Fetch stats
            const statsRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/id-cards/appeals/stats`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (error) {
            console.error('Failed to fetch appeals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (appealId: string, action: 'approve' | 'reject') => {
        setProcessing(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/id-cards/appeals/${appealId}/review`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        action,
                        admin_notes: reviewNotes
                    })
                }
            );

            if (!response.ok) throw new Error('Failed to review appeal');

            alert(`Appeal ${action}d successfully!`);
            setSelectedAppeal(null);
            setReviewNotes('');
            await fetchData();
        } catch (error: any) {
            alert(error.message || 'Failed to review appeal');
        } finally {
            setProcessing(false);
        }
    };

    // Stats Cards Component
    const StatsCards = () => {
        if (!stats) return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Appeals</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.total_appeals}</p>
                            </div>
                            <FileText className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Pending</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.pending_count}</p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-500" />
                        </div>
                        {stats.oldest_pending_hours && (
                            <p className="text-xs text-slate-500 mt-2">
                                Oldest: {Math.round(stats.oldest_pending_hours)}h ago
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Approved</p>
                                <p className="text-2xl font-bold text-green-600">{stats.approved_count}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Rejected</p>
                                <p className="text-2xl font-bold text-red-600">{stats.rejected_count}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // Appeal Card Component
    const AppealCard = ({ appeal }: { appeal: Appeal }) => {
        const statusColors = {
            pending: 'border-orange-200 bg-orange-50',
            approved: 'border-green-200 bg-green-50',
            rejected: 'border-red-200 bg-red-50'
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
            >
                <Card className={`border-2 ${statusColors[appeal.status]} hover:shadow-lg transition-shadow`}>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{appeal.full_name}</h3>
                                    <p className="text-sm text-slate-600">
                                        {appeal.admission_number} • {appeal.current_class || 'No Class'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${appeal.status === 'pending' ? 'bg-orange-200 text-orange-800' :
                                        appeal.status === 'approved' ? 'bg-green-200 text-green-800' :
                                            'bg-red-200 text-red-800'
                                    }`}>
                                    {appeal.status.toUpperCase()}
                                </span>
                                {appeal.hours_pending && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        {Math.round(appeal.hours_pending)}h ago
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">Appeal Reason:</p>
                                <p className="text-sm text-slate-900 bg-white p-3 rounded-lg border border-slate-200">
                                    {appeal.appeal_reason}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">Detailed Description:</p>
                                <p className="text-sm text-slate-900 bg-white p-3 rounded-lg border border-slate-200">
                                    {appeal.mistake_description}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-600">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(appeal.submitted_at).toLocaleDateString()}
                                </span>
                                <span>Submissions: {appeal.submission_count}</span>
                                <span>Card Status: {appeal.card_status}</span>
                            </div>

                            {appeal.admin_notes && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-blue-900 mb-1">Admin Notes:</p>
                                    <p className="text-sm text-blue-800">{appeal.admin_notes}</p>
                                </div>
                            )}
                        </div>

                        {appeal.status === 'pending' && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <Button
                                    onClick={() => setSelectedAppeal(appeal)}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    Review Appeal
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    // Review Modal Component
    const ReviewModal = () => {
        if (!selectedAppeal) return null;

        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedAppeal(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Review Appeal</h2>

                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h3 className="font-bold text-slate-900 mb-2">{selectedAppeal.full_name}</h3>
                                <p className="text-sm text-slate-600">
                                    {selectedAppeal.admission_number} • {selectedAppeal.current_class}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-2">Appeal Reason:</p>
                                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                                    {selectedAppeal.appeal_reason}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-700 mb-2">Detailed Description:</p>
                                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                                    {selectedAppeal.mistake_description}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Admin Notes (Optional)
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add notes about your decision..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    maxLength={1000}
                                />
                                <p className="text-xs text-slate-500 mt-1">{reviewNotes.length}/1000</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setSelectedAppeal(null)}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleReview(selectedAppeal.appeal_id, 'reject')}
                                disabled={processing}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                {processing ? (
                                    <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Processing...</>
                                ) : (
                                    <><XCircle className="h-4 w-4 mr-2" /> Reject</>
                                )}
                            </Button>
                            <Button
                                onClick={() => handleReview(selectedAppeal.appeal_id, 'approve')}
                                disabled={processing}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                {processing ? (
                                    <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Processing...</>
                                ) : (
                                    <><CheckCircle className="h-4 w-4 mr-2" /> Approve</>
                                )}
                            </Button>
                        </div>

                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-900">
                                <strong>Note:</strong> Approving will unlock the ID card for ONE MORE edit.
                                After re-submission, it will be permanently locked.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">ID Card Appeals Management</h1>
                    <p className="text-slate-600">Review and manage student ID card correction requests</p>
                </div>

                {/* Stats */}
                <StatsCards />

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${filter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            {status === 'pending' && stats && stats.pending_count > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                                    {stats.pending_count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Appeals List */}
                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-slate-600">Loading appeals...</p>
                    </div>
                ) : appeals.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <AlertTriangle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Appeals Found</h3>
                            <p className="text-slate-600">
                                {filter === 'pending'
                                    ? 'No pending appeals at the moment.'
                                    : `No ${filter} appeals found.`}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {appeals.map((appeal) => (
                            <AppealCard key={appeal.appeal_id} appeal={appeal} />
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            <ReviewModal />
        </div>
    );
}
