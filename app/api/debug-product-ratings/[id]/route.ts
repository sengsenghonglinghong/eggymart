import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    // Debug: Check if product exists
    const [productCheck] = await query<any>(
      'SELECT id, name FROM products WHERE id = :id',
      { id }
    )

    if (productCheck.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Debug: Check order_items for this product
    const [orderItems] = await query<any>(
      `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity,
              o.id as order_id, o.status as order_status, o.order_number
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = :id`,
      { id }
    )

    // Debug: Check order_ratings for orders containing this product
    const [orderRatings] = await query<any>(
      `SELECT or_ratings.id, or_ratings.rating, or_ratings.review_text, or_ratings.created_at,
              o.id as order_id, o.status as order_status, o.order_number
       FROM order_ratings or_ratings
       JOIN orders o ON or_ratings.order_id = o.id
       WHERE o.id IN (
         SELECT DISTINCT oi.order_id 
         FROM order_items oi 
         WHERE oi.product_id = :id
       )`,
      { id }
    )

    // Debug: Full query with all joins
    const [fullQuery] = await query<any>(
      `SELECT p.id, p.name, p.price, p.stock, p.status, p.description, c.name as category,
              s.id as sale_id, s.original_price, s.sale_price, s.discount_percentage,
              s.quantity_available as sale_quantity, s.start_date, s.end_date, s.status as sale_status,
              COALESCE(AVG(order_ratings.rating), 0) as average_rating,
              COUNT(DISTINCT order_ratings.id) as total_ratings,
              COUNT(DISTINCT oi.order_id) as total_orders_with_product,
              COUNT(DISTINCT o.id) as total_delivered_orders_with_product
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

    return NextResponse.json({
      product: productCheck[0],
      orderItems,
      orderRatings,
      fullQuery: fullQuery[0] || null,
      summary: {
        totalOrderItems: orderItems.length,
        totalOrderRatings: orderRatings.length,
        averageRating: fullQuery[0]?.average_rating || 0,
        totalRatings: fullQuery[0]?.total_ratings || 0,
        totalOrdersWithProduct: fullQuery[0]?.total_orders_with_product || 0,
        totalDeliveredOrdersWithProduct: fullQuery[0]?.total_delivered_orders_with_product || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to debug product ratings', 
      details: error.message 
    }, { status: 500 })
  }
}
