'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { useBranding } from '@/context/branding-context';
import { motion } from 'framer-motion';
import { Users, BookOpen, UserCheck, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import SignupForm from '@/components/SignupForm';

export default function Home() {
  const { branding } = useBranding();
  const [isSignupOpen, setIsSignupOpen] = React.useState(false);

  const features = [
    {
      icon: Users,
      title: "Student Management",
      desc: "Complete digital records, attendance tracking, and performance analytics.",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      icon: UserCheck,
      title: "Staff & Teachers",
      desc: "Efficient staff attendance, payroll, and class assignment management.",
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      icon: BookOpen,
      title: "Academic Content",
      desc: "Distribute learning materials, assignments, and digital resources.",
      color: "text-violet-600",
      bg: "bg-violet-50"
    }
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <Navbar />

      <main className="pt-24 pb-20 px-6">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center pt-24 mb-40">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm font-bold mb-6">
              <Zap className="h-4 w-4" />
              <span>Powered by PakAi Nexus AI</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Elevating <span className="gradient-text">Education</span> Standard.
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-xl leading-relaxed">
              Welcome to <strong>{branding?.name || 'PakAi Nexus'}</strong>. We provide a state-of-the-art digital environment for students, teachers, and parents to collaborate and excel.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold premium-shadow hover:scale-105 transition-all flex items-center space-x-2">
                <span>Go to Dashboard</span>
                <ArrowRight className="h-5 w-5" />
              </a>
              <button
                onClick={() => setIsSignupOpen(true)}
                className="px-8 py-4 bg-white dark:bg-slate-800 border-2 border-border rounded-2xl font-bold hover:bg-muted transition-all"
              >
                Start Free Trial
              </button>
            </div>
          </motion.div>

          {/* Signup Modal */}
          {isSignupOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setIsSignupOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg p-8 overflow-y-auto max-h-[90vh]"
              >
                <button
                  onClick={() => setIsSignupOpen(false)}
                  className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
                <SignupForm onClose={() => setIsSignupOpen(false)} />
              </motion.div>
            </div>
          )}

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            {/* Decorative Blob */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700" />

            <div className="glass rounded-[2rem] p-8 relative overflow-hidden aspect-square flex flex-col items-center justify-center text-center">
              <div className="bg-primary/5 p-8 rounded-full mb-8">
                {branding?.logo_url ? (
                  <img src={branding.logo_url} alt="Logo" className="w-48 h-auto" />
                ) : (
                  <Globe className="w-32 h-32 text-primary animate-spin-slow" />
                )}
              </div>
              <h2 className="text-3xl font-bold mb-4">{branding?.name || 'PakAi Nexus'}</h2>
              <p className="text-muted-foreground max-w-xs">{branding?.website || 'Official School Portal'}</p>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Core Modules</h2>
            <p className="text-muted-foreground">Everything you need to manage your institution efficiently.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-8 rounded-3xl group hover:border-primary/50 transition-all cursor-default"
              >
                <div className={`${f.bg} p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`h-8 w-8 ${f.color}`} />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Trust Banner */}
        <section className="max-w-5xl mx-auto bg-slate-900 text-white rounded-[3rem] p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl -mr-32 -mt-32" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-4">
                <ShieldCheck className="h-5 w-5" />
                <span>Advanced Security</span>
              </div>
              <h2 className="text-4xl font-extrabold mb-4">Your Data, Protected.</h2>
              <p className="text-slate-400 max-w-sm">We use enterprise-grade encryption and isolated database schemas to ensure your school's privacy.</p>
            </div>
            <button className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-2xl">
              Request Audit 🔐
            </button>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 text-muted-foreground">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 bg-primary rounded-md" />
          <span className="font-bold text-foreground">PakAi Nexus</span>
        </div>
        <p>© 2026 PakAi Nexus. All rights reserved.</p>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
          <a href="#" className="hover:text-primary transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
