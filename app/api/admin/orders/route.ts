import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

// Get user ID from token and verify admin role
async function getAdminUser(request: Request) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) return null
    
    const secret = process.env.JWT_SECRET || 'dev-secret'
    const decoded = jwt.verify(token, secret) as any
    
    // Check if user is admin
    const [userRows] = await query<any>(
      'SELECT id, role FROM users WHERE id = :userId',
      { userId: decoded.sub }
    )
    
    if (userRows.length === 0 || userRows[0].role !== 'admin') {
      return null
    }
    
    return decoded.sub
  } catch {
    return null
  }
}

// GET /api/admin/orders - Get all orders for admin
export async function GET(request: Request) {
  try {
    const adminId = await getAdminUser(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    const [rows] = await query<any>(
      `SELECT o.id, o.order_number, o.status, o.customer_name, o.customer_email,
              o.customer_phone, o.customer_address, o.delivery_method, o.payment_method,
              o.subtotal, o.delivery_fee, o.total_amount, o.notes, o.created_at,
              COUNT(oi.id) as item_count,
              GROUP_CONCAT(CONCAT(oi.quantity, 'x ', oi.product_name) SEPARATOR ', ') as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      {}
    )

    const orders = rows.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      deliveryMethod: order.delivery_method,
      paymentMethod: order.payment_method,
      subtotal: parseFloat(order.subtotal),
      deliveryFee: parseFloat(order.delivery_fee),
      totalAmount: parseFloat(order.total_amount),
      notes: order.notes,
      itemCount: order.item_count,
      items: order.items || 'No items',
      createdAt: order.created_at
    }))

    return NextResponse.json({ orders })
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch orders', 
      details: e.message 
    }, { status: 500 })
  }
}
