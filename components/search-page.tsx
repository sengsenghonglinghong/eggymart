"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductGrid } from "./product-grid"

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setHasSearched(true)
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-pink-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Products</h1>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search for eggs, chicks, supplies..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" className="bg-pink-500 hover:bg-pink-600">
              Search
            </Button>
          </form>
        </div>

        <div className="p-6">
          {hasSearched ? (
            <div>
              <p className="text-gray-600 mb-6">
                {searchQuery ? `Search results for "${searchQuery}"` : "All products"}
              </p>
              <ProductGrid />
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start your search</h3>
              <p className="text-gray-600">Enter keywords to find eggs, chicks, and supplies</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
