'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { School, Loader2, User, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                username: email,
                password: password,
                redirect: false
            });

            if (res?.error) {
                setError('Invalid credentials. Please try again.');
            } else {
                router.push('/dashboard');
            }
        } catch (_) {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-900">
            {/* Animated Background Gradients (The "Orbs") */}
            <div className="absolute inset-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[100px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] left-[30%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md mx-4"
            >
                {/* Glassmorphism Card */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl p-6 md:p-10 relative overflow-hidden">

                    {/* Decorative shine effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="text-center mb-8 md:mb-10">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-blue-500 to-indigo-600 h-14 w-14 md:h-16 md:w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20"
                        >
                            <School className="text-white h-7 w-7 md:h-8 md:w-8" />
                        </motion.div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
                        <p className="text-slate-400 mt-2 text-sm">Sign in to manage your school</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-3 text-xs font-medium text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 py-3 text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-slate-900/70"
                                    placeholder="admin@school.com"
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-12 py-3 text-base text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-slate-900/70"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center text-slate-400 hover:text-slate-300 cursor-pointer">
                                <input type="checkbox" className="mr-2 rounded border-white/10 bg-white/5" />
                                Remember me
                            </label>
                            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Forgot Password?</a>
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
                                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-xs text-slate-500 mt-8">
                        Protected by PakNexus Security
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
