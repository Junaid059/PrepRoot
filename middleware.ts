import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Paths that require authentication
const authPaths = ['/profile', '/my-courses'];

// Paths that require admin authentication
const adminPaths = ['/admin-dashboard'];

// Paths that are only accessible when not logged in
const guestOnlyPaths = ['/login', '/signup'];

interface JWTPayload {
  isAdmin?: boolean;
  [key: string]: any;
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Get token from cookies
    const token = request.cookies.get('token')?.value;

    // Initialize auth state
    let isAuthenticated = false;
    let isAdmin = false;

    // Verify token if present
    if (token && token !== 'undefined' && token !== 'null') {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(token, secret);
        const typedPayload = payload as JWTPayload;

        isAuthenticated = true;
        isAdmin = Boolean(typedPayload.isAdmin);
      } catch (tokenError) {
        console.error('Token verification failed:', tokenError);
        // Token is invalid, treat as unauthenticated
        isAuthenticated = false;
        isAdmin = false;
      }
    }

    // Route protection logic
    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));
    const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
    const isGuestOnlyPath = guestOnlyPaths.includes(pathname);

    // Admin paths require admin authentication
    if (isAdminPath && (!isAuthenticated || !isAdmin)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Auth paths require authentication
    if (isAuthPath && !isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Guest-only paths redirect authenticated users
    if (isGuestOnlyPath && isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/my-courses/:path*',
    '/admin-dashboard/:path*',
    '/login',
    '/signup',
  ],
};
