import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"


export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                try {
                    if (!credentials?.username || !credentials?.password) return null;

                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/login/access-token`,
                        {
                            method: "POST",
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                username: credentials.username as string,
                                password: credentials.password as string,
                            }).toString(),
                        }
                    );

                    const data = await res.json();

                    if (data.access_token) {
                        return {
                            id: "current-user",
                            email: credentials.username as string,
                            accessToken: data.access_token
                        };
                    }
                    return null;
                } catch (e) {
                    console.error("Login failed:", e);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.accessToken = (user as any).accessToken;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.accessToken) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session as any).accessToken = token.accessToken;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    }
})
