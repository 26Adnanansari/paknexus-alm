'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface UploadResult {
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
}

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                setError('Please select a CSV file');
                return;
            }
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    const downloadTemplate = () => {
        const template = `full_name,admission_number,admission_date,date_of_birth,gender,current_class,father_name,father_phone
John Doe,ADM-001,2024-01-15,2010-05-20,Male,Grade 5,Robert Doe,03001234567
Jane Smith,ADM-002,2024-01-15,2011-08-15,Female,Grade 4,Michael Smith,03009876543
Ali Khan,ADM-003,2024-01-15,2012-03-10,Male,Grade 3,Ahmed Khan,03005555555`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_upload_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const text = await file.text();
            const lines = text.trim().split('\n');

            if (lines.length < 2) {
                throw new Error('CSV file is empty or has no data rows');
            }

            const headers = lines[0].split(',').map(h => h.trim());
            const students = [];
            const errors: Array<{ row: number; error: string }> = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());

                if (values.length !== headers.length) {
                    errors.push({ row: i + 1, error: 'Column count mismatch' });
                    continue;
                }

                const student: any = {};
                headers.forEach((header, index) => {
                    student[header] = values[index] || null;
                });

                // Validate required fields
                if (!student.full_name || !student.admission_number || !student.date_of_birth || !student.gender) {
                    errors.push({ row: i + 1, error: 'Missing required fields (full_name, admission_number, date_of_birth, gender)' });
                    continue;
                }

                // Set default admission_date if not provided
                if (!student.admission_date) {
                    student.admission_date = new Date().toISOString().split('T')[0];
                }

                students.push(student);
            }

            // Upload students one by one (or batch if backend supports)
            let successCount = 0;
            let failedCount = 0;

            for (let i = 0; i < students.length; i++) {
                try {
                    await api.post('/students', students[i]);
                    successCount++;
                } catch (err: any) {
                    failedCount++;
                    errors.push({
                        row: i + 2, // +2 because of header and 0-index
                        error: err?.response?.data?.detail || 'Failed to create student'
                    });
                }
            }

            setResult({
                success: successCount,
                failed: failedCount,
                errors
            });

            if (successCount > 0) {
                onSuccess();
            }

        } catch (err: any) {
            setError(err.message || 'Failed to process CSV file');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={handleClose}
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Bulk Upload Students</h2>
                            <p className="text-sm text-slate-500">Upload multiple students from CSV file</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Download Template */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-900">Download Template First</h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Download and fill the CSV template with your student data
                                    </p>
                                    <Button
                                        onClick={downloadTemplate}
                                        variant="outline"
                                        className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                                        size="sm"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download Template
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Select CSV File
                            </label>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label
                                    htmlFor="csv-upload"
                                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    Click to select CSV file
                                </label>
                                {file && (
                                    <p className="mt-2 text-sm text-slate-600">
                                        Selected: <span className="font-semibold">{file.name}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                            >
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-red-900">Error</h4>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Result Display */}
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-3"
                            >
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-green-900">Upload Complete</h4>
                                        <p className="text-sm text-green-700 mt-1">
                                            Successfully added: <span className="font-bold">{result.success}</span> students
                                            {result.failed > 0 && (
                                                <span className="text-red-600 ml-2">
                                                    • Failed: <span className="font-bold">{result.failed}</span>
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {result.errors.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                                        <h4 className="font-semibold text-yellow-900 mb-2">Errors ({result.errors.length})</h4>
                                        <ul className="space-y-2">
                                            {result.errors.map((err, idx) => (
                                                <li key={idx} className="text-sm text-yellow-800">
                                                    <span className="font-semibold">Row {err.row}:</span> {err.error}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Upload Button */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                onClick={handleClose}
                                variant="outline"
                                className="rounded-xl"
                                disabled={uploading}
                            >
                                {result ? 'Close' : 'Cancel'}
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!file || uploading}
                                className="rounded-xl bg-blue-600 hover:bg-blue-700"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Students
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
