import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import { Sidebar } from "@/components/sidebar"

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="bg-yellow-50/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-yellow-200">
            <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
            <p className="text-gray-600 mt-2">Browse our complete collection of eggs and chicks</p>
          </div>
          <div className="flex gap-6 p-6">
            <Sidebar />
            <ProductGrid />
          </div>
        </div>
      </main>
    </div>
  )
}
