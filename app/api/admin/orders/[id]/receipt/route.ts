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

// GET /api/admin/orders/[id]/receipt - Get order receipt data
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = await getAdminUser(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    const orderId = params.id

    // Get order details
    const [orderRows] = await query<any>(
      `SELECT o.id, o.order_number, o.status, o.customer_name, o.customer_email,
              o.customer_phone, o.customer_address, o.delivery_method, o.payment_method,
              o.subtotal, o.delivery_fee, o.total_amount, o.notes, o.created_at
       FROM orders o
       WHERE o.id = :orderId`,
      { orderId }
    )

    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderRows[0]

    // Get order items
    const [itemRows] = await query<any>(
      `SELECT oi.id, oi.product_name, oi.product_price, oi.quantity, oi.total_price
       FROM order_items oi
       WHERE oi.order_id = :orderId
       ORDER BY oi.created_at`,
      { orderId }
    )

    // Get store information (you can customize this)
    const storeInfo = {
      name: "EggMart Store",
      address: "123 Farm Road, Agriculture District",
      phone: "+63 912 345 6789",
      email: "info@eggmart.com"
    }

    const receiptData = {
      store: storeInfo,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        createdAt: order.created_at,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        customerAddress: order.customer_address,
        deliveryMethod: order.delivery_method,
        paymentMethod: order.payment_method,
        notes: order.notes
      },
      items: itemRows.map(item => ({
        name: item.product_name,
        price: parseFloat(item.product_price),
        quantity: item.quantity,
        total: parseFloat(item.total_price)
      })),
      totals: {
        subtotal: parseFloat(order.subtotal),
        deliveryFee: parseFloat(order.delivery_fee),
        total: parseFloat(order.total_amount)
      }
    }

    return NextResponse.json({ receipt: receiptData })
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Failed to generate receipt', 
      details: e.message 
    }, { status: 500 })
  }
}

