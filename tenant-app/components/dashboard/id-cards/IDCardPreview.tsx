'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Upload, User, GraduationCap } from 'lucide-react';
import QRCode from 'react-qr-code';

export interface IDCardData {
    id: string; // student_id or staff_id
    full_name: string;
    admission_number: string; // employee_id for staff
    current_class: string; // role/designation for staff
    photo_url?: string;
    father_name?: string; // department for staff
    father_phone?: string;
    type?: 'student' | 'staff'; // to adjust labels
    address?: string;
}

interface IDCardPreviewProps {
    data: IDCardData | null;
    frontBg: string | null;
    backBg: string | null;
    branding?: { name: string; logo_url?: string };
    isFlipped: boolean;
    className?: string;
    showPlaceholder?: boolean;
}

export default function IDCardPreview({
    data,
    frontBg,
    backBg,
    branding,
    isFlipped,
    className = "",
    showPlaceholder = true
}: IDCardPreviewProps) {

    // Labels based on type
    const isStaff = data?.type === 'staff';
    const classLabel = isStaff ? "Designation" : "Class";
    const idLabel = isStaff ? "Employee ID" : "Roll No";
    const parentLabel = isStaff ? "Department" : "Guardian";

    // If no data and no placeholder allowed, return null or skeletal
    if (!data && !showPlaceholder) return null;

    return (
        <div className={`w-[300px] h-[480px] [perspective:1000px] ${className}`}>
            <motion.div
                className="w-full h-full relative [transform-style:preserve-3d] transition-all duration-500"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
            >
                {/* Front Side */}
                <div className="absolute inset-0 bg-white rounded-2xl shadow-xl overflow-hidden [backface-visibility:hidden] border border-slate-200">
                    {frontBg ? (
                        <img src={frontBg} className="w-full h-full object-cover" alt="Card Front" />
                    ) : (
                        <div className="p-10 text-center text-slate-300 flex flex-col items-center h-full justify-center gap-2 bg-slate-50">
                            <Upload />
                            <span className="text-xs">No Front Design</span>
                        </div>
                    )}

                    {/* Dynamic Content Overlay (Front) */}
                    {frontBg && (
                        <div className="absolute inset-0 p-5 flex flex-col items-center">
                            {/* Header */}
                            <div className="w-full flex justify-between items-start mb-4">
                                <div className="w-10 h-10 bg-white/90 p-1 rounded shadow-sm flex items-center justify-center">
                                    {branding?.logo_url ? (
                                        <img src={branding.logo_url} className="w-full h-full object-contain" alt="Logo" />
                                    ) : (
                                        <GraduationCap className="text-blue-600 w-6 h-6" />
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900 text-[10px] uppercase leading-none max-w-[120px]">
                                        {branding?.name || 'School Name'}
                                    </p>
                                </div>
                            </div>

                            {/* Photo */}
                            <div className="w-28 h-32 bg-slate-200 rounded-lg border-4 border-white shadow-md mb-3 overflow-hidden relative">
                                {data?.photo_url ? (
                                    <img src={data.photo_url} className="w-full h-full object-cover" alt={data.full_name} />
                                ) : (
                                    <User className="w-full h-full p-4 text-slate-400 absolute inset-0" />
                                )}
                            </div>

                            {/* Name */}
                            <h2 className="text-lg font-black text-slate-900 uppercase text-center leading-tight mb-1 line-clamp-2 px-2">
                                {data?.full_name || 'Name Here'}
                            </h2>
                            {isStaff && <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1">STAFF</div>}

                            {/* Details Grid */}
                            <div className="mt-auto w-full grid grid-cols-2 gap-2 text-[8px]">
                                <div>
                                    <p className="font-bold text-slate-500 uppercase">{classLabel}</p>
                                    <p className="font-bold text-slate-900 text-xs truncate max-w-[100px]">{data?.current_class || '-'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-500 uppercase">{idLabel}</p>
                                    <p className="font-bold text-slate-900 text-xs">{data?.admission_number || '-'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 bg-white rounded-2xl shadow-xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] border border-slate-200">
                    {backBg ? (
                        <img src={backBg} className="w-full h-full object-cover" alt="Card Back" />
                    ) : (
                        <div className="p-10 text-center text-slate-300 flex flex-col items-center h-full justify-center gap-2 bg-slate-50">
                            <Upload />
                            <span className="text-xs">No Back Design</span>
                        </div>
                    )}

                    {/* Dynamic Content Overlay (Back) */}
                    {backBg && (
                        <div className="absolute inset-0 p-5 flex flex-col">
                            <div className="mt-8 space-y-3">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">{parentLabel}</p>
                                    <p className="font-bold text-slate-900 text-sm">{data?.father_name || '-'}</p>
                                </div>
                                {data?.father_phone && (
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Contact</p>
                                        <p className="font-bold text-slate-900 text-sm">{data.father_phone}</p>
                                    </div>
                                )}

                                {isStaff && data?.address && (
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Address</p>
                                        <p className="font-bold text-slate-900 text-[10px] leading-tight line-clamp-3">{data.address}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto self-center text-center">
                                <div className="bg-white p-2 rounded shadow-sm border mb-1 inline-block">
                                    {data?.id ? (
                                        <QRCode value={isStaff ? `STAFF:${data.id}` : data.id} size={64} />
                                    ) : (
                                        <div className="w-16 h-16 bg-slate-100" />
                                    )}
                                </div>
                                <p className="text-[8px] font-bold text-slate-400">Scan to Verify</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
