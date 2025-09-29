"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"

export default function DebugRatingsPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        setLoading(true)
        
        // Fetch test ratings data
        const testResponse = await fetch('/api/test-ratings')
        const testData = await testResponse.json()
        
        // Fetch products data
        const productsResponse = await fetch('/api/products')
        const productsData = await productsResponse.json()
        
        setDebugData({
          testRatings: testData,
          products: productsData.items?.slice(0, 3) || [] // First 3 products
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDebugData()
  }, [])

  const testProductRating = async (productId: number) => {
    try {
      const response = await fetch(`/api/debug-product-ratings/${productId}`)
      const data = await response.json()
      console.log(`Debug data for product ${productId}:`, data)
      alert(`Check console for debug data for product ${productId}`)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading debug data...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error: {error}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Rating System Debug</h1>
          
          {/* Database Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Database Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Total Orders</h3>
                <p className="text-2xl font-bold text-blue-600">{debugData?.testRatings?.summary?.totalOrders || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900">Total Ratings</h3>
                <p className="text-2xl font-bold text-green-600">{debugData?.testRatings?.summary?.totalRatings || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900">Total Images</h3>
                <p className="text-2xl font-bold text-purple-600">{debugData?.testRatings?.summary?.totalImages || 0}</p>
              </div>
            </div>
          </div>

          {/* Sample Orders */}
          {debugData?.testRatings?.sampleOrders && debugData.testRatings.sampleOrders.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Sample Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Order ID</th>
                      <th className="text-left p-2">Order Number</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">User ID</th>
                      <th className="text-left p-2">Items</th>
                      <th className="text-left p-2">Ratings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugData.testRatings.sampleOrders.map((order: any) => (
                      <tr key={order.id} className="border-b">
                        <td className="p-2">{order.id}</td>
                        <td className="p-2">{order.order_number}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-2">{order.user_id}</td>
                        <td className="p-2">{order.item_count}</td>
                        <td className="p-2">{order.rating_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sample Ratings */}
          {debugData?.testRatings?.sampleRatings && debugData.testRatings.sampleRatings.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Sample Ratings</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Rating ID</th>
                      <th className="text-left p-2">Rating</th>
                      <th className="text-left p-2">Order Number</th>
                      <th className="text-left p-2">Order Status</th>
                      <th className="text-left p-2">Images</th>
                      <th className="text-left p-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugData.testRatings.sampleRatings.map((rating: any) => (
                      <tr key={rating.id} className="border-b">
                        <td className="p-2">{rating.id}</td>
                        <td className="p-2">
                          <span className="flex items-center">
                            {'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}
                            <span className="ml-2 text-sm">({rating.rating})</span>
                          </span>
                        </td>
                        <td className="p-2">{rating.order_number}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            rating.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rating.status}
                          </span>
                        </td>
                        <td className="p-2">{rating.image_count}</td>
                        <td className="p-2">{new Date(rating.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products with Ratings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Products with Rating Data</h2>
            <div className="space-y-4">
              {debugData?.products?.map((product: any) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-600">ID: {product.id}</p>
                      <p className="text-sm text-gray-600">Category: {product.category}</p>
                      <div className="mt-2">
                        <span className="text-sm">
                          Rating: {product.average_rating || 0} ({product.total_ratings || 0} reviews)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => testProductRating(product.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
                    >
                      Debug This Product
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
