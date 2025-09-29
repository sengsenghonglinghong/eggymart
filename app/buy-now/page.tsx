"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Heart, ShoppingCart, Star, Minus, Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { SaleCountdown } from "@/components/sale-countdown"

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  rating: number
  reviews: number
  badge?: string
  description?: string
  isOnSale?: boolean
  saleEndDate?: string
}

export default function BuyNowPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; phone: string; address: string } | null>(null)
  const [isInFavorites, setIsInFavorites] = useState(false)
  const [isInCart, setIsInCart] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  })
  const [deliveryMethod, setDeliveryMethod] = useState("delivery")
  const [paymentMethod, setPaymentMethod] = useState("cod")

  // Get product ID from URL params
  const productId = searchParams.get('id')

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setIsLoggedIn(true)
          setUser(data.user)
          setCustomerInfo(prev => ({
            ...prev,
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            address: data.user.address || ""
          }))
        } else {
          setIsLoggedIn(false)
          router.push('/login')
        }
      } catch {
        setIsLoggedIn(false)
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('No product ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/products/${productId}`)
        if (!response.ok) {
          throw new Error('Product not found')
        }
        const data = await response.json()
        
        const transformedProduct: Product = {
          id: data.id,
          name: data.name,
          price: parseFloat(data.price),
          originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : undefined,
          image: data.image || "/placeholder.svg",
          category: data.category,
          rating: 4.5,
          reviews: Math.floor(Math.random() * 200) + 10,
          badge: data.isOnSale ? 'Sale' : (data.status === 'active' ? 'Available' : undefined),
          description: data.description || '',
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

    fetchProduct()
  }, [productId])

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

  const toggleFavorite = async (productId: number) => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    try {
      if (isInFavorites) {
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
        }
      } else {
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
        alert(`Failed to add to cart: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart. Please try again.')
    }
  }

  const handleSubmit = async () => {
    if (!isLoggedIn || !product) return

    setIsSubmitting(true)
    try {
      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          customerInfo,
          deliveryMethod,
          paymentMethod,
          notes: customerInfo.notes
        })
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const orderData = await orderResponse.json()
      
      // Create notification for order placement
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order',
            title: 'Order Placed Successfully',
            message: `Your order #${orderData.orderNumber} for "${product.name}" has been placed successfully`,
            productId: product.id,
            productName: product.name,
            orderId: orderData.orderId
          })
        })
        // Dispatch event to update notification count
        window.dispatchEvent(new CustomEvent('notificationsUpdated'))
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError)
      }
      
      // Show success message
      alert(`Order placed successfully!\n\nOrder Number: ${orderData.orderNumber}\nProduct: ${product.name}\nQuantity: ${quantity}\nTotal: ₱${orderData.total}\n\nDelivery: ${deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pickup'}\nPayment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'gcash' ? 'GCash' : 'Pay on Store'}`)
      
      // Dispatch custom event to update header counts
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      
      // Redirect to home
      router.push('/home')
    } catch (error) {
      console.error('Order failed:', error)
      alert(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
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

  const subtotal = product.price * quantity
  const deliveryFee = deliveryMethod === "delivery" ? (subtotal >= 500 ? 0 : 50) : 0
  const total = subtotal + deliveryFee

  const isFormValid = customerInfo.name && customerInfo.phone && 
    (deliveryMethod === "pickup" || customerInfo.address)

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="bg-yellow-50/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Buy Now</h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Product Info & Customer Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Product Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Product Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-gray-900">₱{product.price}</span>
                          <span className="text-sm text-gray-600">
                            Stock: <span className="font-medium text-gray-700">{product.stock || 0} available</span>
                          </span>
                        </div>
                        
                        {/* Sale Countdown */}
                        {product.isOnSale && product.saleEndDate && (
                          <div className="mt-3">
                            <SaleCountdown endDate={product.saleEndDate} />
                          </div>
                        )}
                        
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="h-8 w-8"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="px-3 py-1 min-w-[2rem] text-center text-sm">{quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setQuantity(Math.min(product.stock || 0, quantity + 1))}
                            className="h-8 w-8"
                            disabled={quantity >= (product.stock || 0)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                    {user && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <p><strong>Account:</strong> {user.name} ({user.email})</p>
                        <p><strong>Phone:</strong> {user.phone}</p>
                        <p><strong>Address:</strong> {user.address}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setCustomerInfo({
                              name: user.name || "",
                              email: user.email || "",
                              phone: user.phone || "",
                              address: user.address || "",
                              notes: customerInfo.notes
                            })
                          }}
                        >
                          Use Account Information
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="09XX XXX XXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery" className="flex-1">
                          <div className="flex justify-between">
                            <span>Home Delivery</span>
                            <span className="text-sm text-gray-600">{subtotal >= 500 ? "FREE" : "₱50"}</span>
                          </div>
                          <p className="text-sm text-gray-600">Delivered to your address</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup" className="flex-1">
                          <div className="flex justify-between">
                            <span>Store Pickup</span>
                            <span className="text-sm text-gray-600">FREE</span>
                          </div>
                          <p className="text-sm text-gray-600">Pick up from our store</p>
                        </Label>
                      </div>
                    </RadioGroup>

                    {deliveryMethod === "delivery" && (
                      <div className="mt-4">
                        <Label htmlFor="address">Delivery Address *</Label>
                        {user?.address && (
                          <div className="mb-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setCustomerInfo(prev => ({ ...prev, address: user.address }))}
                            >
                              Use Account Address
                            </Button>
                          </div>
                        )}
                        <Textarea
                          id="address"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter your complete address"
                          rows={3}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod">Cash on Delivery</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gcash" id="gcash" />
                        <Label htmlFor="gcash">GCash</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="store" id="store" />
                        <Label htmlFor="store">Pay on Store</Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Order Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Notes (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any special instructions..."
                      rows={3}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Order Summary */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>{product.name} x{quantity}</span>
                        <span>₱{subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>{deliveryFee === 0 ? "FREE" : `₱${deliveryFee}`}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>₱{total}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
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

                    <div className="space-y-2">
                      <Button
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                      >
                        {isSubmitting ? "Processing..." : `Place Order - ₱${total}`}
                      </Button>

                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                          onClick={() => addToCart(product.id)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
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
                    </div>

                    <p className="text-xs text-gray-600 text-center">
                      By placing this order, you agree to our terms and conditions
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
