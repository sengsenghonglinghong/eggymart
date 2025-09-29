import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Test basic connection
    const [result] = await query('SELECT 1 as test')
    console.log('Database connection test:', result)

    // Check if cart_items table exists
    const [tables] = await query<any>(
      "SHOW TABLES LIKE 'cart_items'"
    )
    
    const cartTableExists = tables.length > 0
    console.log('Cart table exists:', cartTableExists)

    // Check if favorites table exists
    const [favoritesTables] = await query<any>(
      "SHOW TABLES LIKE 'favorites'"
    )
    
    const favoritesTableExists = favoritesTables.length > 0
    console.log('Favorites table exists:', favoritesTableExists)

    return NextResponse.json({
      databaseConnected: true,
      cartTableExists,
      favoritesTableExists,
      message: cartTableExists && favoritesTableExists 
        ? 'All tables exist and ready!' 
        : 'Missing tables - please run the database setup script'
    })
  } catch (error: any) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      databaseConnected: false,
      error: error.message,
      message: 'Database connection failed'
    }, { status: 500 })
  }
}











