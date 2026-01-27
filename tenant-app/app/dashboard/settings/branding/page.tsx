'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Palette, Upload, Save, Eye, Sparkles, Image as ImageIcon, RefreshCw
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface BrandingData {
    name: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    website?: string;
    address?: string;
}

export default function BrandingSettingsPage() {
    const [branding, setBranding] = useState<BrandingData>({
        name: '',
        logo_url: '',
        primary_color: '#3B82F6',
        secondary_color: '#6366F1',
        website: '',
        address: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewLogo, setPreviewLogo] = useState<string | null>(null);

    useEffect(() => {
        fetchBranding();
    }, []);

    const fetchBranding = async () => {
        setLoading(true);
        try {
            const res = await api.get('/school/profile');
            setBranding({
                name: res.data.name || '',
                logo_url: res.data.logo_url || '',
                primary_color: res.data.primary_color || '#3B82F6',
                secondary_color: res.data.secondary_color || '#6366F1',
                website: res.data.website || '',
                address: res.data.address || ''
            });
            setPreviewLogo(res.data.logo_url || null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load branding settings');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size should be less than 2MB');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const logoUrl = res.data.url;
            setBranding({ ...branding, logo_url: logoUrl });
            setPreviewLogo(logoUrl);
            toast.success('Logo uploaded successfully');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Failed to upload logo');
        } finally {
            setUploading(false);
        }
    };

    const saveBranding = async () => {
        setSaving(true);
        try {
            await api.patch('/school/branding', {
                name: branding.name,
                logo_url: branding.logo_url,
                primary_color: branding.primary_color,
                secondary_color: branding.secondary_color,
                website: branding.website,
                address: branding.address
            });

            toast.success('Branding updated successfully! Refresh the page to see changes.');

            // Apply colors to CSS variables
            document.documentElement.style.setProperty('--primary-color', branding.primary_color);
            document.documentElement.style.setProperty('--secondary-color', branding.secondary_color);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Failed to update branding');
        } finally {
            setSaving(false);
        }
    };

    const resetColors = () => {
        setBranding({
            ...branding,
            primary_color: '#3B82F6',
            secondary_color: '#6366F1'
        });
        toast.info('Colors reset to default');
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <Palette className="text-purple-600" size={36} />
                        School Branding
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Customize your school's visual identity</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Settings Panel */}
                    <div className="space-y-6">
                        {/* Logo Upload */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <ImageIcon size={24} className="text-blue-600" />
                                School Logo
                            </h2>

                            <div className="space-y-4">
                                {previewLogo && (
                                    <div className="flex justify-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <img
                                            src={previewLogo}
                                            alt="School Logo"
                                            className="max-h-32 object-contain"
                                        />
                                    </div>
                                )}

                                <label className="block">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                    <div className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${uploading
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'
                                        }`}>
                                        <Upload className="mx-auto mb-3 text-slate-400" size={32} />
                                        <p className="text-sm font-bold text-slate-700">
                                            {uploading ? 'Uploading...' : 'Click to upload logo'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 2MB</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* School Name */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">School Name</h2>
                            <input
                                type="text"
                                value={branding.name}
                                onChange={(e) => setBranding({ ...branding, name: e.target.value })}
                                placeholder="Enter school name"
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg font-bold"
                            />
                        </div>

                        {/* Colors */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <Palette size={24} className="text-purple-600" />
                                    Brand Colors
                                </h2>
                                <button
                                    onClick={resetColors}
                                    className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                                >
                                    <RefreshCw size={14} /> Reset
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Primary Color
                                    </label>
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="color"
                                            value={branding.primary_color}
                                            onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                                            className="h-12 w-20 rounded-xl border-2 border-slate-200 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={branding.primary_color}
                                            onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                                            className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Secondary Color
                                    </label>
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="color"
                                            value={branding.secondary_color}
                                            onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                                            className="h-12 w-20 rounded-xl border-2 border-slate-200 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={branding.secondary_color}
                                            onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                                            className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Additional Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        value={branding.website}
                                        onChange={(e) => setBranding({ ...branding, website: e.target.value })}
                                        placeholder="https://yourschool.com"
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Address
                                    </label>
                                    <textarea
                                        value={branding.address}
                                        onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                                        placeholder="School address"
                                        rows={3}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={saveBranding}
                            disabled={saving}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw size={20} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Save Branding
                                </>
                            )}
                        </button>
                    </div>

                    {/* Live Preview Panel */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Eye size={24} className="text-green-600" />
                                Live Preview
                            </h2>

                            <div className="space-y-4">
                                {/* Navbar Preview */}
                                <div className="border-2 border-slate-200 rounded-2xl overflow-hidden">
                                    <div
                                        className="p-4 flex items-center justify-between"
                                        style={{ backgroundColor: branding.primary_color }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {previewLogo ? (
                                                <img src={previewLogo} alt="Logo" className="h-10 w-10 object-contain bg-white rounded-lg p-1" />
                                            ) : (
                                                <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
                                                    <Sparkles size={20} className="text-slate-400" />
                                                </div>
                                            )}
                                            <span className="text-white font-bold text-lg">{branding.name || 'School Name'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
                                            <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Button Preview */}
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-slate-600">Button Styles</p>
                                    <button
                                        className="w-full py-3 rounded-xl font-bold text-white transition-all"
                                        style={{ backgroundColor: branding.primary_color }}
                                    >
                                        Primary Button
                                    </button>
                                    <button
                                        className="w-full py-3 rounded-xl font-bold text-white transition-all"
                                        style={{ backgroundColor: branding.secondary_color }}
                                    >
                                        Secondary Button
                                    </button>
                                </div>

                                {/* Card Preview */}
                                <div className="border-2 rounded-2xl p-4" style={{ borderColor: branding.primary_color }}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: branding.primary_color }}
                                        >
                                            <Sparkles className="text-white" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Card Title</h3>
                                            <p className="text-sm text-slate-500">Card description</p>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full" style={{ backgroundColor: branding.secondary_color + '40' }}>
                                        <div
                                            className="h-2 rounded-full w-2/3"
                                            style={{ backgroundColor: branding.secondary_color }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Badge Preview */}
                                <div className="flex gap-2 flex-wrap">
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-bold text-white"
                                        style={{ backgroundColor: branding.primary_color }}
                                    >
                                        Primary Badge
                                    </span>
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-bold text-white"
                                        style={{ backgroundColor: branding.secondary_color }}
                                    >
                                        Secondary Badge
                                    </span>
                                </div>

                                {/* Info Box */}
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <p className="text-sm text-blue-900">
                                        <strong>💡 Tip:</strong> Changes will be applied across the entire application after saving.
                                        Refresh the page to see the new branding in action!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
