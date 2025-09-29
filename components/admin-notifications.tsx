"use client"

import { useState } from "react"
import { Bell, Package, Star, AlertTriangle, X, Clock, ShoppingCart, CheckCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Notification {
  id: string | number
  type: 'low_stock' | 'new_review' | 'new_order' | 'order_reminder'
  message: string
  name?: string
  stock?: number
  category?: string
  customerName?: string
  productName?: string
  rating?: number
  reviewText?: string
  orderNumber?: string
  totalAmount?: number
  status?: string
  itemCount?: number
  reminderMessage?: string
  createdAt?: string
  updatedAt?: string
}

interface AdminNotificationsProps {
  notifications: {
    lowStock: Notification[]
    newReviews: Notification[]
    newOrders: Notification[]
    orderReminders: Notification[]
  }
  loading?: boolean
}

export function AdminNotifications({ notifications, loading = false }: AdminNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [readNotifications, setReadNotifications] = useState<Set<string | number>>(new Set())
  
  const allNotifications = [
    ...notifications.lowStock.map(n => ({ ...n, type: 'low_stock' as const })),
    ...notifications.newReviews.map(n => ({ ...n, type: 'new_review' as const })),
    ...notifications.newOrders.map(n => ({ ...n, type: 'new_order' as const })),
    ...notifications.orderReminders.map(n => ({ ...n, type: 'order_reminder' as const }))
  ].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.updatedAt || 0)
    const dateB = new Date(b.createdAt || b.updatedAt || 0)
    return dateB.getTime() - dateA.getTime()
  })

  const unreadNotifications = allNotifications.filter(n => !readNotifications.has(n.id))
  const totalNotifications = unreadNotifications.length
  const lowStockCount = notifications.lowStock.filter(n => !readNotifications.has(n.id)).length
  const newReviewCount = notifications.newReviews.filter(n => !readNotifications.has(n.id)).length
  const newOrderCount = notifications.newOrders.filter(n => !readNotifications.has(n.id)).length
  const orderReminderCount = notifications.orderReminders.filter(n => !readNotifications.has(n.id)).length

  // Show all notifications in the list, but track read status for counts
  const displayNotifications = allNotifications

  const markAllAsRead = () => {
    const allIds = allNotifications.map(n => n.id)
    setReadNotifications(new Set(allIds))
  }

  const markAsRead = (notificationId: string | number) => {
    setReadNotifications(prev => new Set([...prev, notificationId]))
  }

  const markAsUnread = (notificationId: string | number) => {
    setReadNotifications(prev => {
      const newSet = new Set(prev)
      newSet.delete(notificationId)
      return newSet
    })
  }

  const toggleReadStatus = (notificationId: string | number) => {
    if (readNotifications.has(notificationId)) {
      markAsUnread(notificationId)
    } else {
      markAsRead(notificationId)
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Unknown time'
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'new_review':
        return <Star className="w-4 h-4 text-yellow-500" />
      case 'new_order':
        return <ShoppingCart className="w-4 h-4 text-green-500" />
      case 'order_reminder':
        return <RotateCcw className="w-4 h-4 text-purple-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'bg-orange-50 border-orange-200'
      case 'new_review':
        return 'bg-blue-50 border-blue-200'
      case 'new_order':
        return 'bg-green-50 border-green-200'
      case 'order_reminder':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`relative transition-all duration-200 hover:shadow-md ${
            totalNotifications > 0 
              ? "bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100" 
              : "bg-transparent border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Bell className="w-4 h-4 mr-2" />
          Notifications
          {totalNotifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold animate-pulse"
            >
              {totalNotifications}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Admin Notifications
              {totalNotifications > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalNotifications} unread
                </Badge>
              )}
            </DialogTitle>
            {totalNotifications > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs bg-transparent hover:bg-gray-50"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark All as Read
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : displayNotifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No notifications at the moment</p>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                You'll see low stock alerts, new reviews, orders, and reminders here when they occur
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className={`transition-all duration-200 hover:shadow-md ${lowStockCount > 0 ? "bg-orange-50 border-orange-200 shadow-orange-100" : "bg-gray-50 border-gray-200"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-700 mb-1">Low Stock</p>
                        <p className="text-3xl font-bold text-gray-900">{lowStockCount}</p>
                        <p className="text-xs text-gray-500 mt-1">items need restocking</p>
                      </div>
                      <div className={`p-3 rounded-full ${lowStockCount > 0 ? "bg-orange-100" : "bg-gray-100"}`}>
                        <AlertTriangle className={`w-6 h-6 ${lowStockCount > 0 ? "text-orange-600" : "text-gray-400"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={`transition-all duration-200 hover:shadow-md ${newReviewCount > 0 ? "bg-blue-50 border-blue-200 shadow-blue-100" : "bg-gray-50 border-gray-200"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-700 mb-1">New Reviews</p>
                        <p className="text-3xl font-bold text-gray-900">{newReviewCount}</p>
                        <p className="text-xs text-gray-500 mt-1">customer feedback</p>
                      </div>
                      <div className={`p-3 rounded-full ${newReviewCount > 0 ? "bg-blue-100" : "bg-gray-100"}`}>
                        <Star className={`w-6 h-6 ${newReviewCount > 0 ? "text-blue-600" : "text-gray-400"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={`transition-all duration-200 hover:shadow-md ${newOrderCount > 0 ? "bg-green-50 border-green-200 shadow-green-100" : "bg-gray-50 border-gray-200"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-700 mb-1">New Orders</p>
                        <p className="text-3xl font-bold text-gray-900">{newOrderCount}</p>
                        <p className="text-xs text-gray-500 mt-1">last 24 hours</p>
                      </div>
                      <div className={`p-3 rounded-full ${newOrderCount > 0 ? "bg-green-100" : "bg-gray-100"}`}>
                        <ShoppingCart className={`w-6 h-6 ${newOrderCount > 0 ? "text-green-600" : "text-gray-400"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={`transition-all duration-200 hover:shadow-md ${orderReminderCount > 0 ? "bg-purple-50 border-purple-200 shadow-purple-100" : "bg-gray-50 border-gray-200"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-700 mb-1">Order Reminders</p>
                        <p className="text-3xl font-bold text-gray-900">{orderReminderCount}</p>
                        <p className="text-xs text-gray-500 mt-1">need attention</p>
                      </div>
                      <div className={`p-3 rounded-full ${orderReminderCount > 0 ? "bg-purple-100" : "bg-gray-100"}`}>
                        <RotateCcw className={`w-6 h-6 ${orderReminderCount > 0 ? "text-purple-600" : "text-gray-400"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notifications List */}
              <div className="space-y-3">
                {displayNotifications.map((notification, index) => {
                  const dateTime = formatDateTime(notification.createdAt || notification.updatedAt)
                  const isRead = readNotifications.has(notification.id)
                  
                  return (
                    <Card 
                      key={`${notification.type}-${notification.id}-${index}`} 
                      className={`${getNotificationColor(notification.type)} ${isRead ? 'opacity-60' : ''} transition-opacity duration-200`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1 relative">
                            {getNotificationIcon(notification.type)}
                            {!isRead && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900 mb-1">
                                  {notification.message}
                                </p>
                                
                                {notification.type === 'low_stock' && (
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <p><span className="font-medium">Product:</span> {notification.name}</p>
                                    <p><span className="font-medium">Category:</span> {notification.category}</p>
                                    <p><span className="font-medium">Stock:</span> <span className="text-orange-600 font-semibold">{notification.stock} items left</span></p>
                                  </div>
                                )}
                                
                                {notification.type === 'new_review' && (
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <p><span className="font-medium">Customer:</span> {notification.customerName}</p>
                                    <p><span className="font-medium">Product:</span> {notification.productName}</p>
                                    <p><span className="font-medium">Order:</span> #{notification.orderNumber}</p>
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Rating:</span>
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <span
                                            key={i}
                                            className={`text-xs ${
                                              i < (notification.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                          >
                                            ★
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    {notification.reviewText && (
                                      <p className="mt-2 p-2 bg-white rounded border text-gray-700">
                                        "{notification.reviewText}"
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {notification.type === 'new_order' && (
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <p><span className="font-medium">Order:</span> #{notification.orderNumber}</p>
                                    <p><span className="font-medium">Customer:</span> {notification.customerName}</p>
                                    <p><span className="font-medium">Amount:</span> ₱{parseFloat(notification.totalAmount || 0).toFixed(2)}</p>
                                    <p><span className="font-medium">Items:</span> {notification.itemCount} item(s)</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="font-medium">Status:</span>
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-xs ${
                                          notification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          notification.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                          notification.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                                          notification.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                                          notification.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}
                                      >
                                        {notification.status}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                                
                                {notification.type === 'order_reminder' && (
                                  <div className="text-xs text-gray-600 space-y-1">
                                    <p><span className="font-medium">Order:</span> #{notification.orderNumber}</p>
                                    <p><span className="font-medium">Customer:</span> {notification.customerName}</p>
                                    <p><span className="font-medium">Amount:</span> ₱{parseFloat(notification.totalAmount || 0).toFixed(2)}</p>
                                    <p><span className="font-medium">Items:</span> {notification.itemCount} item(s)</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="font-medium">Status:</span>
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-xs ${
                                          notification.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                          notification.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}
                                      >
                                        {notification.status}
                                      </Badge>
                                    </div>
                                    <p className="mt-2 p-2 bg-white rounded border text-gray-700 font-medium">
                                      {notification.reminderMessage}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{dateTime.date} at {dateTime.time}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleReadStatus(notification.id)}
                                className={`text-xs h-6 px-2 ${
                                  isRead 
                                    ? 'text-gray-400 hover:text-gray-600' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {isRead ? 'Mark as Unread' : 'Mark as Read'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
