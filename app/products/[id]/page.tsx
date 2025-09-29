"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Heart, ShoppingCart, Star, Minus, Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { SaleCountdown } from "@/components/sale-countdown"
import { ProductRating } from "@/components/product-rating"

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  category: string
  rating: number
  reviews: number
  averageRating?: number
  totalRatings?: number
  badge?: string
  description?: string
  specifications?: Record<string, string>
  stock?: number
  isOnSale?: boolean
  saleEndDate?: string
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [favorites, setFavorites] = useState<number[]>([])
  const [cart, setCart] = useState<number[]>([])
  const [isInFavorites, setIsInFavorites] = useState(false)
  const [isInCart, setIsInCart] = useState(false)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        setIsLoggedIn(response.ok)
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  // Check if product is in favorites and cart
  useEffect(() => {
    const checkProductStatus = async () => {
      if (!isLoggedIn || !product) return

      try {
        // Check favorites
        const favoritesResponse = await fetch('/api/favorites')
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json()
          setIsInFavorites(favoritesData.items.some((item: any) => item.productId === product.id))
        }

        // Check cart
        const cartResponse = await fetch('/api/cart')
        if (cartResponse.ok) {
          const cartData = await cartResponse.json()
          setIsInCart(cartData.items.some((item: any) => item.productId === product.id))
        }
      } catch (error) {
        console.error('Failed to check product status:', error)
      }
    }

    checkProductStatus()
  }, [isLoggedIn, product])

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/products/${params.id}`)
        if (!response.ok) {
          throw new Error('Product not found')
        }
        const data = await response.json()

        // Transform API data to match our Product interface
        const transformedProduct: Product = {
          id: data.id,
          name: data.name,
          price: parseFloat(data.price),
          originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
          image: data.image || "/placeholder.svg",
          images: data.images ? data.images.map((img: any) => img.url) : [],
          category: data.category,
          rating: data.averageRating || 0,
          reviews: data.totalRatings || 0,
          averageRating: data.averageRating || 0,
          totalRatings: data.totalRatings || 0,
          badge: data.isOnSale ? 'Sale' : (data.status === 'active' ? 'Available' : undefined),
          description: data.description || '',
          specifications: {},
          stock: data.stock || 0,
          isOnSale: data.isOnSale,
          saleEndDate: data.saleInfo?.endDate
        }

        
        setProduct(transformedProduct)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const handleLoginRequired = () => {
    router.push('/login')
  }

  const toggleFavorite = async (productId: number) => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    try {
      if (isInFavorites) {
        // Remove from favorites
        const response = await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        })
        if (response.ok) {
          setIsInFavorites(false)
          alert('Removed from favorites!')
          // Refresh header counts
          if ((window as any).refreshHeaderCounts) {
            (window as any).refreshHeaderCounts()
          }
        } else {
          const errorData = await response.json()
          console.error('Remove from favorites failed:', errorData)
          alert(`Failed to remove from favorites: ${errorData.error || 'Unknown error'}`)
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId })
        })
        if (response.ok) {
          setIsInFavorites(true)
          alert('Added to favorites!')
          // Refresh header counts
          if ((window as any).refreshHeaderCounts) {
            (window as any).refreshHeaderCounts()
          }
        } else {
          const errorData = await response.json()
          console.error('Add to favorites failed:', errorData)
          alert(`Failed to add to favorites: ${errorData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      alert('Failed to update favorites. Please try again.')
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
        body: JSON.stringify({ productId, quantity })
      })
      
      if (response.ok) {
        setIsInCart(true)
        alert('Product added to cart!')
        // Refresh header counts
        if ((window as any).refreshHeaderCounts) {
          (window as any).refreshHeaderCounts()
        }
      } else {
        const errorData = await response.json()
        console.error('Add to cart failed:', errorData)
        alert(`Failed to add to cart: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Loading product...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error || 'Product not found'}</p>
            <Button onClick={() => router.push('/')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Use actual product images if available, otherwise fallback to single image
  const images = product?.images && product.images.length > 0 
    ? product.images
    : product?.image 
    ? [product.image]
    : ['/placeholder.svg']


  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="bg-yellow-50/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Product Images */}
              <div className="space-y-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={images[selectedImage] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? "border-pink-500" : "border-gray-200"
                      }`}
                    >
                      <img src={image || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  {product.badge && (
                    <Badge className="mb-2 bg-pink-500 hover:bg-pink-600 text-white">{product.badge}</Badge>
                  )}
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.averageRating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.averageRating > 0 ? `${product.averageRating.toFixed(1)} (${product.totalRatings} reviews)` : 'No ratings yet'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-gray-900">₱{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-2xl text-gray-500 line-through">₱{product.originalPrice}</span>
                  )}
                  {product.originalPrice && (
                    <Badge variant="destructive">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                </div>

                {/* Sale Countdown */}
                {product.isOnSale && product.saleEndDate && (
                  <div className="mt-4">
                    <SaleCountdown endDate={product.saleEndDate} className="text-sm" />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600">
                      {product.description ||
                        `Premium quality ${product.name.toLowerCase()} sourced from trusted local farms. Perfect for your poultry needs with guaranteed freshness and health.`}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Specifications</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span>{product.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-semibold ${(product.stock || 0) > 10 ? 'text-green-600' : (product.stock || 0) > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {product.stock || 0} available
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span>{product.category === "Chicks" ? "1-2 weeks" : "Fresh daily"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Origin:</span>
                        <span>Local Farm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quality:</span>
                        <span>Premium Grade</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">Quantity:</span>
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-10 w-10"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setQuantity(Math.min(product.stock || 0, quantity + 1))} 
                        className="h-10 w-10"
                        disabled={quantity >= (product.stock || 0)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <span className="text-sm text-gray-600">
                      Max: {product.stock || 0}
                    </span>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                      onClick={() => addToCart(product.id)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart - ₱{product.price * quantity}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`border-pink-300 hover:bg-pink-50 bg-transparent ${
                        isInFavorites ? "text-pink-600" : "text-gray-600 hover:text-pink-600"
                      }`}
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart className={`w-4 h-4 ${isInFavorites ? "fill-current" : ""}`} />
                    </Button>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 bg-transparent"
                    onClick={() => router.push(`/buy-now?id=${product.id}`)}
                  >
                    Buy Now
                  </Button>
                </div>

                <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>🚚</span>
                    <span>Free delivery for orders over ₱500</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span>24/7 customer support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span>Quality guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Ratings and Reviews */}
        {product && (
          <div className="mt-8">
            <ProductRating productId={product.id} productName={product.name} />
          </div>
        )}

        {/* Note: Ratings are now order-based, not product-based */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Product ratings are based on customer order experiences. 
            You can rate products after your order has been delivered.
          </p>
        </div>
      </main>

    </div>
  )
}
