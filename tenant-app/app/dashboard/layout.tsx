'use client';

import React from 'react';
import { useBranding } from '@/context/branding-context';
import { motion, AnimatePresence } from 'framer-motion';
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
    Camera,
    type LucideIcon
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from "next-auth/react";

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

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

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
                        /* eslint-disable-next-line @next/next/no-img-element */
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

                <div className="px-6 py-2">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span className="font-semibold text-sm">Sign Out</span>
                    </button>
                </div>

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
            <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden pb-20 md:pb-0">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30 touch-target">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg touch-target flex items-center justify-center min-w-[44px] min-h-[44px]"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open sidebar menu"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                placeholder="Search anything..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-[40px]"
                                aria-label="Search dashboard"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            className="relative p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors touch-target flex items-center justify-center min-w-[44px] min-h-[44px]"
                            aria-label="View notifications"
                        >
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden xs:block">
                                <p className="text-sm font-bold text-slate-900">Admin User</p>
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
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 grid grid-cols-4 px-2 py-2 z-40 safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
                aria-label="Mobile navigation"
            >
                <NavButton icon={TrendingUp} label="Home" active={isActive('/dashboard')} onClick={() => router.push('/dashboard')} />
                <NavButton icon={Users} label="Students" active={isActive('/dashboard/students')} onClick={() => router.push('/dashboard/students')} />
                <NavButton icon={Calendar} label="Attend" active={isActive('/dashboard/attendance')} onClick={() => router.push('/dashboard/attendance')} />
                <NavButton icon={Camera} label="Moments" active={isActive('/dashboard/moments')} onClick={() => router.push('/dashboard/moments')} />
            </nav>

            {/* Slide-out Mobile Menu Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-hidden="true"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="absolute top-0 bottom-0 left-0 w-[85vw] max-w-[320px] bg-white p-6 shadow-2xl flex flex-col z-50"
                            role="dialog"
                            aria-label="Sidebar menu"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="font-black text-2xl tracking-tighter text-blue-600 italic">PAK NEXUS</div>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 -mr-2 text-slate-500 hover:text-slate-900 touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    aria-label="Close menu"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="space-y-2 flex-1 overflow-y-auto">
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
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors min-h-[48px]"
                                >
                                    <LogOut size={20} />
                                    <span className="font-semibold text-sm">Sign Out</span>
                                </button>
                            </div>
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface NavItemProps {
    icon: LucideIcon;
    label: string;
    active?: boolean;
    onClick: () => void;
}

function NavItem({ icon: Icon, label, active = false, onClick }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 min-h-[48px] ${active
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-bold'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
        >
            <Icon size={20} />
            <span className="text-base">{label}</span>
        </button>
    );
}

interface NavButtonProps {
    icon: LucideIcon;
    label: string;
    active?: boolean;
    onClick: () => void;
}

function NavButton({ icon: Icon, label, active = false, onClick }: NavButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] w-full active:scale-95 transition-transform ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
        >
            <div className={`p-1.5 rounded-full ${active ? 'bg-blue-50' : ''}`}>
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
        </button>
    );
}
