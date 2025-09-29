"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingCart } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSessionContext } from "@/components/session-provider"

export function FavoritesPage() {
  const router = useRouter()
  const { isLoggedIn, isLoading } = useSessionContext()
  const [favoriteItems, setFavoriteItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch favorites when logged in
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLoggedIn) {
        setLoading(false)
        return
      }

      try {
        const favoritesResponse = await fetch('/api/favorites')
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json()
          setFavoriteItems(favoritesData.items)
        }
      } catch (error) {
        console.error('Failed to load favorites:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isLoggedIn) {
      fetchFavorites()
    } else {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  const removeFromFavorites = async (productId: number) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })
      if (response.ok) {
        setFavoriteItems(prev => prev.filter(item => item.productId !== productId))
      }
    } catch (error) {
      console.error('Failed to remove from favorites:', error)
    }
  }

  const addToCart = async (productId: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 })
      })
      if (response.ok) {
        alert('Product added to cart!')
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="text-center py-8">
              <p className="text-gray-600">Loading favorites...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-pink-200">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500" />
            My Favorites
          </h1>
          <p className="text-gray-600 mt-2">Items you've saved for later</p>
        </div>

        <div className="p-6">
          {favoriteItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteItems.map((item) => (
                <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="relative aspect-square mb-4 overflow-hidden rounded-lg">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white text-pink-500"
                        onClick={() => removeFromFavorites(item.productId)}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </Button>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
                    <p className="text-2xl font-bold text-pink-600 mb-4">₱{item.price}</p>
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-pink-500 hover:bg-pink-600" 
                        onClick={() => addToCart(item.productId)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full border-pink-300 text-pink-600 hover:bg-pink-50"
                        onClick={() => router.push(`/products/${item.productId}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-6">Start browsing and save items you love!</p>
              <Button 
                className="bg-pink-500 hover:bg-pink-600"
                onClick={() => router.push('/home')}
              >
                Browse Products
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
