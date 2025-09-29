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

// GET /api/notifications - Get user's notifications
export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const [rows] = await query<any>(
      `SELECT id, type, title, message, is_read, created_at, product_id, product_name, order_id
       FROM notifications
       WHERE user_id = :userId
       ORDER BY created_at DESC
       LIMIT 50`,
      { userId }
    )

    const notifications = rows.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: Boolean(notification.is_read),
      createdAt: notification.created_at,
      productId: notification.product_id,
      productName: notification.product_name,
      orderId: notification.order_id
    }))

    return NextResponse.json({ notifications })
  } catch (e: any) {
    console.error('GET /api/notifications error:', e)
    return NextResponse.json({ 
      error: 'Failed to fetch notifications', 
      details: e.message 
    }, { status: 500 })
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { type, title, message, productId, productName, orderId } = await request.json()

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validTypes = ['favorite', 'cart', 'order', 'order_status', 'sale']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    const [result] = await query<any>(
      `INSERT INTO notifications (
        user_id, type, title, message, product_id, product_name, order_id, created_at
      ) VALUES (
        :userId, :type, :title, :message, :productId, :productName, :orderId, NOW()
      )`,
      {
        userId,
        type,
        title,
        message,
        productId: productId || null,
        productName: productName || null,
        orderId: orderId || null
      }
    )

    return NextResponse.json({ 
      success: true, 
      notificationId: (result as any).insertId 
    })
  } catch (e: any) {
    console.error('POST /api/notifications error:', e)
    return NextResponse.json({ 
      error: 'Failed to create notification', 
      details: e.message 
    }, { status: 500 })
  }
}
