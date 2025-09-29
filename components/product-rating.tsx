"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Star, MessageSquare, ThumbsUp, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useSessionContext } from "@/components/session-provider"
import { useRouter } from "next/navigation"

interface Rating {
  id: number
  rating: number
  reviewText: string | null
  createdAt: string
  updatedAt: string | null
  userName: string
  userEmail: string
  images?: Array<{
    id: number
    imageUrl: string
    imageName: string
    imageSize: number
    createdAt: string
  }>
}

interface RatingStats {
  averageRating: string
  totalRatings: number
  ratingDistribution: {
    fiveStar: number
    fourStar: number
    threeStar: number
    twoStar: number
    oneStar: number
  }
}

interface ProductRatingProps {
  productId: number
  productName: string
}

interface UserOrder {
  id: number
  orderNumber: string
  status: string
  createdAt: string
  hasRating?: boolean
  existingRating?: {
    rating: number
    reviewText: string | null
    createdAt: string
  }
}

export function ProductRating({ productId, productName }: ProductRatingProps) {
  const { isLoggedIn, isLoading } = useSessionContext()
  const router = useRouter()
  const [ratings, setRatings] = useState<Rating[]>([])
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [userReview, setUserReview] = useState("")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [userOrders, setUserOrders] = useState<UserOrder[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [canRate, setCanRate] = useState(false)

  // Fetch ratings and user orders
  useEffect(() => {
    if (productId) {
      fetchRatings()
      if (isLoggedIn) {
        fetchUserOrders()
      }
    }
  }, [productId, isLoggedIn])

  // Load existing rating when order is selected
  useEffect(() => {
    if (selectedOrderId && userOrders.length > 0) {
      const selectedOrder = userOrders.find(order => order.id === selectedOrderId)
      if (selectedOrder?.hasRating && selectedOrder.existingRating) {
        setUserRating(selectedOrder.existingRating.rating)
        setUserReview(selectedOrder.existingRating.reviewText || "")
        setShowReviewForm(true)
      } else {
        setUserRating(0)
        setUserReview("")
      }
    }
  }, [selectedOrderId, userOrders])

  // Helper function to get full image URL - memoized to prevent infinite re-renders
  const getImageUrl = useCallback((imageUrl: string) => {
    if (imageUrl.startsWith('http')) {
      return imageUrl
    }
    
    // Try different URL formats
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    const fullUrl = `${baseUrl}${imageUrl}`
    
    return fullUrl
  }, [])

  const fetchRatings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/product-ratings/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setRatings(data.ratings)
        setStats(data.stats)
        
        // Images will be handled directly without state management
        
        // Find user's existing rating
        if (isLoggedIn) {
          const userRatingData = data.ratings.find((r: Rating) => 
            r.userEmail === (typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null)
          )
          if (userRatingData) {
            setUserRating(userRatingData.rating)
            setUserReview(userRatingData.reviewText || "")
          }
        }
      } else {
        console.error('Failed to fetch ratings:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserOrders = async () => {
    try {
      const response = await fetch(`/api/orders?productId=${productId}`)
      if (response.ok) {
        const data = await response.json()
        const deliveredOrders = data.orders.filter((order: any) => order.status === 'delivered')
        
        // Check for existing ratings for each order
        const ordersWithRatingStatus = await Promise.all(
          deliveredOrders.map(async (order: any) => {
            try {
              const ratingResponse = await fetch(`/api/ratings?orderId=${order.id}`)
              if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json()
                return {
                  ...order,
                  hasRating: ratingData.userRating !== null,
                  existingRating: ratingData.userRating
                }
              }
            } catch (error) {
              console.error(`Failed to fetch rating for order ${order.id}:`, error)
            }
            return {
              ...order,
              hasRating: false,
              existingRating: null
            }
          })
        )
        
        setUserOrders(ordersWithRatingStatus)
        
        // Check if user has any unrated delivered orders
        const unratedOrders = ordersWithRatingStatus.filter(order => !order.hasRating)
        setCanRate(unratedOrders.length > 0)
        
        // If user has only one unrated delivered order, auto-select it
        if (unratedOrders.length === 1) {
          setSelectedOrderId(unratedOrders[0].id)
        }
      } else {
        console.error('Failed to fetch user orders:', response.status, response.statusText)
        setCanRate(false)
      }
    } catch (error) {
      console.error('Failed to fetch user orders:', error)
      setCanRate(false)
    }
  }

  const handleRatingSubmit = async () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    if (userRating === 0) {
      alert('Please select a rating')
      return
    }

    if (!selectedOrderId) {
      alert('Please select an order to rate')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          rating: userRating,
          reviewText: userReview.trim() || null
        })
      })

      if (response.ok) {
        alert('Rating submitted successfully!')
        setShowReviewForm(false)
        fetchRatings() // Refresh ratings
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit rating')
      }
    } catch (error) {
      console.error('Failed to submit rating:', error)
      alert('Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRating = async () => {
    if (!isLoggedIn || !selectedOrderId) return

    try {
      const response = await fetch(`/api/ratings?orderId=${selectedOrderId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Rating deleted successfully!')
        setUserRating(0)
        setUserReview("")
        fetchRatings() // Refresh ratings
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete rating')
      }
    } catch (error) {
      console.error('Failed to delete rating:', error)
      alert('Failed to delete rating')
    }
  }

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive ? () => setUserRating(star) : undefined}
          />
        ))}
      </div>
    )
  }

  const getRatingPercentage = (count: number) => {
    if (!stats || stats.totalRatings === 0) return 0
    return Math.round((count / stats.totalRatings) * 100)
  }


  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading ratings...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Debug Section - Remove this after debugging */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">🐛 Debug Info</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Product ID:</strong> {productId}</p>
              <p><strong>Ratings Count:</strong> {ratings.length}</p>
              <p><strong>Ratings with Images:</strong> {ratings.filter(r => r.images && r.images.length > 0).length}</p>
              <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
              <p><strong>Base URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
            </div>
            {ratings.filter(r => r.images && r.images.length > 0).map((rating, index) => (
              <div key={index} className="mt-2 p-2 bg-yellow-100 rounded">
                <p className="font-medium">Rating {index + 1} Images:</p>
                {rating.images.map((img, imgIndex) => (
                  <div key={imgIndex} className="text-xs">
                    <p>• Original: {img.imageUrl}</p>
                    <p>• Full URL: {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}{img.imageUrl}</p>
                    <p>• Size: {img.imageSize} bytes</p>
                    <button 
                      onClick={async () => {
                        const testUrl = getImageUrl(img.imageUrl)
                        console.log('🧪 Testing image URL:', testUrl)
                        
                        try {
                          const response = await fetch(testUrl)
                          console.log('🧪 Image fetch result:', {
                            status: response.status,
                            statusText: response.statusText,
                            ok: response.ok,
                            headers: Object.fromEntries(response.headers.entries())
                          })
                          
                          if (response.ok) {
                            console.log('✅ Image is accessible!')
                            window.open(testUrl, '_blank')
                          } else {
                            console.log('❌ Image is not accessible:', response.status, response.statusText)
                          }
                        } catch (error) {
                          console.log('❌ Error fetching image:', error)
                        }
                      }}
                      className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Test URL
                    </button>
                    <button 
                      onClick={() => {
                        const testUrl = getImageUrl(img.imageUrl)
                        console.log('🖼️ Creating test image element:', testUrl)
                        const testImg = document.createElement('img')
                        testImg.src = testUrl
                        testImg.style.width = '100px'
                        testImg.style.height = '100px'
                        testImg.style.border = '2px solid red'
                        testImg.onload = () => console.log('✅ Test image loaded successfully')
                        testImg.onerror = () => console.log('❌ Test image failed to load')
                        document.body.appendChild(testImg)
                        setTimeout(() => document.body.removeChild(testImg), 5000)
                      }}
                      className="mt-1 ml-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      Test Image
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Product Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats && stats.totalRatings > 0 ? (
            <div className="space-y-4">
              {/* Average Rating */}
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.averageRating}
                </div>
                <div>
                  {renderStars(Math.round(parseFloat(stats.averageRating)))}
                  <p className="text-sm text-gray-600 mt-1">
                    Based on {stats.totalRatings} rating{stats.totalRatings !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.ratingDistribution[`${star}Star` as keyof typeof stats.ratingDistribution]
                  const percentage = getRatingPercentage(count)
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-sm w-8">{star}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">No ratings yet. Be the first to rate this product!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Rating Form */}
      {isLoggedIn && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-pink-500" />
              {userRating > 0 ? 'Update Your Rating' : 'Rate This Product'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!canRate ? (
              <div className="text-center py-4">
                {userOrders.length === 0 ? (
                  <>
                    <p className="text-gray-600 mb-2">
                      You can only rate products you have purchased and received.
                    </p>
                    <p className="text-sm text-gray-500">
                      Purchase this product and wait for delivery to leave a rating.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-2">
                      You have already rated all your delivered orders for this product.
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Place a new order to rate this product again.
                    </p>
                    
                    {/* Show all orders for this product */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Your Orders for this Product:</p>
                      {userOrders.map((order) => (
                        <div 
                          key={order.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">Order #{order.orderNumber}</p>
                              <Badge variant="secondary" className="text-xs">
                                {order.status === 'delivered' ? 'Delivered' : order.status}
                              </Badge>
                              {order.hasRating && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  Rated
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {order.status === 'delivered' ? 'Delivered' : 'Ordered'} on {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                            {order.hasRating && order.existingRating && (
                              <div className="flex items-center gap-2 mt-1">
                                {renderStars(order.existingRating.rating)}
                                <span className="text-xs text-gray-500">
                                  Rated on {new Date(order.existingRating.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : userOrders.filter(order => !order.hasRating).length > 1 && !selectedOrderId ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    You have multiple delivered orders for this product. Which order would you like to rate?
                  </p>
                  <div className="space-y-2">
                    {userOrders.filter(order => !order.hasRating).map((order) => (
                      <div 
                        key={order.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <div>
                          <p className="font-medium text-sm">Order #{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">
                            Delivered on {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOrderId(order.id)
                          }}
                        >
                          Rate This Order
                        </Button>
                      </div>
                    ))}
                    
                    {/* Show already rated orders */}
                    {userOrders.filter(order => order.hasRating).length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Already Rated Orders:</p>
                        {userOrders.filter(order => order.hasRating).map((order) => (
                          <div 
                            key={order.id}
                            className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">Order #{order.orderNumber}</p>
                                <Badge variant="secondary" className="text-xs">
                                  Already Rated
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">
                                Delivered on {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                              {order.hasRating && order.existingRating && (
                                <div className="flex items-center gap-2 mt-1">
                                  {renderStars(order.existingRating.rating)}
                                  <span className="text-xs text-gray-500">
                                    Rated on {new Date(order.existingRating.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Button 
                              size="sm"
                              variant="outline"
                              disabled
                              className="text-gray-400"
                            >
                              Already Rated
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : !showReviewForm && userRating === 0 ? (
              <div className="space-y-4">
                {selectedOrderId && userOrders.find(o => o.id === selectedOrderId)?.hasRating ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-2">
                      You have already rated Order #{userOrders.find(o => o.id === selectedOrderId)?.orderNumber}.
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Each order can only be rated once. Place a new order to rate this product again.
                    </p>
                    {userOrders.find(o => o.id === selectedOrderId)?.existingRating && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Your Rating:</p>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {renderStars(userOrders.find(o => o.id === selectedOrderId)?.existingRating?.rating || 0)}
                          <span className="text-sm text-gray-600">
                            {userOrders.find(o => o.id === selectedOrderId)?.existingRating?.rating} star{(userOrders.find(o => o.id === selectedOrderId)?.existingRating?.rating || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {userOrders.find(o => o.id === selectedOrderId)?.existingRating?.reviewText && (
                          <p className="text-sm text-gray-600 italic">
                            "{userOrders.find(o => o.id === selectedOrderId)?.existingRating?.reviewText}"
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Rated on {new Date(userOrders.find(o => o.id === selectedOrderId)?.existingRating?.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">How would you rate this product?</p>
                      {renderStars(0, true)}
                    </div>
                    {selectedOrderId && (
                      <p className="text-xs text-gray-500">
                        Rating for Order #{userOrders.find(o => o.id === selectedOrderId)?.orderNumber}
                      </p>
                    )}
                    <Button 
                      onClick={() => setShowReviewForm(true)}
                      className="bg-pink-500 hover:bg-pink-600 text-white"
                    >
                      Write a Review
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Your Rating:</p>
                  {renderStars(0, true)}
                  {userRating > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {userRating} star{userRating !== 1 ? 's' : ''}
                    </p>
                  )}
                  {selectedOrderId && (
                    <p className="text-xs text-gray-500">
                      Rating for Order #{userOrders.find(o => o.id === selectedOrderId)?.orderNumber}
                    </p>
                  )}
                  {selectedOrderId && userOrders.find(o => o.id === selectedOrderId)?.hasRating && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ You can only rate each order once. This will update your existing rating.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    Review (Optional):
                  </label>
                  <Textarea
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleRatingSubmit}
                    disabled={submitting || userRating === 0 || !selectedOrderId}
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    {submitting ? 'Submitting...' : 
                     (selectedOrderId && userOrders.find(o => o.id === selectedOrderId)?.hasRating) ? 
                     'Update Rating' : 'Submit Rating'}
                  </Button>
                  
                  {userRating > 0 && (
                    <Button 
                      onClick={handleDeleteRating}
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete Rating
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => {
                      setShowReviewForm(false)
                      if (userOrders.length > 1) {
                        setSelectedOrderId(null)
                      }
                    }}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-500" />
              Customer Reviews ({ratings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                       <span className="font-medium text-gray-900">
                         {rating.userName}
                       </span>
                       <Badge variant="secondary" className="text-xs">
                         Verified Purchase
                       </Badge>
                       <Badge variant="outline" className="text-xs">
                         {rating.productName}
                       </Badge>
                     </div>
                     <div className="flex items-center gap-2">
                       {renderStars(rating.rating)}
                       <span className="text-sm text-gray-500">
                         {new Date(rating.createdAt).toLocaleDateString()}
                       </span>
                     </div>
                   </div>
                  
                   {rating.reviewText && (
                     <p className="text-gray-700 text-sm leading-relaxed mb-3">
                       {rating.reviewText}
                     </p>
                   )}
                   
                   {/* Review Images */}
                   {rating.images && rating.images.length > 0 && (
                     <div className="mt-3">
                       <div className="flex items-center gap-2 mb-2">
                         <span className="text-xs text-gray-500">
                           {rating.images.length} image{rating.images.length !== 1 ? 's' : ''} attached
                         </span>
                       </div>
                       <div className="flex flex-wrap gap-2">
                         {rating.images.map((image, imageIndex) => {
                           const fullImageUrl = getImageUrl(image.imageUrl)
                           
                           return (
                             <div key={image.id} className="relative group">
                               <div className="relative">
                                 <img
                                   src={fullImageUrl}
                                   alt={image.imageName || 'Review image'}
                                   className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                                   onLoad={() => {
                                     console.log('✅ Review image loaded successfully:', fullImageUrl)
                                   }}
                                   onError={(e) => {
                                     console.log('❌ Review image failed to load:', fullImageUrl)
                                     e.currentTarget.src = '/placeholder.svg'
                                   }}
                                 />
                               </div>
                               <div 
                                 className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer"
                                 onClick={() => {
                                   console.log('🖼️ Image clicked for full view:', fullImageUrl)
                                   setSelectedImage(fullImageUrl)
                                 }}
                               >
                                 <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                               </div>
                             </div>
                           )
                         })}
                       </div>
                     </div>
                   )}
                 </div>
              ))}
            </div>
          </CardContent>
         </Card>
       )}

       {/* Image Modal */}
       {selectedImage && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
           <div className="relative max-w-4xl max-h-full">
             <img
               src={selectedImage}
               alt="Review image"
               className="max-w-full max-h-full object-contain rounded-lg"
               onError={(e) => {
                 e.currentTarget.src = '/placeholder.svg'
               }}
             />
             <Button
               variant="ghost"
               size="icon"
               className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white"
               onClick={() => setSelectedImage(null)}
             >
               <X className="w-6 h-6" />
             </Button>
           </div>
         </div>
       )}
     </div>
   )
 }
