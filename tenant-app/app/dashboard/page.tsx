'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useBranding } from '@/context/branding-context';
import {
    Users,
    GraduationCap,
    Database,
    TrendingUp,
    Plus,
    Calendar,
    Bell,
    Settings,
    type LucideIcon
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import KarmaCard from '@/components/karma/KarmaCard';

export default function Dashboard() {
    const { branding } = useBranding();
    const { data: session } = useSession();
    const [stats] = React.useState<StatCardProps[]>([
        { label: 'Students', value: '0', limit: '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', progress: 0, delay: 0 },
        { label: 'Teachers', value: '0', limit: '0', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-100', progress: 0, delay: 0.1 },
        { label: 'Storage', value: '0 MB', limit: '0 MB', icon: Database, color: 'text-orange-600', bg: 'bg-orange-100', progress: 0, delay: 0.2 },
    ]);

    // Placeholder for future stats fetching
    React.useEffect(() => {
        if (!session) return;
        // connection logic here
    }, [session]);

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
            {/* Welcome section with animation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-slate-500">Welcome back, {branding?.name}. Here&apos;s what&apos;s new today.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95">
                    <Plus size={20} />
                    <span>Enroll Student</span>
                </button>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KarmaCard />
                {stats.map((stat, i) => (
                    <StatCard key={stat.label} {...stat} delay={i * 0.1} />
                ))}
            </div>

            {/* Quick Actions & Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-slate-900">Management Shortcuts</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <QuickAction icon={GraduationCap} label="Add Teacher" color="blue" />
                        <QuickAction icon={Calendar} label="Attendance" color="emerald" />
                        <QuickAction icon={GraduationCap} label="Generate IDs" color="purple" onClick={() => window.location.href = '/dashboard/id-cards'} />
                        <QuickAction icon={Settings} label="Settings" color="slate" />
                    </div>

                    {/* Chart Placeholder / Performance */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-slate-800">Attendance Trends</h4>
                            <select className="text-xs font-semibold bg-slate-50 border-none rounded-lg p-2 outline-none">
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                            </select>
                        </div>
                        <div className="h-48 flex items-end justify-between gap-2 px-2">
                            {[45, 60, 52, 75, 40, 68, 85].map((val, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${val}%` }}
                                    transition={{ delay: 1 + (i * 0.1), duration: 0.8 }}
                                    className="flex-1 bg-blue-100 hover:bg-blue-500 rounded-t-lg transition-colors relative group"
                                >
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{val}% Present</span>
                                </motion.div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900">Recent Logs</h3>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-1">
                            <ActivityEntry
                                title="New enrollment"
                                name="Ahmed K."
                                time="2h ago"
                                icon={Users}
                                color="bg-blue-100 text-blue-600"
                            />
                            <ActivityEntry
                                title="Fee Paid"
                                name="Sarah M. - $200"
                                time="5h ago"
                                icon={TrendingUp}
                                color="bg-emerald-100 text-emerald-600"
                            />
                            <ActivityEntry
                                title="Absent Alert"
                                name="John D. - Grade 10"
                                time="1d ago"
                                icon={Bell}
                                color="bg-red-100 text-red-600"
                            />
                        </div>
                        <button className="w-full py-4 text-sm font-bold text-blue-600 hover:bg-slate-50 transition-colors border-t border-slate-100">
                            View All Activity
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string;
    limit: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    progress: number;
    delay: number;
}

function StatCard({ label, value, limit, icon: Icon, color, bg, progress, delay }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl ${bg} ${color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} />
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-2xl font-black text-slate-900">{value}</p>
                </div>
            </div>
            <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2">
                    <span>CAPACITY</span>
                    <span>{limit} MAX</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${progress}%` }}
                        transition={{ delay: delay + 0.3, duration: 1 }}
                        className={`h-full ${bg} ${color.replace('text', 'bg')}`}
                    />
                </div>
            </div>
        </motion.div>
    );
}

interface QuickActionProps {
    icon: LucideIcon;
    label: string;
    color: 'blue' | 'emerald' | 'purple' | 'slate';
    onClick?: () => void;
}

function QuickAction({ icon: Icon, label, color, onClick }: QuickActionProps) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600',
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-600',
        slate: 'bg-slate-50 text-slate-600 hover:bg-slate-600',
    };

    return (
        <motion.button
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`${colors[color]} p-4 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all h-full min-h-[100px] border border-transparent shadow-sm`}
        >
            <Icon size={24} className="group-hover:text-white transition-colors" />
            <span className="text-xs font-bold group-hover:text-white transition-colors text-center">{label}</span>
        </motion.button>
    );
}

interface ActivityEntryProps {
    title: string;
    name: string;
    time: string;
    icon: LucideIcon;
    color: string;
}

function ActivityEntry({ title, name, time, icon: Icon, color }: ActivityEntryProps) {
    return (
        <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-xl">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{title}</p>
                <p className="text-xs text-slate-500 truncate">{name}</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{time}</span>
        </div>
    );
}
