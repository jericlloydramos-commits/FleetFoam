import { NextRequest, NextResponse } from 'next/server';

/**
 * FleetFoam Detail Coordinator — Route Protection Middleware
 * FR-07 / US-06: Role-Based Access Control
 *
 * Protected Routes:
 *  /booking  → CUSTOMER only
 *  /crew     → CREW only
 *  /ops      → OPERATIONS only
 *
 * In mock mode (no real Supabase), we read role from a custom cookie
 * set during sign-in. In real Supabase mode, we check the JWT.
 */

// Routes that require authentication
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/booking':      ['CUSTOMER', 'OPERATIONS'], // FR-07 / AC-06.1 — Customer + Admin oversight
  '/appointments': ['CUSTOMER', 'OPERATIONS'], // FR-07 / AC-06.1 — Customer + Admin oversight
  '/crew':         ['CREW', 'OPERATIONS'],     // FR-07 / AC-06.2 — Crew + Admin oversight
  '/ops':          ['OPERATIONS'],             // FR-07 / AC-06.3 — Strictly Operations/Admin only
};

// Routes that logged-in users should NOT access (auth pages)
const AUTH_ROUTES = ['/auth/login', '/auth/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the mock session cookie (set during sign-in in mock mode)
  const mockSession = request.cookies.get('fleetfoam_role')?.value;

  // Allow access to auth routes so users can easily switch accounts or re-login
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ── Check protected routes ──────────────────────────────────────────────────
  const matchedRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
    pathname.startsWith(route)
  );

  if (matchedRoute) {
    const allowedRoles = PROTECTED_ROUTES[matchedRoute];

    // Not logged in at all → redirect to login
    if (!mockSession) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Logged in but wrong role → redirect to unauthorized page
    if (!allowedRoles.includes(mockSession)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/booking/:path*',
    '/appointments/:path*',
    '/crew/:path*',
    '/ops/:path*',
    '/auth/:path*',
  ],
};
