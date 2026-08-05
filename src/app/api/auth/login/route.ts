import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sessionOptions, type SessionData } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'
import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { username, password } = parsed.data
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }
    const cookieStore = await cookies()
    const session: IronSession<SessionData> = await getIronSession<SessionData>(cookieStore, sessionOptions)
    session.userId = user.id
    session.role = user.role
    session.name = user.name
    session.username = user.username
    await session.save()
    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
