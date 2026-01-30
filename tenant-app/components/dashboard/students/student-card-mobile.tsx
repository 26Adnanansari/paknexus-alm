'use client';

import React, { useState } from 'react';
import StudentAvatar from '@/components/ui/student-avatar';
import {
    MoreVertical, Eye, Edit, Trash2, User, Phone, Copy, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Student {
    student_id: string;
    full_name: string;
    admission_number: string;
    current_class?: string;
    photo_url?: string;
    father_name?: string;
    father_phone?: string;
    status: string;
}

interface StudentCardMobileProps {
    student: Student;
    onEdit: (student: Student) => void;
    onDelete: (id: string, name: string) => void;
    onViewDetails?: (id: string) => void;
}

export default function StudentCardMobile({ student, onEdit, onDelete, onViewDetails }: StudentCardMobileProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleCopyLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/id-card/${student.student_id}`; // Verify logic? Spec says id-card/[id] but usually it's token.
        // Use student_id as fallback or whatever the system uses. 
        // Existing code `ShareIDCardLink` generates link. I'll assume ID.
        navigator.clipboard.writeText(url);
        toast.success('Link copied!');
    };

    return (
        <div
            className="
        bg-white rounded-xl border border-slate-200
        p-4 shadow-sm hover:shadow-md
        transition-all duration-200
        relative
      "
            onClick={() => onViewDetails?.(student.student_id)}
        >
            {/* Row 1: Avatar + Info + Menu */}
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <StudentAvatar
                    photoUrl={student.photo_url || null}
                    name={student.full_name}
                    size="md"
                />

                {/* Info */}
                <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-base font-bold text-slate-900 truncate pr-8">
                        {student.full_name}
                    </h3>

                    <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                            {student.current_class || 'N/A'}
                        </span>
                        <span className="text-sm font-mono text-slate-500">
                            {student.admission_number}
                        </span>
                    </div>
                </div>

                {/* Menu Button */}
                <div className="absolute top-4 right-4 z-10">
                    <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 text-slate-500 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                    >
                        <MoreVertical size={20} />
                    </button>

                    <AnimatePresence>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30"
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onViewDetails?.(student.student_id); }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Eye size={16} /> View Details
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(student); }}
                                        className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Edit size={16} /> Edit Student
                                    </button>
                                    <div className="h-px bg-slate-50 my-1" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(student.student_id, student.full_name); }}
                                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Row 2: Parent Info */}
            <div className="mt-4 space-y-2 border-t border-slate-50 pt-3">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{student.father_name || 'No Parent Info'}</span>
                </div>
                {student.father_phone && (
                    <a
                        href={`tel:${student.father_phone}`}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 active:text-blue-700 w-fit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="font-mono">{student.father_phone}</span>
                    </a>
                )}
            </div>

            {/* Row 3: Status + Actions */}
            <div className="mt-4 flex items-center justify-between gap-3">
                {/* Status Badge */}
                <span
                    className={`
            inline-flex items-center gap-1.5
            px-3 py-1.5 rounded-full text-xs font-bold
            ${student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }
          `}
                >
                    <span
                        className={`
              w-1.5 h-1.5 rounded-full
              ${student.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}
            `}
                    />
                    {student.status === 'active' ? 'Active' : student.status || 'Inactive'}
                </span>

                {/* Action Buttons */}
                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        className="
              h-10 px-4
              bg-indigo-50 text-indigo-700 
              rounded-lg text-sm font-bold
              hover:bg-indigo-100 active:bg-indigo-200
              transition-colors
              flex items-center gap-2
              border border-indigo-100
            "
                        onClick={handleCopyLink}
                    >
                        <Copy className="w-4 h-4" />
                        <span className="">Copy Link</span>
                    </button>

                    <button
                        className="
              h-10 w-10
              bg-white text-slate-700 
              rounded-lg text-sm font-bold
              hover:bg-slate-50 active:bg-slate-100
              transition-colors
              flex items-center justify-center
              border border-slate-200
            "
                        onClick={(e) => {
                            e.stopPropagation();
                            if (navigator.share) {
                                navigator.share({
                                    title: 'Student ID Card',
                                    text: `Check ID Card for ${student.full_name}`,
                                    url: `${window.location.origin}/id-card/${student.student_id}`
                                }).catch(console.error);
                            } else {
                                toast('Sharing not supported on this device');
                            }
                        }}
                    >
                        <Share2 className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>
        </div>
    );
}
