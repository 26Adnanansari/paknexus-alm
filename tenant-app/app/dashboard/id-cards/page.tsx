'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, Upload, Download, RefreshCcw, User,
    CheckCircle2, ChevronRight, ChevronLeft, GraduationCap,
    Save, Trash2, Edit, Search, Filter, X, Plus
} from 'lucide-react';
import { useBranding } from '@/context/branding-context';
import api from '@/lib/api';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';

interface Student {
    student_id: string;
    full_name: string;
    admission_number: string;
    current_class: string;
    photo_url?: string;
    div_name?: string;
    father_name?: string;
    father_phone?: string;
}

export default function IDCardUnifiedDashboard() {
    const { branding } = useBranding();

    // --- Template State ---
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [activeTemplate, setActiveTemplate] = useState<any>(null); // Full obj
    const [isEditingTemplate, setIsEditingTemplate] = useState(false);

    // Edit Form State
    const [tempName, setTempName] = useState('');
    const [frontBg, setFrontBg] = useState<string | null>(null);
    const [backBg, setBackBg] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- Student State ---
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [classes, setClasses] = useState<string[]>([]);

    // --- UI State ---
    const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
    const [flipPreview, setFlipPreview] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    useEffect(() => {
        fetchTemplates();
        fetchStudents();
    }, []);

    useEffect(() => {
        if (selectedTemplate) {
            const t = templates.find(x => x.template_id === selectedTemplate);
            if (t) {
                setActiveTemplate(t);
                setFrontBg(t.front_bg_url);
                setBackBg(t.back_bg_url);
                setTempName(t.template_name);
            }
        } else {
            setActiveTemplate(null);
            setFrontBg(null);
            setBackBg(null);
            setTempName('');
        }
    }, [selectedTemplate, templates]);

    useEffect(() => {
        // Filter Logic
        let res = students;
        if (classFilter) res = res.filter(s => s.current_class === classFilter);
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            res = res.filter(s =>
                s.full_name.toLowerCase().includes(term) ||
                s.admission_number.toLowerCase().includes(term)
            );
        }
        setFilteredStudents(res);
        if (res.length > 0 && !previewStudent) setPreviewStudent(res[0]);
    }, [students, classFilter, searchTerm]);

    // --- API Calls ---

    const fetchTemplates = async () => {
        try {
            await api.post('/id-cards/system/init-templates');
            const res = await api.get('/id-cards/templates');
            setTemplates(res.data);
            if (res.data.length > 0) setSelectedTemplate(res.data[0].template_id);
        } catch (e) { toast.error("Failed to load templates"); }
    };

    const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
            const res = await api.get('/students?limit=500'); // Fetch enough for bulk selection
            const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
            setStudents(data);
            setFilteredStudents(data);

            // Extract Classes
            const unique = [...new Set(data.map((s: any) => s.current_class).filter(Boolean))];
            setClasses(unique as string[]);
        } catch (e) { toast.error("Failed to load students"); }
        finally { setLoadingStudents(false); }
    };

    // --- Actions ---

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const toastId = toast.loading("Uploading...");
            const res = await api.post('/upload/image', formData);
            toast.dismiss(toastId);
            if (side === 'front') setFrontBg(res.data.url);
            else setBackBg(res.data.url);
            toast.success("Uploaded!");
        } catch (e) { toast.error("Upload failed"); }
    };

    const saveTemplate = async () => {
        if (!frontBg || !tempName.trim()) return toast.error("Name and Front Image required");
        setIsSaving(true);
        try {
            const payload = {
                template_name: tempName,
                front_bg_url: frontBg,
                back_bg_url: backBg,
                layout_json: {},
                is_active: true
            };

            let res: any;
            if (isEditingTemplate && selectedTemplate !== 'new') {
                res = await api.put(`/id-cards/templates/${selectedTemplate}`, payload);
                setTemplates(prev => prev.map(t => t.template_id === selectedTemplate ? res.data : t));
                toast.success("Updated!");
            } else {
                res = await api.post('/id-cards/templates', { ...payload, is_default: false });
                setTemplates(prev => [res.data, ...prev]);
                setSelectedTemplate(res.data.template_id);
                toast.success("Created!");
            }
            setIsEditingTemplate(false);
        } catch (e: any) { toast.error(e.response?.data?.detail || "Save failed"); }
        finally { setIsSaving(false); }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm("Delete this template?")) return;
        try {
            await api.delete(`/id-cards/templates/${id}`);
            setTemplates(prev => prev.filter(t => t.template_id !== id));
            if (selectedTemplate === id) setSelectedTemplate(templates[0]?.template_id || '');
            toast.success("Deleted");
        } catch (e) { toast.error("Failed to delete"); }
    };

    const toggleStudent = (id: string) => {
        const next = new Set(selectedStudents);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedStudents(next);
    };

    const toggleAll = () => {
        if (selectedStudents.size === filteredStudents.length) setSelectedStudents(new Set());
        else setSelectedStudents(new Set(filteredStudents.map(s => s.student_id)));
    };

    const generateCards = async () => {
        if (selectedStudents.size === 0) return toast.error("Select students first");
        try {
            const res = await api.post('/id-cards/bulk-generate', {
                student_ids: Array.from(selectedStudents),
                issue_date: new Date().toISOString().split('T')[0]
            });
            toast.success(`Generated ${res.data.successful} cards!`);
        } catch (e: any) { toast.error(e.response?.data?.detail || "Generation failed"); }
    };

    // --- Render Helpers ---

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">

            {/* LEFT SIDEBAR: CONTENT (Student Selection) */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">

                {/* Header Phase */}
                <div className="bg-white p-6 border-b border-slate-200 shadow-sm z-20">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <CreditCard className="text-blue-600" />
                            ID Card Center
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold">
                                {selectedStudents.size} Selected
                            </div>
                            <button
                                onClick={generateCards}
                                disabled={selectedStudents.size === 0}
                                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <Download size={16} /> Generate IDs
                            </button>
                        </div>
                    </div>

                    {/* Template Mini-Carousel */}
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Template:</span>
                        <button
                            onClick={() => { setSelectedTemplate('new'); setIsEditingTemplate(true); setFrontBg(null); setBackBg(null); setTempName(''); }}
                            className={`flex flex-col items-center justify-center w-16 h-20 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all flex-shrink-0 ${selectedTemplate === 'new' ? 'border-blue-500 bg-blue-50' : ''}`}
                        >
                            <Plus size={20} />
                            <span className="text-[10px] font-bold mt-1">New</span>
                        </button>
                        {templates.map(t => (
                            <button
                                key={t.template_id}
                                onClick={() => { setSelectedTemplate(t.template_id); setIsEditingTemplate(false); }}
                                className={`relative w-16 h-20 rounded-lg border-2 overflow-hidden transition-all flex-shrink-0 group ${selectedTemplate === t.template_id ? 'border-blue-600 ring-2 ring-blue-100 scale-105' : 'border-slate-200 hover:border-blue-300'}`}
                            >
                                <img src={t.front_bg_url} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                    {/* Template Editor (Collapsible) */}
                    <AnimatePresence>
                        {(isEditingTemplate || (selectedTemplate && isEditingTemplate)) && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div className="space-y-4">
                                    <input
                                        value={tempName}
                                        onChange={e => setTempName(e.target.value)}
                                        placeholder="Template Name"
                                        className="w-full p-2 text-sm border-2 border-slate-200 rounded-lg font-bold"
                                    />
                                    <div className="flex gap-2">
                                        <label className="flex-1 cursor-pointer bg-slate-50 border border-dashed border-slate-300 rounded-lg p-2 flex items-center justify-center gap-2 hover:bg-slate-100">
                                            <Upload size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500">Front Img</span>
                                            <input type="file" hidden onChange={e => handleFileUpload(e, 'front')} />
                                        </label>
                                        <label className="flex-1 cursor-pointer bg-slate-50 border border-dashed border-slate-300 rounded-lg p-2 flex items-center justify-center gap-2 hover:bg-slate-100">
                                            <Upload size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500">Back Img</span>
                                            <input type="file" hidden onChange={e => handleFileUpload(e, 'back')} />
                                        </label>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={saveTemplate} disabled={isSaving} className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">Save Design</button>
                                        <button onClick={() => setIsEditingTemplate(false)} className="px-4 py-2 text-slate-500 text-xs font-bold">Cancel</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Filters Row */}
                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Find student..."
                            className="w-full pl-9 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <select
                            value={classFilter}
                            onChange={e => setClassFilter(e.target.value)}
                            className="w-full py-2 px-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={toggleAll} className="text-xs font-bold text-slate-500 hover:text-blue-600 underline">
                            {selectedStudents.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto px-6 pb-24">
                    {loadingStudents ? (
                        <div className="text-center py-20 text-slate-500">Loading directory...</div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">No students found</div>
                    ) : (
                        <div className="space-y-2">
                            {filteredStudents.map(student => (
                                <div
                                    key={student.student_id}
                                    onClick={() => { toggleStudent(student.student_id); setPreviewStudent(student); }}
                                    className={`
                                        group flex items-center p-3 rounded-xl border cursor-pointer transition-all
                                        ${selectedStudents.has(student.student_id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-blue-200'}
                                    `}
                                >
                                    <div className="pr-4" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.has(student.student_id)}
                                            onChange={() => toggleStudent(student.student_id)}
                                            className="w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                        {student.photo_url ? (
                                            <img src={student.photo_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">{student.full_name[0]}</div>
                                        )}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="font-bold text-slate-900 text-sm">{student.full_name}</p>
                                        <p className="text-xs text-slate-500 font-mono">{student.admission_number}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                                            {student.current_class}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT SIDEBAR: PREVIEW (Fixed Width) */}
            <div className="w-[380px] bg-slate-900 text-white flex flex-col items-center p-6 border-l border-slate-800 shadow-2xl z-30">
                <div className="w-full flex justify-between items-center mb-8">
                    <h3 className="font-bold text-lg text-slate-300">Live Preview</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFlipPreview(!flipPreview)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"
                            title="Flip Card"
                        >
                            <RefreshCcw size={18} />
                        </button>
                        {activeTemplate && !isEditingTemplate && (
                            <button
                                onClick={() => { setIsEditingTemplate(true); setSelectedTemplate(activeTemplate.template_id); }}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400"
                                title="Edit Template"
                            >
                                <Edit size={18} />
                            </button>
                        )}
                        {activeTemplate && (
                            <button
                                onClick={() => deleteTemplate(activeTemplate.template_id)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400"
                                title="Delete Template"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* 3D Flip Card */}
                <div className="w-[300px] h-[480px] [perspective:1000px] mb-8">
                    <motion.div
                        className="w-full h-full relative [transform-style:preserve-3d] transition-all duration-500"
                        animate={{ rotateY: flipPreview ? 180 : 0 }}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 bg-white rounded-2xl shadow-xl overflow-hidden [backface-visibility:hidden]">
                            {frontBg ? <img src={frontBg} className="w-full h-full object-cover" /> : <div className="p-10 text-center text-slate-300 flex flex-col items-center h-full justify-center gap-2"><Upload /><span className="text-xs">No Front Design</span></div>}

                            {/* Dynamic Content Overlay (Front) */}
                            {frontBg && (
                                <div className="absolute inset-0 p-5 flex flex-col items-center">
                                    <div className="w-full flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-white/90 p-1 rounded shadow-sm">
                                            {branding?.logo_url ? <img src={branding.logo_url} className="w-full h-full object-contain" /> : <GraduationCap className="text-blue-600" />}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900 text-[10px] uppercase leading-none">{branding?.name || 'School Name'}</p>
                                        </div>
                                    </div>
                                    <div className="w-28 h-32 bg-slate-200 rounded-lg border-4 border-white shadow-md mb-3 overflow-hidden">
                                        {previewStudent?.photo_url ? <img src={previewStudent.photo_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-slate-400" />}
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 uppercase text-center leading-none mb-1">{previewStudent?.full_name || 'Student Name'}</h2>
                                    <div className="mt-auto w-full grid grid-cols-2 gap-2 text-[8px]">
                                        <div>
                                            <p className="font-bold text-slate-500 uppercase">Class</p>
                                            <p className="font-bold text-slate-900 text-xs">{previewStudent?.current_class || 'VI-A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-500 uppercase">Roll No</p>
                                            <p className="font-bold text-slate-900 text-xs">{previewStudent?.admission_number || '001'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 bg-white rounded-2xl shadow-xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
                            {backBg ? <img src={backBg} className="w-full h-full object-cover" /> : <div className="p-10 text-center text-slate-300 flex flex-col items-center h-full justify-center gap-2"><Upload /><span className="text-xs">No Back Design</span></div>}

                            {/* Dynamic Content Overlay (Back) */}
                            {backBg && (
                                <div className="absolute inset-0 p-5 flex flex-col">
                                    <div className="mt-8 space-y-3">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase">Guardian</p>
                                            <p className="font-bold text-slate-900 text-sm">{previewStudent?.father_name || 'Parent Name'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase">Contact</p>
                                            <p className="font-bold text-slate-900 text-sm">{previewStudent?.father_phone || '+00 000 000'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-auto self-center text-center">
                                        <div className="bg-white p-2 rounded shadow-sm border mb-1 inline-block">
                                            <QRCode value={previewStudent?.student_id || 'DEMO'} size={64} />
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-400">Scan to Verify</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                <div className="w-full bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">Preview Data Source</p>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                            {previewStudent?.photo_url ? <img src={previewStudent.photo_url} className="w-full h-full object-cover" /> : null}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{previewStudent?.full_name || 'Select a student'}</p>
                            <p className="text-[10px] text-slate-400 truncate font-mono">{previewStudent?.student_id || 'ID: ---'}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
