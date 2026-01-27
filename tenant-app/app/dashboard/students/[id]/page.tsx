'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    User, FileText, Calendar, DollarSign, GraduationCap,
    Upload, Trash2, ExternalLink, ArrowLeft, Loader2, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import PhotoUpload from '@/components/PhotoUpload';

export default function StudentProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { id } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Documents State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [documents, setDocuments] = useState<any[]>([]);
    const [docLoading, setDocLoading] = useState(false);
    const [newDoc, setNewDoc] = useState({ title: '', url: '', doc_type: 'other' });
    const [uploadingDoc, setUploadingDoc] = useState(false);

    useEffect(() => {
        fetchStudent();
        fetchDocuments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchStudent = async () => {
        try {
            const res = await api.get(`/students/${id}`);
            setStudent(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load student profile");
            router.push('/dashboard/students');
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async () => {
        try {
            setDocLoading(true);
            const res = await api.get(`/students/${id}/documents`);
            setDocuments(res.data);
        } catch (error) {
            console.error("Failed to load documents", error);
        } finally {
            setDocLoading(false);
        }
    };

    const handleUploadDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoc.url || !newDoc.title) return;

        setUploadingDoc(true);
        try {
            await api.post(`/students/${id}/documents`, newDoc);
            toast.success("Document added successfully");
            setNewDoc({ title: '', url: '', doc_type: 'other' });
            fetchDocuments();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add document");
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm("Delete this document?")) return;
        try {
            await api.delete(`/students/${id}/documents/${docId}`);
            setDocuments(docs => docs.filter(d => d.document_id !== docId));
            toast.success("Document deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete document");
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>;
    if (!student) return null;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                <ArrowLeft size={16} className="mr-2" /> Back to Directory
            </button>

            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-32 h-32 rounded-2xl bg-slate-100 overflow-hidden border-4 border-white shadow-lg shrink-0">
                    {student.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <User size={48} />
                        </div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900">{student.full_name}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
                            {student.admission_number}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold border border-slate-200">
                            {student.current_class || 'No Class'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${student.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {student.status?.toUpperCase()}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-500 mt-4 max-w-2xl">
                        <p>Father: <span className="text-slate-900 font-medium">{student.father_name || '-'}</span></p>
                        <p>Phone: <span className="text-slate-900 font-medium">{student.father_phone || '-'}</span></p>
                        <p>DOB: <span className="text-slate-900 font-medium">{student.date_of_birth}</span></p>
                        <p>Gender: <span className="text-slate-900 font-medium">{student.gender}</span></p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200 flex gap-6 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'documents', label: 'Documents', icon: FileText },
                    { id: 'attendance', label: 'Attendance', icon: Calendar },
                    { id: 'fees', label: 'Fee History', icon: DollarSign },
                    { id: 'results', label: 'Exam Results', icon: GraduationCap },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap px-1 ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 font-semibold'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Detailed Information</h3>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admission Date</dt>
                                    <dd className="text-slate-900 mt-1">{student.admission_date}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</dt>
                                    <dd className="text-slate-900 mt-1">{student.email || '-'}</dd>
                                </div>
                                <div className="md:col-span-2">
                                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</dt>
                                    <dd className="text-slate-900 mt-1">{student.address || '-'}</dd>
                                </div>
                            </dl>
                        </div>
                        <div className="pt-6 border-t border-slate-100">
                            <p className="text-sm text-slate-500 italic">More academic details coming soon.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* List */}
                        <div className="lg:col-span-2 space-y-4">
                            {docLoading ? (
                                <div className="text-center py-10 text-slate-500">Loading documents...</div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                    <h3 className="text-slate-900 font-medium">No documents yet</h3>
                                    <p className="text-slate-500 text-sm">Upload birth certificates, medical records, etc.</p>
                                </div>
                            ) : (
                                documents.map(doc => (
                                    <div key={doc.document_id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between group hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{doc.title}</h4>
                                                <p className="text-xs text-slate-500 uppercase">{doc.doc_type} • {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <ExternalLink size={18} />
                                            </a>
                                            <button onClick={() => handleDeleteDocument(doc.document_id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Upload Form */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 h-fit space-y-4">
                            <h3 className="font-bold text-slate-900">Add New Document</h3>
                            <PhotoUpload
                                label="Upload Document/Image"
                                currentPhotoUrl={newDoc.url}
                                onPhotoUploaded={(url) => setNewDoc(d => ({ ...d, url }))}
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Document Title</label>
                                <input
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="e.g. Birth Certificate"
                                    value={newDoc.title}
                                    onChange={e => setNewDoc(d => ({ ...d, title: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Type</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                    value={newDoc.doc_type}
                                    onChange={e => setNewDoc(d => ({ ...d, doc_type: e.target.value }))}
                                >
                                    <option value="academic">Academic Record</option>
                                    <option value="medical">Medical Record</option>
                                    <option value="legal">Legal/ID Proof</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <Button
                                onClick={handleUploadDocument}
                                disabled={uploadingDoc || !newDoc.url || !newDoc.title}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {uploadingDoc ? 'Saving...' : 'Save Document'}
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 font-medium">Attendance History</h3>
                        <p className="text-slate-500">Attendance records will appear here.</p>
                    </div>
                )}

                {activeTab === 'fees' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 font-medium">Fee Payment History</h3>
                        <p className="text-slate-500">Fee records will appear here.</p>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 font-medium">Exam Results</h3>
                        <p className="text-slate-500">Examination results will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
