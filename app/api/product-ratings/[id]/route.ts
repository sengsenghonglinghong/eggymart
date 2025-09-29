import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/product-ratings/[id] - Get all ratings for a specific product
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productId = Number(params.id)
    if (!productId) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    // Get all ratings for this product through order_items
    const [ratings] = await query<any>(
      `SELECT 
        order_ratings.id,
        order_ratings.rating,
        order_ratings.review_text,
        order_ratings.created_at,
        order_ratings.updated_at,
        u.name as user_name,
        u.email as user_email,
        o.order_number,
        o.status as order_status,
        oi.product_name
       FROM order_ratings
       JOIN users u ON order_ratings.user_id = u.id
       JOIN orders o ON order_ratings.order_id = o.id
       JOIN order_items oi ON o.id = oi.order_id
       WHERE oi.product_id = :productId AND o.status = 'delivered'
       ORDER BY order_ratings.created_at DESC`,
      { productId }
    )

    // Get images for each rating
    const ratingsWithImages = await Promise.all(
      ratings.map(async (rating: any) => {
        const [images] = await query<any>(
          `SELECT id, image_url, image_name, image_size, created_at
           FROM order_rating_images 
           WHERE order_rating_id = :ratingId
           ORDER BY created_at ASC`,
          { ratingId: rating.id }
        )
        return {
          ...rating,
          images: images || []
        }
      })
    )

    // Calculate stats
    const totalRatings = ratings.length
    const averageRating = totalRatings > 0 
      ? (ratings.reduce((sum: number, rating: any) => sum + rating.rating, 0) / totalRatings).toFixed(1)
      : '0.0'

    // Calculate rating distribution
    const ratingDistribution = {
      '5Star': ratings.filter((r: any) => r.rating === 5).length,
      '4Star': ratings.filter((r: any) => r.rating === 4).length,
      '3Star': ratings.filter((r: any) => r.rating === 3).length,
      '2Star': ratings.filter((r: any) => r.rating === 2).length,
      '1Star': ratings.filter((r: any) => r.rating === 1).length,
    }

    return NextResponse.json({
      ratings: ratingsWithImages.map(rating => ({
        id: rating.id,
        rating: rating.rating,
        reviewText: rating.review_text,
        createdAt: rating.created_at,
        updatedAt: rating.updated_at,
        userName: rating.user_name,
        userEmail: rating.user_email,
        orderNumber: rating.order_number,
        orderStatus: rating.order_status,
        productName: rating.product_name,
        images: rating.images.map((img: any) => ({
          id: img.id,
          imageUrl: img.image_url,
          imageName: img.image_name,
          imageSize: img.image_size,
          createdAt: img.created_at
        }))
      })),
      stats: {
        averageRating,
        totalRatings,
        ratingDistribution
      }
    })
  } catch (e: any) {
    console.error('GET /api/product-ratings/[id] error:', e)
    return NextResponse.json({ 
      error: 'Failed to fetch product ratings', 
      details: e.message 
    }, { status: 500 })
  }
}
