"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface Product {
  id: number
  name: string
  price: number
  image: string
  category: string
}

interface BuyNowModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export function BuyNowModal({ product, isOpen, onClose }: BuyNowModalProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  })
  const [deliveryMethod, setDeliveryMethod] = useState("delivery")
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
            email: data.user.email || ""
          }))
        } else {
          setIsLoggedIn(false)
        }
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1)
      setCustomerInfo(prev => ({
        ...prev,
        name: user?.name || "",
        email: user?.email || ""
      }))
    }
  }, [isOpen, product, user])

  if (!product) return null

  const subtotal = product.price * quantity
  const deliveryFee = deliveryMethod === "delivery" ? (subtotal >= 500 ? 0 : 50) : 0
  const total = subtotal + deliveryFee

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    try {
      // Add to cart first
      const cartResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity })
      })

      if (!cartResponse.ok) {
        throw new Error('Failed to add to cart')
      }

      // Here you would typically create an order
      // For now, we'll just show a success message
      alert(`Order placed successfully!\n\nProduct: ${product.name}\nQuantity: ${quantity}\nTotal: ₱${total}\n\nDelivery: ${deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pickup'}\nPayment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'gcash' ? 'GCash' : 'Pay on Store'}`)
      
      onClose()
    } catch (error) {
      console.error('Order failed:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = customerInfo.name && customerInfo.phone && 
    (deliveryMethod === "pickup" || customerInfo.address)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Buy Now</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Product Info & Customer Details */}
          <div className="space-y-6">
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
                          onClick={() => setQuantity(quantity + 1)}
                          className="h-8 w-8"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
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

                <Button
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? "Processing..." : `Place Order - ₱${total}`}
                </Button>

                <p className="text-xs text-gray-600 text-center">
                  By placing this order, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

