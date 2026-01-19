'use client';

import React from 'react';
import { useBranding } from '@/context/branding-context';
import { motion } from 'framer-motion';
import {
    Users,
    GraduationCap,
    TrendingUp,
    Calendar,
    BookOpen,
    Settings,
    Bell,
    Search,
    Menu,
    X,
    LogOut,
    Camera
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { branding, loading } = useBranding();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const pathname = usePathname();
    const router = useRouter();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { icon: TrendingUp, label: "Overview", path: "/dashboard" },
        { icon: Users, label: "Students", path: "/dashboard/students" },
        { icon: GraduationCap, label: "Teachers", path: "/dashboard/teachers" },
        { icon: Calendar, label: "Attendance", path: "/dashboard/attendance" },
        { icon: BookOpen, label: "Curriculum", path: "/dashboard/curriculum" },
        { icon: Camera, label: "Moments", path: "/dashboard/moments" },
        { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen z-40">
                <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => router.push('/')}>
                    {branding?.logo_url ? (
                        <img src={branding.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
                    ) : (
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">PN</div>
                    )}
                    <span className="font-bold text-xl tracking-tight text-slate-900 line-clamp-1">{branding?.name || 'School Portal'}</span>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            active={isActive(item.path)}
                            onClick={() => router.push(item.path)}
                        />
                    ))}
                </nav>

                <div className="mt-auto p-4 bg-slate-100 rounded-xl">
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Plan Status</p>
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">Premium Trial</span>
                        <span className="text-blue-600 font-bold">75%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} className="bg-blue-600 h-full" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-x-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                placeholder="Search anything..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden xs:block">
                                <p className="text-sm font-semibold text-slate-900">Admin User</p>
                                <p className="text-xs text-slate-500 uppercase tracking-tighter">School Head</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-slate-100">
                                <Users size={20} className="text-slate-500" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 grid grid-cols-4 px-2 py-3 z-40 safe-area-pb">
                <NavButton icon={TrendingUp} label="Home" active={isActive('/dashboard')} onClick={() => router.push('/dashboard')} />
                <NavButton icon={Users} label="Students" active={isActive('/dashboard/students')} onClick={() => router.push('/dashboard/students')} />
                <NavButton icon={Calendar} label="Attend" active={isActive('/dashboard/attendance')} onClick={() => router.push('/dashboard/attendance')} />
                <NavButton icon={Camera} label="Moments" active={isActive('/dashboard/moments')} onClick={() => router.push('/dashboard/moments')} />
            </nav>

            {/* Slide-out Mobile Menu Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        className="absolute top-0 bottom-0 left-0 w-80 bg-white p-6 shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-10">
                            <div className="font-black text-2xl tracking-tighter text-blue-600 italic">PAK NEXUS</div>
                            <button onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="space-y-2 flex-1">
                            {navItems.map((item) => (
                                <NavItem
                                    key={item.path}
                                    icon={item.icon}
                                    label={item.label}
                                    active={isActive(item.path)}
                                    onClick={() => {
                                        router.push(item.path);
                                        setIsMobileMenuOpen(false);
                                    }}
                                />
                            ))}
                        </div>
                        <div className="mt-auto pt-6 border-t border-slate-100">
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                <LogOut size={20} />
                                <span className="font-semibold text-sm">Sign Out</span>
                            </button>
                        </div>
                    </motion.aside>
                </div>
            )}
        </div>
    );
}

function NavItem({ icon: Icon, label, active = false, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
        >
            <Icon size={20} />
            <span className="font-semibold text-sm">{label}</span>
        </button>
    );
}

function NavButton({ icon: Icon, label, active = false, onClick }: any) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
            <Icon size={22} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </button>
    );
}
