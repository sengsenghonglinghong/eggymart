import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

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

// GET /api/ratings?orderId=123 - Get rating for an order
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const userId = await getUserId(request)

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get rating for the order with images
    const [ratings] = await query<any>(
      `SELECT 
        or_ratings.id,
        or_ratings.rating,
        or_ratings.review_text,
        or_ratings.created_at,
        or_ratings.updated_at,
        u.name as user_name,
        u.email as user_email,
        o.order_number,
        o.status as order_status
       FROM order_ratings or_ratings
       JOIN users u ON or_ratings.user_id = u.id
       JOIN orders o ON or_ratings.order_id = o.id
       WHERE or_ratings.order_id = :orderId
       ORDER BY or_ratings.created_at DESC`,
      { orderId }
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

    // Check if current user has rated this order
    const [userRating] = await query<any>(
      `SELECT rating, review_text, created_at, updated_at
       FROM order_ratings 
       WHERE order_id = :orderId AND user_id = :userId`,
      { orderId, userId }
    )

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
        images: rating.images.map((img: any) => ({
          id: img.id,
          imageUrl: img.image_url,
          imageName: img.image_name,
          imageSize: img.image_size,
          createdAt: img.created_at
        }))
      })),
      userRating: userRating.length > 0 ? {
        rating: userRating[0].rating,
        reviewText: userRating[0].review_text,
        createdAt: userRating[0].created_at,
        updatedAt: userRating[0].updated_at
      } : null
    })
  } catch (e: any) {
    console.error('GET /api/ratings error:', e)
    return NextResponse.json({ 
      error: 'Failed to fetch rating', 
      details: e.message 
    }, { status: 500 })
  }
}

// POST /api/ratings - Create or update an order rating
export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { orderId, rating, reviewText, images } = await request.json()

    if (!orderId || !rating) {
      return NextResponse.json({ error: 'Order ID and rating are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Verify the order exists and belongs to the user and is delivered
    const [orderCheck] = await query<any>(
      `SELECT id, user_id, status FROM orders WHERE id = :orderId AND user_id = :userId`,
      { orderId, userId }
    )

    if (orderCheck.length === 0) {
      return NextResponse.json({ error: 'Order not found or not authorized' }, { status: 404 })
    }

    if (orderCheck[0].status !== 'delivered') {
      return NextResponse.json({ error: 'Can only rate delivered orders' }, { status: 400 })
    }

    // Check if user has already rated this order
    const [existingRating] = await query<any>(
      'SELECT id FROM order_ratings WHERE user_id = :userId AND order_id = :orderId',
      { userId, orderId }
    )

    if (existingRating.length > 0) {
      return NextResponse.json({ 
        error: 'You have already rated this order. Each order can only be rated once.' 
      }, { status: 400 })
    }

    // Create new rating
    const [result] = await query<any>(
      `INSERT INTO order_ratings (user_id, order_id, rating, review_text, created_at) 
       VALUES (:userId, :orderId, :rating, :reviewText, NOW())`,
      { userId, orderId, rating, reviewText: reviewText || null }
    )
    const ratingId = result.insertId

    // Handle images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      // Delete existing images for this rating
      await query(
        'DELETE FROM order_rating_images WHERE order_rating_id = :ratingId',
        { ratingId }
      )

      // Insert new images (max 3)
      const imagesToInsert = images.slice(0, 3)
      for (const image of imagesToInsert) {
        if (image.imageUrl && image.imageName && image.imageSize) {
          await query(
            `INSERT INTO order_rating_images (order_rating_id, image_url, image_name, image_size, created_at) 
             VALUES (:ratingId, :imageUrl, :imageName, :imageSize, NOW())`,
            { 
              ratingId, 
              imageUrl: image.imageUrl, 
              imageName: image.imageName, 
              imageSize: image.imageSize 
            }
          )
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Rating added successfully' 
    })
  } catch (e: any) {
    console.error('POST /api/ratings error:', e)
    return NextResponse.json({ 
      error: 'Failed to save rating', 
      details: e.message 
    }, { status: 500 })
  }
}

// DELETE /api/ratings?orderId=123 - Delete an order rating
export async function DELETE(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const [result] = await query<any>(
      'DELETE FROM order_ratings WHERE user_id = :userId AND order_id = :orderId',
      { userId, orderId }
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Rating deleted successfully' })
  } catch (e: any) {
    console.error('DELETE /api/ratings error:', e)
    return NextResponse.json({ 
      error: 'Failed to delete rating', 
      details: e.message 
    }, { status: 500 })
  }
}