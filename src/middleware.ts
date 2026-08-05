import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession, IronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and auth API routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // For all other routes, check session
  const session: IronSession<SessionData> = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions)

  if (!session.userId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
}
