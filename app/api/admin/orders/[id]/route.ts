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

// PUT /api/admin/orders/[id] - Update order status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = await getAdminUser(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    const orderId = params.id
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get current order status, user info, and items
    const [orderRows] = await query<any>(
      `SELECT o.status as current_status, o.user_id, o.order_number, oi.product_id, oi.quantity
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = :orderId`,
      { orderId }
    )

    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const currentStatus = orderRows[0].current_status
    const userId = orderRows[0].user_id
    const orderNumber = orderRows[0].order_number
    const orderItems = orderRows.map(row => ({
      productId: row.product_id,
      quantity: row.quantity
    }))

    // Handle stock updates based on status changes
    if (currentStatus !== status) {
      // If changing to cancelled, restore stock
      if (status === 'cancelled') {
        for (const item of orderItems) {
          await query(
            'UPDATE products SET stock = stock + :quantity, updated_at = NOW() WHERE id = :productId',
            { quantity: item.quantity, productId: item.productId }
          )
        }
      }
      // If changing from cancelled to another status, reduce stock again
      else if (currentStatus === 'cancelled') {
        for (const item of orderItems) {
          // Check if there's enough stock before reducing
          const [productRows] = await query<any>(
            'SELECT stock FROM products WHERE id = :productId',
            { productId: item.productId }
          )
          
          if (productRows.length > 0 && productRows[0].stock < item.quantity) {
            return NextResponse.json({ 
              error: `Insufficient stock for product ID ${item.productId}. Available: ${productRows[0].stock}, Required: ${item.quantity}` 
            }, { status: 400 })
          }
          
          await query(
            'UPDATE products SET stock = stock - :quantity, updated_at = NOW() WHERE id = :productId',
            { quantity: item.quantity, productId: item.productId }
          )
        }
      }
    }

    // Update order status
    await query(
      'UPDATE orders SET status = :status, updated_at = NOW() WHERE id = :orderId',
      { status, orderId }
    )

    // Create notification for order status change if status actually changed
    if (currentStatus !== status) {
      try {
        const statusMessages = {
          'confirmed': 'Your order has been confirmed and is being prepared',
          'processing': 'Your order is now being processed',
          'shipped': 'Your order has been shipped and is on its way',
          'delivered': 'Your order has been delivered successfully',
          'cancelled': 'Your order has been cancelled'
        }
        
        const statusTitles = {
          'confirmed': 'Order Confirmed',
          'processing': 'Order Processing',
          'shipped': 'Order Shipped',
          'delivered': 'Order Delivered',
          'cancelled': 'Order Cancelled'
        }
        
        await query(
          `INSERT INTO notifications (
            user_id, type, title, message, order_id, created_at
          ) VALUES (
            :userId, 'order_status', :title, :message, :orderId, NOW()
          )`,
          {
            userId,
            title: statusTitles[status as keyof typeof statusTitles] || 'Order Status Updated',
            message: `${statusMessages[status as keyof typeof statusMessages] || 'Your order status has been updated'} - Order #${orderNumber}`,
            orderId
          }
        )
      } catch (notificationError) {
        console.error('Failed to create order status notification:', notificationError)
        // Don't fail the entire request if notification creation fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Order status updated to ${status}`,
      stockUpdated: currentStatus !== status && (status === 'cancelled' || currentStatus === 'cancelled')
    })
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Failed to update order', 
      details: e.message 
    }, { status: 500 })
  }
}

// GET /api/admin/orders/[id] - Get order details
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
              o.subtotal, o.delivery_fee, o.total_amount, o.notes, o.created_at, o.updated_at
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
      `SELECT oi.id, oi.product_id, oi.product_name, oi.product_price,
              oi.quantity, oi.total_price, oi.created_at
       FROM order_items oi
       WHERE oi.order_id = :orderId
       ORDER BY oi.created_at`,
      { orderId }
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
      subtotal: parseFloat(order.subtotal),
      deliveryFee: parseFloat(order.delivery_fee),
      totalAmount: parseFloat(order.total_amount),
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: itemRows.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productPrice: parseFloat(item.product_price),
        quantity: item.quantity,
        totalPrice: parseFloat(item.total_price)
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
