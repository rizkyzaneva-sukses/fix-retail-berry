import { NextResponse } from 'next/server'
import { sessionOptions } from '@/lib/auth'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const session = await getIronSession(cookieStore, sessionOptions)
  session.destroy()
  return NextResponse.json({ success: true })
}
