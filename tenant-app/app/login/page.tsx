'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { School, Loader2 } from 'lucide-react';

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
                setError('Invalid email or password');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-8">
                <div className="text-center">
                    <div className="bg-blue-600 h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                        <School className="text-white h-7 w-7" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
                    <p className="text-slate-500 mt-2">Sign in to your school dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="educator@school.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium text-slate-700">Password</label>
                            <a href="#" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-10 text-base">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                        Sign In
                    </Button>
                </form>

                <p className="text-center text-sm text-slate-500">
                    Need help? <a href="mailto:support@almsaas.com" className="text-blue-600 font-medium hover:underline">Contact Support</a>
                </p>
            </div>
        </div>
    );
}
