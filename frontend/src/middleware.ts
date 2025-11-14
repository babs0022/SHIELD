import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const isProtectedRoute = (req: NextRequest) => {
  const protectedPaths = ['/admin', '/api/admin'];
  return protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));
};

export async function middleware(req: NextRequest) {
  if (isProtectedRoute(req)) {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (typeof decoded === 'string' || !decoded.address) {
        return new NextResponse(JSON.stringify({ message: 'Unauthorized: Invalid token payload' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
