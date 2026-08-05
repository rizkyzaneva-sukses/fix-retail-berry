import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(users)
  } catch (err) {
    console.error('GET /api/users error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data pengguna' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, username, password, role, phone } = body

    if (!name || !username || !password) {
      return NextResponse.json({ error: 'Nama, username, dan password wajib diisi' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username sudah ada' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
        role: role ?? 'driver',
        phone: phone ?? null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        username: user.username,
        userName: user.name,
        role: user.role,
        action: 'create_user',
        entityType: 'User',
        entityId: newUser.id,
        summary: `Membuat pengguna baru: ${newUser.name} (${newUser.username}) - Role: ${newUser.role}`,
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (err) {
    console.error('POST /api/users error:', err)
    return NextResponse.json({ error: 'Gagal membuat pengguna' }, { status: 500 })
  }
}
