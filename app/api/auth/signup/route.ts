import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phoneNumber: z.string().min(3),
  address: z.string().min(3),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = signupSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { name, email, password, phoneNumber, address } = parsed.data

    // check existing
    const [existing] = await query<any>(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { email }
    )
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await query(
      `INSERT INTO users (name, email, password_hash, phone, address, role, created_at)
       VALUES (:name, :email, :password_hash, :phone, :address, 'user', NOW())`,
      { name, email, password_hash: passwordHash, phone: phoneNumber, address }
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


