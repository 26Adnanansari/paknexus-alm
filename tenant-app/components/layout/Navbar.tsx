'use client';

import React from 'react';
import { useBranding } from '@/context/branding-context';
import { motion } from 'framer-motion';
import { GraduationCap, LogIn, Menu, X } from 'lucide-react';

export default function Navbar() {
    const { branding } = useBranding();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 right-0 z-[100] px-6 py-4"
            >
                <div className="max-w-7xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {branding?.logo_url ? (
                            <img src={branding.logo_url} alt="Logo" className="h-10 w-auto" />
                        ) : (
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <GraduationCap className="h-6 w-6 text-primary" />
                            </div>
                        )}
                        <span className="text-xl font-bold tracking-tight text-foreground">
                            {branding?.name || 'PakAi Nexus'}
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#" className="font-medium text-muted-foreground hover:text-primary transition-colors">Students</a>
                        <a href="#" className="font-medium text-muted-foreground hover:text-primary transition-colors">Teachers</a>
                        <a href="#" className="font-medium text-muted-foreground hover:text-primary transition-colors">Curriculum</a>
                        <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold premium-shadow hover:scale-105 transition-all flex items-center space-x-2">
                            <LogIn className="h-4 w-4" />
                            <span>Login</span>
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(true)}>
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
                        <div className="flex items-center justify-between mb-10">
                            <span className="font-bold text-xl">{branding?.name || 'Menu'}</span>
                            <button onClick={() => setIsMobileMenuOpen(false)}>
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="space-y-6 flex flex-col">
                            <a href="#" className="text-lg font-medium hover:text-primary transition-colors">Students</a>
                            <a href="#" className="text-lg font-medium hover:text-primary transition-colors">Teachers</a>
                            <a href="#" className="text-lg font-medium hover:text-primary transition-colors">Curriculum</a>
                            <hr className="border-border" />
                            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold w-full">
                                Login
                            </button>
                        </div>
                    </motion.aside>
                </div>
            )}
        </>
    );
}
