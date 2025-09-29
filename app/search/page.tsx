import { Header } from "@/components/header"
import { SearchPage } from "@/components/search-page"

export default function Search() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-200">
      <Header />
      <SearchPage />
    </div>
  )
}
