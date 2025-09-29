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

// GET /api/cart - Get user's cart items
export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // First, update any expired sales
    await query<any>(
      `UPDATE sales 
       SET status = 'expired', updated_at = NOW() 
       WHERE status = 'active' AND end_date < NOW()`,
      {}
    )

    const [rows] = await query<any>(
      `SELECT c.id, c.quantity, c.created_at,
              p.id as product_id, p.name, p.price, p.status, p.description,
              c2.name as category,
              pi.image_url as image,
              s.id as sale_id, s.original_price, s.sale_price, s.discount_percentage,
              s.quantity_available as sale_quantity, s.start_date, s.end_date, s.status as sale_status
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       JOIN categories c2 ON p.category_id = c2.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
       LEFT JOIN sales s ON p.id = s.product_id 
         AND s.status = 'active' 
         AND NOW() BETWEEN s.start_date AND s.end_date
       WHERE c.user_id = :userId
       ORDER BY c.created_at DESC`,
      { userId }
    )

    const cartItems = rows.map(item => {
      // Check if product is on sale
      const isOnSale = item.sale_id && item.sale_status === 'active' && 
                      new Date() >= new Date(item.start_date) && 
                      new Date() <= new Date(item.end_date)
      
      return {
        id: item.id,
        productId: item.product_id,
        name: item.name,
        price: isOnSale ? parseFloat(item.sale_price) : parseFloat(item.price),
        originalPrice: isOnSale ? parseFloat(item.original_price) : undefined,
        quantity: item.quantity,
        image: item.image || '/placeholder.svg',
        category: item.category,
        status: item.status,
        isOnSale: isOnSale
      }
    })

    return NextResponse.json({ items: cartItems })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to fetch cart', details: e.message }, { status: 500 })
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { productId, quantity = 1 } = await request.json()
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    console.log('Adding to cart:', { userId, productId, quantity })

    // Check if product exists, is active, and has stock
    const [productRows] = await query<any>(
      'SELECT id, status, stock FROM products WHERE id = :productId',
      { productId }
    )

    if (productRows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (productRows[0].status !== 'active') {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 })
    }

    const product = productRows[0]

    // Check if there's enough stock
    if (product.stock < quantity) {
      return NextResponse.json({ 
        error: `Insufficient stock. Only ${product.stock} items available.` 
      }, { status: 400 })
    }

    // Check if item already exists in cart
    const [existingRows] = await query<any>(
      'SELECT id, quantity FROM cart_items WHERE user_id = :userId AND product_id = :productId',
      { userId, productId }
    )

    if (existingRows.length > 0) {
      // Update quantity
      await query(
        'UPDATE cart_items SET quantity = quantity + :quantity, updated_at = NOW() WHERE id = :id',
        { quantity, id: existingRows[0].id }
      )
    } else {
      // Add new item
      await query(
        'INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at) VALUES (:userId, :productId, :quantity, NOW(), NOW())',
        { userId, productId, quantity }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to add to cart', details: e.message }, { status: 500 })
  }
}

// PUT /api/cart - Update item quantity in cart
export async function PUT(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { productId, quantity } = await request.json()
    
    if (!productId || !quantity) {
      return NextResponse.json({ error: 'Product ID and quantity are required' }, { status: 400 })
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await query(
        'DELETE FROM cart_items WHERE user_id = :userId AND product_id = :productId',
        { userId, productId }
      )
    } else {
      // Check if there's enough stock
      const [productRows] = await query<any>(
        'SELECT stock FROM products WHERE id = :productId',
        { productId }
      )

      if (productRows.length > 0 && productRows[0].stock < quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock. Only ${productRows[0].stock} items available.` 
        }, { status: 400 })
      }

      // Update quantity
      await query(
        'UPDATE cart_items SET quantity = :quantity, updated_at = NOW() WHERE user_id = :userId AND product_id = :productId',
        { userId, productId, quantity }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to update cart', details: e.message }, { status: 500 })
  }
}

// DELETE /api/cart - Remove item from cart
export async function DELETE(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { productId } = await request.json()
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    await query(
      'DELETE FROM cart_items WHERE user_id = :userId AND product_id = :productId',
      { userId, productId }
    )

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to remove from cart', details: e.message }, { status: 500 })
  }
}
