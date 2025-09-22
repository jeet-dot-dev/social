import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the request is for a protected dashboard route
  if (pathname.startsWith('/dashboard')) {
    // Get the auth token from cookies or headers
    const authToken = request.cookies.get('authToken')?.value || 
                     request.headers.get('authorization');
    
    // If no token is found, redirect to auth page
    if (!authToken) {
      const authUrl = new URL('/auth', request.url);
      return NextResponse.redirect(authUrl);
    }
    
    // You could add JWT verification here if needed
    // For now, we'll just check if token exists
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
  ],
};
