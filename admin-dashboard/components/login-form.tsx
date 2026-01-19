'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate } from '@/app/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export default function LoginForm() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="w-full max-w-sm mx-auto">
            <form action={dispatch} className="space-y-6">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome back
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter your credentials to access your account
                    </p>
                </div>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <a
                                href="/forgot-password"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                Forgot password?
                            </a>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOffIcon className="h-4 w-4" />
                                ) : (
                                    <EyeIcon className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>
                    {errorMessage && (
                        <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md">
                            {errorMessage}
                        </div>
                    )}
                    <LoginButton />
                </div>
            </form>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <Button className="w-full" type="submit" disabled={pending}>
            {pending ? 'Signing in...' : 'Sign In'}
        </Button>
    );
}
