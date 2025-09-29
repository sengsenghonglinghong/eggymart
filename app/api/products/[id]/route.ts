import { NextResponse } from 'next/server'
import { z } from 'zod'
import { query } from '@/lib/db'

const updateSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  description: z.string().optional().nullable(),
  images: z.array(z.string().trim()).optional(), // when provided, replace all
})

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    // First, update any expired sales
    await query<any>(
      `UPDATE sales 
       SET status = 'expired', updated_at = NOW() 
       WHERE status = 'active' AND end_date < NOW()`,
      {}
    )

    const [rows] = await query<any>(
      `SELECT p.id, p.name, p.price, p.stock, p.status, p.description, c.name as category,
              s.id as sale_id, s.original_price, s.sale_price, s.discount_percentage,
              s.quantity_available as sale_quantity, s.start_date, s.end_date, s.status as sale_status,
              COALESCE(AVG(order_ratings.rating), 0) as average_rating,
              COUNT(DISTINCT order_ratings.id) as total_ratings
       FROM products p
       JOIN categories c ON p.category_id = c.id
       LEFT JOIN sales s ON p.id = s.product_id 
         AND s.status = 'active' 
         AND NOW() BETWEEN s.start_date AND s.end_date
       LEFT JOIN order_items oi ON p.id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
       LEFT JOIN order_ratings ON o.id = order_ratings.order_id
       WHERE p.id = :id
       GROUP BY p.id, p.name, p.price, p.stock, p.status, p.description, c.name, s.id, s.original_price, s.sale_price, s.discount_percentage, s.quantity_available, s.start_date, s.end_date, s.status`,
      { id }
    )


    if (rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = rows[0]

    // Check if product is on sale
    const isOnSale = product.sale_id && product.sale_status === 'active' && 
                    new Date() >= new Date(product.start_date) && 
                    new Date() <= new Date(product.end_date)

    // Get product images
    const [imageRows] = await query<any>(
      'SELECT image_url, alt_text, is_primary FROM product_images WHERE product_id = :id ORDER BY sort_order',
      { id }
    )
    

    const response = {
      id: product.id,
      name: product.name,
      price: isOnSale ? parseFloat(product.sale_price) : parseFloat(product.price),
      originalPrice: isOnSale ? parseFloat(product.original_price) : undefined,
      stock: product.stock,
      status: product.status,
      description: product.description,
      category: product.category,
      image: imageRows.length > 0 ? imageRows[0].image_url : null,
      images: imageRows.map(img => ({
        url: img.image_url,
        alt: img.alt_text,
        isPrimary: img.is_primary
      })),
      isOnSale: isOnSale,
      saleInfo: isOnSale ? {
        discountPercentage: parseFloat(product.discount_percentage),
        saleQuantity: product.sale_quantity,
        startDate: product.start_date,
        endDate: product.end_date
      } : null,
      averageRating: parseFloat(product.average_rating) || 0,
      totalRatings: product.total_ratings || 0
    }


    return NextResponse.json(response)
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to fetch product', details: e.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.issues }, { status: 400 })
    }

    const { name, category, price, stock, description, images } = parsed.data

    const [catRows] = await query<any>('SELECT id FROM categories WHERE name = :name LIMIT 1', { name: category })
    if (catRows.length === 0) return NextResponse.json({ error: 'Category not found' }, { status: 400 })
    const categoryId = catRows[0].id

    const status = stock > 10 ? 'active' : 'inactive'

    await query(
      `UPDATE products
       SET name = :name, category_id = :category_id, price = :price, stock = :stock,
           status = :status, description = :description, updated_at = NOW()
       WHERE id = :id`,
      { id, name, category_id: categoryId, price, stock, status, description: description || null }
    )

    if (Array.isArray(images)) {
      await query('DELETE FROM product_images WHERE product_id = :id', { id })
      for (let idx = 0; idx < images.length; idx++) {
        const url = images[idx]
        await query(
          `INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary, created_at)
           VALUES (:product_id, :image_url, :alt_text, :sort_order, :is_primary, NOW())`,
          { product_id: id, image_url: url, alt_text: name, sort_order: idx, is_primary: idx === 0 }
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to update', details: e.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    await query('DELETE FROM product_images WHERE product_id = :id', { id })
    await query('DELETE FROM products WHERE id = :id', { id })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to delete', details: e.message }, { status: 500 })
  }
}




