import { Button } from "@/components/ui/button"

export function HeroBanner() {
  return (
    <div className="relative bg-gradient-to-r from-pink-300 via-purple-300 to-pink-400 p-8 md:p-12">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 text-balance">
          FRESH EGGS & HEALTHY CHICKS
          <br />
          UP TO 30% OFF
        </h1>
        <p className="text-white/90 mb-6 text-lg">Premium quality farm-fresh eggs and baby chicks</p>
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full text-white font-semibold border border-white/20">
            PROMO CODE: FRESH30
          </span>
        </div>
        <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-full">
          SHOP NOW
        </Button>
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-3 h-3 bg-white/60 rounded-full"></div>
          <div className="w-3 h-3 bg-white rounded-full"></div>
          <div className="w-3 h-3 bg-white/60 rounded-full"></div>
        </div>
      </div>

      <div className="absolute top-4 left-8 text-6xl text-white/30">🥚</div>
      <div className="absolute bottom-4 right-8 text-6xl text-white/30">🐣</div>
      <div className="absolute top-1/2 left-4 text-4xl text-white/25">🌾</div>
    </div>
  )
}
