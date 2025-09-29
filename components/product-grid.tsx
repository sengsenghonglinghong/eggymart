"use client"

import { useState, useEffect } from "react"
import { Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useSessionContext } from "@/components/session-provider"
import { SaleCountdown } from "./sale-countdown"

// Product type definition
interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  image?: string
  category: string
  rating?: number
  reviews?: number
  averageRating?: number
  totalRatings?: number
  badge?: string
  description?: string
  status?: string
  stock?: number
  isOnSale?: boolean
  saleEndDate?: string
}

interface ProductGridProps {
  category?: string
}

export function ProductGrid({ category }: ProductGridProps) {
  const router = useRouter()
  const { isLoggedIn } = useSessionContext()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<number[]>([])
  const [cart, setCart] = useState<number[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedFilter, setSelectedFilter] = useState("all")

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/products')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        const data = await response.json()
        // Transform API data to match our Product interface
        const transformedProducts: Product[] = data.items.map((item: any) => {
          // Check if product is on sale
          const isOnSale = item.sale_id && item.sale_status === 'active' && 
                          new Date() >= new Date(item.start_date) && 
                          new Date() <= new Date(item.end_date)
          
          return {
            id: item.id,
            name: item.name,
            price: isOnSale ? parseFloat(item.sale_price) : parseFloat(item.price),
            originalPrice: isOnSale ? parseFloat(item.original_price) : undefined,
            image: item.image || "/placeholder.svg",
            category: item.category,
            rating: parseFloat(item.average_rating) || 0,
            reviews: item.total_ratings || 0,
            averageRating: parseFloat(item.average_rating) || 0,
            totalRatings: item.total_ratings || 0,
            badge: isOnSale ? 'Sale' : (item.status === 'active' ? 'Available' : undefined),
            description: item.description || '',
            status: item.status,
            stock: item.stock || 0, // Real stock from database
            isOnSale: isOnSale,
            saleEndDate: isOnSale ? item.end_date : undefined
          }
        })
        setProducts(transformedProducts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Load user's favorites and cart when logged in
  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoggedIn) {
        setFavorites([])
        setCart([])
        return
      }

      try {
        // Load favorites
        const favoritesResponse = await fetch('/api/favorites')
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json()
          setFavorites(favoritesData.items.map((item: any) => item.productId))
        }

        // Load cart
        const cartResponse = await fetch('/api/cart')
        if (cartResponse.ok) {
          const cartData = await cartResponse.json()
          setCart(cartData.items.map((item: any) => item.productId))
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
      }
    }

    loadUserData()
  }, [isLoggedIn])

  const filteredProducts = products.filter((product) => {
    // If we're on a specific category page, use that
    if (category === "eggs") return product.category === "Eggs"
    if (category === "chicks") return product.category === "Chicks"
    
    // Otherwise use the dropdown selection
    let categoryMatch = true
    if (selectedCategory === "eggs") categoryMatch = product.category === "Eggs"
    if (selectedCategory === "chicks") categoryMatch = product.category === "Chicks"
    if (selectedCategory === "all") categoryMatch = true
    
    // Apply additional filter
    let filterMatch = true
    if (selectedFilter === "premium") filterMatch = product.name.toLowerCase().includes("premium") || product.name.toLowerCase().includes("grade a")
    if (selectedFilter === "organic") filterMatch = product.name.toLowerCase().includes("organic")
    if (selectedFilter === "fresh") filterMatch = product.name.toLowerCase().includes("fresh") || product.name.toLowerCase().includes("daily")
    if (selectedFilter === "all") filterMatch = true
    
    return categoryMatch && filterMatch
  })


  const handleProductClick = (product: Product) => {
    router.push(`/products/${product.id}`)
  }

  const toggleFavorite = async (productId: number) => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    try {
      const isCurrentlyFavorite = favorites.includes(productId)
      
      if (isCurrentlyFavorite) {
        // Remove from favorites
        const response = await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        })
        
        if (response.ok) {
          setFavorites((prev) => prev.filter((id) => id !== productId))
          // Dispatch custom event to update header counts
          window.dispatchEvent(new CustomEvent('favoritesUpdated'))
        } else {
          const error = await response.json()
          console.error('Failed to remove from favorites:', error)
          alert('Failed to remove from favorites')
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        })
        
        if (response.ok) {
          setFavorites((prev) => [...prev, productId])
          alert('Added to favorites!')
          // Dispatch custom event to update header counts
          window.dispatchEvent(new CustomEvent('favoritesUpdated'))
          
          // Create notification for adding to favorites
          const product = products.find(p => p.id === productId)
          if (product) {
            try {
              await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'favorite',
                  title: 'Added to Favorites',
                  message: `You added "${product.name}" to your favorites`,
                  productId: product.id,
                  productName: product.name
                })
              })
              // Dispatch event to update notification count
              window.dispatchEvent(new CustomEvent('notificationsUpdated'))
            } catch (notificationError) {
              console.error('Failed to create notification:', notificationError)
            }
          }
        } else {
          const error = await response.json()
          console.error('Failed to add to favorites:', error)
          alert(error.error || 'Failed to add to favorites')
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Failed to update favorites')
    }
  }

  const addToCart = async (productId: number) => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      })
      
      if (response.ok) {
        setCart((prev) => [...prev, productId])
        alert('Product added to cart!')
        // Dispatch custom event to update header counts
        window.dispatchEvent(new CustomEvent('cartUpdated'))
        
        // Create notification for adding to cart
        const product = products.find(p => p.id === productId)
        if (product) {
          try {
            await fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'cart',
                title: 'Added to Cart',
                message: `You added "${product.name}" to your cart`,
                productId: product.id,
                productName: product.name
              })
            })
            // Dispatch event to update notification count
            window.dispatchEvent(new CustomEvent('notificationsUpdated'))
          } catch (notificationError) {
            console.error('Failed to create notification:', notificationError)
          }
        }
      } else {
        const error = await response.json()
        console.error('Failed to add to cart:', error)
        alert(error.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add to cart')
    }
  }

  const buyNow = (productId: number) => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    // Navigate to buy now page with product ID
    router.push(`/buy-now?id=${productId}`)
  }


  const handleViewMore = () => {
    router.push("/products")
  }

  const handleSearch = () => {
    router.push("/search")
  }

  return (
    <div className="flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {category === "eggs" ? "Fresh Eggs" : category === "chicks" ? "Baby Chicks" : "New arrivals"}
        </h2>
        <Button
          variant="outline"
          className="text-yellow-600 border-yellow-300 hover:bg-yellow-50 bg-transparent w-full sm:w-auto"
          onClick={handleViewMore}
        >
          View more
        </Button>
      </div>

      {/* Filter Dropdowns */}
      {!category && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="all">All Products</option>
                <option value="eggs">🥚 Eggs</option>
                <option value="chicks">🐣 Chicks</option>
              </select>
            </div>

            {/* Additional Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="all">All Items</option>
                <option value="premium">⭐ Premium Quality</option>
                <option value="fresh">🆕 Fresh Daily</option>
              </select>
            </div>
          </div>
        </div>
      )}


      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading products...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No products found.</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-300 cursor-pointer">
            <CardContent className="p-0">
              <div className="relative" onClick={() => handleProductClick(product)}>
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-40 sm:h-48 object-cover rounded-t-lg"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute top-2 right-2 bg-white/80 hover:bg-white transition-colors ${
                    favorites.includes(product.id) ? "text-pink-600" : "text-gray-600 hover:text-pink-600"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isLoggedIn) {
                      router.push('/login')
                      return
                    }
                    toggleFavorite(product.id)
                  }}
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(product.id) ? "fill-current" : ""}`} />
                </Button>
                {product.badge && (
                  <Badge className="absolute top-2 left-2 bg-pink-500 hover:bg-pink-600 text-white text-xs">
                    {product.badge}
                  </Badge>
                )}
              </div>

              <div className="p-3 sm:p-4">
                <h3
                  className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer text-sm sm:text-base"
                  onClick={() => handleProductClick(product)}
                >
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-amber-600 text-sm">★</span>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {product.averageRating > 0 ? `${product.averageRating.toFixed(1)} (${product.totalRatings})` : 'No ratings yet'}
                  </span>
                </div>
                
                {/* Stock Information */}
                <div className="mb-3">
                  <span className="text-xs text-gray-500">
                    Stock: <span className="font-medium text-gray-700">{product.stock || 0} available</span>
                  </span>
                </div>

                {/* Sale Countdown */}
                {product.isOnSale && product.saleEndDate && (
                  <div className="mb-3">
                    <SaleCountdown endDate={product.saleEndDate} />
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-gray-900">₱{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-xs sm:text-sm text-gray-500 line-through">₱{product.originalPrice}</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-pink-500 hover:bg-pink-600 text-white text-xs px-2 sm:px-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      addToCart(product.id)
                    }}
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50 text-xs px-2 sm:px-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      buyNow(product.id)
                    }}
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

    </div>
  )
}
