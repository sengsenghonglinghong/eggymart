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

// GET /api/favorites - Get user's favorite items
export async function GET(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const [rows] = await query<any>(
      `SELECT f.id, f.created_at,
              p.id as product_id, p.name, p.price, p.status, p.description,
              c.name as category,
              pi.image_url as image
       FROM favorites f
       JOIN products p ON f.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
       WHERE f.user_id = :userId
       ORDER BY f.created_at DESC`,
      { userId }
    )

    const favoriteItems = rows.map(item => ({
      id: item.id,
      productId: item.product_id,
      name: item.name,
      price: parseFloat(item.price),
      image: item.image || '/placeholder.svg',
      category: item.category,
      status: item.status
    }))

    return NextResponse.json({ items: favoriteItems })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to fetch favorites', details: e.message }, { status: 500 })
  }
}

// POST /api/favorites - Add item to favorites
export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { productId } = await request.json()
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Check if product exists
    const [productRows] = await query<any>(
      'SELECT id FROM products WHERE id = :productId',
      { productId }
    )

    if (productRows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if already in favorites
    const [existingRows] = await query<any>(
      'SELECT id FROM favorites WHERE user_id = :userId AND product_id = :productId',
      { userId, productId }
    )

    if (existingRows.length > 0) {
      return NextResponse.json({ error: 'Product already in favorites' }, { status: 400 })
    }

    // Add to favorites
    await query(
      'INSERT INTO favorites (user_id, product_id, created_at) VALUES (:userId, :productId, NOW())',
      { userId, productId }
    )

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to add to favorites', details: e.message }, { status: 500 })
  }
}

// DELETE /api/favorites - Remove item from favorites
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
      'DELETE FROM favorites WHERE user_id = :userId AND product_id = :productId',
      { userId, productId }
    )

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to remove from favorites', details: e.message }, { status: 500 })
  }
}

