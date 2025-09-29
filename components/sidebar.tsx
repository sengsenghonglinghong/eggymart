"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Filter } from "lucide-react"
import { useState, useEffect } from "react"

export function Sidebar() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [categoryCounts, setCategoryCounts] = useState<{[key: string]: number}>({})
  const [totalStock, setTotalStock] = useState(0)

  // Fetch real product counts and stock from database
  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        const response = await fetch('/api/products')
        if (response.ok) {
          const data = await response.json()
          const counts: {[key: string]: number} = {}
          let total = 0
          
          data.items.forEach((item: any) => {
            const category = item.category
            counts[category] = (counts[category] || 0) + 1
            total += item.stock || 0
          })
          
          setCategoryCounts(counts)
          setTotalStock(total)
        }
      } catch (error) {
        console.error('Failed to fetch category counts:', error)
      }
    }

    fetchCategoryCounts()
  }, [])

  const categories = [
    { name: "Bestsellers", icon: "⭐", count: categoryCounts["Bestsellers"] || 0, path: "/?category=bestsellers" },
    { name: "Fresh Eggs", icon: "🥚", count: categoryCounts["Eggs"] || 0, path: "/eggs" },
    { name: "Baby Chicks", icon: "🐣", count: categoryCounts["Chicks"] || 0, path: "/chicks" },
    { name: "Duck Eggs", icon: "🦆", count: categoryCounts["Duck Eggs"] || 0, path: "/?category=duck-eggs" },
    { name: "Quail Eggs", icon: "🥚", count: categoryCounts["Quail Eggs"] || 0, path: "/?category=quail-eggs" },
  ]

  const handleCategoryClick = (path: string) => {
    router.push(path)
  }

  const handleSpecialOfferClick = () => {
    router.push("/?offer=special")
  }

  const SidebarContent = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <Button
              key={category.name}
              variant="ghost"
              className="w-full justify-between text-left hover:bg-pink-50 hover:text-pink-600"
              onClick={() => handleCategoryClick(category.path)}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg" style={{ color: "#1f2937" }}>
                  {category.icon}
                </span>
                {category.name}
              </span>
              <span className="text-sm text-gray-500">({category.count})</span>
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
        <div className="text-center">
          <div className="text-3xl mb-2">📦</div>
          <h4 className="font-semibold text-gray-900 mb-2">Stock Summary</h4>
          <p className="text-sm text-gray-600 mb-3">Total items in stock: <span className="font-semibold text-green-600">{totalStock}</span></p>
          <div className="text-xs text-gray-500">
            Real-time stock from database
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <div className="text-center">
          <div className="text-3xl mb-2">🎯</div>
          <h4 className="font-semibold text-gray-900 mb-2">Special Offer</h4>
          <p className="text-sm text-gray-600 mb-3">Buy 2 dozen eggs, get 1 free chick!</p>
          <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white" onClick={handleSpecialOfferClick}>
            Learn More
          </Button>
        </div>
      </Card>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="mb-4 bg-transparent">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <div className="mt-6">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside className="w-64 shrink-0">
      <SidebarContent />
    </aside>
  )
}
