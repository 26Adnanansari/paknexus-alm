'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    Upload,
    Download,
    RefreshCcw,
    User,
    Barcode as BarcodeIcon,
    Layout,
    Layers,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    GraduationCap
} from 'lucide-react';
import { useBranding } from '@/context/branding-context';
import Barcode from 'react-barcode';

export default function IDCardGenerator() {
    const { branding } = useBranding();
    const [step, setStep] = useState(1);
    const [frontBg, setFrontBg] = useState<string | null>(null);
    const [backBg, setBackBg] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [studentCount, setStudentCount] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sampleStudent, setSampleStudent] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const api = await import('@/lib/api').then(m => m.default);
                const res = await api.get('/students?limit=1');

                let students = [];
                if (Array.isArray(res.data)) {
                    students = res.data;
                } else if (res.data?.items) {
                    students = res.data.items;
                }

                if (students.length > 0) {
                    setStudentCount(students.length); // Note: this is just page count if paginated, but works for small numbers
                    setSampleStudent(students[0]);
                }
            } catch (err) {
                console.error("Failed to fetch student data", err);
            }
        };
        fetchStats();
    }, []);

    const steps = [
        { title: 'Upload Background', icon: Upload },
        { title: 'Preview Design', icon: CreditCard },
        { title: 'Dynamic Generation', icon: RefreshCcw },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (side === 'front') setFrontBg(reader.result as string);
                else setBackBg(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Dynamic ID Generator</h1>
                        <p className="text-slate-500 font-medium">Create and manage your school&apos;s student ID cards with live dynamic data.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.location.href = '/dashboard/attendance'}
                            className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            Open Scanner
                        </button>
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-2"
                        >
                            <ChevronLeft size={18} />
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-between max-w-2xl bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mx-auto">
                    {steps.map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {step > i + 1 ? <CheckCircle2 size={20} /> : <s.icon size={20} />}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${step === i + 1 ? 'text-slate-900' : 'text-slate-400'}`}>{s.title}</span>
                            {i < steps.length - 1 && <div className="w-8 h-px bg-slate-200 mx-2" />}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Controls */}
                    <motion.div
                        layout
                        className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-xl space-y-8"
                    >
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <SectionTitle title="Card Backgrounds" subtitle="Upload front and back templates (PNG/JPG)" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-slate-500 uppercase px-1">Front Side</p>
                                            <label className="relative block h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group overflow-hidden">
                                                {frontBg ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={frontBg} alt="Front" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                        <Upload size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Image</span>
                                                    </div>
                                                )}
                                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'front')} />
                                            </label>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-slate-500 uppercase px-1">Back Side</p>
                                            <label className="relative block h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group overflow-hidden">
                                                {backBg ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={backBg} alt="Back" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                        <Upload size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Image</span>
                                                    </div>
                                                )}
                                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'back')} />
                                            </label>
                                        </div>
                                    </div>
                                    <button
                                        disabled={!frontBg}
                                        onClick={() => setStep(2)}
                                        className="w-full bg-slate-900 hover:bg-blue-600 disabled:bg-slate-200 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                                    >
                                        <span>Next: Customize Design</span>
                                        <ChevronRight size={18} />
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <SectionTitle title="Design Editor" subtitle="Adjust placement of dynamic fields" />
                                    <div className="space-y-4">
                                        <LayerToggle label="Student Photo" active />
                                        <LayerToggle label="Student Name" active />
                                        <LayerToggle label="Roll Number" active />
                                        <LayerToggle label="Barcode (Code 128)" active icon={<BarcodeIcon size={18} />} />
                                        <LayerToggle label="School Logo" />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-bold transition-all">Back</button>
                                        <button onClick={() => setStep(3)} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">Preview Generator</button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <SectionTitle title="Ready to Scale" subtitle="Generate individual or bulk cards" />
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                                        <div className="p-4 bg-white rounded-2xl shadow-sm">
                                            <RefreshCcw size={24} className="text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">System Ready</p>
                                            <p className="text-xs text-slate-500">
                                                {studentCount > 0 ? `${studentCount} students detected` : 'No students found'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setIsGenerating(true)}
                                            disabled={studentCount === 0}
                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-200 flex items-center justify-center gap-3 transition-all active:scale-95"
                                        >
                                            <Download size={20} />
                                            <span>Generate All (PDF)</span>
                                        </button>
                                        <button
                                            onClick={() => window.location.href = '/dashboard/students'}
                                            className="w-full bg-white border border-slate-200 hover:border-blue-400 text-slate-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Layout size={18} className="text-slate-400" />
                                            <span>Manage Students</span>
                                        </button>
                                    </div>
                                    <button onClick={() => setStep(2)} className="w-full text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Return to Editor</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Live Preview */}
                    <div className="flex flex-col items-center justify-start space-y-10">
                        <div className="text-center">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Live Card Preview</p>
                            <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full" />
                        </div>

                        {/* The Card - 3D Effect with Framer Motion */}
                        <div className="perspective-1000 group">
                            <motion.div
                                layout
                                className="w-full max-w-[340px] aspect-[1/1.58] bg-white rounded-[24px] shadow-2xl overflow-hidden relative border border-slate-100"
                                animate={{
                                    rotateY: isGenerating ? 360 : 0,
                                    scale: isGenerating ? 0.95 : 1
                                }}
                                transition={{ duration: 0.6 }}
                            >
                                {/* Background Template */}
                                <div className="absolute inset-0 z-0">
                                    {frontBg ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={frontBg} alt="Card Front" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center opacity-50 italic text-slate-400 text-sm">
                                            No Template
                                        </div>
                                    )}
                                </div>

                                {/* Dynamic Content Overlay */}
                                <div className="absolute inset-0 z-10 flex flex-col items-center p-6 bg-white/10 backdrop-blur-[1px]">
                                    <div className="w-full flex justify-between items-start mb-8">
                                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md p-2">
                                            {branding?.logo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={branding.logo_url} alt="School Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <GraduationCap className="text-blue-600" />
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black tracking-widest text-slate-900 uppercase leading-none">{branding?.name || 'Pak Nexus'}</p>
                                            <p className="text-[8px] font-bold text-slate-600 uppercase">Identity Card</p>
                                        </div>
                                    </div>

                                    <div className="w-32 h-36 bg-slate-100 rounded-2xl border-2 border-white shadow-xl mb-4 flex items-center justify-center overflow-hidden">
                                        {sampleStudent?.photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={sampleStudent.photo_url} alt="Student" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <User size={64} className="mb-2" />
                                                <span className="text-[10px] font-bold uppercase">No Photo</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center space-y-1 mb-6">
                                        <p className="text-xl font-black text-slate-900 leading-tight uppercase truncate max-w-[280px]">
                                            {sampleStudent?.full_name || 'STUDENT NAME'}
                                        </p>
                                        <div className="inline-block px-3 py-1 bg-blue-600 text-white font-bold text-[10px] rounded-full">STUDENT</div>
                                    </div>

                                    <div className="w-full grid grid-cols-2 gap-4 text-left border-t border-slate-200/50 pt-4 mb-auto">
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">System ID</p>
                                            <p className="text-[12px] font-black text-slate-800 tracking-tight truncate">
                                                {sampleStudent?.admission_number || 'PN-000'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Class</p>
                                            <p className="text-[12px] font-black text-slate-800">
                                                {sampleStudent?.current_class || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full flex justify-between items-end mt-2">
                                        <div className="bg-white p-1 rounded">
                                            <Barcode
                                                value={sampleStudent?.admission_number || 'SAMPLE'}
                                                width={1.2}
                                                height={30}
                                                fontSize={10}
                                                displayValue={false}
                                            />
                                        </div>
                                        <div className="text-right">
                                            <div className="h-6 w-24 bg-slate-900/5 rounded border border-slate-900/10 mb-1 flex items-center justify-center italic text-[6px] text-slate-400">Principal Sign</div>
                                            <p className="text-[6px] font-bold uppercase text-slate-500">Authorized Signature</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => { setIsGenerating(true); setTimeout(() => setIsGenerating(false), 800); }}
                                className="p-3 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <RefreshCcw size={20} className="text-slate-600" />
                            </button>
                            <div className="text-[10px] items-center flex font-bold tracking-widest text-slate-400 uppercase bg-slate-100 px-4 rounded-full">
                                {sampleStudent ? `Previewing: ${sampleStudent.full_name}` : 'No student data found'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SectionTitle({ title, subtitle }: any) {
    return (
        <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
            <p className="text-sm font-medium text-slate-400">{subtitle}</p>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LayerToggle({ label, active = false, icon }: any) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${active ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
            <div className="flex items-center gap-3">
                <div className={active ? 'text-blue-600' : 'text-slate-400'}>
                    {icon || <Layers size={18} />}
                </div>
                <span className={`text-sm font-bold ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'right-1' : 'left-1'}`} />
            </div>
        </div>
    );
}
