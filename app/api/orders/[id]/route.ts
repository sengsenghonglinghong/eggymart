import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

// Get user ID from token
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

// GET /api/orders/[id] - Get order details with items
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const orderId = params.id

    // Get order details
    const [orderRows] = await query<any>(
      `SELECT o.id, o.order_number, o.status, o.customer_name, o.customer_email,
              o.customer_phone, o.customer_address, o.delivery_method, o.payment_method,
              o.subtotal, o.delivery_fee, o.total_amount, o.notes, o.created_at
       FROM orders o
       WHERE o.id = :orderId AND o.user_id = :userId`,
      { orderId, userId }
    )

    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderRows[0]

    // Get order items with user ratings
    const [itemRows] = await query<any>(
      `SELECT oi.id, oi.product_id, oi.product_name, oi.product_price,
              oi.quantity, oi.total_price, oi.created_at,
              p.image_url as product_image,
              order_ratings.rating as user_rating, order_ratings.review_text as user_review
       FROM order_items oi
       LEFT JOIN product_images p ON oi.product_id = p.product_id AND p.is_primary = 1
       LEFT JOIN order_ratings ON oi.order_id = order_ratings.order_id AND order_ratings.user_id = :userId
       WHERE oi.order_id = :orderId
       ORDER BY oi.created_at`,
      { orderId, userId }
    )

    const orderDetails = {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      deliveryMethod: order.delivery_method,
      paymentMethod: order.payment_method,
      subtotal: parseFloat(order.subtotal) || 0,
      deliveryFee: parseFloat(order.delivery_fee) || 0,
      totalAmount: parseFloat(order.total_amount) || 0,
      notes: order.notes,
      createdAt: order.created_at,
      items: itemRows.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productPrice: parseFloat(item.product_price) || 0,
        quantity: item.quantity || 0,
        totalPrice: parseFloat(item.total_price) || 0,
        productImage: item.product_image || '/placeholder.svg',
        userRating: item.user_rating || null,
        userReview: item.user_review || null
      }))
    }

    return NextResponse.json({ order: orderDetails })
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch order details', 
      details: e.message 
    }, { status: 500 })
  }
}
