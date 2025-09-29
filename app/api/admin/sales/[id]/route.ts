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

// GET /api/admin/sales/[id] - Get a specific sale
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = await getAdminUser(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    const saleId = params.id

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
       WHERE s.id = :saleId`,
      { saleId }
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    const sale = rows[0]
    return NextResponse.json({
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
    })
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch sale', 
      details: e.message 
    }, { status: 500 })
  }
}

// PUT /api/admin/sales/[id] - Update a sale
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = await getAdminUser(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    const saleId = params.id
    const { 
      originalPrice, 
      salePrice, 
      discountPercentage, 
      quantityAvailable, 
      startDate, 
      endDate,
      status 
    } = await request.json()

    // Validate required fields
    if (!originalPrice || !salePrice || !discountPercentage || !quantityAvailable || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if sale exists and get current data
    const [existingSale] = await query<any>(
      'SELECT id, product_id, status FROM sales WHERE id = :saleId',
      { saleId }
    )

    if (existingSale.length === 0) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Check if product still exists and has enough stock
    const [productRows] = await query<any>(
      'SELECT id, name, stock FROM products WHERE id = :productId',
      { productId: existingSale[0].product_id }
    )

    if (productRows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Validate quantity doesn't exceed product stock
    if (quantityAvailable > productRows[0].stock) {
      return NextResponse.json({ 
        error: `Quantity available (${quantityAvailable}) cannot exceed product stock (${productRows[0].stock})` 
      }, { status: 400 })
    }

    // Check for overlapping active sales for the same product (excluding current sale)
    const [overlappingSales] = await query<any>(
      `SELECT id FROM sales 
       WHERE product_id = :productId 
         AND id != :saleId
         AND status = 'active' 
         AND (
           (start_date <= :startDate AND end_date >= :startDate) OR
           (start_date <= :endDate AND end_date >= :endDate) OR
           (start_date >= :startDate AND end_date <= :endDate)
         )`,
      { productId: existingSale[0].product_id, saleId, startDate, endDate }
    )

    if (overlappingSales.length > 0) {
      return NextResponse.json({ 
        error: 'There is already an active sale for this product during the specified period' 
      }, { status: 400 })
    }

    // Update the sale
    await query(
      `UPDATE sales SET 
        original_price = :originalPrice,
        sale_price = :salePrice,
        discount_percentage = :discountPercentage,
        quantity_available = :quantityAvailable,
        start_date = :startDate,
        end_date = :endDate,
        status = :status,
        updated_at = NOW()
       WHERE id = :saleId`,
      {
        saleId,
        originalPrice,
        salePrice,
        discountPercentage,
        quantityAvailable,
        startDate,
        endDate,
        status: status || 'active'
      }
    )

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Failed to update sale', 
      details: e.message 
    }, { status: 500 })
  }
}

// DELETE /api/admin/sales/[id] - Delete a sale
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = await getAdminUser(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    const saleId = params.id

    // Delete the sale
    await query('DELETE FROM sales WHERE id = :saleId', { saleId })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Failed to delete sale', 
      details: e.message 
    }, { status: 500 })
  }
}
