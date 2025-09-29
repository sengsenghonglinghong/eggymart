"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Header } from "@/components/header"
import { OrderReceiptModal } from "@/components/order-receipt-modal"
import { User, MapPin, Phone, Mail, Package, Bot, ShoppingCart, Heart, Eye, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSessionContext } from "@/components/session-provider"

export function ProfilePage() {
  const router = useRouter()
  const { isLoggedIn, user, isLoading } = useSessionContext()
  const [isEditing, setIsEditing] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: "Juan Dela Cruz",
    email: "juan.delacruz@email.com",
    phone: "+63 912 345 6789",
    address: "123 Barangay Street, Quezon City, Metro Manila",
  })

  // Update user info when user data is available
  useEffect(() => {
    if (user) {
      setUserInfo(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        address: user.address || prev.address
      }))
    }
  }, [user])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, isLoading, router])

  // State for real data
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  
  // Receipt modal state
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  // Fetch user's orders
  const fetchOrders = async () => {
    if (!isLoggedIn) return
    
    try {
      setOrdersLoading(true)
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setRecentOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!isLoggedIn) return
    
    try {
      setFavoritesLoading(true)
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        console.log('Favorites API response:', data)
        setFavorites(data.items || [])
      } else {
        console.error('Favorites API error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    } finally {
      setFavoritesLoading(false)
    }
  }

  // Generate AI recommendations based on user's order history and favorites
  const generateRecommendations = async () => {
    if (!isLoggedIn) return
    
    try {
      setRecommendationsLoading(true)
      // Get user's order history to generate recommendations
      const ordersResponse = await fetch('/api/orders')
      const favoritesResponse = await fetch('/api/favorites')
      
      if (ordersResponse.ok && favoritesResponse.ok) {
        const ordersData = await ordersResponse.json()
        const favoritesData = await favoritesResponse.json()
        console.log('Orders data:', ordersData)
        console.log('Favorites data:', favoritesData)
        
        // Get all products to recommend from
        const productsResponse = await fetch('/api/products')
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          const allProducts = productsData.items || []
          
          // Simple recommendation logic based on categories from orders and favorites
          const userCategories = new Set()
          
          // Add categories from orders
          ordersData.orders?.forEach((order: any) => {
            if (order.items) {
              // Extract categories from order items (simple text matching)
              if (order.items.toLowerCase().includes('egg')) userCategories.add('eggs')
              if (order.items.toLowerCase().includes('chick')) userCategories.add('chicks')
            }
          })
          
          // Add categories from favorites
          favoritesData.items?.forEach((fav: any) => {
            if (fav.category) {
              userCategories.add(fav.category.toLowerCase())
            }
          })
          
          // Filter products by user's preferred categories
          let recommendedProducts = allProducts
            .filter((product: any) => {
              const productCategory = product.category?.toLowerCase() || ''
              return Array.from(userCategories).some(cat => 
                productCategory.includes(cat) || product.name.toLowerCase().includes(cat)
              )
            })
            .slice(0, 3) // Take top 3 recommendations

          // If no recommendations based on user preferences, show popular products
          if (recommendedProducts.length === 0) {
            recommendedProducts = allProducts
              .filter((product: any) => product.status === 'active')
              .slice(0, 3)
          }
          
          // Transform to recommendation format
          const recommendations = recommendedProducts.map((product: any) => ({
            id: product.id,
            name: product.name,
            reason: `Based on your interest in ${product.category || 'similar products'}`,
            price: `₱${product.price}`,
            image: product.images?.[0]?.image_url || "/placeholder.svg",
            category: product.category
          }))
          
          console.log('Generated recommendations:', recommendations)
          setAiRecommendations(recommendations)
        }
      }
    } catch (error) {
      console.error('Failed to generate recommendations:', error)
    } finally {
      setRecommendationsLoading(false)
    }
  }

  // Fetch data when user is logged in
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      fetchOrders()
      fetchFavorites()
      generateRecommendations()
    }
  }, [isLoggedIn, isLoading])

  const handleSave = () => {
    setIsEditing(false)
    // In a real app, this would save to backend
  }

  const openReceiptModal = (orderId: number) => {
    setSelectedOrderId(orderId)
    setReceiptModalOpen(true)
  }

  const closeReceiptModal = () => {
    setReceiptModalOpen(false)
    setSelectedOrderId(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading profile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="w-20 h-20">
              <AvatarImage src="/placeholder.svg?height=80&width=80" />
              <AvatarFallback className="bg-pink-100 text-pink-600 text-xl">
                {userInfo.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="ai-recommendations">AI Recommendations</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your account details</CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                    >
                      {isEditing ? "Save Changes" : "Edit Profile"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <Input
                          id="name"
                          value={userInfo.name}
                          onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={userInfo.email}
                          onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <Input
                          id="phone"
                          value={userInfo.phone}
                          onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <Input
                          id="address"
                          value={userInfo.address}
                          onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>Track your recent purchases</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading orders...</p>
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No orders found</p>
                      <p className="text-sm text-gray-500">Start shopping to see your order history here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4 flex-1">
                            <Package className="w-8 h-8 text-pink-500" />
                            <div className="flex-1">
                              <p className="font-medium">{order.items || 'Order items'}</p>
                              <p className="text-sm text-gray-600">
                                Order #{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium">₱{order.totalAmount}</p>
                              <Badge 
                                variant={order.status === "delivered" ? "default" : "secondary"}
                                className={order.status === "delivered" ? "bg-green-100 text-green-800" : ""}
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReceiptModal(order.id)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Receipt
                            </Button>
                            {order.status === "delivered" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/rate?orderId=${order.id}`)}
                                className="flex items-center gap-2"
                              >
                                <Star className="w-4 h-4" />
                                Rate Order
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-recommendations">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-purple-500" />
                    <div>
                      <CardTitle>AI-Powered Recommendations</CardTitle>
                      <CardDescription>Personalized suggestions based on your preferences</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {recommendationsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating recommendations...</p>
                    </div>
                  ) : aiRecommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No recommendations available</p>
                      <p className="text-sm text-gray-500">Make some purchases or add favorites to get personalized recommendations</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {aiRecommendations.map((item, index) => (
                          <div key={index} className="border rounded-lg p-4 space-y-3">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-full h-32 object-cover rounded-md"
                            />
                            <div>
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-sm text-gray-600 mb-2">{item.reason}</p>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-pink-600">{item.price}</span>
                                <Button 
                                  size="sm" 
                                  className="bg-pink-500 hover:bg-pink-600"
                                  onClick={() => router.push(`/products/${item.id}`)}
                                >
                                  <ShoppingCart className="w-4 h-4 mr-1" />
                                  View Product
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-5 h-5 text-purple-600" />
                          <h4 className="font-medium text-purple-800">Smart Reorder Assistant</h4>
                        </div>
                        <p className="text-sm text-purple-700 mb-3">
                          Based on your purchase history and favorites, we've selected these products that match your preferences.
                          {recentOrders.length > 0 && " Your last order was " + new Date(recentOrders[0].createdAt).toLocaleDateString() + "."}
                        </p>
                        <Button
                          variant="outline"
                          className="border-purple-300 text-purple-600 hover:bg-purple-50 bg-transparent"
                          onClick={() => router.push('/products')}
                        >
                          Browse All Products
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle>My Favorites</CardTitle>
                  <CardDescription>Products you've saved for later</CardDescription>
                </CardHeader>
                <CardContent>
                  {favoritesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading favorites...</p>
                    </div>
                  ) : favorites.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No favorites yet</p>
                      <p className="text-sm text-gray-500">Browse products and add them to your favorites</p>
                      <Button 
                        className="mt-4 bg-pink-500 hover:bg-pink-600"
                        onClick={() => router.push('/products')}
                      >
                        Browse Products
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favorites.map((favorite) => (
                        <div key={favorite.id} className="border rounded-lg p-4 space-y-3">
                          <img
                            src={favorite.image || "/placeholder.svg"}
                            alt={favorite.name}
                            className="w-full h-32 object-cover rounded-md"
                          />
                          <div>
                            <h3 className="font-medium">{favorite.name}</h3>
                            <p className="text-sm text-gray-600">{favorite.description || favorite.category}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-bold text-pink-600">₱{favorite.price}</span>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch('/api/favorites', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ productId: favorite.productId })
                                      })
                                      if (response.ok) {
                                        setFavorites(prev => prev.filter(fav => fav.id !== favorite.id))
                                        // Dispatch event to update header count
                                        window.dispatchEvent(new CustomEvent('favoritesUpdated'))
                                      }
                                    } catch (error) {
                                      console.error('Failed to remove from favorites:', error)
                                    }
                                  }}
                                >
                                  <Heart className="w-4 h-4 fill-current text-pink-500" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-pink-500 hover:bg-pink-600"
                                  onClick={() => router.push(`/products/${favorite.productId}`)}
                                >
                                  View Product
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Order Receipt Modal */}
      <OrderReceiptModal
        isOpen={receiptModalOpen}
        onClose={closeReceiptModal}
        orderId={selectedOrderId}
      />
    </div>
  )
}
