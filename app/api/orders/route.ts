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

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `EGG${timestamp.slice(-6)}${random}`
}

// POST /api/orders - Create a new order
export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const {
      productId,
      quantity,
      customerInfo,
      deliveryMethod,
      paymentMethod,
      notes
    } = await request.json()

    if (!productId || !quantity || !customerInfo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get product details and check stock, including active sales
    const [productRows] = await query<any>(
      `SELECT p.id, p.name, p.price, p.status, p.stock,
              s.id as sale_id, s.original_price, s.sale_price, s.discount_percentage,
              s.quantity_available as sale_quantity, s.start_date, s.end_date, s.status as sale_status
       FROM products p
       LEFT JOIN sales s ON p.id = s.product_id 
         AND s.status = 'active' 
         AND NOW() BETWEEN s.start_date AND s.end_date
       WHERE p.id = :productId`,
      { productId }
    )

    if (productRows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (productRows[0].status !== 'active') {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 })
    }

    const product = productRows[0]

    // Check if product is on sale
    const isOnSale = product.sale_id && product.sale_status === 'active' && 
                    new Date() >= new Date(product.start_date) && 
                    new Date() <= new Date(product.end_date)

    // Use sale price if product is on sale, otherwise use regular price
    const productPrice = isOnSale ? parseFloat(product.sale_price) : parseFloat(product.price)
    const originalPrice = isOnSale ? parseFloat(product.original_price) : parseFloat(product.price)

    // Check if there's enough stock
    if (product.stock < quantity) {
      return NextResponse.json({ 
        error: `Insufficient stock. Only ${product.stock} items available.` 
      }, { status: 400 })
    }

    // Check sale quantity if product is on sale
    if (isOnSale && product.sale_quantity < quantity) {
      return NextResponse.json({ 
        error: `Insufficient sale quantity. Only ${product.sale_quantity} items available on sale.` 
      }, { status: 400 })
    }

    const subtotal = productPrice * quantity
    const deliveryFee = deliveryMethod === 'delivery' ? (subtotal >= 500 ? 0 : 50) : 0
    const totalAmount = subtotal + deliveryFee

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create order
    const [orderResult] = await query(
      `INSERT INTO orders (
        user_id, order_number, customer_name, customer_email, customer_phone, 
        customer_address, delivery_method, payment_method, subtotal, 
        delivery_fee, total_amount, notes, created_at
      ) VALUES (
        :userId, :orderNumber, :customerName, :customerEmail, :customerPhone,
        :customerAddress, :deliveryMethod, :paymentMethod, :subtotal,
        :deliveryFee, :totalAmount, :notes, NOW()
      )`,
      {
        userId,
        orderNumber,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address || null,
        deliveryMethod,
        paymentMethod,
        subtotal,
        deliveryFee,
        totalAmount,
        notes: notes || null
      }
    )

    const orderId = (orderResult as any).insertId

    // Create order item
    await query(
      `INSERT INTO order_items (
        order_id, product_id, product_name, product_price, 
        quantity, total_price, created_at
      ) VALUES (
        :orderId, :productId, :productName, :productPrice,
        :quantity, :totalPrice, NOW()
      )`,
      {
        orderId,
        productId,
        productName: product.name,
        productPrice: productPrice, // Use the calculated price (sale or regular)
        quantity,
        totalPrice: subtotal
      }
    )

    // Reduce product stock
    await query(
      'UPDATE products SET stock = stock - :quantity, updated_at = NOW() WHERE id = :productId',
      { quantity, productId }
    )

    // Update sale quantity if product is on sale
    if (isOnSale) {
      await query(
        'UPDATE sales SET quantity_sold = quantity_sold + :quantity, updated_at = NOW() WHERE id = :saleId',
        { quantity, saleId: product.sale_id }
      )
    }

    // Add to cart as well (optional)
    try {
      await query(
        `INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at) 
         VALUES (:userId, :productId, :quantity, NOW(), NOW())
         ON DUPLICATE KEY UPDATE 
         quantity = quantity + :quantity, updated_at = NOW()`,
        { userId, productId, quantity }
      )
    } catch (error) {
      // Cart addition is optional, don't fail the order
      console.log('Failed to add to cart:', error)
    }

    return NextResponse.json({ 
      success: true, 
      orderId,
      orderNumber,
      total: totalAmount
    })
  } catch (e: any) {
    console.error('Order creation failed:', e)
    return NextResponse.json({ 
      error: 'Failed to create order', 
      details: e.message 
    }, { status: 500 })
  }
}

// GET /api/orders - Get user's orders
export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    let queryString: string
    let queryParams: any

    if (productId) {
      // Get orders that contain a specific product
      queryString = `SELECT DISTINCT o.id, o.order_number, o.status, o.customer_name, o.customer_email,
                            o.customer_phone, o.customer_address, o.delivery_method, o.payment_method,
                            o.subtotal, o.delivery_fee, o.total_amount, o.notes, o.created_at
                     FROM orders o
                     INNER JOIN order_items oi ON o.id = oi.order_id
                     WHERE o.user_id = :userId AND oi.product_id = :productId
                     ORDER BY o.created_at DESC`
      queryParams = { userId, productId }
    } else {
      // Get all orders
      queryString = `SELECT o.id, o.order_number, o.status, o.customer_name, o.customer_email,
                            o.customer_phone, o.customer_address, o.delivery_method, o.payment_method,
                            o.subtotal, o.delivery_fee, o.total_amount, o.notes, o.created_at,
                            COUNT(oi.id) as item_count
                     FROM orders o
                     LEFT JOIN order_items oi ON o.id = oi.order_id
                     WHERE o.user_id = :userId
                     GROUP BY o.id
                     ORDER BY o.created_at DESC`
      queryParams = { userId }
    }

    const [rows] = await query<any>(queryString, queryParams)

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
      itemCount: order.item_count || 0,
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
