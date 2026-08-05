import { SessionOptions, getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  userId?: number
  role?: string
  name?: string
  username?: string
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex-password-at-least-32-characters-long',
  cookieName: 'retail-strawberry-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session.userId) return null
  return {
    id: session.userId,
    role: session.role,
    name: session.name,
    username: session.username,
  }
}
