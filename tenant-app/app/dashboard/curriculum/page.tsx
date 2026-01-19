'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Layers, Hash } from 'lucide-react';

export default function CurriculumPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Simple state for adding (could be modal)
    const [newClass, setNewClass] = useState({ class_name: '', section: 'A', academic_year: '2024-2025' });
    const [newSubject, setNewSubject] = useState({ subject_name: '', subject_code: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [classesRes, subjectsRes] = await Promise.all([
                api.get('/curriculum/classes'),
                api.get('/curriculum/subjects')
            ]);
            setClasses(classesRes.data);
            setSubjects(subjectsRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const addClass = async () => {
        try {
            await api.post('/curriculum/classes', newClass);
            setNewClass({ class_name: '', section: 'A', academic_year: '2024-2025' });
            fetchData();
        } catch (e) { alert('Failed to add class'); }
    };

    const addSubject = async () => {
        try {
            await api.post('/curriculum/subjects', newSubject);
            setNewSubject({ subject_name: '', subject_code: '' });
            fetchData();
        } catch (e) { alert('Failed to add subject'); }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                    Curriculum
                </h1>
                <p className="text-slate-500">Manage classes, sections, and subjects.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Classes Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Layers className="h-5 w-5 text-indigo-500" />
                            Classes
                        </h2>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <input className="flex-1 px-3 py-2 border rounded-lg" placeholder="Class Name (e.g. Grade 1)" value={newClass.class_name} onChange={e => setNewClass({ ...newClass, class_name: e.target.value })} />
                        <input className="w-20 px-3 py-2 border rounded-lg" placeholder="Sec" value={newClass.section} onChange={e => setNewClass({ ...newClass, section: e.target.value })} />
                        <Button onClick={addClass} disabled={!newClass.class_name}><Plus size={16} /></Button>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {classes.map(c => (
                            <div key={c.class_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="font-medium">{c.class_name} - {c.section}</span>
                                <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border">{c.academic_year}</span>
                            </div>
                        ))}
                        {classes.length === 0 && <p className="text-slate-400 text-center py-4">No classes added</p>}
                    </div>
                </div>

                {/* Subjects Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Hash className="h-5 w-5 text-emerald-500" />
                            Subjects
                        </h2>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <input className="flex-1 px-3 py-2 border rounded-lg" placeholder="Subject Name" value={newSubject.subject_name} onChange={e => setNewSubject({ ...newSubject, subject_name: e.target.value })} />
                        <input className="w-24 px-3 py-2 border rounded-lg" placeholder="Code" value={newSubject.subject_code} onChange={e => setNewSubject({ ...newSubject, subject_code: e.target.value })} />
                        <Button onClick={addSubject} disabled={!newSubject.subject_name} className="bg-emerald-600 hover:bg-emerald-700"><Plus size={16} /></Button>
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {subjects.map(s => (
                            <div key={s.subject_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="font-medium">{s.subject_name}</span>
                                <span className="text-xs font-mono text-slate-500">{s.subject_code}</span>
                            </div>
                        ))}
                        {subjects.length === 0 && <p className="text-slate-400 text-center py-4">No subjects added</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
