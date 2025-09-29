"use client"

import { useState, useEffect } from "react"
import { Bell, Heart, ShoppingCart, Package, X, Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { useSessionContext } from "@/components/session-provider"
import { useRouter } from "next/navigation"

interface Notification {
  id: number | string
  type: 'favorite' | 'cart' | 'order' | 'order_status' | 'sale'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  productId?: number
  productName?: string
  productImage?: string
  categoryName?: string
  originalPrice?: number
  salePrice?: number
  discountPercentage?: number
  quantityAvailable?: number
  startDate?: string
  endDate?: string
  savings?: number
  orderId?: number
}

export default function NotificationPage() {
  const router = useRouter()
  const { isLoggedIn, isLoading } = useSessionContext()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, isLoading, router])

  // Fetch notifications
  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications()
    }
  }, [isLoggedIn])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      
      // Fetch regular notifications and sale notifications in parallel
      const [regularResponse, salesResponse] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/sales/notifications')
      ])
      
      const regularData = regularResponse.ok ? await regularResponse.json() : { notifications: [] }
      const salesData = salesResponse.ok ? await salesResponse.json() : { notifications: [] }
      
      // Combine both notification types
      const allNotifications = [
        ...(regularData.notifications || []),
        ...(salesData.notifications || [])
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setNotifications(allNotifications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number | string) => {
    try {
      // For sale notifications (string IDs), just update local state
      if (typeof notificationId === 'string') {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        )
        return
      }

      // For regular notifications (number IDs), call the API
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        )
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        )
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        )
      }
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'favorite':
        return <Heart className="w-5 h-5 text-pink-500" />
      case 'cart':
        return <ShoppingCart className="w-5 h-5 text-blue-500" />
      case 'order':
        return <Package className="w-5 h-5 text-green-500" />
      case 'order_status':
        return <Package className="w-5 h-5 text-purple-500" />
      case 'sale':
        return <span className="text-2xl">🔥</span>
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'favorite':
        return 'border-l-pink-500'
      case 'cart':
        return 'border-l-blue-500'
      case 'order':
        return 'border-l-green-500'
      case 'order_status':
        return 'border-l-purple-500'
      case 'sale':
        return 'border-l-red-500'
      default:
        return 'border-l-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null // Will redirect to login
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error: {error}</p>
              <Button onClick={fetchNotifications} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-gray-600 mb-4">
                  You'll see notifications here when you favorite products, add items to cart, or make purchases.
                </p>
                <Button onClick={() => router.push('/home')} className="bg-pink-500 hover:bg-pink-600 text-white">
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all duration-200 hover:shadow-md ${
                    !notification.isRead ? 'bg-white border-l-4' : 'bg-gray-50'
                  } ${getNotificationColor(notification.type)} ${
                    notification.type === 'order_status' && 
                    notification.title.includes('Delivered') && 
                    notification.orderId ? 'cursor-pointer hover:bg-pink-50 border-pink-200' : ''
                  }`}
                  onClick={() => {
                    if (notification.type === 'order_status' && 
                        notification.title.includes('Delivered') && 
                        notification.orderId) {
                      markAsRead(notification.id)
                      router.push(`/rate?orderId=${notification.orderId}`)
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </h3>
                            <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatDate(notification.createdAt)}
                              </span>
                              {!notification.isRead && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            
                            {/* Rate Order Button for Delivered Orders */}
                            {notification.type === 'order_status' && 
                             notification.title.includes('Delivered') && 
                             notification.orderId && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2">
                                  Click anywhere on this notification or the button below to rate your order experience
                                </p>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                    router.push(`/rate?orderId=${notification.orderId}`)
                                  }}
                                  className="bg-pink-500 hover:bg-pink-600 text-white text-xs"
                                >
                                  <Star className="w-3 h-3 mr-1" />
                                  Rate Order
                                </Button>
                              </div>
                            )}

                            {/* Sale Notification Details */}
                            {notification.type === 'sale' && (
                              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center gap-3">
                                  {notification.productImage && (
                                    <img 
                                      src={notification.productImage} 
                                      alt={notification.productName}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-sm">
                                      {notification.productName}
                                    </h4>
                                    <p className="text-xs text-gray-600 mb-1">
                                      {notification.categoryName}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold text-red-600">
                                        ₱{notification.salePrice?.toFixed(2)}
                                      </span>
                                      <span className="text-sm text-gray-500 line-through">
                                        ₱{notification.originalPrice?.toFixed(2)}
                                      </span>
                                      <Badge variant="destructive" className="text-xs">
                                        {notification.discountPercentage}% OFF
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-green-600 font-medium mt-1">
                                      Save ₱{notification.savings?.toFixed(2)} • {notification.quantityAvailable} left
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Sale ends: {new Date(notification.endDate || '').toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                    router.push(`/products/${notification.productId}`)
                                  }}
                                  className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white text-xs"
                                >
                                  <ShoppingCart className="w-3 h-3 mr-1" />
                                  View Sale
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="text-xs"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Mark Read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
