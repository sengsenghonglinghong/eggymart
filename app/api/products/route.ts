import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'

const createProductSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1), // category name (e.g., "Eggs", "Chicks")
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  description: z.string().optional().nullable(),
  // accept relative paths like "/uploads/xyz.jpg" or absolute URLs
  images: z.array(z.string().trim()).optional().default([]),
})

export async function GET() {
  try {
    // First, update any expired sales
    await query<any>(
      `UPDATE sales 
       SET status = 'expired', updated_at = NOW() 
       WHERE status = 'active' AND end_date < NOW()`,
      {}
    )

    const [rows] = await query<any>(
      `SELECT p.id, p.name, c.name AS category, p.price, p.stock, p.status, p.description,
              (SELECT pi.image_url FROM product_images pi
               WHERE pi.product_id = p.id AND pi.is_primary = TRUE
               ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1) AS image,
              s.id as sale_id, s.original_price, s.sale_price, s.discount_percentage,
              s.quantity_available as sale_quantity, s.start_date, s.end_date, s.status as sale_status,
              COALESCE(AVG(order_ratings.rating), 0) as average_rating,
              COUNT(DISTINCT order_ratings.id) as total_ratings
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN sales s ON p.id = s.product_id 
         AND s.status = 'active' 
         AND NOW() BETWEEN s.start_date AND s.end_date
       LEFT JOIN order_items oi ON p.id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
       LEFT JOIN order_ratings ON o.id = order_ratings.order_id
       GROUP BY p.id, p.name, c.name, p.price, p.stock, p.status, p.description, s.id, s.original_price, s.sale_price, s.discount_percentage, s.quantity_available, s.start_date, s.end_date, s.status
       ORDER BY p.id DESC`
    )
    return NextResponse.json({ items: rows })
  } catch (e) {
    console.error('GET /api/products error:', e)
    return NextResponse.json({ error: 'Failed to load products', details: e.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('POST /api/products body:', body)
    console.log('Images array:', body.images)
    console.log('Number of images:', body.images?.length || 0)
    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) {
      console.error('Validation error:', parsed.error)
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 })
    }

    const { name, category, price, stock, description, images } = parsed.data

    // map category name to id
    const [catRows] = await query<any>('SELECT id FROM categories WHERE name = :name LIMIT 1', { name: category })
    if (catRows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 })
    }
    const categoryId = catRows[0].id

    const status = stock > 10 ? 'active' : 'inactive'

    const [result] = await query<any>(
      `INSERT INTO products (name, category_id, price, stock, status, description, created_at)
       VALUES (:name, :category_id, :price, :stock, :status, :description, NOW())`,
      { name, category_id: categoryId, price, stock, status, description: description || null }
    )

    const insertedId = result.insertId

    // Insert images if any
    if (images && images.length > 0) {
      console.log('Inserting images for product:', insertedId)
      console.log('Images to insert:', images)
      const values = images.map((url: string, idx: number) => ({
        product_id: insertedId,
        image_url: url,
        alt_text: name,
        sort_order: idx,
        is_primary: idx === 0,
      }))
      console.log('Image values to insert:', values)
      for (const v of values) {
        console.log('Inserting image:', v)
        await query(
          `INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, created_at)
           VALUES (:product_id, :image_url, :alt_text, :sort_order, :is_primary, NOW())`,
          v
        )
      }
      console.log('All images inserted successfully')
    } else {
      console.log('No images to insert')
    }

    return NextResponse.json({ ok: true, id: insertedId })
  } catch (e) {
    console.error('POST /api/products error:', e)
    return NextResponse.json({ error: 'Failed to create product', details: e.message }, { status: 500 })
  }
}


