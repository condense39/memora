import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: { user?: { id: string; role: string } } | null }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/events") ||
    nextUrl.pathname.startsWith("/profile") ||
    nextUrl.pathname.startsWith("/my-photos") ||
    nextUrl.pathname.startsWith("/favourites") ||
    nextUrl.pathname.startsWith("/notifications");

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  // Redirect unauthenticated users trying to access dashboard to login
  if (isOnDashboard && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from auth pages to dashboard
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth routes)
     * - api/events GET (public events listing)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
