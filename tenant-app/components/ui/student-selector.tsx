'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Check, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import StudentAvatar from '@/components/ui/student-avatar';
import { cn } from '@/lib/utils';
// import { toast } from 'sonner';

export interface StudentCompact {
    student_id: string;
    full_name: string;
    admission_number: string;
    current_class: string;
    photo_url?: string;
    status: string;
}

interface StudentSelectorProps {
    onSelect: (students: StudentCompact[]) => void;
    multiSelect?: boolean;
    preSelected?: string[]; // IDs
    className?: string;
    label?: string;
}

export default function StudentSelector({
    onSelect,
    multiSelect = false,
    preSelected = [],
    className,
    label = "Select Students"
}: StudentSelectorProps) {
    const [students, setStudents] = useState<StudentCompact[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('');

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preSelected));

    useEffect(() => {
        fetchClasses();
        fetchStudents();
    }, []);

    // Re-fetch when class filter changes
    useEffect(() => {
        fetchStudents();
    }, [classFilter]);

    // Notify parent on selection change
    useEffect(() => {
        const selectedStudents = students.filter(s => selectedIds.has(s.student_id));
        // We might need to keep track of selected students even if they are filtered out
        // For now complex logic omitted, assuming filtered list is main source
        onSelect(selectedStudents);
    }, [selectedIds, students]);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/curriculum/classes'); // Using the new endpoint
            // If it returns list of objects
            if (Array.isArray(res.data)) {
                const names = res.data.map((c: any) => c.class_name);
                setClasses(Array.from(new Set(names)));
            }
        } catch (e) {
            console.error("Failed to fetch classes", e);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 }; // Reasonable limit for selector
            if (classFilter) params.current_class = classFilter;

            // Backend search isn't fully robust yet, usually we fetch all for class and filter client side
            // But let's verify if we have a search endpoint. 
            // Usually /students list endpoint doesn't support generic fuzzy search efficiently yet
            // So we'll fetch list and filter client-side for name, but server-side for class

            const res = await api.get('/students', { params });
            // API usually returns list of students
            if (Array.isArray(res.data)) {
                // Ensure photo_url is present (mapped in backend now)
                setStudents(res.data);
            }
        } catch (e) {
            console.error("Failed to fetch students", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(multiSelect ? selectedIds : []);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={cn("flex flex-col gap-4 border border-slate-200 rounded-xl p-4 bg-white shadow-sm", className)}>
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700">{label}</h3>
                {multiSelect && (
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {selectedIds.size} Selected
                    </span>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search name or ID..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-slate-50"
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* List */}
            <div className="h-64 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                        <span className="text-xs">Loading students...</span>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <span className="text-sm">No students found</span>
                    </div>
                ) : (
                    filteredStudents.map(student => {
                        const isSelected = selectedIds.has(student.student_id);
                        return (
                            <div
                                key={student.student_id}
                                onClick={() => toggleSelection(student.student_id)}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border",
                                    isSelected
                                        ? "bg-blue-50 border-blue-200"
                                        : "hover:bg-slate-50 border-transparent"
                                )}
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                    isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                                )}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>

                                <StudentAvatar
                                    name={student.full_name}
                                    photoUrl={student.photo_url || null}
                                    size="sm"
                                    className="w-8 h-8 text-xs"
                                />

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{student.full_name}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span className="font-mono">{student.admission_number}</span>
                                        <span>•</span>
                                        <span>{student.current_class}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
