import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const isProtectedRoute = (req: NextRequest) => {
  console.log('Checking if route is protected:', req.nextUrl.pathname);
  const protectedPaths = ['/admin', '/api/admin'];
  return protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));
};

export async function middleware(req: NextRequest) {
  const { method, url } = req;
  const log = (message: string, ...args: any[]) => console.log(`[${method}] ${url} - ${message}`, ...args);

  log('Middleware processing request...');

  if (isProtectedRoute(req)) {
    log('Route is protected. Authenticating...');
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      log('Authentication failed: No token provided.');
      return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      log('Authentication error: JWT_SECRET is not defined.');
      return new NextResponse(JSON.stringify({ message: 'Server configuration error' }), { status: 500 });
    } else {
      log(`JWT_SECRET is present. Length: ${process.env.JWT_SECRET.length}`);
    }

    try {
      log('Token received:', token);
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      if (!payload.address) {
        log('Authentication failed: Invalid token payload - address is missing.');
        return new NextResponse(JSON.stringify({ message: 'Unauthorized: Invalid token payload' }), { status: 401 });
      }

      log(`Authentication successful for address: ${payload.address}`);
    } catch (error: any) {
      log('Authentication failed: JWT verification error.', error.name, error.message);
      return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }
  } else {
    log('Route is not protected. Passing through.');
  }
  
  return NextResponse.next();
};

export const config = {
  matcher: ['/((?!.*\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};