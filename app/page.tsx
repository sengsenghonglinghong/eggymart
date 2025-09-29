import { Header } from "@/components/header"
import { HeroBanner } from "@/components/hero-banner"
import { ProductGrid } from "@/components/product-grid"
import { Sidebar } from "@/components/sidebar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="bg-yellow-50/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <HeroBanner />
          <div className="lg:flex lg:gap-6 p-4 sm:p-6">
            <div className="lg:hidden mb-4">
              <Sidebar />
            </div>
            <div className="hidden lg:block">
              <Sidebar />
            </div>
            <ProductGrid />
          </div>
        </div>
      </main>
    </div>
  )
}
