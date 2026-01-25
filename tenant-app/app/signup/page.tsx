'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { School, Loader2, User, Lock, Mail, Building, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        // School Information
        schoolName: '',
        schoolEmail: '',
        schoolPhone: '',
        schoolAddress: '',

        // Admin User Information
        adminName: '',
        adminEmail: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password strength
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/public/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    school_name: formData.schoolName,
                    subdomain: formData.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-'), // Auto-generate subdomain from school name
                    admin_email: formData.adminEmail,
                    admin_password: formData.password,
                    contact_phone: formData.schoolPhone || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Registration failed');
            }

            // Show success message and redirect to login
            const result = await response.json();
            alert(`Registration successful! Your subdomain is: ${result.subdomain}\nYou can now login at the tenant app.`);
            router.push('/login');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-900 py-12">
            {/* Animated Background Gradients */}
            <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[100px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] left-[30%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-4xl mx-4"
            >
                {/* Glassmorphism Card */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-6 md:p-10 relative overflow-hidden">

                    {/* Decorative shine effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-blue-500 to-indigo-600 h-14 w-14 md:h-16 md:w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20"
                        >
                            <School className="text-white h-7 w-7 md:h-8 md:w-8" />
                        </motion.div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Create Your School Account</h1>
                        <p className="text-slate-400 mt-2 text-sm">Start your 14-day free trial • No credit card required</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-3 text-xs font-medium text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* School Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Building className="h-5 w-5 text-blue-400" />
                                School Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative group">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.schoolName}
                                        onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 h-12 md:h-14 text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-slate-900/70"
                                        placeholder="School Name *"
                                        aria-label="School Name"
                                    />
                                </div>

                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.schoolEmail}
                                        onChange={(e) => setFormData({ ...formData, schoolEmail: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 h-12 md:h-14 text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-slate-900/70"
                                        placeholder="School Email *"
                                        aria-label="School Email"
                                    />
                                </div>

                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="tel"
                                        value={formData.schoolPhone}
                                        onChange={(e) => setFormData({ ...formData, schoolPhone: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 h-12 md:h-14 text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-slate-900/70"
                                        placeholder="School Phone"
                                        aria-label="School Phone"
                                    />
                                </div>

                                <div className="relative group md:col-span-1">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={formData.schoolAddress}
                                        onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 h-12 md:h-14 text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-slate-900/70"
                                        placeholder="School Address"
                                        aria-label="School Address"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Admin User Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-400" />
                                Administrator Account
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.adminName}
                                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 h-12 md:h-14 text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-slate-900/70"
                                        placeholder="Your Full Name *"
                                        aria-label="Admin Name"
                                    />
                                </div>

                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 h-12 md:h-14 text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-slate-900/70"
                                        placeholder="Your Email *"
                                        aria-label="Admin Email"
                                    />
                                </div>

                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 h-12 md:h-14 text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-slate-900/70"
                                        placeholder="Password (8+ characters) *"
                                        aria-label="Password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>

                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 h-12 md:h-14 text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-slate-900/70"
                                        placeholder="Confirm Password *"
                                        aria-label="Confirm Password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors focus:outline-none"
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold h-12 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] border-0"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                            ) : (
                                <span className="flex items-center justify-center">
                                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-slate-400 text-sm">
                            Already have an account?{' '}
                            <a href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                                Sign in
                            </a>
                        </p>
                    </div>

                    <p className="text-center text-xs text-slate-500 mt-6">
                        By signing up, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
