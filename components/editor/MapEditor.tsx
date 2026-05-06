'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MapPin, Download, Type, Palette, Map, Eye, LayoutTemplate, X, ChevronUp } from 'lucide-react'

// Light styles: sepia+hue-rotate tints, low saturation for pastels, high contrast to keep roads visible.
// contrast() is the key — it darkens the roads without darkening the already-light background much.
// Dark styles: dark_nolabels base gives near-black bg; white roads become gold via sepia+hue-rotate.
const MAP_STYLES = [
  { id: 'light',     name: 'Light',       url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'contrast(1.4)',                                                                                          bg: '#f0ede8', roads: '#9a9288' },
  { id: 'labels',    name: 'Light+Labels', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',       filter: 'contrast(1.4)',                                                                                          bg: '#f0ede8', roads: '#9a9288' },
  { id: 'blush',     name: 'Blush',       url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'sepia(1) hue-rotate(-12deg) saturate(0.55) brightness(1.12) contrast(1.6)',                             bg: '#f5e8e2', roads: '#a06050' },
  { id: 'rose',      name: 'Rose',        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'sepia(1) hue-rotate(-8deg) saturate(0.8) brightness(1.05) contrast(1.65)',                              bg: '#f2d4cc', roads: '#aa4838' },
  { id: 'sage',      name: 'Sage',        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'sepia(1) hue-rotate(100deg) saturate(0.5) brightness(1.1) contrast(1.6)',                              bg: '#e4ede6', roads: '#386850' },
  { id: 'teal',      name: 'Teal',        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'sepia(1) hue-rotate(140deg) saturate(0.55) brightness(1.08) contrast(1.55)',                           bg: '#dce9ea', roads: '#307070' },
  { id: 'aqua',      name: 'Aqua',        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'sepia(1) hue-rotate(155deg) saturate(0.45) brightness(1.1) contrast(1.55)',                            bg: '#e0eaec', roads: '#387888' },
  { id: 'sand',      name: 'Sand',        url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'sepia(1) hue-rotate(28deg) saturate(0.4) brightness(1.1) contrast(1.55)',                              bg: '#f4eadc', roads: '#a08048' },
  { id: 'copper',    name: 'Copper',      url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'sepia(1) hue-rotate(18deg) saturate(0.65) brightness(1.0) contrast(1.6)',                              bg: '#f0d8b0', roads: '#986020' },
  { id: 'mauve',     name: 'Mauve',       url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'sepia(1) hue-rotate(-35deg) saturate(0.5) brightness(1.08) contrast(1.55)',                            bg: '#ede0ec', roads: '#785888' },
  { id: 'teal-bold', name: 'Teal Bold',   url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'sepia(1) hue-rotate(145deg) saturate(2.5) brightness(0.65) contrast(1.4)',                             bg: '#185858', roads: '#083838' },
  { id: 'ghost',     name: 'Ghost',       url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'saturate(0.06) brightness(1.18) contrast(1.4)',                                                         bg: '#f4f2f0', roads: '#b0aaa4' },
  { id: 'winter',    name: 'Winter',      url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',  filter: 'grayscale(1) brightness(1.2) contrast(1.35)',                                                           bg: '#f5f5f5', roads: '#b0b0b0' },
  { id: 'ink',       name: 'Ink',         url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',   filter: 'sepia(1) hue-rotate(32deg) saturate(2) brightness(0.75)',                                          bg: '#131313', roads: '#c8a050' },
  { id: 'navy',      name: 'Navy',        url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',   filter: 'sepia(1) hue-rotate(32deg) saturate(2.8) brightness(0.65)',                                        bg: '#0d1a28', roads: '#c8a050' },
  { id: 'burgundy',  name: 'Burgundy',    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',   filter: 'sepia(1) hue-rotate(32deg) saturate(2.8) brightness(0.58)',                                        bg: '#280612', roads: '#c8a050' },
  { id: 'forest',    name: 'Forest',      url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',   filter: 'sepia(1) hue-rotate(32deg) saturate(2.8) brightness(0.62)',                                        bg: '#0c1e0c', roads: '#c8a050' },
  { id: 'coral',     name: 'Coral',       url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',   filter: 'sepia(1) hue-rotate(32deg) saturate(2.8) brightness(0.60)',                                        bg: '#380808', roads: '#c8a050' },
]

const COLOR_THEMES = [
  { id: 'white',      label: 'White',     bg: '#ffffff', text: '#000000', accent: '#555555' },
  { id: 'cream',      label: 'Cream',     bg: '#f5f0e8', text: '#1a1a1a', accent: '#706850' },
  { id: 'black',      label: 'Black',     bg: '#0a0a0a', text: '#ffffff', accent: '#888888' },
  { id: 'navy',       label: 'Navy',      bg: '#0f1f3d', text: '#e8edf5', accent: '#8aadcc' },
  { id: 'forest',     label: 'Forest',    bg: '#1a2e1a', text: '#e0f0e0', accent: '#6aaa6a' },
  { id: 'burgundy',   label: 'Burgundy',  bg: '#2d0a10', text: '#f5e0e4', accent: '#cc5a6a' },
  { id: 'lavender',   label: 'Lavender',  bg: '#1a0f3d', text: '#e8e0f5', accent: '#9a7acc' },
  { id: 'sand',       label: 'Sand',      bg: '#f5e8cc', text: '#3d2a0f', accent: '#8a6a3a' },
  { id: 'terracotta', label: 'Terra',     bg: '#3d1a0f', text: '#f5e0d8', accent: '#cc7a5a' },
  { id: 'blush',      label: 'Blush',     bg: '#f5e0e8', text: '#2a0a16', accent: '#c07080' },
]

const FONTS = [
  { id: 'inter',    name: 'Inter',            style: "'Inter', sans-serif" },
  { id: 'playfair', name: 'Playfair Display', style: "'Playfair Display', serif" },
  { id: 'space',    name: 'Space Grotesk',    style: "'Space Grotesk', sans-serif" },
]

type Layout = 'split' | 'fullbleed' | 'circle' | 'typography'

type Template = { id: string; name: string; desc: string; mapStyle: string; colorTheme: string; font: string; layout: Layout }

const TEMPLATES: Template[] = [
  { id: 'arctic',    name: 'Arctic',      desc: 'Light map · cream · serif',        mapStyle: 'light',     colorTheme: 'cream',    font: 'playfair', layout: 'split' },
  { id: 'midnight',  name: 'Midnight',    desc: 'Ink map · black · modern',         mapStyle: 'ink',       colorTheme: 'black',    font: 'space',    layout: 'split' },
  { id: 'blueprint', name: 'Blueprint',   desc: 'Navy map · navy frame',            mapStyle: 'navy',      colorTheme: 'navy',     font: 'inter',    layout: 'split' },
  { id: 'botanical', name: 'Botanical',   desc: 'Sage map · forest frame · serif',  mapStyle: 'sage',      colorTheme: 'forest',   font: 'playfair', layout: 'split' },
  { id: 'atlas',     name: 'Atlas',       desc: 'Circle · light map · cream',       mapStyle: 'labels',    colorTheme: 'cream',    font: 'playfair', layout: 'circle' },
  { id: 'nautical',  name: 'Nautical',    desc: 'Circle · teal map · navy',         mapStyle: 'teal',      colorTheme: 'navy',     font: 'inter',    layout: 'circle' },
  { id: 'bordeaux',  name: 'Bordeaux',    desc: 'Circle · burgundy map · dark',     mapStyle: 'burgundy',  colorTheme: 'burgundy', font: 'playfair', layout: 'circle' },
  { id: 'ghost',     name: 'Ghost',       desc: 'Full bleed · ghost map · white',   mapStyle: 'ghost',     colorTheme: 'white',    font: 'inter',    layout: 'fullbleed' },
  { id: 'terra',     name: 'Terra',       desc: 'Full bleed · copper · warm',       mapStyle: 'copper',    colorTheme: 'terracotta', font: 'playfair', layout: 'fullbleed' },
  { id: 'neon',      name: 'Neon',        desc: 'Full bleed · teal bold · lavender',mapStyle: 'teal-bold', colorTheme: 'lavender',  font: 'space',    layout: 'fullbleed' },
  { id: 'typo-navy', name: 'Type: Navy',  desc: 'Letters cut from navy · light map',mapStyle: 'light',     colorTheme: 'navy',     font: 'inter',    layout: 'typography' },
  { id: 'typo-ink',  name: 'Type: Ink',   desc: 'Letters cut from black · ghost',   mapStyle: 'ghost',     colorTheme: 'black',    font: 'inter',    layout: 'typography' },
]

const LAYOUT_LABELS: Record<Layout, string> = { split: 'Split', fullbleed: 'Full Bleed', circle: 'Circle', typography: 'Typography' }
const POSTER_SIZES = { A4: { width: 595, height: 842 }, A3: { width: 842, height: 1191 } }

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
  const [showWatermark, setShowWatermark] = useState(true)
  const [customTitle, setCustomTitle] = useState('')
  const [layout, setLayout] = useState<Layout>('split')
  const [activeTab, setActiveTab] = useState<'templates' | 'style' | 'colors' | 'typography' | 'labels'>('templates')
  const [promoCode, setPromoCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  const [windowSize, setWindowSize] = useState({ w: 1200, h: 800 })

  const posterRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      setIsMobile(w < 768)
      setWindowSize({ w, h })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

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
    } catch (e) { console.error('Geocoding failed:', e) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { geocodeCity(initialCity) }, [initialCity, geocodeCity])

  useEffect(() => {
    if (!coords || typeof window === 'undefined') return
    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      leafletRef.current = L
      const el = document.getElementById('map-container')
      if (!el) return
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      const map = L.map('map-container', { center: coords, zoom, zoomControl: false, attributionControl: false, dragging: true, scrollWheelZoom: true })
      L.tileLayer(activeStyle.url, { maxZoom: 19, attribution: '' }).addTo(map)
      mapRef.current = map
    }
    initMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, isMobile])

  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return
    const L = leafletRef.current
    mapRef.current.eachLayer((l: any) => { if (l instanceof L.TileLayer) mapRef.current.removeLayer(l) })
    L.tileLayer(activeStyle.url, { maxZoom: 19, attribution: '' }).addTo(mapRef.current)
  }, [activeStyle])

  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current?.invalidateSize(), 80)
  }, [layout, size, isMobile])

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
    if (isMobile) setPanelOpen(false)
  }

  const handleBuyAndDownload = async () => {
    setIsPaying(true)
    try {
      const { default: html2canvas } = await import('html2canvas')

      // Scale to 300 DPI: A4 = 2480×3508px, A3 = 3508×4961px
      const printWidths = { A4: 2480, A3: 3508 }
      const printHeights = { A4: 3508, A3: 4961 }
      const printScale = Math.ceil(printWidths[size] / W)

      const canvas = await html2canvas(posterRef.current!, {
        scale: printScale,
        useCORS: true,
        allowTaint: true,
        width: W,
        height: H,
      })

      const isFree = promoCode.toLowerCase().trim() === 'free'

      if (isFree) {
        // Free flow: generate PDF directly, no Stripe
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        const { default: jsPDF } = await import('jspdf')
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: size.toLowerCase() as 'a4' | 'a3' })
        const w = size === 'A4' ? 210 : 297
        const h = size === 'A4' ? 297 : 420
        pdf.addImage(dataUrl, 'JPEG', 0, 0, w, h)
        pdf.save(`wallify-${city.toLowerCase().replace(/\s+/g, '-')}-${size.toLowerCase()}.pdf`)
        setIsPaying(false)
        return
      }

      // Paid flow: store high-res capture → Stripe checkout
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      localStorage.setItem('wallify_poster_data', dataUrl)
      localStorage.setItem('wallify_poster_size', size)
      localStorage.setItem('wallify_poster_city', city)

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, size }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Could not start checkout. Please try again.')
        setIsPaying(false)
      }
    } catch (e) {
      console.error(e)
      alert('Something went wrong. Please try again.')
      setIsPaying(false)
    }
  }

  const displayTitle = customTitle || city.toUpperCase()

  // Poster display dimensions
  const posterDims = POSTER_SIZES[size]
  const availH = isMobile ? windowSize.h - 180 : 700
  const availW = isMobile ? windowSize.w - 24 : 9999
  const scaleH = availH / posterDims.height
  const scaleW = availW / posterDims.width
  const scale = Math.min(scaleH, scaleW)
  const W = Math.round(posterDims.width * scale)
  const H = Math.round(posterDims.height * scale)

  // Circle geometry — consistent between clip-path and border ring
  const circleMarginX = Math.round(W * 0.06)
  const circleRadius = Math.round((W - circleMarginX * 2) / 2)
  const circleTopMargin = Math.round(H * 0.03)
  const circleCenterY = circleTopMargin + circleRadius
  const circleBottom = circleCenterY + circleRadius + Math.round(H * 0.01)

  // Typography geometry — each word fills full poster width via SVG textLength
  const typoWords = displayTitle.split(' ')
  const typoFontSize = Math.round((H * 0.44) / Math.max(typoWords.length, 1))
  const typoLineH = Math.round(typoFontSize * 1.05)
  const typoTotalH = typoLineH * typoWords.length
  const typoStartY = Math.round((H - typoTotalH) / 2) + Math.round(typoFontSize * 0.82)

  const coordLabel = coords
    ? `${Math.abs(coords[0]).toFixed(4)}°${coords[0] >= 0 ? 'N' : 'S'}  ${Math.abs(coords[1]).toFixed(4)}°${coords[1] >= 0 ? 'E' : 'W'}`
    : ''

  // Map container style — changes per layout
  const mapStyle: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: layout === 'split' ? '78%' : '100%',
    filter: activeStyle.filter,
    ...(layout === 'circle' ? {
      clipPath: `circle(${circleRadius}px at ${W / 2}px ${circleCenterY}px)`,
    } : {}),
  }

  // ── Sidebar content (shared between desktop and mobile) ──────────────────
  const SidebarContent = () => (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>

      {activeTab === 'templates' && (
        <div>
          <p style={labelStyle}>Presets</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TEMPLATES.map(tpl => {
              const th = COLOR_THEMES.find(c => c.id === tpl.colorTheme)!
              const ms = MAP_STYLES.find(m => m.id === tpl.mapStyle)!
              return (
                <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                  style={{ textAlign: 'left', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: 'transparent', padding: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#8b5cf6')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                >
                  <div style={{ height: 56, position: 'relative', backgroundColor: th.bg, overflow: 'hidden' }}>
                    {/* Map thumbnail */}
                    <div style={{ position: 'absolute', inset: 0, bottom: tpl.layout === 'split' ? '28%' : 0, backgroundColor: ms.bg, filter: ms.filter === 'none' ? undefined : ms.filter }}>
                      {/* Fake road lines */}
                      <div style={{ position: 'absolute', top: '42%', left: 0, right: 0, height: 2, backgroundColor: ms.roads, opacity: 0.8 }} />
                      <div style={{ position: 'absolute', top: '65%', left: 0, right: 0, height: 1.5, backgroundColor: ms.roads, opacity: 0.5 }} />
                      <div style={{ position: 'absolute', left: '35%', top: 0, bottom: 0, width: 2, backgroundColor: ms.roads, opacity: 0.7 }} />
                      <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: 1, backgroundColor: ms.roads, opacity: 0.4 }} />
                    </div>
                    {tpl.layout === 'circle' && <div style={{ position: 'absolute', top: '6%', left: '18%', right: '18%', bottom: '28%', borderRadius: '50%', backgroundColor: ms.bg, filter: ms.filter === 'none' ? undefined : ms.filter, overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '45%', left: 0, right: 0, height: 2, backgroundColor: ms.roads }} />
                      <div style={{ position: 'absolute', left: '40%', top: 0, bottom: 0, width: 2, backgroundColor: ms.roads }} />
                    </div>}
                    {tpl.layout === 'split' && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%', backgroundColor: th.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.15em', color: th.text }}>CITY NAME</span></div>}
                    {tpl.layout === 'fullbleed' && <><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} /><div style={{ position: 'absolute', bottom: 5, left: 0, right: 0, textAlign: 'center', fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', color: '#fff' }}>CITY NAME</div></>}
                    {tpl.layout === 'typography' && <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}><defs><mask id={`pm-${tpl.id}`}><rect width="100%" height="100%" fill="white" /><text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontSize="30" fontWeight="900" fontFamily="Inter" fill="black">CITY</text></mask></defs><rect width="100%" height="100%" fill={th.bg} mask={`url(#pm-${tpl.id})`} /></svg>}
                  </div>
                  <div style={{ padding: '6px 10px 8px', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{tpl.name}</div>
                      <div style={{ fontSize: 9, color: '#6b7280', marginTop: 1 }}>{tpl.desc}</div>
                    </div>
                    <span style={{ fontSize: 8, color: '#8b5cf6', border: '1px solid #8b5cf620', borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap', flexShrink: 0 }}>{LAYOUT_LABELS[tpl.layout]}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'style' && (
        <div>
          <p style={labelStyle}>Map Color</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 20 }}>
            {MAP_STYLES.map(s => (
              <button key={s.id} onClick={() => setActiveStyle(s)} title={s.name}
                style={{ padding: 0, border: `2px solid ${activeStyle.id === s.id ? '#8b5cf6' : 'transparent'}`, borderRadius: 10, cursor: 'pointer', background: 'transparent', overflow: 'hidden' }}>
                <div style={{ height: 52, backgroundColor: s.bg, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, height: 3, backgroundColor: s.roads, opacity: 0.9 }} />
                  <div style={{ position: 'absolute', top: '65%', left: 0, right: 0, height: 1.5, backgroundColor: s.roads, opacity: 0.6 }} />
                  <div style={{ position: 'absolute', left: '38%', top: 0, bottom: 0, width: 2.5, backgroundColor: s.roads, opacity: 0.8 }} />
                  <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: 1, backgroundColor: s.roads, opacity: 0.5 }} />
                  {activeStyle.id === s.id && <div style={{ position: 'absolute', inset: 0, border: '2px solid #8b5cf6', borderRadius: 8 }} />}
                </div>
                <div style={{ fontSize: 8, color: '#9ca3af', textAlign: 'center', padding: '3px 2px', background: '#111', lineHeight: 1.2 }}>{s.name}</div>
              </button>
            ))}
          </div>

          <p style={labelStyle}>Layout</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
            {(['split', 'fullbleed', 'circle', 'typography'] as Layout[]).map(id => (
              <button key={id} onClick={() => setLayout(id)}
                style={{ padding: '9px 4px', borderRadius: 8, border: `1px solid ${layout === id ? '#8b5cf6' : '#2a2a2a'}`, background: layout === id ? '#8b5cf615' : 'transparent', color: layout === id ? '#c4b5fd' : '#6b7280', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                {LAYOUT_LABELS[id]}
              </button>
            ))}
          </div>

          <p style={labelStyle}>Zoom</p>
          <input type="range" min="8" max="16" value={zoom} onChange={e => { const z = Number(e.target.value); setZoom(z); if (mapRef.current) mapRef.current.setZoom(z) }} style={{ width: '100%', accentColor: '#8b5cf6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginTop: 4 }}>
            <span>Wide</span><span>Close</span>
          </div>
        </div>
      )}

      {activeTab === 'colors' && (
        <div>
          <p style={labelStyle}>Frame Color</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {COLOR_THEMES.map(t => (
              <button key={t.id} onClick={() => setColorTheme(t)}
                style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${colorTheme.id === t.id ? '#8b5cf6' : '#2a2a2a'}`, background: t.bg, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.text }}>{t.label}</div>
                <div style={{ fontSize: 9, color: t.accent, marginTop: 2 }}>Aa · {t.accent}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'typography' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={labelStyle}>Custom Title</p>
            <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder={city.toUpperCase()}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <p style={labelStyle}>Font</p>
            {FONTS.map(f => (
              <button key={f.id} onClick={() => setFont(f)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${font.id === f.id ? '#8b5cf6' : '#2a2a2a'}`, background: font.id === f.id ? '#8b5cf615' : 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', textAlign: 'left', marginBottom: 6, fontFamily: f.style }}>
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'labels' && (
        <div>
          <p style={labelStyle}>Visible Elements</p>
          {[
            { label: 'City Title', value: showTitle, setter: setShowTitle },
            { label: 'Coordinates', value: showSubtitle, setter: setShowSubtitle },
            { label: 'Watermark', value: showWatermark, setter: setShowWatermark },
          ].map(({ label, value, setter }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: '#fff' }}>{label}</span>
              <button onClick={() => setter(!value)}
                style={{ width: 40, height: 22, borderRadius: 11, border: 'none', background: value ? '#8b5cf6' : '#2a2a2a', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 2, width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'left 0.15s', left: value ? '20px' : '2px' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Poster render ──────────────────────────────────────────────────────────
  const PosterCanvas = () => (
    <div ref={posterRef}
      style={{ position: 'relative', width: W, height: H, backgroundColor: colorTheme.bg, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden', flexShrink: 0 }}
    >
      {/* Map */}
      <div id="map-container" style={mapStyle} />

      {/* SPLIT */}
      {layout === 'split' && <>
        <div style={{ position: 'absolute', top: '78%', left: 0, right: 0, height: 1, background: colorTheme.accent, opacity: 0.2 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%', backgroundColor: colorTheme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', fontFamily: font.style }}>
          {showTitle && <div style={{ fontSize: Math.round(W * 0.072), fontWeight: 700, letterSpacing: '0.15em', lineHeight: 1.05, textAlign: 'center', color: colorTheme.text }}>{displayTitle}</div>}
          {showSubtitle && coordLabel && <div style={{ fontSize: Math.round(W * 0.024), color: colorTheme.accent, letterSpacing: '0.2em', marginTop: 5, textTransform: 'uppercase' }}>{coordLabel}</div>}
          {showWatermark && <div style={{ fontSize: Math.round(W * 0.016), color: colorTheme.accent, marginTop: 5, letterSpacing: '0.1em', opacity: 0.45 }}>wallify.app</div>}
        </div>
      </>}

      {/* FULL BLEED */}
      {layout === 'fullbleed' && <>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: `0 28px ${Math.round(H * 0.065)}px`, fontFamily: font.style }}>
          {showTitle && <div style={{ fontSize: Math.round(W * 0.072), fontWeight: 700, letterSpacing: '0.15em', lineHeight: 1.05, textAlign: 'center', color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>{displayTitle}</div>}
          {showSubtitle && coordLabel && <div style={{ fontSize: Math.round(W * 0.024), color: 'rgba(255,255,255,0.72)', letterSpacing: '0.2em', marginTop: 7, textTransform: 'uppercase' }}>{coordLabel}</div>}
          {showWatermark && <div style={{ fontSize: Math.round(W * 0.016), color: 'rgba(255,255,255,0.32)', marginTop: 8, letterSpacing: '0.1em' }}>wallify.app</div>}
        </div>
      </>}

      {/* CIRCLE */}
      {layout === 'circle' && <>
        {/* Circle border ring — exactly matches clip-path */}
        <div style={{
          position: 'absolute',
          top: circleTopMargin,
          left: circleMarginX,
          width: circleRadius * 2,
          height: circleRadius * 2,
          borderRadius: '50%',
          border: `1px solid ${colorTheme.accent}`,
          opacity: 0.35,
          pointerEvents: 'none',
        }} />
        {/* Text below circle */}
        <div style={{
          position: 'absolute',
          top: circleBottom,
          left: 0, right: 0,
          bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: colorTheme.bg,
          fontFamily: font.style,
          padding: '0 20px',
        }}>
          {showTitle && <div style={{ fontSize: Math.round(W * 0.072), fontWeight: 700, letterSpacing: '0.15em', color: colorTheme.text, lineHeight: 1, textAlign: 'center' }}>{displayTitle}</div>}
          <div style={{ width: '52%', height: 1, background: colorTheme.accent, opacity: 0.35, margin: `${Math.round(H * 0.012)}px 0` }} />
          {showSubtitle && coordLabel && <div style={{ fontSize: Math.round(W * 0.022), color: colorTheme.accent, letterSpacing: '0.15em', textAlign: 'center' }}>{coordLabel}</div>}
          {showWatermark && <div style={{ fontSize: Math.round(W * 0.015), color: colorTheme.accent, marginTop: Math.round(H * 0.008), opacity: 0.4 }}>wallify.app</div>}
        </div>
      </>}

      {/* TYPOGRAPHY */}
      {layout === 'typography' && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <defs>
            <mask id="typo-mask">
              <rect width="100%" height="100%" fill="white" />
              <text
                x="50%" y="50%"
                textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.round(W / Math.max(displayTitle.replace(/\s/g, '').length, 2) * 1.6)}
                fontWeight="900" fontFamily="'Inter', sans-serif"
                fill="black" letterSpacing="-1"
              >{displayTitle}</text>
            </mask>
          </defs>
          <rect width="100%" height="100%" fill={colorTheme.bg} mask="url(#typo-mask)" />
          {showSubtitle && coordLabel && <text x="4%" y="5.5%" fill={colorTheme.text} fontSize={Math.round(W * 0.02)} fontFamily="'Inter', sans-serif" opacity="0.65">{coordLabel}</text>}
          <line x1="5%" y1="89%" x2="95%" y2="89%" stroke={colorTheme.accent} strokeWidth="0.5" opacity="0.25" />
          {showWatermark && <text x="50%" y="94%" textAnchor="middle" fill={colorTheme.accent} fontSize={Math.round(W * 0.019)} fontFamily="'Inter', sans-serif" opacity="0.5">wallify.app</text>}
        </svg>
      )}
    </div>
  )

  const tabs = [
    { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
    { id: 'style',     icon: Map,            label: 'Style' },
    { id: 'colors',    icon: Palette,         label: 'Colors' },
    { id: 'typography',icon: Type,            label: 'Text' },
    { id: 'labels',    icon: Eye,             label: 'Labels' },
  ] as const

  // Single unified render tree — #map-container never unmounts when switching mobile/desktop
  return (
    <div style={{ height: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <header style={{ height: isMobile ? 52 : 56, background: '#111', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ fontSize: isMobile ? 17 : 18, fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            Wall<span style={{ color: '#8b5cf6' }}>ify</span>
          </a>
          {/* Desktop city search in header */}
          {!isMobile && (
            <form onSubmit={handleCitySearch} style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <MapPin style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#6b7280' }} />
                <input value={cityInput} onChange={e => setCityInput(e.target.value)}
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, paddingLeft: 30, paddingRight: 12, paddingTop: 6, paddingBottom: 6, fontSize: 13, color: '#fff', outline: 'none', width: 200 }}
                  placeholder="Search city..." />
              </div>
              <button type="submit" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#fff', cursor: 'pointer' }}>Search</button>
            </form>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: 7, padding: 2, border: '1px solid #2a2a2a' }}>
            {(['A4', 'A3'] as const).map(s => (
              <button key={s} onClick={() => setSize(s)} style={{ padding: isMobile ? '3px 10px' : '4px 14px', borderRadius: 6, fontSize: isMobile ? 11 : 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: size === s ? '#8b5cf6' : 'transparent', color: size === s ? '#fff' : '#6b7280' }}>{s}</button>
            ))}
          </div>
          <input
            value={promoCode}
            onChange={e => setPromoCode(e.target.value)}
            placeholder={isMobile ? 'Code' : 'Promo code'}
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: isMobile ? '7px 8px' : '7px 10px', fontSize: 12, color: '#fff', outline: 'none', width: isMobile ? 58 : 96 }}
          />
          <button onClick={handleBuyAndDownload} disabled={isPaying || isLoading}
            style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, padding: isMobile ? '7px 12px' : '8px 18px', fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isPaying ? 0.6 : 1 }}>
            <Download style={{ width: 14, height: 14 }} />
            {isPaying ? '...' : promoCode.toLowerCase().trim() === 'free' ? (isMobile ? 'Free' : 'Download Free') : (isMobile ? '€5' : 'Buy & Download — €5')}
          </button>
        </div>
      </header>

      {/* Mobile city search row */}
      {isMobile && (
        <form onSubmit={handleCitySearch} style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 8, background: '#0d0d0d', flexShrink: 0 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <MapPin style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#6b7280' }} />
            <input value={cityInput} onChange={e => setCityInput(e.target.value)}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Search city..." />
          </div>
          <button type="submit" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0 14px', fontSize: 13, color: '#fff', cursor: 'pointer' }}>Go</button>
        </form>
      )}

      {/* ── Main body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Desktop sidebar */}
        {!isMobile && (
          <aside style={{ width: 276, background: '#111', borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
              {tabs.map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', fontSize: 9, cursor: 'pointer', border: 'none', background: 'transparent', color: activeTab === id ? '#8b5cf6' : '#6b7280', borderBottom: activeTab === id ? '2px solid #8b5cf6' : '2px solid transparent' }}>
                  <Icon style={{ width: 14, height: 14 }} />
                  {label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <SidebarContent />
            </div>
          </aside>
        )}

        {/* ── Canvas area — always in DOM ── */}
        <main style={{ flex: 1, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: isMobile ? '12px' : '32px' }}>
          {isLoading ? (
            <div style={{ color: '#6b7280', fontSize: 13 }}>Finding {cityInput}...</div>
          ) : (
            <div ref={posterRef}
              style={{ position: 'relative', width: W, height: H, backgroundColor: colorTheme.bg, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden', flexShrink: 0 }}
            >
              {/* Map — always present, never unmounts */}
              <div id="map-container" style={mapStyle} />

              {/* SPLIT */}
              {layout === 'split' && <>
                <div style={{ position: 'absolute', top: '78%', left: 0, right: 0, height: 1, background: colorTheme.accent, opacity: 0.2 }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '22%', backgroundColor: colorTheme.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', fontFamily: font.style }}>
                  {showTitle && <div style={{ fontSize: Math.round(W * 0.072), fontWeight: 700, letterSpacing: '0.15em', lineHeight: 1.05, textAlign: 'center', color: colorTheme.text }}>{displayTitle}</div>}
                  {showSubtitle && coordLabel && <div style={{ fontSize: Math.round(W * 0.024), color: colorTheme.accent, letterSpacing: '0.2em', marginTop: 5, textTransform: 'uppercase' }}>{coordLabel}</div>}
                  {showWatermark && <div style={{ fontSize: Math.round(W * 0.016), color: colorTheme.accent, marginTop: 5, letterSpacing: '0.1em', opacity: 0.45 }}>wallify.app</div>}
                </div>
              </>}

              {/* FULL BLEED */}
              {layout === 'fullbleed' && <>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: `0 28px ${Math.round(H * 0.065)}px`, fontFamily: font.style }}>
                  {showTitle && <div style={{ fontSize: Math.round(W * 0.072), fontWeight: 700, letterSpacing: '0.15em', lineHeight: 1.05, textAlign: 'center', color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>{displayTitle}</div>}
                  {showSubtitle && coordLabel && <div style={{ fontSize: Math.round(W * 0.024), color: 'rgba(255,255,255,0.72)', letterSpacing: '0.2em', marginTop: 7, textTransform: 'uppercase' }}>{coordLabel}</div>}
                  {showWatermark && <div style={{ fontSize: Math.round(W * 0.016), color: 'rgba(255,255,255,0.32)', marginTop: 8, letterSpacing: '0.1em' }}>wallify.app</div>}
                </div>
              </>}

              {/* CIRCLE */}
              {layout === 'circle' && <>
                <div style={{ position: 'absolute', top: circleTopMargin, left: circleMarginX, width: circleRadius * 2, height: circleRadius * 2, borderRadius: '50%', border: `1px solid ${colorTheme.accent}`, opacity: 0.35, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: circleBottom, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: colorTheme.bg, fontFamily: font.style, padding: '0 20px' }}>
                  {showTitle && <div style={{ fontSize: Math.round(W * 0.072), fontWeight: 700, letterSpacing: '0.15em', color: colorTheme.text, lineHeight: 1, textAlign: 'center' }}>{displayTitle}</div>}
                  <div style={{ width: '52%', height: 1, background: colorTheme.accent, opacity: 0.35, margin: `${Math.round(H * 0.012)}px 0` }} />
                  {showSubtitle && coordLabel && <div style={{ fontSize: Math.round(W * 0.022), color: colorTheme.accent, letterSpacing: '0.15em', textAlign: 'center' }}>{coordLabel}</div>}
                  {showWatermark && <div style={{ fontSize: Math.round(W * 0.015), color: colorTheme.accent, marginTop: Math.round(H * 0.008), opacity: 0.4 }}>wallify.app</div>}
                </div>
              </>}

              {/* TYPOGRAPHY */}
              {layout === 'typography' && (
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  <defs>
                    <mask id="typo-mask">
                      <rect width="100%" height="100%" fill="white" />
                      {typoWords.map((word, i) => (
                        <text key={i}
                          x="50%"
                          y={typoStartY + i * typoLineH}
                          textAnchor="middle"
                          fontSize={typoFontSize}
                          fontWeight="900"
                          fontFamily="'Inter', sans-serif"
                          fill="black"
                          textLength={Math.round(W * 0.94)}
                          lengthAdjust="spacingAndGlyphs"
                        >{word}</text>
                      ))}
                    </mask>
                  </defs>
                  {/* Dark frame with letter cutouts revealing the map */}
                  <rect width="100%" height="100%" fill={colorTheme.bg} mask="url(#typo-mask)" />
                  {/* City label upper-right */}
                  {showTitle && (
                    <text x={W - Math.round(W * 0.05)} y={Math.round(H * 0.075)}
                      textAnchor="end" fill={colorTheme.text}
                      fontSize={Math.round(W * 0.028)} fontFamily="'Inter', sans-serif"
                      fontWeight="600" letterSpacing="0.14em" opacity="0.9">
                      {displayTitle}
                    </text>
                  )}
                  {/* Divider + coordinates bottom */}
                  <line x1={Math.round(W * 0.05)} y1={Math.round(H * 0.895)} x2={Math.round(W * 0.95)} y2={Math.round(H * 0.895)} stroke={colorTheme.accent} strokeWidth="0.6" opacity="0.3" />
                  {showSubtitle && coordLabel && (
                    <text x={Math.round(W * 0.05)} y={Math.round(H * 0.935)}
                      fill={colorTheme.text} fontSize={Math.round(W * 0.019)}
                      fontFamily="'Inter', sans-serif" opacity="0.6" letterSpacing="0.06em">
                      {coordLabel}
                    </text>
                  )}
                  {showWatermark && (
                    <text x={W - Math.round(W * 0.05)} y={Math.round(H * 0.935)}
                      textAnchor="end" fill={colorTheme.accent}
                      fontSize={Math.round(W * 0.017)} fontFamily="'Inter', sans-serif" opacity="0.45">
                      wallify.app
                    </text>
                  )}
                </svg>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <div style={{ background: '#111', borderTop: '1px solid #2a2a2a', display: 'flex', flexShrink: 0, zIndex: 20 }}>
          {tabs.map(({ id, icon: Icon, label }) => (
            <button key={id}
              onClick={() => { setActiveTab(id); setPanelOpen(activeTab !== id || !panelOpen) }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0 8px', border: 'none', background: 'transparent', cursor: 'pointer', color: activeTab === id && panelOpen ? '#8b5cf6' : '#6b7280' }}>
              <Icon style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 9 }}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Mobile slide-up panel ── */}
      {isMobile && panelOpen && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#111', borderTop: '2px solid #8b5cf6', maxHeight: '65dvh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </span>
            <button onClick={() => setPanelOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <SidebarContent />
          </div>
        </div>
      )}

    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 10, color: '#6b7280', marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }
