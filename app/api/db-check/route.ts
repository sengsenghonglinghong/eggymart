import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Check if all required tables exist
    const [tables] = await query<any>(
      `SHOW TABLES LIKE 'order_ratings'`
    )
    
    const [imageTables] = await query<any>(
      `SHOW TABLES LIKE 'order_rating_images'`
    )

    const [ordersTable] = await query<any>(
      `SHOW TABLES LIKE 'orders'`
    )

    const [orderItemsTable] = await query<any>(
      `SHOW TABLES LIKE 'order_items'`
    )

    const [productsTable] = await query<any>(
      `SHOW TABLES LIKE 'products'`
    )

    // Check table structures
    let orderRatingsStructure = null
    let orderRatingImagesStructure = null

    if (tables.length > 0) {
      const [structure] = await query<any>('DESCRIBE order_ratings')
      orderRatingsStructure = structure
    }

    if (imageTables.length > 0) {
      const [structure] = await query<any>('DESCRIBE order_rating_images')
      orderRatingImagesStructure = structure
    }

    return NextResponse.json({
      tables: {
        order_ratings: tables.length > 0,
        order_rating_images: imageTables.length > 0,
        orders: ordersTable.length > 0,
        order_items: orderItemsTable.length > 0,
        products: productsTable.length > 0
      },
      structures: {
        order_ratings: orderRatingsStructure,
        order_rating_images: orderRatingImagesStructure
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Database check failed', 
      details: error.message 
    }, { status: 500 })
  }
}
