import NextAuth, { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

// Config object
export const { auth, signIn, signOut, handlers } = NextAuth({
    pages: {
        signIn: '/login',
    },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    try {
                        // Call FastAPI Backend
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

                        const formData = new URLSearchParams();
                        formData.append('username', email);
                        formData.append('password', password);

                        // Use simple fetch to login
                        console.log('Attempting login to:', `${apiUrl}/api/v1/auth/login/access-token`);
                        const res = await fetch(`${apiUrl}/api/v1/auth/login/access-token`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: formData,
                        });

                        console.log('Backend response status:', res.status);
                        const responseText = await res.text();
                        console.log('Backend response body:', responseText);

                        if (!res.ok) {
                            console.error('Login failed:', responseText);
                            return null;
                        }

                        const user = JSON.parse(responseText);
                        console.log('User data received:', user);

                        // Return user object with token
                        return {
                            id: user.user_id, // Use the actual UUID from backend
                            email: email,
                            accessToken: user.access_token,
                            role: user.user_role,
                            tenantId: user.tenant_id
                        } as User;

                    } catch (error) {
                        console.error('Auth error FULL OBJECT:', error);
                        console.error('Auth error message:', error instanceof Error ? error.message : String(error));
                        return null;
                    }
                }
                console.log('Invalid credentials format');
                return null; // Invalid credentials
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // token is of type JWT
            // user is of type User - only present on first signin
            if (user) {
                const u = user as any;
                token.accessToken = u.accessToken;
                token.role = u.role;
                token.tenantId = u.tenantId;
            }
            return token;
        },
        async session({ session, token }) {
            // session is of type Session
            // token is of type JWT
            if (session.user) {
                const s = session.user as any;
                const t = token as any;
                s.accessToken = t.accessToken;
                s.role = t.role;
                s.tenantId = t.tenantId;
            }
            return session;
        },
    },
});
