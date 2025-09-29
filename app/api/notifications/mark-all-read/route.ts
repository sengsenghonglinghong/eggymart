import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

async function getUserId(request: Request) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) return null
    const secret = process.env.JWT_SECRET || 'dev-secret'
    const decoded = jwt.verify(token, secret) as any
    return decoded.sub
  } catch {
    return null
  }
}

// PUT /api/notifications/mark-all-read - Mark all notifications as read
export async function PUT(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const [result] = await query<any>(
      `UPDATE notifications 
       SET is_read = 1, updated_at = NOW() 
       WHERE user_id = :userId AND is_read = 0`,
      { userId }
    )

    return NextResponse.json({ 
      success: true, 
      updatedCount: result.affectedRows 
    })
  } catch (e: any) {
    console.error('PUT /api/notifications/mark-all-read error:', e)
    return NextResponse.json({ 
      error: 'Failed to mark all notifications as read', 
      details: e.message 
    }, { status: 500 })
  }
}
