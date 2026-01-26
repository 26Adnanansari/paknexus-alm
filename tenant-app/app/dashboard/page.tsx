'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const router = useRouter();

    // Stats State
    const [stats, setStats] = React.useState<StatCardProps[]>([
        { label: 'Students', value: '0', limit: '500', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', progress: 0, delay: 0 },
        { label: 'Teachers', value: '0', limit: '50', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-100', progress: 0, delay: 0.1 },
        { label: 'Storage', value: '120 MB', limit: '1 GB', icon: Database, color: 'text-orange-600', bg: 'bg-orange-100', progress: 12, delay: 0.2 },
    ]);

    // Attendance State
    const [attendanceTrends, setAttendanceTrends] = React.useState<{ labels: string[], data: number[] }>({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [0, 0, 0, 0, 0, 0, 0]
    });

    // Fetch real stats
    React.useEffect(() => {
        if (session?.user) {
            const fetchStats = async () => {
                try {
                    const api = (await import('@/lib/api')).default;

                    // 1. Fetch Basic Stats
                    const res = await api.get('/school/stats');
                    const data = res.data;

                    setStats(prev => [
                        {
                            ...prev[0],
                            value: data.students.toString(),
                            limit: data.student_limit.toString(),
                            progress: Math.min((data.students / data.student_limit) * 100, 100)
                        },
                        {
                            ...prev[1],
                            value: data.teachers.toString(),
                            limit: data.teacher_limit.toString(),
                            progress: Math.min((data.teachers / data.teacher_limit) * 100, 100)
                        },
                        {
                            ...prev[2],
                            value: `${data.storage_mb} MB`,
                            limit: `${data.storage_limit_mb} MB`,
                            progress: Math.min((data.storage_mb / data.storage_limit_mb) * 100, 100)
                        }
                    ]);

                    // 2. Fetch Attendance Trends
                    try {
                        const attRes = await api.get('/attendance/stats');
                        if (attRes.data?.error) {
                            // If backend signals missing table or other error, try init
                            console.log("Self-healing attendance tables...");
                            await api.post('/attendance/system/init-tables');
                            const retry = await api.get('/attendance/stats');
                            if (!retry.data?.error) setAttendanceTrends(retry.data);
                        } else if (attRes.data && attRes.data.data && attRes.data.data.length > 0) {
                            setAttendanceTrends(attRes.data);
                        }
                    } catch (e) {
                        // Fallback for 500 error (if backend not updated yet)
                        try {
                            await api.post('/attendance/system/init-tables');
                        } catch (err) { console.error("Init failed", err); }
                    }

                } catch (error) {
                    console.error("Failed to fetch dashboard stats:", error);
                }
            };
            fetchStats();
        }
    }, [session]);

    return (
        <div className="p-4 md:p-6 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
            {/* Welcome section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2"
            >
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-1">Dashboard Overview</h1>
                    <p className="text-sm md:text-base text-slate-500 font-medium">Welcome back, {branding?.name}. Here&apos;s what&apos;s new today.</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/students')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 touch-target h-[44px] text-sm md:text-base w-full sm:w-auto"
                >
                    <Plus size={18} />
                    <span>Enroll Student</span>
                </button>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="sm:col-span-2 lg:col-span-1">
                    <KarmaCard />
                </div>
                {stats.map((stat, i) => (
                    <StatCard key={stat.label} {...stat} delay={i * 0.1} />
                ))}
            </div>

            {/* Quick Actions & Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Quick Actions & Charts */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-fluid-h3 text-slate-900">Management Shortcuts</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <QuickAction icon={GraduationCap} label="Add Teacher" color="blue" onClick={() => router.push('/dashboard/teachers')} />
                        <QuickAction icon={Calendar} label="Attendance" color="emerald" onClick={() => router.push('/dashboard/attendance')} />
                        <QuickAction icon={GraduationCap} label="Generate IDs" color="purple" onClick={() => router.push('/dashboard/id-cards')} />
                        <QuickAction icon={Settings} label="Settings" color="slate" onClick={() => router.push('/dashboard/settings')} />
                    </div>

                    {/* Chart Data */}
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-slate-800 text-lg">Attendance Trends</h4>
                            <select
                                className="text-xs font-semibold bg-slate-50 border-none rounded-lg p-2 outline-none touch-target"
                                aria-label="Select date range"
                            >
                                <option>Last 7 Days</option>
                            </select>
                        </div>
                        <div className="h-48 flex items-end justify-between gap-2 px-2" role="img" aria-label="Attendance bar chart">
                            {attendanceTrends.data.length > 0 ? attendanceTrends.data.map((val, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${val}%` }}
                                    transition={{ delay: 1 + (i * 0.1), duration: 0.8 }}
                                    className="flex-1 bg-blue-100 hover:bg-blue-500 rounded-t-lg transition-colors relative group"
                                >
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{val}% Present</span>
                                </motion.div>
                            )) : (
                                <div className="text-center w-full text-slate-400 text-sm self-center">No attendance data for this week</div>
                            )}
                        </div>
                        <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                            {attendanceTrends.labels.map((lbl, i) => (
                                <span key={i}>{lbl}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activity (Still Hardcoded for now) */}
                <div className="space-y-6">
                    <h3 className="text-fluid-h3 text-slate-900">Recent Logs</h3>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-1">
                            <ActivityEntry
                                title="New Staff Added"
                                name="System"
                                time="Just now"
                                icon={Users}
                                color="bg-blue-100 text-blue-600"
                            />
                            <ActivityEntry
                                title="Fee Collection"
                                name="Pending Setup"
                                time="--h ago"
                                icon={TrendingUp}
                                color="bg-emerald-100 text-emerald-600"
                            />
                            <ActivityEntry
                                title="System Update"
                                name="Version 1.0.1"
                                time="Today"
                                icon={Bell}
                                color="bg-purple-100 text-purple-600"
                            />
                        </div>
                        <button className="w-full py-4 text-sm font-bold text-blue-600 hover:bg-slate-50 transition-colors border-t border-slate-100 min-h-[48px]">
                            View All Logs
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
            className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm hover:premium-shadow transition-all group flex flex-col justify-between h-[110px] md:h-full min-h-[110px]"
        >
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2.5 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={20} />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-xl font-black text-slate-900 leading-tight">{value}</p>
                </div>
            </div>
            <div className="mt-auto">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                    <span>CAPACITY</span>
                    <span>{limit} MAX</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
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
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`${colors[color]} p-3 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all h-[90px] w-full border border-transparent shadow-sm`}
            aria-label={label}
        >
            <Icon size={24} className="group-hover:text-white transition-colors" />
            <span className="text-[11px] font-bold group-hover:text-white transition-colors text-center leading-tight">{label}</span>
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
        <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-xl cursor-default">
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
