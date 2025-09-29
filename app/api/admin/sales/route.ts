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

// GET /api/admin/sales - Get all sales
export async function GET(request: Request) {
  try {
    const adminId = await getAdminUser(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    // First, update any expired sales
    await query<any>(
      `UPDATE sales 
       SET status = 'expired', updated_at = NOW() 
       WHERE status = 'active' AND end_date < NOW()`,
      {}
    )

    const [rows] = await query<any>(
      `SELECT s.id, s.original_price, s.sale_price, s.discount_percentage,
              s.quantity_available, s.quantity_sold, s.start_date, s.end_date, s.status,
              s.created_at, s.updated_at,
              p.id as product_id, p.name as product_name, p.stock as product_stock,
              c.name as category_name,
              pi.image_url as product_image
       FROM sales s
       JOIN products p ON s.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
       ORDER BY s.created_at DESC`,
      {}
    )

    const sales = rows.map(sale => ({
      id: sale.id,
      productId: sale.product_id,
      productName: sale.product_name,
      productStock: sale.product_stock,
      categoryName: sale.category_name,
      productImage: sale.product_image || '/placeholder.svg',
      originalPrice: parseFloat(sale.original_price),
      salePrice: parseFloat(sale.sale_price),
      discountPercentage: parseFloat(sale.discount_percentage),
      quantityAvailable: sale.quantity_available,
      quantitySold: sale.quantity_sold,
      startDate: sale.start_date,
      endDate: sale.end_date,
      status: sale.status,
      createdAt: sale.created_at,
      updatedAt: sale.updated_at
    }))

    return NextResponse.json({ sales })
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch sales', 
      details: e.message 
    }, { status: 500 })
  }
}

// POST /api/admin/sales - Create a new sale
export async function POST(request: Request) {
  try {
    const adminId = await getAdminUser(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    const { 
      productId, 
      originalPrice, 
      salePrice, 
      discountPercentage, 
      quantityAvailable, 
      startDate, 
      endDate 
    } = await request.json()

    // Validate required fields
    if (!productId || !originalPrice || !salePrice || !discountPercentage || !quantityAvailable || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if product exists and get current stock
    const [productRows] = await query<any>(
      'SELECT id, name, price, stock FROM products WHERE id = :productId',
      { productId }
    )

    if (productRows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = productRows[0]

    // Validate quantity doesn't exceed product stock
    if (quantityAvailable > product.stock) {
      return NextResponse.json({ 
        error: `Quantity available (${quantityAvailable}) cannot exceed product stock (${product.stock})` 
      }, { status: 400 })
    }

    // Check for overlapping active sales for the same product
    const [overlappingSales] = await query<any>(
      `SELECT id FROM sales 
       WHERE product_id = :productId 
         AND status = 'active' 
         AND (
           (start_date <= :startDate AND end_date >= :startDate) OR
           (start_date <= :endDate AND end_date >= :endDate) OR
           (start_date >= :startDate AND end_date <= :endDate)
         )`,
      { productId, startDate, endDate }
    )

    if (overlappingSales.length > 0) {
      return NextResponse.json({ 
        error: 'There is already an active sale for this product during the specified period' 
      }, { status: 400 })
    }

    // Create the sale
    const [result] = await query<any>(
      `INSERT INTO sales (
        product_id, original_price, sale_price, discount_percentage,
        quantity_available, start_date, end_date, created_at
      ) VALUES (
        :productId, :originalPrice, :salePrice, :discountPercentage,
        :quantityAvailable, :startDate, :endDate, NOW()
      )`,
      {
        productId,
        originalPrice,
        salePrice,
        discountPercentage,
        quantityAvailable,
        startDate,
        endDate
      }
    )

    return NextResponse.json({ 
      success: true, 
      saleId: (result as any).insertId 
    })
  } catch (e: any) {
    console.error('POST /api/admin/sales error:', e)
    return NextResponse.json({ 
      error: 'Failed to create sale', 
      details: e.message 
    }, { status: 500 })
  }
}
