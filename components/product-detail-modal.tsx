"use client"

import { useState, useEffect } from "react"
import { Heart, ShoppingCart, Star, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  images?: Array<{
    url: string
    alt: string
    isPrimary: boolean
  }>
  category: string
  rating: number
  reviews: number
  badge?: string
  description?: string
  specifications?: Record<string, string>
}

interface ProductDetailModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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

  const handleLoginRequired = () => {
    router.push('/login')
  }

  if (!product) return null

  // Use actual product images if available, otherwise fallback to single image
  const images = product?.images && product.images.length > 0 
    ? product.images
    : product?.image 
    ? [product.image]
    : ['/placeholder.svg']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
        </DialogHeader>

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-gray-900">₱{product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">₱{product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <Badge variant="destructive">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </Badge>
              )}
            </div>

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
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} className="h-10 w-10">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                  onClick={handleLoginRequired}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart - ₱{product.price * quantity}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-pink-300 text-pink-600 hover:bg-pink-50 bg-transparent"
                  onClick={handleLoginRequired}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>

              <Button 
                variant="outline" 
                className="w-full border-gray-300 bg-transparent"
                onClick={handleLoginRequired}
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
      </DialogContent>
    </Dialog>
  )
}
