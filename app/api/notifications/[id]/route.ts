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

// PUT /api/notifications/[id] - Update notification (mark as read)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const notificationId = params.id
    const { isRead } = await request.json()

    if (typeof isRead !== 'boolean') {
      return NextResponse.json({ error: 'isRead must be a boolean' }, { status: 400 })
    }

    const [result] = await query<any>(
      `UPDATE notifications 
       SET is_read = :isRead, updated_at = NOW() 
       WHERE id = :notificationId AND user_id = :userId`,
      { isRead, notificationId, userId }
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('PUT /api/notifications/[id] error:', e)
    return NextResponse.json({ 
      error: 'Failed to update notification', 
      details: e.message 
    }, { status: 500 })
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const notificationId = params.id

    const [result] = await query<any>(
      'DELETE FROM notifications WHERE id = :notificationId AND user_id = :userId',
      { notificationId, userId }
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('DELETE /api/notifications/[id] error:', e)
    return NextResponse.json({ 
      error: 'Failed to delete notification', 
      details: e.message 
    }, { status: 500 })
  }
}
