import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const needsAuth = req.nextUrl.pathname.startsWith("/dashboard");
    const isLoginPage = req.nextUrl.pathname === "/login";

    if (needsAuth && !req.auth) {
        const newUrl = new URL("/login", req.nextUrl.origin);
        return NextResponse.redirect(newUrl);
    }

    if (isLoginPage && req.auth) {
        const newUrl = new URL("/dashboard", req.nextUrl.origin);
        return NextResponse.redirect(newUrl);
    }
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
