'use client';

import React from 'react';
import { useBranding } from '@/context/branding-context';
import { motion } from 'framer-motion';
import { GraduationCap, LogIn, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Navbar() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { branding } = useBranding() as any;
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const handleLogin = () => {
        router.push('/login');
    };

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 right-0 z-[100] px-4 py-3 md:px-6 md:py-4"
            >
                <div className="max-w-7xl mx-auto glass rounded-2xl px-4 py-2 md:px-6 md:py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {branding?.logo_url ? (
                            <div className="relative h-8 w-8 md:h-10 md:w-10">
                                <Image
                                    src={branding.logo_url}
                                    alt="Logo"
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 32px, 40px"
                                />
                            </div>
                        ) : (
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                            </div>
                        )}
                        <span className="text-lg md:text-xl font-bold tracking-tight text-foreground truncate max-w-[150px] md:max-w-none">
                            {branding?.name || 'PakAi Nexus'}
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#" className="font-medium text-muted-foreground hover:text-primary transition-colors">Students</a>
                        <a href="#" className="font-medium text-muted-foreground hover:text-primary transition-colors">Teachers</a>
                        <a href="#" className="font-medium text-muted-foreground hover:text-primary transition-colors">Curriculum</a>
                        <button
                            onClick={handleLogin}
                            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold premium-shadow hover:scale-105 transition-all flex items-center space-x-2"
                        >
                            <LogIn className="h-4 w-4" />
                            <span>Login</span>
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2">
                            <Menu className="h-6 w-6 text-muted-foreground" />
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[200] md:hidden overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        className="absolute top-0 bottom-0 right-0 w-80 bg-white dark:bg-slate-900 p-6 shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <span className="font-bold text-xl truncate pr-4">{branding?.name || 'Menu'}</span>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="space-y-4 flex flex-col flex-1">
                            <a href="#" className="text-base font-medium p-2 hover:bg-slate-50 rounded-lg transition-colors">Students</a>
                            <a href="#" className="text-base font-medium p-2 hover:bg-slate-50 rounded-lg transition-colors">Teachers</a>
                            <a href="#" className="text-base font-medium p-2 hover:bg-slate-50 rounded-lg transition-colors">Curriculum</a>
                        </div>
                        <div className="pt-6 mt-auto border-t border-border">
                            <button
                                onClick={handleLogin}
                                className="bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-bold w-full flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all"
                            >
                                <LogIn className="h-5 w-5" />
                                <span>Login</span>
                            </button>
                        </div>
                    </motion.aside>
                </div>
            )}
        </>
    );
}
