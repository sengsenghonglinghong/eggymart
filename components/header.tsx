"use client"

import { useState, useEffect } from "react"
import { Search, Heart, ShoppingCart, User, Menu, LogOut, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSessionContext } from "@/components/session-provider"

export function Header() {
  const router = useRouter()
  const { isLoggedIn, user, logout } = useSessionContext()
  const [cartCount, setCartCount] = useState(0)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Function to refresh counts
  const refreshCounts = async () => {
    if (!isLoggedIn) {
      setCartCount(0)
      setFavoritesCount(0)
      setNotificationCount(0)
      return
    }

    try {
      // Fetch cart count
      const cartResponse = await fetch('/api/cart')
      if (cartResponse.ok) {
        const cartData = await cartResponse.json()
        setCartCount(cartData.items.length)
      }

      // Fetch favorites count
      const favoritesResponse = await fetch('/api/favorites')
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json()
        setFavoritesCount(favoritesData.items.length)
      }

      // Fetch notification count (regular + sales)
      const [notificationResponse, salesResponse] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/sales/notifications')
      ])
      
      let totalUnreadCount = 0
      
      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json()
        const unreadCount = notificationData.notifications.filter((n: any) => !n.isRead).length
        totalUnreadCount += unreadCount
      }
      
      if (salesResponse.ok) {
        const salesData = await salesResponse.json()
        totalUnreadCount += salesData.count || 0
      }
      
      setNotificationCount(totalUnreadCount)
    } catch (error) {
      console.error('Failed to fetch counts:', error)
    }
  }

  // Fetch cart and favorites counts
  useEffect(() => {
    refreshCounts()
  }, [isLoggedIn])

  // Listen for storage events to update counts when items are added/removed
  useEffect(() => {
    const handleStorageChange = () => {
      refreshCounts()
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events for same-tab updates
    window.addEventListener('cartUpdated', handleStorageChange)
    window.addEventListener('favoritesUpdated', handleStorageChange)
    window.addEventListener('notificationsUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cartUpdated', handleStorageChange)
      window.removeEventListener('favoritesUpdated', handleStorageChange)
      window.removeEventListener('notificationsUpdated', handleStorageChange)
    }
  }, [isLoggedIn])

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-pink-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="flex flex-col gap-6 mt-6">
                  <Link href={isLoggedIn ? "/home" : "/"} className="flex items-center">
                    <Image 
                      src="/logo.png" 
                      alt="EggMart Logo" 
                      width={120} 
                      height={40} 
                      className="h-8 w-auto sm:h-10"
                    />
                  </Link>
                  <nav className="flex flex-col gap-4">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-700 hover:text-pink-600"
                      onClick={() => isLoggedIn ? router.push('/favorites') : router.push('/login')}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Favorites
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-700 hover:text-pink-600"
                      onClick={() => isLoggedIn ? router.push('/cart') : router.push('/login')}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Cart
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-700 hover:text-pink-600"
                      onClick={() => router.push('/notification')}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                      {notificationCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {notificationCount}
                        </span>
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-700 hover:text-pink-600"
                      onClick={() => isLoggedIn ? router.push('/profile') : router.push('/login')}
                    >
                      <User className="w-4 h-4 mr-2" />
                      {isLoggedIn ? 'Profile' : 'Login'}
                    </Button>
                    {isLoggedIn && (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-gray-700 hover:text-red-600"
                        onClick={logout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            <Link href={isLoggedIn ? "/home" : "/"} className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="EggMart Logo" 
                width={140} 
                height={50} 
                className="h-8 w-auto sm:h-10 md:h-12 lg:h-14"
                priority
              />
            </Link>

            {/* Search bar beside logo */}
            <div className="hidden sm:flex max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search for eggs, chicks..." className="pl-10 bg-gray-50 border-gray-200" />
              </div>
            </div>

          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden text-gray-700 hover:text-pink-600"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Favorites, Cart, Notification, and Profile buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Favorites button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-700 hover:text-pink-600 relative"
                onClick={() => isLoggedIn ? router.push('/favorites') : router.push('/login')}
              >
                <Heart className="w-5 h-5" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </Button>

              {/* Cart button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-700 hover:text-pink-600 relative"
                onClick={() => isLoggedIn ? router.push('/cart') : router.push('/login')}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* Notification button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-700 hover:text-pink-600 relative"
                onClick={() => router.push('/notification')}
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </Button>

              {/* Profile button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-700 hover:text-pink-600"
                onClick={() => isLoggedIn ? router.push('/profile') : router.push('/login')}
              >
                <User className="w-5 h-5" />
              </Button>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:block">
                  Welcome, {user?.name || 'User'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent text-xs sm:text-sm px-2 sm:px-4"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-pink-300 text-pink-600 hover:bg-pink-50 bg-transparent text-xs sm:text-sm px-2 sm:px-4"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>

        {isSearchOpen && (
          <div className="sm:hidden mt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search for eggs, chicks..." className="pl-10 bg-gray-50 border-gray-200" />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
