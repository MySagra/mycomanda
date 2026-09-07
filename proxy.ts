import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'mycomanda_session';
const USER_COOKIE = 'mycomanda_user';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userToken = request.cookies.get(USER_COOKIE)?.value;
  const isAuthenticated = !!(token && userToken);

  const isRoot = pathname === '/';
  const isOnProtectedRoute = pathname.startsWith('/commands') || pathname.startsWith('/settings');
  const isOnLogin = pathname.startsWith('/login');

  if (isRoot) {
    return NextResponse.redirect(new URL(isAuthenticated ? '/commands' : '/login', request.url));
  }

  if (isOnProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isOnLogin && isAuthenticated) {
    return NextResponse.redirect(new URL('/commands', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
