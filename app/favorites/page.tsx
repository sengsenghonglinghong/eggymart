import { Header } from "@/components/header"
import { FavoritesPage } from "@/components/favorites-page"

export default function Favorites() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
      <Header />
      <FavoritesPage />
    </div>
  )
}
