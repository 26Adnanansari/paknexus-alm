import { auth } from "@/auth"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard")

    if (isOnDashboard) {
        if (isLoggedIn) return
        return Response.redirect(new URL("/login", req.nextUrl))
    }
    // Removed auto-redirect from /login to /dashboard to prevent infinite loops when session is stale
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
