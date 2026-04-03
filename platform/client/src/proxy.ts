import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get auth token from cookies or localStorage (via header)
    const token = request.cookies.get('auth_token')?.value;

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/waiting-room', '/team/join'];
    const isPublicRoute = publicRoutes.some(r => pathname.startsWith(r));

    // Auth routes (login, signup) — if already logged in, redirect away
    const isAuthRoute = ['/login', '/signup'].includes(pathname);

    // Onboarding routes
    const isOnboardingRoute = pathname.startsWith('/onboarding');

    // Protected app routes
    const isProtectedRoute = ['/dashboard', '/campaigns', '/contacts', '/analytics'].some(
        route => pathname.startsWith(route)
    );

    // Rule 1: If no token and trying to access protected route → redirect to login
    if (!token && isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Get tenant status from cookie
    const tenantStatus = request.cookies.get('tenant_status')?.value;
    const emailVerified = request.cookies.get('email_verified')?.value;

    const allowUnverifiedRoutes = ['/verify-email', '/logout'];

    // Rule 2: If has token and on auth route → redirect based on status
    if (token && isAuthRoute) {
        if (tenantStatus === 'onboarding') {
            return NextResponse.redirect(new URL('/onboarding/workspace', request.url));
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Rule 2.5: Email verification gate for protected routes
    if (token && isProtectedRoute && emailVerified === 'false' && !allowUnverifiedRoutes.some(r => pathname.startsWith(r))) {
        return NextResponse.redirect(new URL('/verify-email', request.url));
    }

    // Rule 3: STRICT DASHBOARD ACCESS CONTROL
    // If user is accessing dashboard but status is 'onboarding' → FORCE redirect to onboarding
    if (token && isProtectedRoute && tenantStatus === 'onboarding') {
        return NextResponse.redirect(new URL('/onboarding/workspace', request.url));
    }

    // Rule 4: If user is 'active' and tries to access onboarding pages → redirect to dashboard
    if (token && isOnboardingRoute && tenantStatus === 'active') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - _next/data (RSC/SSR data payloads)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
    ],
};
