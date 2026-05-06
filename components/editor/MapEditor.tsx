'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MapPin, Download, Type, Palette, Map, Eye, LayoutTemplate } from 'lucide-react'

const MAP_STYLES = [
  { id: 'light',        name: 'Light',        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',       filter: 'none',                                                                              thumb: '#e8e4dd' },
  { id: 'teal-dark',    name: 'Teal Dark',    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',         filter: 'hue-rotate(160deg) saturate(1.5)',                                                  thumb: '#1a3d3d' },
  { id: 'aqua',         name: 'Aqua',         url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',        filter: 'hue-rotate(165deg) saturate(2) brightness(0.95)',                                   thumb: '#c8e8e4' },
  { id: 'olive',        name: 'Dark Olive',   url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',         filter: 'sepia(0.5) hue-rotate(55deg) saturate(1.8)',                                        thumb: '#1e220a' },
  { id: 'navy',         name: 'Navy',         url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',         filter: 'hue-rotate(210deg) saturate(2)',                                                    thumb: '#0f1a30' },
  { id: 'sage',         name: 'Sage',         url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',   filter: 'hue-rotate(110deg) saturate(0.8) brightness(0.85) sepia(0.3)',                     thumb: '#b8ccb0' },
  { id: 'ink',          name: 'Ink',          url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',    filter: 'grayscale(1) contrast(1.4) brightness(0.85)',                                       thumb: '#111111' },
  { id: 'burgundy',     name: 'Burgundy',     url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',         filter: 'hue-rotate(320deg) saturate(2.5) sepia(0.6) brightness(0.65)',                     thumb: '#3d0a10' },
  { id: 'steel',        name: 'Steel Blue',   url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',        filter: 'hue-rotate(200deg) saturate(0.7) brightness(1.05)',                                 thumb: '#c0cce0' },
  { id: 'ghost',        name: 'Ghost',        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',   filter: 'brightness(1.15) contrast(0.75) saturate(0.3)',                                     thumb: '#f0eee8' },
  { id: 'blush',        name: 'Blush',        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',        filter: 'hue-rotate(330deg) saturate(0.8) sepia(0.2) brightness(1.05)',                     thumb: '#e8d0d4' },
  { id: 'salmon',       name: 'Salmon',       url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',        filter: 'hue-rotate(340deg) saturate(1.5) sepia(0.4) brightness(0.95)',                     thumb: '#e0a8a0' },
  { id: 'copper',       name: 'Copper',       url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',         filter: 'hue-rotate(20deg) sepia(0.9) saturate(1.8) brightness(0.7)',                       thumb: '#3d1e08' },
  { id: 'mauve',        name: 'Dusty Mauve',  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',        filter: 'hue-rotate(310deg) saturate(0.6) sepia(0.35) brightness(0.95)',                    thumb: '#d8c0cc' },
  { id: 'coral',        name: 'Coral',        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',         filter: 'hue-rotate(340deg) saturate(3.5) brightness(0.75)',                                 thumb: '#5a0a0a' },
  { id: 'teal-bright',  name: 'Teal Bright',  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',         filter: 'hue-rotate(155deg) saturate(3) brightness(1.1)',                                    thumb: '#003d3d' },
  { id: 'satellite',    name: 'Satellite',    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                    filter: 'grayscale(0.5) contrast(1.1) brightness(0.85)',                                     thumb: '#2a3020' },
  { id: 'winter',       name: 'Winter',       url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',   filter: 'grayscale(1) brightness(1.25) contrast(0.6)',                                       thumb: '#f0f0f0' },
]

const COLOR_THEMES = [
  { id: 'white',       label: 'White',     bg: '#ffffff', text: '#000000', accent: '#555555' },
  { id: 'cream',       label: 'Cream',     bg: '#f5f0e8', text: '#1a1a1a', accent: '#777060' },
  { id: 'black',       label: 'Black',     bg: '#0a0a0a', text: '#ffffff', accent: '#888888' },
  { id: 'navy',        label: 'Navy',      bg: '#0f1f3d', text: '#e8edf5', accent: '#8aadcc' },
  { id: 'forest',      label: 'Forest',    bg: '#1a2e1a', text: '#e0f0e0', accent: '#6aaa6a' },
  { id: 'burgundy',    label: 'Burgundy',  bg: '#2d0a10', text: '#f5e0e4', accent: '#cc5a6a' },
  { id: 'lavender',    label: 'Lavender',  bg: '#1a0f3d', text: '#e8e0f5', accent: '#9a7acc' },
  { id: 'sand',        label: 'Sand',      bg: '#f5e8cc', text: '#3d2a0f', accent: '#8a6a3a' },
  { id: 'terracotta',  label: 'Terra',     bg: '#3d1a0f', text: '#f5e0d8', accent: '#cc7a5a' },
  { id: 'slate',       label: 'Slate',     bg: '#1a1f2e', text: '#d0d8e8', accent: '#6a88b8' },
  { id: 'blush',       label: 'Blush',     bg: '#f5e0e8', text: '#2a0a16', accent: '#c07080' },
  { id: 'copper',      label: 'Copper',    bg: '#f5e8d8', text: '#2a1800', accent: '#9a6030' },
]

const FONTS = [
  { id: 'inter',    name: 'Inter',            style: "'Inter', sans-serif" },
  { id: 'playfair', name: 'Playfair Display', style: "'Playfair Display', serif" },
  { id: 'space',    name: 'Space Grotesk',    style: "'Space Grotesk', sans-serif" },
]

type Layout = 'split' | 'fullbleed' | 'circle' | 'typography'

type Template = {
  id: string; name: string; desc: string
  mapStyle: string; colorTheme: string; font: string; layout: Layout
}

const TEMPLATES: Template[] = [
  { id: 'arctic',    name: 'Arctic',     desc: 'Light map · cream frame · serif',            mapStyle: 'light',       colorTheme: 'cream',      font: 'playfair', layout: 'split' },
  { id: 'midnight',  name: 'Midnight',   desc: 'Dark map · black frame · modern sans',        mapStyle: 'ink',         colorTheme: 'black',      font: 'space',    layout: 'split' },
  { id: 'blueprint', name: 'Blueprint',  desc: 'Dark navy map · navy frame',                  mapStyle: 'navy',        colorTheme: 'navy',       font: 'inter',    layout: 'split' },
  { id: 'bordeaux',  name: 'Bordeaux',   desc: 'Burgundy tones · dramatic circle',            mapStyle: 'burgundy',    colorTheme: 'burgundy',   font: 'playfair', layout: 'circle' },
  { id: 'atlas',     name: 'Atlas',      desc: 'Circle map · cream · editorial',              mapStyle: 'light',       colorTheme: 'cream',      font: 'playfair', layout: 'circle' },
  { id: 'nautical',  name: 'Nautical',   desc: 'Teal-dark map · navy frame',                  mapStyle: 'teal-dark',   colorTheme: 'navy',       font: 'inter',    layout: 'circle' },
  { id: 'ghost',     name: 'Ghost',      desc: 'No labels · white · full bleed',              mapStyle: 'ghost',       colorTheme: 'white',      font: 'inter',    layout: 'fullbleed' },
  { id: 'explorer',  name: 'Explorer',   desc: 'Voyager · sand · full bleed',                 mapStyle: 'aqua',        colorTheme: 'sand',       font: 'playfair', layout: 'fullbleed' },
  { id: 'neon',      name: 'Neon',       desc: 'Dark no-labels · lavender · full bleed',     mapStyle: 'teal-bright', colorTheme: 'lavender',   font: 'space',    layout: 'fullbleed' },
  { id: 'typo-navy', name: 'Type: Navy', desc: 'City name cut out of navy overlay',           mapStyle: 'light',       colorTheme: 'navy',       font: 'inter',    layout: 'typography' },
  { id: 'typo-ink',  name: 'Type: Ink',  desc: 'City name cut out of black overlay',          mapStyle: 'ghost',       colorTheme: 'black',      font: 'inter',    layout: 'typography' },
  { id: 'botanical', name: 'Botanical',  desc: 'Sage map · forest green · serif',             mapStyle: 'sage',        colorTheme: 'forest',     font: 'playfair', layout: 'split' },
]

const POSTER_SIZES = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
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
  const [layout, setLayout] = useState<Layout>('split')
  const [activeTab, setActiveTab] = useState<'templates' | 'style' | 'colors' | 'typography' | 'labels'>('templates')
  const [isLoading, setIsLoading] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const posterRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)

  const geocodeCity = useCallback(async (cityName: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data?.[0]) {
        setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)])
        setCity(cityName)
      }
    } catch (e) {
      console.error('Geocoding failed:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { geocodeCity(initialCity) }, [initialCity, geocodeCity])

  useEffect(() => {
    if (!coords || typeof window === 'undefined') return
    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      leafletRef.current = L
      const mapContainer = document.getElementById('map-container')
      if (!mapContainer) return
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      const map = L.map('map-container', {
        center: coords, zoom, zoomControl: false, attributionControl: false, dragging: true, scrollWheelZoom: true,
      })
      L.tileLayer(activeStyle.url, { maxZoom: 19, attribution: '' }).addTo(map)
      mapRef.current = map
    }
    initMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords])

  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return
    const L = leafletRef.current
    mapRef.current.eachLayer((layer: any) => { if (layer instanceof L.TileLayer) mapRef.current.removeLayer(layer) })
    L.tileLayer(activeStyle.url, { maxZoom: 19, attribution: '' }).addTo(mapRef.current)
  }, [activeStyle])

  // Invalidate map size when layout changes (map area dimensions change)
  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current?.invalidateSize(), 50)
  }, [layout, size])

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault()
    geocodeCity(cityInput)
    router.replace(`/editor?city=${encodeURIComponent(cityInput)}`, { scroll: false })
  }

  const applyTemplate = (tpl: Template) => {
    setActiveStyle(MAP_STYLES.find(m => m.id === tpl.mapStyle)!)
    setColorTheme(COLOR_THEMES.find(c => c.id === tpl.colorTheme)!)
    setFont(FONTS.find(f => f.id === tpl.font)!)
    setLayout(tpl.layout)
  }

  const handleBuyAndDownload = async () => {
    setIsPaying(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(posterRef.current!, { scale: 2, useCORS: true, allowTaint: true })
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
  const maxHeight = 700
  const scale = maxHeight / posterDims.height
  const W = Math.round(posterDims.width * scale)
  const H = Math.round(posterDims.height * scale)

  // Map container style per layout
  const mapContainerStyle: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: layout === 'split' ? '78%' : '100%',
    filter: activeStyle.filter,
    ...(layout === 'circle' ? { clipPath: `circle(${Math.round(W * 0.4)}px at 50% ${Math.round(H * 0.37)}px)` } : {}),
  }

  const coordLabel = coords ? `${Math.abs(coords[0]).toFixed(4)}°${coords[0] >= 0 ? 'N' : 'S'}  ${Math.abs(coords[1]).toFixed(4)}°${coords[1] >= 0 ? 'E' : 'W'}` : ''

  const layoutLabel = { split: 'Split', fullbleed: 'Full Bleed', circle: 'Circle', typography: 'Typography' }

  return (
    <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Top bar */}
      <header style={{ height: 56, background: '#111111', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ fontSize: 18, fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '-0.02em' }}>Wallify</a>
          <form onSubmit={handleCitySearch} style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <MapPin style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#6b7280' }} />
              <input
                value={cityInput} onChange={e => setCityInput(e.target.value)}
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, paddingLeft: 30, paddingRight: 12, paddingTop: 6, paddingBottom: 6, fontSize: 13, color: '#fff', outline: 'none', width: 180 }}
                placeholder="City name..."
              />
            </div>
            <button type="submit" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#fff', cursor: 'pointer' }}>Search</button>
          </form>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: 8, padding: 2, border: '1px solid #2a2a2a' }}>
            {(['A4', 'A3'] as const).map(s => (
              <button key={s} onClick={() => setSize(s)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: size === s ? '#8b5cf6' : 'transparent', color: size === s ? '#fff' : '#6b7280' }}>{s}</button>
            ))}
          </div>
          <button onClick={handleBuyAndDownload} disabled={isPaying || isLoading} style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: isPaying ? 0.6 : 1 }}>
            <Download style={{ width: 14, height: 14 }} />
            {isPaying ? 'Processing...' : 'Buy & Download — €5'}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <aside style={{ width: 280, background: '#111111', borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a' }}>
            {[
              { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
              { id: 'style',     icon: Map,            label: 'Style' },
              { id: 'colors',    icon: Palette,         label: 'Colors' },
              { id: 'typography',icon: Type,            label: 'Text' },
              { id: 'labels',    icon: Eye,             label: 'Labels' },
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setActiveTab(id as typeof activeTab)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', fontSize: 10, cursor: 'pointer', border: 'none', background: 'transparent', color: activeTab === id ? '#8b5cf6' : '#6b7280', borderBottom: activeTab === id ? '2px solid #8b5cf6' : '2px solid transparent' }}>
                <Icon style={{ width: 14, height: 14 }} />
                {label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

            {/* TEMPLATES */}
            {activeTab === 'templates' && (
              <div>
                <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Presets</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {TEMPLATES.map(tpl => {
                    const theme = COLOR_THEMES.find(c => c.id === tpl.colorTheme)!
                    const ms = MAP_STYLES.find(m => m.id === tpl.mapStyle)!
                    return (
                      <button key={tpl.id} onClick={() => applyTemplate(tpl)} style={{ textAlign: 'left', borderRadius: 12, border: '1px solid #2a2a2a', overflow: 'hidden', cursor: 'pointer', background: 'transparent', padding: 0, transition: 'border-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#8b5cf6')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                      >
                        {/* Mini preview */}
                        <div style={{ height: 52, position: 'relative', backgroundColor: theme.bg, overflow: 'hidden' }}>
                          {/* Fake map */}
                          <div style={{ position: 'absolute', inset: 0, bottom: tpl.layout === 'split' ? '28%' : 0, background: ms.thumb, filter: ms.filter === 'none' ? undefined : ms.filter }} />
                          {/* Circle clip */}
                          {tpl.layout === 'circle' && <div style={{ position: 'absolute', top: '5%', left: '15%', right: '15%', bottom: '28%', borderRadius: '50%', background: ms.thumb, filter: ms.filter === 'none' ? undefined : ms.filter, overflow: 'hidden' }} />}
                          {/* Typography overlay */}
                          {tpl.layout === 'typography' && (
                            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                              <defs><mask id={`pm-${tpl.id}`}><rect width="100%" height="100%" fill="white" /><text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontSize="32" fontWeight="900" fontFamily="Inter" fill="black">CITY</text></mask></defs>
                              <rect width="100%" height="100%" fill={theme.bg} mask={`url(#pm-${tpl.id})`} />
                            </svg>
                          )}
                          {/* Split bar */}
                          {tpl.layout === 'split' && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%', backgroundColor: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.15em', color: theme.text }}>CITY NAME</span></div>}
                          {/* Full bleed */}
                          {tpl.layout === 'fullbleed' && <><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} /><div style={{ position: 'absolute', bottom: 5, left: 0, right: 0, textAlign: 'center', fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', color: '#fff' }}>CITY NAME</div></>}
                        </div>
                        <div style={{ padding: '6px 10px 8px', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{tpl.name}</div>
                            <div style={{ fontSize: 9, color: '#6b7280', marginTop: 1, lineHeight: 1.3 }}>{tpl.desc}</div>
                          </div>
                          <span style={{ fontSize: 9, color: '#8b5cf6', border: '1px solid #8b5cf620', borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{layoutLabel[tpl.layout]}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STYLE */}
            {activeTab === 'style' && (
              <div>
                <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Map Color</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 20 }}>
                  {MAP_STYLES.map(s => (
                    <button key={s.id} onClick={() => setActiveStyle(s)} title={s.name} style={{ padding: 0, border: `2px solid ${activeStyle.id === s.id ? '#8b5cf6' : 'transparent'}`, borderRadius: 10, cursor: 'pointer', background: 'transparent', overflow: 'hidden' }}>
                      <div style={{ height: 44, background: s.thumb, filter: s.filter === 'none' ? undefined : s.filter, position: 'relative' }}>
                        {/* Road lines */}
                        <div style={{ position: 'absolute', top: '45%', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.35)' }} />
                        <div style={{ position: 'absolute', top: '70%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.2)' }} />
                        <div style={{ position: 'absolute', left: '40%', top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.3)' }} />
                      </div>
                      <div style={{ fontSize: 8, color: '#9ca3af', textAlign: 'center', padding: '3px 2px', background: '#0d0d0d', lineHeight: 1.2 }}>{s.name}</div>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Layout</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
                  {([['split','Split'], ['fullbleed','Full Bleed'], ['circle','Circle'], ['typography','Typography']] as [Layout, string][]).map(([id, label]) => (
                    <button key={id} onClick={() => setLayout(id)} style={{ padding: '8px 4px', borderRadius: 8, border: `1px solid ${layout === id ? '#8b5cf6' : '#2a2a2a'}`, background: layout === id ? '#8b5cf610' : 'transparent', color: layout === id ? '#8b5cf6' : '#6b7280', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>{label}</button>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Zoom</p>
                <input type="range" min="8" max="16" value={zoom} onChange={e => { const z = Number(e.target.value); setZoom(z); if (mapRef.current) mapRef.current.setZoom(z) }} style={{ width: '100%', accentColor: '#8b5cf6' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginTop: 4 }}>
                  <span>Wide</span><span>Close</span>
                </div>
              </div>
            )}

            {/* COLORS */}
            {activeTab === 'colors' && (
              <div>
                <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Frame Color</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {COLOR_THEMES.map(t => (
                    <button key={t.id} onClick={() => setColorTheme(t)} style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${colorTheme.id === t.id ? '#8b5cf6' : '#2a2a2a'}`, background: t.bg, cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: t.text }}>{t.label}</div>
                      <div style={{ fontSize: 9, color: t.accent, marginTop: 2 }}>Aa · {t.accent}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TEXT */}
            {activeTab === 'typography' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Custom Title</p>
                  <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder={city.toUpperCase()} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Font</p>
                  {FONTS.map(f => (
                    <button key={f.id} onClick={() => setFont(f)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${font.id === f.id ? '#8b5cf6' : '#2a2a2a'}`, background: font.id === f.id ? '#8b5cf610' : 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', textAlign: 'left', marginBottom: 6, fontFamily: f.style }}>{f.name}</button>
                  ))}
                </div>
              </div>
            )}

            {/* LABELS */}
            {activeTab === 'labels' && (
              <div>
                <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Visible Elements</p>
                {[
                  { label: 'City Title', value: showTitle, setter: setShowTitle },
                  { label: 'Coordinates', value: showSubtitle, setter: setShowSubtitle },
                  { label: 'Watermark', value: showCoords, setter: setShowCoords },
                ].map(({ label, value, setter }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: '#fff' }}>{label}</span>
                    <button onClick={() => setter(!value)} style={{ width: 40, height: 22, borderRadius: 11, border: 'none', background: value ? '#8b5cf6' : '#2a2a2a', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                      <span style={{ position: 'absolute', top: 2, width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'left 0.15s', left: value ? '20px' : '2px' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </aside>

        {/* Canvas */}
        <main style={{ flex: 1, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: 32 }}>
          {isLoading ? (
            <div style={{ color: '#6b7280', fontSize: 14 }}>Finding {cityInput}...</div>
          ) : (
            <div ref={posterRef} style={{ position: 'relative', width: W, height: H, backgroundColor: colorTheme.bg, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden', flexShrink: 0 }}>

              {/* Map */}
              <div id="map-container" style={mapContainerStyle} />

              {/* SPLIT layout */}
              {layout === 'split' && (
                <>
                  <div style={{ position: 'absolute', top: '78%', left: 0, right: 0, height: 1, background: colorTheme.accent, opacity: 0.2 }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%', backgroundColor: colorTheme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', fontFamily: font.style }}>
                    {showTitle && <div style={{ fontSize: Math.round(W * 0.072), fontWeight: 700, letterSpacing: '0.15em', lineHeight: 1.05, textAlign: 'center', color: colorTheme.text }}>{displayTitle}</div>}
                    {showSubtitle && coordLabel && <div style={{ fontSize: Math.round(W * 0.024), color: colorTheme.accent, letterSpacing: '0.2em', marginTop: 5, textTransform: 'uppercase' }}>{coordLabel}</div>}
                    {showCoords && <div style={{ fontSize: Math.round(W * 0.016), color: colorTheme.accent, marginTop: 5, letterSpacing: '0.1em', opacity: 0.45 }}>wallify.app</div>}
                  </div>
                </>
              )}

              {/* FULL BLEED layout */}
              {layout === 'fullbleed' && (
                <>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%', background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 100%)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: `0 28px ${Math.round(H * 0.06)}px`, fontFamily: font.style }}>
                    {showTitle && <div style={{ fontSize: Math.round(W * 0.072), fontWeight: 700, letterSpacing: '0.15em', lineHeight: 1.05, textAlign: 'center', color: '#fff', textShadow: '0 2px 16px rgba(0,0,0,0.9)' }}>{displayTitle}</div>}
                    {showSubtitle && coordLabel && <div style={{ fontSize: Math.round(W * 0.024), color: 'rgba(255,255,255,0.7)', letterSpacing: '0.2em', marginTop: 6, textTransform: 'uppercase' }}>{coordLabel}</div>}
                    {showCoords && <div style={{ fontSize: Math.round(W * 0.016), color: 'rgba(255,255,255,0.35)', marginTop: 8, letterSpacing: '0.1em' }}>wallify.app</div>}
                  </div>
                </>
              )}

              {/* CIRCLE layout */}
              {layout === 'circle' && (
                <>
                  {/* Circle border */}
                  <div style={{ position: 'absolute', top: `${Math.round(H * 0.035)}px`, left: `${Math.round(W * 0.08)}px`, right: `${Math.round(W * 0.08)}px`, aspectRatio: '1', borderRadius: '50%', border: `1px solid ${colorTheme.accent}`, opacity: 0.3, pointerEvents: 'none' }} />
                  {/* Bottom text */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%', backgroundColor: colorTheme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, fontFamily: font.style }}>
                    {showTitle && <div style={{ fontSize: Math.round(W * 0.072), fontWeight: 700, letterSpacing: '0.15em', color: colorTheme.text, lineHeight: 1 }}>{displayTitle}</div>}
                    <div style={{ width: '55%', height: 1, background: colorTheme.accent, opacity: 0.35, margin: '6px 0' }} />
                    {showSubtitle && coordLabel && <div style={{ fontSize: Math.round(W * 0.022), color: colorTheme.accent, letterSpacing: '0.18em' }}>{coordLabel}</div>}
                    {showCoords && <div style={{ fontSize: Math.round(W * 0.015), color: colorTheme.accent, marginTop: 4, opacity: 0.4, letterSpacing: '0.08em' }}>wallify.app</div>}
                  </div>
                </>
              )}

              {/* TYPOGRAPHY layout */}
              {layout === 'typography' && (
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <mask id="typo-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <text
                        x="50%" y="52%"
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={Math.round(W / Math.max(displayTitle.length, 3) * 1.55)}
                        fontWeight="900"
                        fontFamily="'Inter', sans-serif"
                        fill="black"
                        letterSpacing="-1"
                      >
                        {displayTitle}
                      </text>
                    </mask>
                  </defs>
                  {/* Colored overlay with text cut out */}
                  <rect width="100%" height="100%" fill={colorTheme.bg} mask="url(#typo-mask)" />
                  {/* Top-left coordinates */}
                  {showSubtitle && coordLabel && (
                    <text x="4%" y="5%" fill={colorTheme.text} fontSize={Math.round(W * 0.022)} fontFamily="'Inter', sans-serif" opacity="0.7">{coordLabel}</text>
                  )}
                  {/* Bottom info */}
                  <line x1="5%" y1="88%" x2="95%" y2="88%" stroke={colorTheme.accent} strokeWidth="0.5" opacity="0.3" />
                  {showCoords && (
                    <text x="50%" y="93%" textAnchor="middle" fill={colorTheme.accent} fontSize={Math.round(W * 0.02)} fontFamily="'Inter', sans-serif" opacity="0.6">wallify.app</text>
                  )}
                </svg>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  )
}
