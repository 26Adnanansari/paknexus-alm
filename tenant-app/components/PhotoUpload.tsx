'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface PhotoUploadProps {
    currentPhotoUrl?: string;
    onPhotoUploaded: (url: string) => void;
    label?: string;
}

export default function PhotoUpload({ currentPhotoUrl, onPhotoUploaded, label = "Student Photo" }: PhotoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to Cloudinary via backend
        await uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Upload to backend which will handle Cloudinary
            const response = await api.post('/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data?.url) {
                onPhotoUploaded(response.data.url);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                throw new Error('No URL returned from upload');
            }
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err?.response?.data?.detail || 'Failed to upload image. Please try again.');
            setPreview(currentPhotoUrl || null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        setError(null);
        setSuccess(false);
        onPhotoUploaded('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">{label}</label>

            {preview ? (
                <div className="relative">
                    <div className="w-full h-48 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        disabled={uploading}
                    >
                        <X className="h-4 w-4" />
                    </button>
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                            <div className="bg-white p-4 rounded-lg flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <span className="text-sm font-medium">Uploading...</span>
                            </div>
                        </div>
                    )}
                    {success && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium shadow-lg">
                            <CheckCircle className="h-4 w-4" />
                            Uploaded!
                        </div>
                    )}
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all bg-slate-50"
                >
                    <div className="p-4 bg-blue-100 rounded-full">
                        <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-center px-4">
                        <p className="font-bold text-slate-700">Click to upload photo</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
            />

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <p className="text-xs text-slate-500">
                Photo will be used for ID cards and student profiles
            </p>
        </div>
    );
}
