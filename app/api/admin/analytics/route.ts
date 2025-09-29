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

// GET /api/admin/analytics - Get admin dashboard analytics
export async function GET(request: Request) {
  try {
    const adminId = await getAdminUser(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    // Get overview stats
    const [productCount] = await query<any>('SELECT COUNT(*) as count FROM products WHERE status = "active"')
    const [orderCount] = await query<any>('SELECT COUNT(*) as count FROM orders')
    const [customerCount] = await query<any>('SELECT COUNT(DISTINCT user_id) as count FROM orders')
    const [totalRevenue] = await query<any>('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != "cancelled"')

    // Get recent orders (last 4)
    const [recentOrders] = await query<any>(
      `SELECT o.id, o.order_number, o.customer_name, o.total_amount, o.status, o.created_at
       FROM orders o
       ORDER BY o.created_at DESC
       LIMIT 4`,
      {}
    )

    // Get low stock products (stock <= 20) for notifications
    const [lowStockProducts] = await query<any>(
      `SELECT p.id, p.name, p.stock, c.name as category, p.updated_at
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.stock <= 20 AND p.status = 'active'
       ORDER BY p.stock ASC
       LIMIT 10`,
      {}
    )

    // Get low stock products (stock <= 10) for overview display
    const [lowStockOverview] = await query<any>(
      `SELECT p.id, p.name, p.stock, c.name as category
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.stock <= 10 AND p.status = 'active'
       ORDER BY p.stock ASC
       LIMIT 4`,
      {}
    )

    // Get monthly revenue data (last 12 months)
    const [monthlyRevenue] = await query<any>(
      `SELECT 
         DATE_FORMAT(created_at, '%b') as month,
         DATE_FORMAT(created_at, '%Y-%m') as month_year,
         COALESCE(SUM(total_amount), 0) as revenue,
         COUNT(*) as orders,
         COALESCE(AVG(total_amount), 0) as avgOrder
       FROM orders 
       WHERE status != 'cancelled' 
         AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
       ORDER BY month_year ASC`,
      {}
    )

    // Get revenue by category
    const [revenueByCategory] = await query<any>(
      `SELECT 
         c.name as category,
         COALESCE(SUM(oi.total_price), 0) as revenue,
         COUNT(DISTINCT o.id) as order_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id
       LEFT JOIN order_items oi ON p.id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
       GROUP BY c.id, c.name
       HAVING revenue > 0
       ORDER BY revenue DESC`,
      {}
    )

    // Get recent customer reviews (last 5)
    const [recentReviews] = await query<any>(
      `SELECT 
         or_ratings.id,
         or_ratings.rating,
         or_ratings.review_text,
         or_ratings.created_at,
         u.name as customer_name,
         o.order_number,
         p.name as product_name,
         p.id as product_id
       FROM order_ratings or_ratings
       JOIN users u ON or_ratings.user_id = u.id
       JOIN orders o ON or_ratings.order_id = o.id
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       ORDER BY or_ratings.created_at DESC
       LIMIT 5`,
      {}
    )

    // Get new orders (last 24 hours)
    const [newOrders] = await query<any>(
      `SELECT 
         o.id,
         o.order_number,
         o.customer_name,
         o.total_amount,
         o.status,
         o.created_at,
         o.updated_at,
         COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         AND o.status != 'cancelled'
       GROUP BY o.id, o.order_number, o.customer_name, o.total_amount, o.status, o.created_at, o.updated_at
       ORDER BY o.created_at DESC
       LIMIT 10`,
      {}
    )

    // Get orders that need attention (confirmed or processing status)
    const [orderReminders] = await query<any>(
      `SELECT 
         o.id,
         o.order_number,
         o.customer_name,
         o.total_amount,
         o.status,
         o.created_at,
         o.updated_at,
         COUNT(oi.id) as item_count,
         CASE 
           WHEN o.status = 'confirmed' THEN 'Order confirmed - ready for processing'
           WHEN o.status = 'processing' THEN 'Order processing - check progress'
           ELSE 'Order needs attention'
         END as reminder_message
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.status IN ('confirmed', 'processing')
         AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY o.id, o.order_number, o.customer_name, o.total_amount, o.status, o.created_at, o.updated_at
       ORDER BY 
         CASE o.status 
           WHEN 'processing' THEN 1 
           WHEN 'confirmed' THEN 2 
           ELSE 3 
         END,
         o.created_at ASC
       LIMIT 15`,
      {}
    )

    // Calculate total revenue for percentage calculation
    const totalCategoryRevenue = revenueByCategory.reduce((sum: number, cat: any) => sum + parseFloat(cat.revenue), 0)

    // Format the data
    const analytics = {
      overview: {
        totalProducts: productCount[0]?.count || 0,
        totalOrders: orderCount[0]?.count || 0,
        totalCustomers: customerCount[0]?.count || 0,
        totalRevenue: parseFloat(totalRevenue[0]?.total || 0)
      },
      recentOrders: recentOrders.map((order: any) => ({
        id: order.order_number,
        customer: order.customer_name,
        amount: `₱${parseFloat(order.total_amount).toFixed(2)}`,
        status: order.status,
        date: order.created_at
      })),
      lowStockProducts: lowStockOverview.map((product: any) => ({
        name: product.name,
        stock: product.stock,
        category: product.category
      })),
      notifications: {
        lowStock: lowStockProducts.map((product: any) => ({
          id: product.id,
          name: product.name,
          stock: product.stock,
          category: product.category,
          updatedAt: product.updated_at,
          type: 'low_stock',
          message: `${product.name} is running low (${product.stock} items left)`
        })),
        newReviews: recentReviews.map((review: any) => ({
          id: review.id,
          customerName: review.customer_name,
          productName: review.product_name,
          rating: review.rating,
          reviewText: review.review_text,
          createdAt: review.created_at,
          orderNumber: review.order_number,
          type: 'new_review',
          message: `New ${review.rating}-star review from ${review.customer_name} for ${review.product_name}`
        })),
        newOrders: newOrders.map((order: any) => ({
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          totalAmount: order.total_amount,
          status: order.status,
          itemCount: order.item_count,
          createdAt: order.created_at,
          type: 'new_order',
          message: `New order #${order.order_number} from ${order.customer_name} - ₱${parseFloat(order.total_amount).toFixed(2)}`
        })),
        orderReminders: orderReminders.map((order: any) => ({
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          totalAmount: order.total_amount,
          status: order.status,
          itemCount: order.item_count,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          reminderMessage: order.reminder_message,
          type: 'order_reminder',
          message: order.reminder_message
        }))
      },
      monthlyRevenue: monthlyRevenue.map((month: any) => ({
        month: month.month,
        revenue: parseFloat(month.revenue),
        orders: month.orders,
        avgOrder: Math.round(parseFloat(month.avgOrder))
      })),
      revenueByCategory: revenueByCategory.map((cat: any) => ({
        category: cat.category,
        revenue: parseFloat(cat.revenue),
        percentage: totalCategoryRevenue > 0 ? Math.round((parseFloat(cat.revenue) / totalCategoryRevenue) * 100) : 0
      })),
      recentReviews: recentReviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        reviewText: review.review_text,
        createdAt: review.created_at,
        customerName: review.customer_name,
        orderNumber: review.order_number,
        productName: review.product_name,
        productId: review.product_id
      }))
    }

    return NextResponse.json(analytics)
  } catch (e: any) {
    console.error('Admin analytics error:', e)
    return NextResponse.json({ 
      error: 'Failed to fetch analytics', 
      details: e.message 
    }, { status: 500 })
  }
}
