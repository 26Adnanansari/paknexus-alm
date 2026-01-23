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

      <main className="pt-20 pb-8 px-4 md:px-6">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 md:gap-16 items-center pt-8 mb-12 md:pt-24 md:mb-40">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs md:text-sm font-bold mb-4 md:mb-6">
              <Zap className="h-3 w-3 md:h-4 md:w-4" />
              <span>Powered by PakAi Nexus AI</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 md:mb-8 leading-tight">
              Elevating <span className="gradient-text">Education</span> Standard.
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-6 md:mb-10 max-w-xl leading-relaxed">
              Welcome to <strong>{branding?.name || 'PakAi Nexus'}</strong>. We provide a state-of-the-art digital environment for students, teachers, and parents to collaborate and excel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={() => window.location.href = '/login'}
                className="px-6 py-3 md:px-8 md:py-4 bg-primary text-primary-foreground rounded-xl md:rounded-2xl font-bold premium-shadow hover:scale-105 transition-all flex items-center justify-center space-x-2 w-full sm:w-auto text-sm md:text-base"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={() => setIsSignupOpen(true)}
                className="px-6 py-3 md:px-8 md:py-4 bg-white dark:bg-slate-800 border-2 border-border rounded-xl md:rounded-2xl font-bold hover:bg-muted transition-all w-full sm:w-auto text-sm md:text-base"
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
                className="relative z-10 bg-white rounded-[24px] md:rounded-[32px] shadow-2xl w-full max-w-lg p-5 md:p-8 overflow-y-auto max-h-[90vh]"
              >
                <button
                  onClick={() => setIsSignupOpen(false)}
                  className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
                <SignupForm onClose={() => setIsSignupOpen(false)} />
              </motion.div>
            </div>
          )}

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative mt-8 lg:mt-0"
          >
            {/* Decorative Blob */}
            <div className="absolute -top-10 -left-10 md:-top-20 md:-left-20 w-48 h-48 md:w-64 md:h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -right-10 md:-bottom-20 md:-right-20 w-48 h-48 md:w-64 md:h-64 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-700" />

            <div className="glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 relative overflow-hidden aspect-square flex flex-col items-center justify-center text-center">
              <div className="bg-primary/5 p-4 md:p-8 rounded-full mb-4 md:mb-8">
                {branding?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={branding.logo_url} alt="Logo" className="w-24 md:w-48 h-auto" />
                ) : (
                  <Globe className="w-16 h-16 md:w-32 md:h-32 text-primary animate-spin-slow" />
                )}
              </div>
              <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-4">{branding?.name || 'PakAi Nexus'}</h2>
              <p className="text-muted-foreground max-w-xs text-sm md:text-base">{branding?.website || 'Official School Portal'}</p>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto mb-12 md:mb-32 space-y-24 md:space-y-32">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight">Core Modules</h2>
            <p className="text-base md:text-xl text-muted-foreground px-4 max-w-2xl mx-auto">Everything you need to manage your institution efficiently, all in one place.</p>
          </div>

          {/* Students Section */}
          <div id="students" className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center scroll-mt-24">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl w-fit mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Student Management</h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Comprehensive digital records for every student. Track admission details, attendance history, and academic performance in real-time.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Digital Student Profiles & Records',
                  'Real-time Attendance Tracking',
                  'Performance Analytics & Gradebooks',
                  'Parent Communication Portal'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="text-blue-600 font-bold hover:gap-3 gap-2 flex items-center transition-all bg-blue-50 px-6 py-3 rounded-xl hover:bg-blue-100">
                Learn more <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 bg-slate-100 rounded-[2rem] p-4 md:p-8 flex items-center justify-center min-h-[400px] border border-slate-200 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
              {/* Visual Placeholder for Generated Image */}
              <div className="text-center z-10 p-6">
                <Users className="h-24 w-24 text-blue-200 mx-auto mb-4 group-hover:scale-110 transition-transform duration-500" />
                <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Dashboard Preview</p>
                <p className="text-slate-300 text-xs mt-2">Replace with `students_management_dashboard.png`</p>
              </div>
            </motion.div>
          </div>

          {/* Teachers Section */}
          <div id="teachers" className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center scroll-mt-24">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="bg-slate-100 rounded-[2rem] p-4 md:p-8 flex items-center justify-center min-h-[400px] border border-slate-200 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-pink-500/5" />
              {/* Visual Placeholder for Generated Image */}
              <div className="text-center z-10 p-6">
                <UserCheck className="h-24 w-24 text-indigo-200 mx-auto mb-4 group-hover:scale-110 transition-transform duration-500" />
                <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Staff Interface Preview</p>
                <p className="text-slate-300 text-xs mt-2">Replace with `teachers_staff_management.png`</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl w-fit mb-6">
                <UserCheck className="h-8 w-8" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Teachers & Staff</h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Empower your faculty with tools that simplify administrative tasks. Manage schedules, payroll, and class assignments effortlessly.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Automated Schedule Management',
                  'Payroll & Leave Tracking',
                  'Digital Lesson Planning',
                  'Staff Directory & Roles'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="text-indigo-600 font-bold hover:gap-3 gap-2 flex items-center transition-all bg-indigo-50 px-6 py-3 rounded-xl hover:bg-indigo-100">
                Explore tools <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </div>

          {/* Curriculum Section */}
          <div id="curriculum" className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center scroll-mt-24">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="bg-violet-50 text-violet-600 p-3 rounded-2xl w-fit mb-6">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Academic Content</h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                A centralized hub for all learning materials. Distribute assignments, share resources, and manage the academic calendar with ease.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Digital Resource Library',
                  'Assignment & Homework Portal',
                  'Exam & Quiz Management',
                  'Curriculum Mapping'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700">
                    <div className="h-2 w-2 rounded-full bg-violet-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="text-violet-600 font-bold hover:gap-3 gap-2 flex items-center transition-all bg-violet-50 px-6 py-3 rounded-xl hover:bg-violet-100">
                View curriculum <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2 bg-slate-100 rounded-[2rem] p-4 md:p-8 flex items-center justify-center min-h-[400px] border border-slate-200 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-violet-500/5 to-fuchsia-500/5" />
              {/* Visual Placeholder for Generated Image */}
              <div className="text-center z-10 p-6">
                <BookOpen className="h-24 w-24 text-violet-200 mx-auto mb-4 group-hover:scale-110 transition-transform duration-500" />
                <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Curriculum Preview</p>
                <p className="text-slate-300 text-xs mt-2">Replace with `curriculum_academic_content.png`</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Banner - Reduced Padding for Mobile */}
        <section className="max-w-5xl mx-auto bg-slate-900 text-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-primary/30 rounded-full blur-3xl -mr-16 -mt-16 md:-mr-32 md:-mt-32" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start space-x-2 text-indigo-400 font-bold mb-3 md:mb-4 text-sm md:text-base">
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
                <span>Advanced Security</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-extrabold mb-3 md:mb-4">Your Data, Protected.</h2>
              <p className="text-slate-400 max-w-sm text-sm md:text-base mx-auto md:mx-0">We use enterprise-grade encryption and isolated database schemas to ensure your school&apos;s privacy.</p>
            </div>
            <button className="px-6 py-4 md:px-10 md:py-5 bg-white text-slate-900 rounded-xl md:rounded-2xl font-black text-sm md:text-lg hover:scale-105 transition-all shadow-2xl w-full md:w-auto">
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
