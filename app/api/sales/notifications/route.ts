import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/sales/notifications - Get active sales for user notifications
export async function GET(request: Request) {
  try {
    // Get active sales that are currently running
    const [sales] = await query<any>(
      `SELECT 
         s.id,
         s.original_price,
         s.sale_price,
         s.discount_percentage,
         s.quantity_available,
         s.quantity_sold,
         s.start_date,
         s.end_date,
         s.status,
         p.id as product_id,
         p.name as product_name,
         p.stock as product_stock,
         c.name as category_name,
         pi.image_url as product_image
       FROM sales s
       JOIN products p ON s.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
       WHERE s.status = 'active' 
         AND s.start_date <= NOW() 
         AND s.end_date >= NOW()
         AND s.quantity_available > s.quantity_sold
       ORDER BY s.discount_percentage DESC, s.created_at DESC
       LIMIT 10`,
      {}
    )

    const saleNotifications = sales.map(sale => ({
      id: `sale-${sale.id}`,
      type: 'sale',
      title: '🔥 Special Sale!',
      message: `${sale.product_name} is on sale! ${sale.discount_percentage}% off - Save ₱${(parseFloat(sale.original_price) - parseFloat(sale.sale_price)).toFixed(2)}`,
      productId: sale.product_id,
      productName: sale.product_name,
      productImage: sale.product_image || '/placeholder.svg',
      categoryName: sale.category_name,
      originalPrice: parseFloat(sale.original_price),
      salePrice: parseFloat(sale.sale_price),
      discountPercentage: parseFloat(sale.discount_percentage),
      quantityAvailable: sale.quantity_available - sale.quantity_sold,
      startDate: sale.start_date,
      endDate: sale.end_date,
      savings: parseFloat(sale.original_price) - parseFloat(sale.sale_price),
      isRead: false, // These are always "new" notifications
      createdAt: sale.start_date
    }))

    return NextResponse.json({ 
      notifications: saleNotifications,
      count: saleNotifications.length
    })
  } catch (e: any) {
    console.error('GET /api/sales/notifications error:', e)
    return NextResponse.json({ 
      error: 'Failed to fetch sale notifications', 
      details: e.message 
    }, { status: 500 })
  }
}


