"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Star, ArrowLeft, Package, User, MapPin, CreditCard, Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { useSessionContext } from "@/components/session-provider"

interface OrderItem {
  id: number
  productId: number
  productName: string
  productImage: string
  quantity: number
  productPrice: number
  totalPrice: number
}

interface Order {
  id: number
  orderNumber: string
  status: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  deliveryMethod: string
  paymentMethod: string
  subtotal: number
  deliveryFee: number
  totalAmount: number
  notes: string
  createdAt: string
  items: OrderItem[]
}

interface OrderRating {
  rating: number
  reviewText: string
  createdAt: string
  updatedAt: string
}

interface UploadedImage {
  id?: string
  imageUrl: string
  imageName: string
  imageSize: number
  file?: File
}

export default function RateOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const { isLoggedIn, isLoading: isSessionLoading } = useSessionContext()

  const [order, setOrder] = useState<Order | null>(null)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [existingRating, setExistingRating] = useState<OrderRating | null>(null)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId || !isLoggedIn) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Fetch order details
      const orderResponse = await fetch(`/api/orders/${orderId}`)
      if (!orderResponse.ok) {
        throw new Error('Failed to fetch order details')
      }
      const orderData = await orderResponse.json()
      setOrder(orderData.order)

      // Check if order is delivered
      if (orderData.order.status !== 'delivered') {
        setError('You can only rate delivered orders')
        setLoading(false)
        return
      }

      // Fetch existing rating
      const ratingResponse = await fetch(`/api/ratings?orderId=${orderId}`)
      if (ratingResponse.ok) {
        const ratingData = await ratingResponse.json()
        if (ratingData.userRating) {
          setExistingRating(ratingData.userRating)
          setRating(ratingData.userRating.rating)
          setReview(ratingData.userRating.reviewText || '')
        }
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }, [orderId, isLoggedIn])

  useEffect(() => {
    if (!isSessionLoading) {
      if (!isLoggedIn) {
        router.push('/login')
      } else {
        fetchOrderDetails()
      }
    }
  }, [isLoggedIn, isSessionLoading, fetchOrderDetails, router])

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
  }

  const handleReviewChange = (newReview: string) => {
    setReview(newReview)
  }

  const handleImageUpload = async (files: FileList) => {
    if (images.length + files.length > 3) {
      alert('You can only upload up to 3 images.')
      return
    }

    setUploadingImages(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to upload image')
        }

        const data = await response.json()
        return {
          imageUrl: data.imageUrl,
          imageName: data.filename,
          imageSize: data.size,
          file
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)
      setImages(prev => [...prev, ...uploadedImages])
    } catch (error: any) {
      setError(error.message || 'Failed to upload images')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleImageUpload(files)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmitRating = async () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    if (rating === 0) {
      alert('Please select a star rating.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: Number(orderId), 
          rating, 
          reviewText: review.trim() || null,
          images: images.map(img => ({
            imageUrl: img.imageUrl,
            imageName: img.imageName,
            imageSize: img.imageSize
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit rating')
      }

      alert('Thank you for your rating! Your feedback helps us improve our service.')
      router.push('/profile')
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  if (isSessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null // Will redirect to login
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error: {error || 'Order not found'}</p>
            <Button onClick={() => router.push('/profile')} className="bg-pink-500 hover:bg-pink-600 text-white">
              Back to Profile
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order #{order.orderNumber}</span>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </CardTitle>
              <CardDescription>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold">₱{(order.totalAmount || 0).toFixed(2)}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{order.deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pickup'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-yellow-500" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.productImage || "/placeholder.svg"}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{item.productName}</h3>
                      <div className="text-sm text-gray-600">
                        <div>Quantity: {item.quantity || 0}</div>
                        <div>Price: ₱{(item.productPrice || 0).toFixed(2)} each</div>
                        <div className="font-medium">Total: ₱{(item.totalPrice || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No items found in this order.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rating Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Rate Your Order Experience
              </CardTitle>
              <CardDescription>
                <p className="text-sm text-gray-600">
                  How was your overall experience with this order? Your feedback helps us improve our service.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Rating Stars */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Overall Rating:
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-8 h-8 cursor-pointer transition-colors ${
                          rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                        onClick={() => handleRatingChange(star)}
                      />
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      {rating} star{rating !== 1 ? 's' : ''} - {
                        rating === 1 ? 'Poor' :
                        rating === 2 ? 'Fair' :
                        rating === 3 ? 'Good' :
                        rating === 4 ? 'Very Good' : 'Excellent'
                      }
                    </p>
                  )}
                </div>

                {/* Review Text */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Write a review (optional):
                  </label>
                  <Textarea
                    placeholder="Share your experience with this order..."
                    value={review}
                    onChange={(e) => handleReviewChange(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Add photos (optional, max 3):
                  </label>
                  
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload images or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      PNG, JPG, WebP up to 5MB each
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages || images.length >= 3}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingImages ? 'Uploading...' : 'Choose Images'}
                    </Button>
                    {images.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {images.length}/3 images selected
                      </p>
                    )}
                  </div>

                  {/* Image Preview */}
                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={image.imageUrl}
                              alt={image.imageName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 truncate">{image.imageName}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(image.imageSize)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Existing Rating Notice */}
                {existingRating && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      You previously rated this order {existingRating.rating} star{existingRating.rating !== 1 ? 's' : ''} on {new Date(existingRating.createdAt).toLocaleDateString()}.
                      {existingRating.updatedAt !== existingRating.createdAt && (
                        <span> (Updated on {new Date(existingRating.updatedAt).toLocaleDateString()})</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSubmitRating}
                      disabled={submitting || rating === 0}
                      className="bg-pink-500 hover:bg-pink-600 text-white"
                    >
                      {submitting ? 'Submitting...' : (existingRating ? 'Update Rating' : 'Submit Rating')}
                    </Button>
                    <Button
                      onClick={() => router.push('/profile')}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    You can update your rating anytime. Your feedback helps us improve our service.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}