"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { PaymentMethods } from "./payment-methods"
import { useSessionContext } from "@/components/session-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface CartItem {
  id: number
  productId: number
  name: string
  price: number
  originalPrice?: number
  image: string
  quantity: number
  category: string
  status: string
  isOnSale: boolean
}

interface UserInfo {
  id: number
  name: string
  email: string
  phone: string
  address: string
  role: string
}

export function CartPage() {
  const { isLoggedIn, isLoading } = useSessionContext()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState("cod")
  const [deliveryMethod, setDeliveryMethod] = useState("delivery")
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch cart items and user info
  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        router.push('/login')
        return
      }
      fetchCartData()
      fetchUserInfo()
    }
  }, [isLoggedIn, isLoading, router])

  // Update customer info when user info is loaded
  useEffect(() => {
    if (userInfo) {
      setCustomerInfo({
        name: userInfo.name,
        phone: userInfo.phone,
        email: userInfo.email,
        address: userInfo.address,
        notes: "",
      })
    }
  }, [userInfo])

  const fetchCartData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCartItems(data.items)
      } else {
        console.error('Failed to fetch cart items')
      }
    } catch (error) {
      console.error('Error fetching cart items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data.user)
      } else {
        console.error('Failed to fetch user info')
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
    }
  }

  const updateQuantity = async (productId: number, newQuantity: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: newQuantity })
      })

      if (response.ok) {
        // Update local state
        if (newQuantity === 0) {
          setCartItems((prev) => prev.filter((item) => item.productId !== productId))
        } else {
          setCartItems((prev) => prev.map((item) => 
            item.productId === productId ? { ...item, quantity: newQuantity } : item
          ))
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update quantity')
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity')
    }
  }

  const removeItem = async (productId: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })

      if (response.ok) {
        setCartItems((prev) => prev.filter((item) => item.productId !== productId))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item')
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = deliveryMethod === "delivery" ? (subtotal >= 500 ? 0 : 50) : 0
  const total = subtotal + deliveryFee

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty')
      return
    }

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.email || !customerInfo.address) {
      alert('Please fill in all required customer information')
      return
    }

    try {
      setSubmitting(true)
      
      // Create order for each product in cart
      for (const item of cartItems) {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
            customerInfo: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: customerInfo.address
            },
            deliveryMethod,
            paymentMethod,
            notes: customerInfo.notes
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create order')
        }
      }

      // Clear cart after successful order
      setCartItems([])
      alert(`Order placed successfully! Total: ₱${total}`)
      
      // Redirect to profile or home
      router.push('/profile')
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert(error.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-yellow-800">Loading your cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-200">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/">
                <Button variant="ghost" size="icon" className="hover:bg-yellow-50">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-6xl mb-4">🛒</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                      <p className="text-gray-600 mb-4">Add some fresh eggs and chicks to get started!</p>
                      <Link href="/">
                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">Continue Shopping</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  cartItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                            {item.isOnSale && item.originalPrice && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-gray-500 line-through">₱{item.originalPrice}</span>
                                <span className="text-sm font-medium text-green-600">₱{item.price}</span>
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Sale</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center border rounded-lg">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="h-8 w-8"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="px-3 py-1 min-w-[2rem] text-center text-sm">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="h-8 w-8"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">₱{item.price * item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.productId)}
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Checkout Form */}
              {cartItems.length > 0 && (
                <div className="space-y-6">
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
                          onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="09XX XXX XXXX"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
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
                          <Input
                            id="address"
                            value={customerInfo.address}
                            onChange={(e) => setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))}
                            placeholder="Enter your complete address"
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
                      <PaymentMethods selectedMethod={paymentMethod} onMethodChange={setPaymentMethod} total={total} />
                    </CardContent>
                  </Card>

                  {/* Order Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Notes (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input
                        value={customerInfo.notes}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any special instructions..."
                      />
                    </CardContent>
                  </Card>

                  {/* Order Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
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
                      <Button
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white mt-4"
                        onClick={handleCheckout}
                        disabled={
                          submitting ||
                          !customerInfo.name ||
                          !customerInfo.phone ||
                          !customerInfo.email ||
                          (deliveryMethod === "delivery" && !customerInfo.address)
                        }
                      >
                        {submitting ? 'Processing Order...' : `Place Order - ₱${total}`}
                      </Button>
                      <p className="text-xs text-gray-600 text-center mt-2">
                        By placing this order, you agree to our terms and conditions
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
