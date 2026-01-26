'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, Upload, Download, RefreshCcw, User,
    Barcode as BarcodeIcon, CheckCircle2, ChevronRight,
    ChevronLeft, GraduationCap, Save, QrCode, Trash2, Edit
} from 'lucide-react';
import { useBranding } from '@/context/branding-context';
import api from '@/lib/api';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';

export default function IDCardGenerator() {
    const { branding } = useBranding();

    // Template State
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>(''); // ID
    const [frontBg, setFrontBg] = useState<string | null>(null);
    const [backBg, setBackBg] = useState<string | null>(null);
    const [templateName, setTemplateName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Generation State
    const [studentCount, setStudentCount] = useState(0);
    const [sampleStudent, setSampleStudent] = useState<any>(null);
    const [flip, setFlip] = useState(false);

    useEffect(() => {
        fetchTemplates();
        fetchStats();
    }, []);

    const fetchTemplates = async () => {
        try {
            await api.post('/id-cards/system/init-templates'); // Ensure schema
            const res = await api.get('/id-cards/templates');
            setTemplates(res.data);
        } catch (e) {
            console.error("Templates fetch error", e);
            toast.error("Failed to load templates");
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/students?limit=1');
            const data = res.data.items || res.data;
            if (data.length > 0) {
                setStudentCount(100);
                setSampleStudent(data[0]);
            }
        } catch (err) { console.error("Student fetch error", err); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const toastId = toast.loading("Uploading...");
                const res = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.dismiss(toastId);

                if (side === 'front') setFrontBg(res.data.url);
                else setBackBg(res.data.url);

                toast.success("Image uploaded!");
            } catch (e) {
                toast.error("Upload failed");
            }
        }
    };

    const saveTemplate = async () => {
        if (!frontBg || !templateName.trim()) {
            toast.error("Template name and front image are required");
            return;
        }

        setIsSaving(true);
        try {
            if (isEditing && selectedTemplate) {
                // Update
                const res = await api.put(`/id-cards/templates/${selectedTemplate}`, {
                    template_name: templateName,
                    layout_json: {},
                    front_image_url: frontBg,
                    back_image_url: backBg,
                    is_active: true
                });
                toast.success("Template Updated!");
                setTemplates(templates.map(t => t.template_id === selectedTemplate ? res.data : t));
                setIsEditing(false);
            } else {
                // Create
                const res = await api.post('/id-cards/templates', {
                    template_name: templateName,
                    layout_json: {},
                    front_image_url: frontBg,
                    back_image_url: backBg,
                    is_active: true,
                    is_default: false
                });
                toast.success("Template Saved!");
                setTemplates([res.data, ...templates]);
                setSelectedTemplate(res.data.template_id);
                setTemplateName('');
                setIsEditing(false);
            }
        } catch (e: any) {
            console.error("Save error:", e);
            toast.error(e.response?.data?.detail || "Failed to save template. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const deleteTemplate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            await api.delete(`/id-cards/templates/${id}`);
            setTemplates(templates.filter(t => t.template_id !== id));
            if (selectedTemplate === id) {
                setSelectedTemplate('');
                setFrontBg(null);
                setBackBg(null);
                setTemplateName('');
                setIsEditing(false);
            }
            toast.success("Deleted successfully");
        } catch (e) { toast.error("Delete failed"); }
    };

    const selectTemplate = (id: string) => {
        const t = templates.find(x => x.template_id === id);
        if (t) {
            setSelectedTemplate(id);
            setFrontBg(t.front_image_url);
            setBackBg(t.back_image_url);
            setTemplateName(t.template_name);
            setIsEditing(false);
        }
    };

    const startEditing = () => {
        setIsEditing(true);
    };

    const clearSelection = () => {
        setSelectedTemplate('');
        setFrontBg(null);
        setBackBg(null);
        setTemplateName('');
        setIsEditing(false);
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">ID Center</h1>
                        <p className="text-slate-500 font-medium">Design, Manage, and Print Student IDs</p>
                    </div>
                    <button onClick={() => window.location.href = '/dashboard'} className="flex items-center gap-2 font-bold text-slate-500 hover:text-slate-700 transition-colors">
                        <ChevronLeft size={20} /> Dashboard
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* LEFT PANEL: CONTROLS */}
                    <div className="space-y-6">
                        {/* 1. Template Selection */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <CreditCard size={20} className="text-blue-600" />
                                Select Template
                            </h3>
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                <div
                                    onClick={clearSelection}
                                    className={`flex-shrink-0 w-24 h-32 border-2 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:border-blue-300 ${!selectedTemplate ? 'border-blue-500 bg-blue-50' : 'border-dashed border-slate-200'}`}
                                >
                                    <span className="text-xs font-bold text-slate-500">New / Custom</span>
                                </div>
                                {templates.map(t => (
                                    <div
                                        key={t.template_id}
                                        onClick={() => selectTemplate(t.template_id)}
                                        className={`flex-shrink-0 w-24 h-32 border-2 rounded-xl relative overflow-hidden cursor-pointer transition-all group hover:scale-105 ${selectedTemplate === t.template_id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}
                                    >
                                        <img src={t.front_image_url} className="w-full h-full object-cover" alt={t.template_name} />
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[9px] p-1 font-bold truncate">
                                            {t.template_name}
                                        </div>
                                        <button
                                            onClick={(e) => deleteTemplate(t.template_id, e)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            title="Delete template"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Upload / Edit */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Upload size={20} className="text-purple-600" />
                                    {isEditing ? 'Editing Template' : selectedTemplate ? 'Viewing Template' : 'New Design'}
                                </h3>
                                {selectedTemplate && !isEditing && (
                                    <button onClick={startEditing} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 transition-colors">
                                        <Edit size={14} /> Edit
                                    </button>
                                )}
                            </div>

                            <div className={`grid grid-cols-2 gap-4 mb-4 transition-opacity ${(!isEditing && selectedTemplate) ? 'opacity-60 pointer-events-none' : ''}`}>
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Front</span>
                                    <label className="block h-32 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer flex items-center justify-center overflow-hidden relative transition-all hover:border-blue-300">
                                        {frontBg ? <img src={frontBg} className="w-full h-full object-cover" alt="Front" /> : <Upload className="text-slate-300" />}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'front')} disabled={!isEditing && !!selectedTemplate} />
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Back</span>
                                    <label className="block h-32 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer flex items-center justify-center overflow-hidden relative transition-all hover:border-blue-300">
                                        {backBg ? <img src={backBg} className="w-full h-full object-cover" alt="Back" /> : <Upload className="text-slate-300" />}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'back')} disabled={!isEditing && !!selectedTemplate} />
                                    </label>
                                </div>
                            </div>

                            {(isEditing || !selectedTemplate) && (
                                <div className="space-y-3 mt-4">
                                    <input
                                        placeholder="Template Name (e.g. Blue 2026 Standard)"
                                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        value={templateName}
                                        onChange={e => setTemplateName(e.target.value)}
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={saveTemplate}
                                            disabled={isSaving || !frontBg || !templateName.trim()}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <RefreshCcw className="animate-spin" size={16} />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={16} />
                                                    {isEditing ? 'Update Template' : 'Save Template'}
                                                </>
                                            )}
                                        </button>
                                        {isEditing && (
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setTemplateName(templates.find(t => t.template_id === selectedTemplate)?.template_name || '');
                                                }}
                                                className="px-4 py-3.5 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Actions */}
                        <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center gap-2">
                            <Download /> Generate PDFs
                        </button>
                    </div>

                    {/* RIGHT PANEL: PREVIEW */}
                    <div className="relative flex flex-col items-center">
                        <div className="flex gap-4 mb-6">
                            <button onClick={() => setFlip(false)} className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${!flip ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Front Side</button>
                            <button onClick={() => setFlip(true)} className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${flip ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Back Side</button>
                        </div>

                        {/* 3D FLIP CONTAINER */}
                        <div className="relative w-[320px] h-[512px] [perspective:1000px]">
                            <motion.div
                                className="w-full h-full relative [transform-style:preserve-3d] transition-all duration-500"
                                animate={{ rotateY: flip ? 180 : 0 }}
                            >
                                {/* FRONT FACE */}
                                <div className="absolute inset-0 w-full h-full bg-white rounded-[24px] shadow-2xl overflow-hidden [backface-visibility:hidden] border border-slate-200">
                                    {frontBg ? <img src={frontBg} className="w-full h-full object-cover absolute inset-0" alt="Front" /> : <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-300">Front Template</div>}

                                    {/* Front Dynamic Content */}
                                    <div className="absolute inset-0 p-6 flex flex-col items-center z-10">
                                        <div className="w-full flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 bg-white/90 p-1 rounded-lg shadow-sm">
                                                {branding?.logo_url ? <img src={branding.logo_url} className="w-full h-full object-contain" alt="Logo" /> : <GraduationCap className="w-full h-full text-blue-600" />}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900 uppercase leading-none text-xs">{branding?.name || 'SCHOOL NAME'}</p>
                                                <p className="text-[10px] font-bold text-slate-500">IDENTITY CARD</p>
                                            </div>
                                        </div>

                                        <div className="w-32 h-36 bg-slate-200 rounded-xl border-4 border-white shadow-lg mb-4 overflow-hidden">
                                            {sampleStudent?.photo_url ? <img src={sampleStudent.photo_url} className="w-full h-full object-cover" alt="Student" /> : <User className="w-full h-full p-6 text-slate-400" />}
                                        </div>

                                        <h2 className="text-xl font-black text-slate-900 uppercase text-center leading-tight mb-1">{sampleStudent?.full_name || 'STUDENT NAME'}</h2>
                                        <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full">STUDENT</span>

                                        <div className="mt-auto w-full grid grid-cols-2 gap-4 pt-4 border-t border-slate-900/10">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Class</p>
                                                <p className="font-bold text-slate-800">{sampleStudent?.current_class || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Roll No</p>
                                                <p className="font-bold text-slate-800">{sampleStudent?.admission_number || '000'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BACK FACE */}
                                <div className="absolute inset-0 w-full h-full bg-white rounded-[24px] shadow-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] border border-slate-200">
                                    {backBg ? <img src={backBg} className="w-full h-full object-cover absolute inset-0" alt="Back" /> : <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-300">Back Template</div>}

                                    <div className="absolute inset-0 p-6 flex flex-col z-10">
                                        <div className="space-y-4 mt-8">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">Father / Guardian</p>
                                                <p className="font-bold text-slate-900 text-lg">{sampleStudent?.father_name || 'Parent Name'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">Emergency Contact</p>
                                                <p className="font-bold text-slate-900">{sampleStudent?.father_phone || '+00 000 0000'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">School Address</p>
                                                <p className="text-xs text-slate-700 leading-tight">{branding?.address || 'School Address Here'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex flex-col items-center gap-2">
                                            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                                <QRCode value={sampleStudent?.student_id || 'DEMO'} size={80} />
                                            </div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Scan for Attendance</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
