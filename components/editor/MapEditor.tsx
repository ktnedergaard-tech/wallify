'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MapPin, Download, Type, Palette, Map, Eye } from 'lucide-react'

// Map styles using free tile providers
const MAP_STYLES = [
  { id: 'minimal-light', name: 'Minimal Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
  { id: 'minimal-dark', name: 'Minimal Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  { id: 'no-labels', name: 'No Labels', url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png' },
  { id: 'dark-no-labels', name: 'Dark No Labels', url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png' },
  { id: 'voyager', name: 'Voyager', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
  { id: 'osm', name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
]

const COLOR_THEMES = [
  { id: 'white', label: 'White', bg: '#ffffff', text: '#000000', accent: '#333333' },
  { id: 'black', label: 'Black', bg: '#0a0a0a', text: '#ffffff', accent: '#aaaaaa' },
  { id: 'cream', label: 'Cream', bg: '#f5f0e8', text: '#1a1a1a', accent: '#666666' },
  { id: 'navy', label: 'Navy', bg: '#0f1f3d', text: '#e8edf5', accent: '#a0b4cc' },
  { id: 'forest', label: 'Forest', bg: '#1a2e1a', text: '#e8f5e8', accent: '#7ab87a' },
  { id: 'terracotta', label: 'Terra', bg: '#3d1a0f', text: '#f5e8e0', accent: '#cc7a5a' },
  { id: 'lavender', label: 'Lavender', bg: '#1a0f3d', text: '#e8e0f5', accent: '#9a7acc' },
  { id: 'sand', label: 'Sand', bg: '#f5e8cc', text: '#3d2a0f', accent: '#8a6a3a' },
]

const FONTS = [
  { id: 'inter', name: 'Inter', style: "'Inter', sans-serif" },
  { id: 'playfair', name: 'Playfair Display', style: "'Playfair Display', serif" },
  { id: 'space', name: 'Space Grotesk', style: "'Space Grotesk', sans-serif" },
]

const POSTER_SIZES = {
  A4: { width: 595, height: 842, label: 'A4' },
  A3: { width: 842, height: 1191, label: 'A3' },
}

export default function MapEditor() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialCity = searchParams.get('city') || 'Copenhagen'

  const [city, setCity] = useState(initialCity)
  const [cityInput, setCityInput] = useState(initialCity)
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [zoom, setZoom] = useState(12)
  const [size, setSize] = useState<'A4' | 'A3'>('A4')
  const [activeStyle, setActiveStyle] = useState(MAP_STYLES[0])
  const [colorTheme, setColorTheme] = useState(COLOR_THEMES[0])
  const [font, setFont] = useState(FONTS[0])
  const [showTitle, setShowTitle] = useState(true)
  const [showSubtitle, setShowSubtitle] = useState(true)
  const [showCoords, setShowCoords] = useState(true)
  const [customTitle, setCustomTitle] = useState('')
  const [activeTab, setActiveTab] = useState<'style' | 'colors' | 'typography' | 'labels'>('style')
  const [isLoading, setIsLoading] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const posterRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)

  // Geocode city
  const geocodeCity = useCallback(async (cityName: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data && data[0]) {
        setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)])
        setCity(cityName)
      }
    } catch (e) {
      console.error('Geocoding failed:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    geocodeCity(initialCity)
  }, [initialCity, geocodeCity])

  // Initialize Leaflet map
  useEffect(() => {
    if (!coords || typeof window === 'undefined') return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      leafletRef.current = L

      const mapContainer = document.getElementById('map-container')
      if (!mapContainer) return

      // Remove existing map
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      const map = L.map('map-container', {
        center: coords,
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true,
      })

      L.tileLayer(activeStyle.url, {
        maxZoom: 19,
        attribution: '',
      }).addTo(map)

      mapRef.current = map
    }

    initMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords])

  // Update tile layer when style changes
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return
    const L = leafletRef.current
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) mapRef.current.removeLayer(layer)
    })
    L.tileLayer(activeStyle.url, { maxZoom: 19, attribution: '' }).addTo(mapRef.current)
  }, [activeStyle])

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault()
    geocodeCity(cityInput)
    router.replace(`/editor?city=${encodeURIComponent(cityInput)}`, { scroll: false })
  }

  const handleBuyAndDownload = async () => {
    setIsPaying(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(posterRef.current!, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })
      const dataUrl = canvas.toDataURL('image/png')

      localStorage.setItem('wallify_poster_data', dataUrl)
      localStorage.setItem('wallify_poster_size', size)
      localStorage.setItem('wallify_poster_city', city)

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, size }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) {
      console.error('Checkout error:', e)
      setIsPaying(false)
    }
  }

  const displayTitle = customTitle || city.toUpperCase()
  const posterDims = POSTER_SIZES[size]

  // Scale poster to fit in viewport
  const maxHeight = 700
  const scale = maxHeight / posterDims.height
  const displayWidth = Math.round(posterDims.width * scale)
  const displayHeight = Math.round(posterDims.height * scale)

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 bg-[#111111] border-b border-[#2a2a2a] flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <a href="/" className="text-lg font-semibold tracking-tight text-white">Wallify</a>
          <form onSubmit={handleCitySearch} className="flex items-center gap-2">
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7280]" />
              <input
                type="text"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-[#6b7280] focus:outline-none focus:border-[#8b5cf6] w-48"
                placeholder="City name..."
              />
            </div>
            <button type="submit" className="text-xs bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-white px-3 py-1.5 rounded-lg transition-colors">
              Search
            </button>
          </form>
        </div>

        <div className="flex items-center gap-3">
          {/* Size toggle */}
          <div className="flex bg-[#1a1a1a] rounded-lg p-0.5 border border-[#2a2a2a]">
            {(['A4', 'A3'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${size === s ? 'bg-[#8b5cf6] text-white' : 'text-[#6b7280] hover:text-white'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={handleBuyAndDownload}
            disabled={isPaying || isLoading}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            {isPaying ? 'Processing...' : 'Buy & Download — €5'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[280px] bg-[#111111] border-r border-[#2a2a2a] flex flex-col overflow-hidden shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-[#2a2a2a]">
            {[
              { id: 'style', label: 'Style', icon: Map },
              { id: 'colors', label: 'Colors', icon: Palette },
              { id: 'typography', label: 'Text', icon: Type },
              { id: 'labels', label: 'Labels', icon: Eye },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'style' | 'colors' | 'typography' | 'labels')}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                  activeTab === id ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6]' : 'text-[#6b7280] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Style Tab */}
            {activeTab === 'style' && (
              <div>
                <p className="text-xs text-[#6b7280] mb-3 uppercase tracking-wider">Map Style</p>
                <div className="grid grid-cols-2 gap-2">
                  {MAP_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setActiveStyle(style)}
                      className={`p-2 rounded-xl border text-xs text-left transition-all ${
                        activeStyle.id === style.id
                          ? 'border-[#8b5cf6] bg-[#8b5cf6]/10 text-white'
                          : 'border-[#2a2a2a] text-[#6b7280] hover:border-[#8b5cf6]/50 hover:text-white'
                      }`}
                    >
                      <div className={`h-10 rounded-lg mb-2 ${
                        style.id.includes('dark') ? 'bg-[#1a1a2e]' : 'bg-[#e8e8e8]'
                      }`} />
                      {style.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#6b7280] mt-4 mb-3 uppercase tracking-wider">Zoom</p>
                <input
                  type="range"
                  min="8"
                  max="16"
                  value={zoom}
                  onChange={e => {
                    const z = Number(e.target.value)
                    setZoom(z)
                    if (mapRef.current) mapRef.current.setZoom(z)
                  }}
                  className="w-full accent-[#8b5cf6]"
                />
                <div className="flex justify-between text-xs text-[#6b7280] mt-1">
                  <span>Wide</span>
                  <span>Close</span>
                </div>
              </div>
            )}

            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <div>
                <p className="text-xs text-[#6b7280] mb-3 uppercase tracking-wider">Frame Color</p>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setColorTheme(theme)}
                      className={`p-3 rounded-xl border text-xs text-left transition-all ${
                        colorTheme.id === theme.id ? 'border-[#8b5cf6]' : 'border-[#2a2a2a] hover:border-[#8b5cf6]/50'
                      }`}
                      style={{ backgroundColor: theme.bg, color: theme.text }}
                    >
                      <div className="font-medium">{theme.label}</div>
                      <div style={{ color: theme.accent }} className="text-[10px] mt-0.5">Aa Bb Cc</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Typography Tab */}
            {activeTab === 'typography' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#6b7280] mb-2 uppercase tracking-wider">Custom Title</p>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder={city.toUpperCase()}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6b7280] focus:outline-none focus:border-[#8b5cf6]"
                  />
                </div>
                <div>
                  <p className="text-xs text-[#6b7280] mb-2 uppercase tracking-wider">Font</p>
                  <div className="space-y-2">
                    {FONTS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setFont(f)}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          font.id === f.id ? 'border-[#8b5cf6] bg-[#8b5cf6]/10' : 'border-[#2a2a2a] hover:border-[#8b5cf6]/50'
                        }`}
                      >
                        <span className="text-white text-sm">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Labels Tab */}
            {activeTab === 'labels' && (
              <div className="space-y-3">
                <p className="text-xs text-[#6b7280] mb-3 uppercase tracking-wider">Poster Elements</p>
                {[
                  { label: 'City Title', value: showTitle, setter: setShowTitle },
                  { label: 'Subtitle / Country', value: showSubtitle, setter: setShowSubtitle },
                  { label: 'Coordinates', value: showCoords, setter: setShowCoords },
                ].map(({ label, value, setter }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-white">{label}</span>
                    <button
                      onClick={() => setter(!value)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${value ? 'bg-[#8b5cf6]' : 'bg-[#2a2a2a]'}`}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all"
                        style={{ left: value ? '18px' : '2px' }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main canvas area */}
        <main className="flex-1 bg-[#1a1a1a] flex items-center justify-center overflow-auto p-8">
          {isLoading ? (
            <div className="text-[#6b7280] text-sm">Finding {cityInput}...</div>
          ) : (
            <div
              ref={posterRef}
              className="relative shadow-2xl overflow-hidden"
              style={{
                width: displayWidth,
                height: displayHeight,
                backgroundColor: colorTheme.bg,
              }}
            >
              {/* Map fills the top 78% of poster */}
              <div
                id="map-container"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '78%',
                }}
              />

              {/* Thin border line between map and text */}
              <div
                style={{
                  position: 'absolute',
                  top: '78%',
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: colorTheme.accent,
                  opacity: 0.3,
                }}
              />

              {/* Bottom text area */}
              <div
                className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center"
                style={{
                  height: '22%',
                  backgroundColor: colorTheme.bg,
                  color: colorTheme.text,
                  padding: '0 24px',
                  fontFamily: font.style,
                }}
              >
                {showTitle && (
                  <div
                    style={{
                      fontSize: Math.round(displayWidth * 0.07),
                      fontWeight: 700,
                      letterSpacing: '0.15em',
                      lineHeight: 1.1,
                      textAlign: 'center',
                    }}
                  >
                    {displayTitle}
                  </div>
                )}
                {showSubtitle && (
                  <div
                    style={{
                      fontSize: Math.round(displayWidth * 0.025),
                      color: colorTheme.accent,
                      letterSpacing: '0.2em',
                      marginTop: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    {coords ? `${coords[0].toFixed(2)}°N, ${coords[1].toFixed(2)}°E` : ''}
                  </div>
                )}
                {showCoords && (
                  <div
                    style={{
                      fontSize: Math.round(displayWidth * 0.018),
                      color: colorTheme.accent,
                      marginTop: 6,
                      letterSpacing: '0.1em',
                      opacity: 0.7,
                    }}
                  >
                    wallify.app
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
