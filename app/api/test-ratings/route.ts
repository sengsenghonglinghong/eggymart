import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Check if we have any orders
    const [orders] = await query<any>('SELECT COUNT(*) as count FROM orders')
    
    // Check if we have any order ratings
    const [ratings] = await query<any>('SELECT COUNT(*) as count FROM order_ratings')
    
    // Check if we have any order rating images
    const [images] = await query<any>('SELECT COUNT(*) as count FROM order_rating_images')
    
    // Get sample data
    const [sampleOrders] = await query<any>(
      `SELECT o.id, o.order_number, o.status, o.user_id, 
              COUNT(oi.id) as item_count,
              COUNT(or_ratings.id) as rating_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN order_ratings or_ratings ON o.id = or_ratings.order_id
       GROUP BY o.id, o.order_number, o.status, o.user_id
       ORDER BY o.id DESC
       LIMIT 5`
    )

    const [sampleRatings] = await query<any>(
      `SELECT or_ratings.id, or_ratings.rating, or_ratings.review_text, or_ratings.created_at,
              o.order_number, o.status,
              COUNT(ori.id) as image_count
       FROM order_ratings or_ratings
       JOIN orders o ON or_ratings.order_id = o.id
       LEFT JOIN order_rating_images ori ON or_ratings.id = ori.order_rating_id
       GROUP BY or_ratings.id, or_ratings.rating, or_ratings.review_text, or_ratings.created_at, o.order_number, o.status
       ORDER BY or_ratings.id DESC
       LIMIT 5`
    )

    return NextResponse.json({
      summary: {
        totalOrders: orders[0].count,
        totalRatings: ratings[0].count,
        totalImages: images[0].count
      },
      sampleOrders,
      sampleRatings
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch test data', 
      details: error.message 
    }, { status: 500 })
  }
}
