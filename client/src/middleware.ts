import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userCookie = request.cookies.get('user')?.value;
  
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // If no token and trying to access protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // If has token and trying to access auth pages
  if (token && isPublicRoute) {
    let user;
    try {
      user = userCookie ? JSON.parse(userCookie) : null;
    } catch {
      // Invalid user cookie, redirect to login
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('token');
      response.cookies.delete('user');
      return response;
    }
    
    if (user) {
      const redirectUrl = user.role === 'WORKER' ? '/dashboard' : '/admin/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }
  
  // Role-based route protection
  if (token && userCookie) {
    let user;
    try {
      user = JSON.parse(userCookie);
    } catch {
      // Invalid user cookie, redirect to login
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('token');
      response.cookies.delete('user');
      return response;
    }
    
    // Admin routes protection
    if (pathname.startsWith('/admin/') && user.role === 'WORKER') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Worker routes protection
    if ((pathname === '/dashboard' || pathname === '/projects' || pathname === '/time-log') && 
        (user.role === 'COMPANY_ADMIN' || user.role === 'CORPORATE_ADMIN')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};