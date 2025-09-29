import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    // Get all images for this product
    const [imageRows] = await query<any>(
      'SELECT image_url, alt_text, is_primary, sort_order FROM product_images WHERE product_id = :id ORDER BY sort_order',
      { id }
    )

    return NextResponse.json({
      productId: id,
      totalImages: imageRows.length,
      images: imageRows
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch product images', 
      details: error.message 
    }, { status: 500 })
  }
}


