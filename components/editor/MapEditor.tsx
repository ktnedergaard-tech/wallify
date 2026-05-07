'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MapPin, Download, Type, Palette, Map, Eye, LayoutTemplate, X, Share2 } from 'lucide-react'

interface ThemeRoads {
  major: string; minor_high: string; minor_mid: string; minor_low: string; path: string; outline: string
}
interface MapTheme {
  id: string; name: string; bg: string; roads: string
  map: { land: string; water: string; waterway: string; parks: string; buildings: string; roads: ThemeRoads; rail: string }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateMapStyle(theme: MapTheme): any {
  const src = 'opnfm'
  const interp = (stops: [number, number][]) => ['interpolate', ['exponential', 1.4], ['zoom'], ...stops.flatMap(([z, w]) => [z, w])]
  return {
    version: 8,
    sources: { [src]: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': theme.map.land } },
      { id: 'landcover', type: 'fill', source: src, 'source-layer': 'landcover',
        filter: ['match', ['get', 'class'], ['grass', 'meadow', 'scrub', 'wood', 'forest', 'park'], true, false],
        paint: { 'fill-color': theme.map.parks, 'fill-opacity': 0.55 } },
      { id: 'park', type: 'fill', source: src, 'source-layer': 'park',
        paint: { 'fill-color': theme.map.parks, 'fill-opacity': 0.65 } },
      { id: 'water', type: 'fill', source: src, 'source-layer': 'water',
        paint: { 'fill-color': theme.map.water } },
      { id: 'waterway', type: 'line', source: src, 'source-layer': 'waterway',
        paint: { 'line-color': theme.map.waterway, 'line-width': interp([[8, 0.5], [12, 1.5], [16, 3]]) } },
      { id: 'building', type: 'fill', source: src, 'source-layer': 'building', minzoom: 12,
        paint: { 'fill-color': theme.map.buildings, 'fill-opacity': 0.8 } },
      { id: 'road-path', type: 'line', source: src, 'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['path', 'track', 'pedestrian', 'footway', 'cycleway'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': theme.map.roads.path, 'line-width': interp([[13, 0.5], [14, 1], [16, 2], [18, 3]]), 'line-dasharray': [2, 2] } },
      { id: 'road-minor-low', type: 'line', source: src, 'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['service', 'residential', 'living_street', 'minor'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': theme.map.roads.minor_low, 'line-width': interp([[12, 0.5], [13, 1], [14, 2], [16, 4], [18, 8]]) } },
      { id: 'road-minor-mid', type: 'line', source: src, 'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['tertiary', 'secondary'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': theme.map.roads.minor_mid, 'line-width': interp([[9, 0.5], [11, 1.5], [13, 3], [15, 5], [17, 9]]) } },
      { id: 'road-minor-high', type: 'line', source: src, 'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['primary'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': theme.map.roads.minor_high, 'line-width': interp([[7, 0.5], [9, 1.5], [11, 3], [13, 5], [15, 8], [17, 14]]) } },
      { id: 'road-major-outline', type: 'line', source: src, 'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['motorway', 'trunk'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': theme.map.roads.outline, 'line-width': interp([[4, 3], [7, 5], [9, 9], [11, 13], [13, 17], [15, 22]]) } },
      { id: 'road-major', type: 'line', source: src, 'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['motorway', 'trunk'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': theme.map.roads.major, 'line-width': interp([[4, 0.5], [7, 1.5], [9, 3], [11, 5], [13, 7], [15, 10], [17, 16]]) } },
      { id: 'rail', type: 'line', source: src, 'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['rail', 'transit', 'light_rail', 'subway'], true, false],
        paint: { 'line-color': theme.map.rail, 'line-width': interp([[10, 0.5], [14, 1.5], [16, 2]]), 'line-dasharray': [3, 2] } },
    ]
  }
}

const MAP_THEMES: MapTheme[] = [
  { id: 'coral', name: 'Coral', bg: '#F3E1DA', roads: '#B9473A',
    map: { land: '#F3E1DA', water: '#B3C8D4', waterway: '#92B4C2', parks: '#CCDECA', buildings: '#E5C4B8',
      roads: { major: '#B9473A', minor_high: '#C8604E', minor_mid: '#D48272', minor_low: '#DDA08A', path: '#E5BFAB', outline: '#E8CEBF' }, rail: '#C07060' } },
  { id: 'sage', name: 'Sage', bg: '#DDE8DD', roads: '#3F624F',
    map: { land: '#DDE8DD', water: '#9BBEC8', waterway: '#7EAABB', parks: '#C2D9C2', buildings: '#C8DACA',
      roads: { major: '#3F624F', minor_high: '#527A64', minor_mid: '#6A9278', minor_low: '#85A890', path: '#AACAAF', outline: '#CAD9CA' }, rail: '#608070' } },
  { id: 'copper', name: 'Copper', bg: '#E1D2C6', roads: '#7C452E',
    map: { land: '#E1D2C6', water: '#A8C0CC', waterway: '#8BAABB', parks: '#C8D8C0', buildings: '#D2C0B0',
      roads: { major: '#7C452E', minor_high: '#945A3E', minor_mid: '#AA7254', minor_low: '#BE8E70', path: '#D0B09A', outline: '#D4C2B2' }, rail: '#A06848' } },
  { id: 'ocean', name: 'Ocean', bg: '#F0F8FA', roads: '#14536A',
    map: { land: '#F0F8FA', water: '#8AC0D4', waterway: '#6AACCC', parks: '#C8E8D8', buildings: '#DCF0F4',
      roads: { major: '#14536A', minor_high: '#1A6882', minor_mid: '#2A82A0', minor_low: '#409CBB', path: '#78C0D8', outline: '#C8E4EE' }, rail: '#2878A0' } },
  { id: 'forest', name: 'Forest', bg: '#F0F4F0', roads: '#3A5E4D',
    map: { land: '#F0F4F0', water: '#A8C8D4', waterway: '#88B4C4', parks: '#C8DACC', buildings: '#DCEADC',
      roads: { major: '#3A5E4D', minor_high: '#4E7462', minor_mid: '#648C78', minor_low: '#80A492', path: '#AACAB6', outline: '#DCE8DC' }, rail: '#5A7870' } },
  { id: 'terracotta', name: 'Terracotta', bg: '#F5EDE4', roads: '#A0522D',
    map: { land: '#F5EDE4', water: '#B0CEDD', waterway: '#90BECE', parks: '#CCDACC', buildings: '#E8D4C8',
      roads: { major: '#A0522D', minor_high: '#B46438', minor_mid: '#C87C52', minor_low: '#D8986E', path: '#E8C0A0', outline: '#EEE0D4' }, rail: '#B87050' } },
  { id: 'japanese', name: 'Japanese Ink', bg: '#FAF8F5', roads: '#8B2500',
    map: { land: '#FAF8F5', water: '#C0D0D8', waterway: '#A0BCCC', parks: '#D8E4D4', buildings: '#F0EAE4',
      roads: { major: '#8B2500', minor_high: '#A83000', minor_mid: '#C44010', minor_low: '#D86030', path: '#ECA080', outline: '#F4EAE4' }, rail: '#B04020' } },
  { id: 'rustic', name: 'Rustic', bg: '#DFD5C8', roads: '#563A2A',
    map: { land: '#DFD5C8', water: '#9ABAC8', waterway: '#7CAABB', parks: '#C0D0B8', buildings: '#CEBFA8',
      roads: { major: '#563A2A', minor_high: '#6A4A38', minor_mid: '#7E5E4C', minor_low: '#947463', path: '#B49E88', outline: '#CEBEA4' }, rail: '#785848' } },
  { id: 'pastel', name: 'Pastel Dream', bg: '#FAF7F2', roads: '#6870A0',
    map: { land: '#FAF7F2', water: '#B8CCDC', waterway: '#9ABCCC', parks: '#D4E4D0', buildings: '#F0EAF4',
      roads: { major: '#6870A0', minor_high: '#8890BC', minor_mid: '#A0A8D0', minor_low: '#B8BEDE', path: '#D4D8F0', outline: '#EDE8F8' }, rail: '#9098C8' } },
  { id: 'warm_beige', name: 'Warm Beige', bg: '#F5F0E8', roads: '#6B4828',
    map: { land: '#F5F0E8', water: '#B4CCDC', waterway: '#94BCCC', parks: '#D0DCCA', buildings: '#EDE4D8',
      roads: { major: '#6B4828', minor_high: '#845A34', minor_mid: '#9C7048', minor_low: '#B48A62', path: '#CEAA88', outline: '#EAE0D0' }, rail: '#906040' } },
  { id: 'midnight', name: 'Midnight Blue', bg: '#0A1628', roads: '#C99C37',
    map: { land: '#0A1628', water: '#0D1E34', waterway: '#102030', parks: '#0A1820', buildings: '#0E1C30',
      roads: { major: '#C99C37', minor_high: '#A07C28', minor_mid: '#7A5E1E', minor_low: '#504018', path: '#2C2210', outline: '#0A1628' }, rail: '#5A4420' } },
  { id: 'old_navy', name: 'Old Navy', bg: '#061327', roads: '#D4A030',
    map: { land: '#061327', water: '#0A1A30', waterway: '#0C1C2C', parks: '#081420', buildings: '#0C1830',
      roads: { major: '#D4A030', minor_high: '#AA8025', minor_mid: '#806018', minor_low: '#544010', path: '#282008', outline: '#061327' }, rail: '#604A18' } },
  { id: 'noir', name: 'Noir', bg: '#111111', roads: '#E0E0E0',
    map: { land: '#111111', water: '#0A1018', waterway: '#0C1218', parks: '#141814', buildings: '#1A1A1A',
      roads: { major: '#E0E0E0', minor_high: '#B8B8B8', minor_mid: '#909090', minor_low: '#686868', path: '#444444', outline: '#111111' }, rail: '#787878' } },
  { id: 'blueprint', name: 'Blueprint', bg: '#1A3A5C', roads: '#D8EEFA',
    map: { land: '#1A3A5C', water: '#12284A', waterway: '#0E2040', parks: '#1A3848', buildings: '#1E3E60',
      roads: { major: '#D8EEFA', minor_high: '#A8C8E0', minor_mid: '#7898B0', minor_low: '#4E6880', path: '#2C4060', outline: '#1A3A5C' }, rail: '#6080A0' } },
  { id: 'heatwave', name: 'Heatwave', bg: '#1C0E09', roads: '#E87030',
    map: { land: '#1C0E09', water: '#180C08', waterway: '#140A06', parks: '#1A1006', buildings: '#201006',
      roads: { major: '#E87030', minor_high: '#C05020', minor_mid: '#A03818', minor_low: '#702010', path: '#3C1208', outline: '#1C0E09' }, rail: '#804020' } },
  { id: 'ruby', name: 'Ruby', bg: '#1A070F', roads: '#C0103C',
    map: { land: '#1A070F', water: '#100610', waterway: '#0C040C', parks: '#180610', buildings: '#1E080F',
      roads: { major: '#C0103C', minor_high: '#980C30', minor_mid: '#700824', minor_low: '#480418', path: '#280210', outline: '#1A070F' }, rail: '#600818' } },
  { id: 'emerald', name: 'Emerald', bg: '#062C22', roads: '#4ADEB0',
    map: { land: '#062C22', water: '#051E28', waterway: '#041824', parks: '#082E20', buildings: '#083028',
      roads: { major: '#4ADEB0', minor_high: '#38B088', minor_mid: '#268060', minor_low: '#175040', path: '#0A2C20', outline: '#062C22' }, rail: '#2A7858' } },
  { id: 'neon', name: 'Neon', bg: '#0B0F1A', roads: '#FF2D95',
    map: { land: '#0B0F1A', water: '#080C18', waterway: '#060A14', parks: '#0A1018', buildings: '#0E1220',
      roads: { major: '#FF2D95', minor_high: '#CC2278', minor_mid: '#991860', minor_low: '#660E42', path: '#330520', outline: '#0B0F1A' }, rail: '#AA2068' } },
]

const COLOR_THEMES = [
  { id: 'coral',      label: 'Coral',        bg: '#F3E1DA', text: '#6E2F28', accent: '#B9473A' },
  { id: 'sage',       label: 'Sage',         bg: '#DDE8DD', text: '#2D4739', accent: '#3F624F' },
  { id: 'copper',     label: 'Copper',       bg: '#E1D2C6', text: '#4E2F22', accent: '#7C452E' },
  { id: 'ocean',      label: 'Ocean',        bg: '#F0F8FA', text: '#1A5F7A', accent: '#14536A' },
  { id: 'forest',     label: 'Forest',       bg: '#F0F4F0', text: '#2D4A3E', accent: '#3A5E4D' },
  { id: 'terracotta', label: 'Terracotta',   bg: '#F5EDE4', text: '#8B4513', accent: '#A0522D' },
  { id: 'japanese',   label: 'Japanese Ink', bg: '#FAF8F5', text: '#2C2C2C', accent: '#8B2500' },
  { id: 'rustic',     label: 'Rustic',       bg: '#DFD5C8', text: '#44362C', accent: '#563A2A' },
  { id: 'pastel',     label: 'Pastel Dream', bg: '#FAF7F2', text: '#5D5A6D', accent: '#6870A0' },
  { id: 'warm_beige', label: 'Warm Beige',   bg: '#F5F0E8', text: '#6B5B4F', accent: '#6B4828' },
  { id: 'midnight',   label: 'Midnight Blue',bg: '#0A1628', text: '#D6B352', accent: '#C99C37' },
  { id: 'old_navy',   label: 'Old Navy',     bg: '#061327', text: '#E2B85C', accent: '#D4A030' },
  { id: 'noir',       label: 'Noir',         bg: '#000000', text: '#FFFFFF', accent: '#E0E0E0' },
  { id: 'blueprint',  label: 'Blueprint',    bg: '#1A3A5C', text: '#E8F4FF', accent: '#D8EEFA' },
  { id: 'heatwave',   label: 'Heatwave',     bg: '#1C0E09', text: '#FFD78A', accent: '#E87030' },
  { id: 'ruby',       label: 'Ruby',         bg: '#1A070F', text: '#F6D7BC', accent: '#C0103C' },
  { id: 'emerald',    label: 'Emerald',      bg: '#062C22', text: '#E3F9F1', accent: '#4ADEB0' },
  { id: 'neon',       label: 'Neon',         bg: '#0B0F1A', text: '#00F5FF', accent: '#FF2D95' },
]

const FONTS = [
  { id: 'inter',    name: 'Inter',            style: "'Inter', sans-serif" },
  { id: 'playfair', name: 'Playfair Display', style: "'Playfair Display', serif" },
  { id: 'space',    name: 'Space Grotesk',    style: "'Space Grotesk', sans-serif" },
]

type Layout = 'split' | 'fullbleed' | 'circle' | 'typography'
type Template = { id: string; name: string; desc: string; mapStyle: string; colorTheme: string; font: string; layout: Layout }

const TEMPLATES: Template[] = [
  { id: 'tpl-midnight',   name: 'Midnight Blue', desc: 'Dark navy · gold roads · full bleed',    mapStyle: 'midnight',   colorTheme: 'midnight',   font: 'inter',    layout: 'fullbleed'  },
  { id: 'tpl-old-navy',   name: 'Old Navy',      desc: 'Deep navy · amber roads · full bleed',   mapStyle: 'old_navy',   colorTheme: 'old_navy',   font: 'inter',    layout: 'fullbleed'  },
  { id: 'tpl-blueprint',  name: 'Blueprint',     desc: 'Navy · white-blue roads · full bleed',   mapStyle: 'blueprint',  colorTheme: 'blueprint',  font: 'inter',    layout: 'fullbleed'  },
  { id: 'tpl-coral',      name: 'Coral',         desc: 'Warm ivory · coral roads · split',        mapStyle: 'coral',      colorTheme: 'coral',      font: 'playfair', layout: 'split'      },
  { id: 'tpl-sage',       name: 'Sage',          desc: 'Soft sage · green roads · split',         mapStyle: 'sage',       colorTheme: 'sage',       font: 'playfair', layout: 'split'      },
  { id: 'tpl-copper',     name: 'Copper',        desc: 'Warm beige · copper roads · split',       mapStyle: 'copper',     colorTheme: 'copper',     font: 'playfair', layout: 'split'      },
  { id: 'tpl-japanese',   name: 'Japanese Ink',  desc: 'Near-white · deep red roads · split',     mapStyle: 'japanese',   colorTheme: 'japanese',   font: 'inter',    layout: 'split'      },
  { id: 'tpl-noir',       name: 'Noir',          desc: 'Pure black · white roads · full bleed',   mapStyle: 'noir',       colorTheme: 'noir',       font: 'space',    layout: 'fullbleed'  },
  { id: 'tpl-heatwave',   name: 'Heatwave',      desc: 'Dark charred · orange roads · full bleed',mapStyle: 'heatwave',   colorTheme: 'heatwave',   font: 'space',    layout: 'fullbleed'  },
  { id: 'tpl-emerald',    name: 'Emerald',       desc: 'Deep green · mint roads · full bleed',    mapStyle: 'emerald',    colorTheme: 'emerald',    font: 'inter',    layout: 'fullbleed'  },
  { id: 'tpl-ocean-c',    name: 'Ocean',         desc: 'Light blue · teal roads · circle',        mapStyle: 'ocean',      colorTheme: 'ocean',      font: 'inter',    layout: 'circle'     },
  { id: 'tpl-coral-c',    name: 'Coral Circle',  desc: 'Warm coral · ivory frame · circle',       mapStyle: 'coral',      colorTheme: 'coral',      font: 'playfair', layout: 'circle'     },
  { id: 'tpl-typo-navy',  name: 'Type: Midnight',desc: 'Gold cutout letters · warm beige map',    mapStyle: 'warm_beige', colorTheme: 'midnight',   font: 'inter',    layout: 'typography' },
  { id: 'tpl-typo-ink',   name: 'Type: Japanese',desc: 'Dark letters · near-white ink map',       mapStyle: 'japanese',   colorTheme: 'japanese',   font: 'inter',    layout: 'typography' },
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
  const [activeTheme, setActiveTheme] = useState(MAP_THEMES[0])
  const [colorTheme, setColorTheme] = useState(COLOR_THEMES[0])
  const [font, setFont] = useState(FONTS[0])
  const [showTitle, setShowTitle] = useState(true)
  const [showSubtitle, setShowSubtitle] = useState(true)
  const [showWatermark, setShowWatermark] = useState(true)
  const [customTitle, setCustomTitle] = useState('')
  const [layout, setLayout] = useState<Layout>('split')
  const [activeTab, setActiveTab] = useState<'templates' | 'style' | 'colors' | 'typography' | 'labels'>('templates')
  const [promoCode, setPromoCode] = useState('')
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'png' | 'svg'>('pdf')
  const [isLoading, setIsLoading] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [windowSize, setWindowSize] = useState({ w: 1200, h: 800 })

  const posterRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth; const h = window.innerHeight
      setIsMobile(w < 768); setWindowSize({ w, h })
    }
    update(); window.addEventListener('resize', update)
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
      if (data?.[0]) { setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]); setCity(cityName) }
    } catch (e) { console.error('Geocoding failed:', e) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { geocodeCity(initialCity) }, [initialCity, geocodeCity])

  // Init/reinit MapLibre when coords or mobile state changes
  useEffect(() => {
    if (!coords || typeof window === 'undefined') return
    const initMap = async () => {
      const mgl = await import('maplibre-gl')
      await import('maplibre-gl/dist/maplibre-gl.css')
      const el = document.getElementById('map-container')
      if (!el) return
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = new mgl.Map({
        container: el,
        style: generateMapStyle(activeTheme),
        center: [coords[1], coords[0]] as [number, number],
        zoom,
        attributionControl: false,
        canvasContextAttributes: { preserveDrawingBuffer: true },
      } as any)
      mapRef.current = map
    }
    initMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, isMobile])

  // Update map style when theme changes
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setStyle(generateMapStyle(activeTheme))
  }, [activeTheme])

  // Resize map when layout or poster size changes
  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current?.resize(), 80)
  }, [layout, size, isMobile])

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault()
    geocodeCity(cityInput)
    router.replace(`/editor?city=${encodeURIComponent(cityInput)}`, { scroll: false })
  }

  const applyTemplate = (tpl: Template) => {
    setActiveTheme(MAP_THEMES.find(m => m.id === tpl.mapStyle)!)
    setColorTheme(COLOR_THEMES.find(c => c.id === tpl.colorTheme)!)
    setFont(FONTS.find(f => f.id === tpl.font)!)
    setLayout(tpl.layout)
    if (isMobile) setPanelOpen(false)
  }

  const captureHighRes = async () => {
    const { default: html2canvas } = await import('html2canvas')
    const printWidths = { A4: 2480, A3: 3508 }
    const printScale = Math.ceil(printWidths[size] / W)
    return html2canvas(posterRef.current!, { scale: printScale, useCORS: true, allowTaint: true, width: W, height: H })
  }

  const downloadCanvas = async (canvas: HTMLCanvasElement, fmt: 'pdf' | 'png' | 'svg') => {
    const slug = `wallify-${city.toLowerCase().replace(/\s+/g, '-')}-${size.toLowerCase()}`
    if (fmt === 'png') {
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png'); a.download = `${slug}.png`; a.click()
    } else if (fmt === 'pdf') {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: size.toLowerCase() as 'a4' | 'a3' })
      const w = size === 'A4' ? 210 : 297; const h = size === 'A4' ? 297 : 420
      pdf.addImage(dataUrl, 'JPEG', 0, 0, w, h); pdf.save(`${slug}.pdf`)
    } else {
      const dataUrl = canvas.toDataURL('image/png')
      const mmW = size === 'A4' ? '210' : '297'; const mmH = size === 'A4' ? '297' : '420'
      const pxW = canvas.width; const pxH = canvas.height
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${mmW}mm" height="${mmH}mm" viewBox="0 0 ${pxW} ${pxH}"><image href="${dataUrl}" width="${pxW}" height="${pxH}"/></svg>`
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${slug}.svg`; a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleBuyAndDownload = async () => {
    setIsPaying(true)
    try {
      const canvas = await captureHighRes()
      const isFree = promoCode.toLowerCase().trim() === 'free'
      if (isFree) {
        await downloadCanvas(canvas, downloadFormat)
        setIsPaying(false); return
      }
      // Paid flow: store PNG data → Stripe → success page handles format choice
      const dataUrl = canvas.toDataURL('image/png')
      localStorage.setItem('wallify_poster_data', dataUrl)
      localStorage.setItem('wallify_poster_size', size)
      localStorage.setItem('wallify_poster_city', city)
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, size }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url }
      else { alert(data.error || 'Could not start checkout. Please try again.'); setIsPaying(false) }
    } catch (e) {
      console.error(e); alert('Something went wrong. Please try again.'); setIsPaying(false)
    }
  }

  const handleInstagramShare = async () => {
    setIsSharing(true)
    try {
      const canvas = await captureHighRes()
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas to blob failed')), 'image/png')
      )
      const file = new File([blob], `wallify-${city.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${city} Map Poster` })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = file.name; a.click()
        URL.revokeObjectURL(url)
        alert('Poster downloaded! Open Instagram and create a new post to share it.')
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') { console.error(e); alert('Could not share. Please try again.') }
    } finally {
      setIsSharing(false)
    }
  }

  const displayTitle = customTitle || city.toUpperCase()
  const posterDims = POSTER_SIZES[size]
  const availH = isMobile ? windowSize.h - 180 : 700
  const availW = isMobile ? windowSize.w - 24 : 9999
  const scaleH = availH / posterDims.height; const scaleW = availW / posterDims.width
  const scale = Math.min(scaleH, scaleW)
  const W = Math.round(posterDims.width * scale); const H = Math.round(posterDims.height * scale)

  const circleMarginX = Math.round(W * 0.06)
  const circleRadius = Math.round((W - circleMarginX * 2) / 2)
  const circleTopMargin = Math.round(H * 0.03)
  const circleCenterY = circleTopMargin + circleRadius
  const circleBottom = circleCenterY + circleRadius + Math.round(H * 0.01)

  const typoWords = displayTitle.split(' ')
  const typoFontSize = Math.round((H * 0.44) / Math.max(typoWords.length, 1))
  const typoLineH = Math.round(typoFontSize * 1.05)
  const typoTotalH = typoLineH * typoWords.length
  const typoStartY = Math.round((H - typoTotalH) / 2) + Math.round(typoFontSize * 0.82)

  const coordLabel = coords
    ? `${Math.abs(coords[0]).toFixed(4)}°${coords[0] >= 0 ? 'N' : 'S'}  ${Math.abs(coords[1]).toFixed(4)}°${coords[1] >= 0 ? 'E' : 'W'}`
    : ''

  const mapDivStyle: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: layout === 'split' ? '78%' : '100%',
    ...(layout === 'circle' ? { clipPath: `circle(${circleRadius}px at ${W / 2}px ${circleCenterY}px)` } : {}),
  }

  const SidebarContent = () => (
    <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>

      {activeTab === 'templates' && (
        <div>
          <p style={labelStyle}>Presets</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TEMPLATES.map(tpl => {
              const th = COLOR_THEMES.find(c => c.id === tpl.colorTheme)!
              const ms = MAP_THEMES.find(m => m.id === tpl.mapStyle)!
              return (
                <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                  style={{ textAlign: 'left', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: 'transparent', padding: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#8b5cf6')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                >
                  <div style={{ height: 56, position: 'relative', backgroundColor: th.bg, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, bottom: tpl.layout === 'split' ? '28%' : 0, backgroundColor: ms.bg }}>
                      <div style={{ position: 'absolute', top: '42%', left: 0, right: 0, height: 2, backgroundColor: ms.roads, opacity: 0.8 }} />
                      <div style={{ position: 'absolute', top: '65%', left: 0, right: 0, height: 1.5, backgroundColor: ms.roads, opacity: 0.5 }} />
                      <div style={{ position: 'absolute', left: '35%', top: 0, bottom: 0, width: 2, backgroundColor: ms.roads, opacity: 0.7 }} />
                      <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: 1, backgroundColor: ms.roads, opacity: 0.4 }} />
                    </div>
                    {tpl.layout === 'circle' && <div style={{ position: 'absolute', top: '6%', left: '18%', right: '18%', bottom: '28%', borderRadius: '50%', backgroundColor: ms.bg, overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: '45%', left: 0, right: 0, height: 2, backgroundColor: ms.roads }} />
                      <div style={{ position: 'absolute', left: '40%', top: 0, bottom: 0, width: 2, backgroundColor: ms.roads }} />
                    </div>}
                    {tpl.layout === 'split' && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%', backgroundColor: th.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.15em', color: th.text }}>CITY NAME</span></div>}
                    {tpl.layout === 'fullbleed' && <><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)' }} /><div style={{ position: 'absolute', bottom: 5, left: 0, right: 0, textAlign: 'center', fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', color: th.text }}>CITY NAME</div></>}
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
            {MAP_THEMES.map(s => (
              <button key={s.id} onClick={() => setActiveTheme(s)} title={s.name}
                style={{ padding: 0, border: `2px solid ${activeTheme.id === s.id ? '#8b5cf6' : 'transparent'}`, borderRadius: 10, cursor: 'pointer', background: 'transparent', overflow: 'hidden' }}>
                <div style={{ height: 52, backgroundColor: s.bg, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, height: 3, backgroundColor: s.roads, opacity: 0.9 }} />
                  <div style={{ position: 'absolute', top: '65%', left: 0, right: 0, height: 1.5, backgroundColor: s.roads, opacity: 0.6 }} />
                  <div style={{ position: 'absolute', left: '38%', top: 0, bottom: 0, width: 2.5, backgroundColor: s.roads, opacity: 0.8 }} />
                  <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: 1, backgroundColor: s.roads, opacity: 0.5 }} />
                  {activeTheme.id === s.id && <div style={{ position: 'absolute', inset: 0, border: '2px solid #8b5cf6', borderRadius: 8 }} />}
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
          <input type="range" min="8" max="16" value={zoom}
            onChange={e => { const z = Number(e.target.value); setZoom(z); if (mapRef.current) mapRef.current.setZoom(z) }}
            style={{ width: '100%', accentColor: '#8b5cf6' }} />
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

  const tabs = [
    { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
    { id: 'style',     icon: Map,            label: 'Style' },
    { id: 'colors',    icon: Palette,        label: 'Colors' },
    { id: 'typography',icon: Type,           label: 'Text' },
    { id: 'labels',    icon: Eye,            label: 'Labels' },
  ] as const

  return (
    <div style={{ height: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <header style={{ height: isMobile ? 52 : 56, background: '#111', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ fontSize: isMobile ? 17 : 18, fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            Wall<span style={{ color: '#8b5cf6' }}>ify</span>
          </a>
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
          {/* Format selector */}
          <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: 7, padding: 2, border: '1px solid #2a2a2a' }}>
            {(['pdf', 'png', 'svg'] as const).map(f => (
              <button key={f} onClick={() => setDownloadFormat(f)}
                style={{ padding: isMobile ? '3px 7px' : '4px 9px', borderRadius: 5, fontSize: isMobile ? 10 : 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: downloadFormat === f ? '#8b5cf6' : 'transparent', color: downloadFormat === f ? '#fff' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {f}
              </button>
            ))}
          </div>
          {!isMobile && (
            <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Promo code"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#fff', outline: 'none', width: 90 }} />
          )}
          <button onClick={handleBuyAndDownload} disabled={isPaying || isLoading}
            style={{ background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, padding: isMobile ? '7px 12px' : '8px 18px', fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isPaying ? 0.6 : 1 }}>
            <Download style={{ width: 14, height: 14 }} />
            {isPaying ? '...' : promoCode.toLowerCase().trim() === 'free' ? (isMobile ? 'Free' : 'Download Free') : (isMobile ? '€5' : 'Buy & Download — €5')}
          </button>
          {/* Instagram share */}
          <button onClick={handleInstagramShare} disabled={isSharing || isPaying} title="Share on Instagram"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: isMobile ? '7px 9px' : '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isSharing ? 0.6 : 1, flexShrink: 0 }}>
            <Share2 style={{ width: 15, height: 15, color: '#e1306c' }} />
          </button>
        </div>
      </header>

      {isMobile && (
        <form onSubmit={handleCitySearch} style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 8, background: '#0d0d0d', flexShrink: 0 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <MapPin style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#6b7280' }} />
            <input value={cityInput} onChange={e => setCityInput(e.target.value)}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Search city..." />
          </div>
          <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Code"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0 8px', fontSize: 12, color: '#fff', outline: 'none', width: 52 }} />
          <button type="submit" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#fff', cursor: 'pointer' }}>Go</button>
        </form>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {!isMobile && (
          <aside style={{ width: 276, background: '#111', borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
              {tabs.map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0', fontSize: 9, cursor: 'pointer', border: 'none', background: 'transparent', color: activeTab === id ? '#8b5cf6' : '#6b7280', borderBottom: activeTab === id ? '2px solid #8b5cf6' : '2px solid transparent' }}>
                  <Icon style={{ width: 14, height: 14 }} />{label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}><SidebarContent /></div>
          </aside>
        )}

        <main style={{ flex: 1, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: isMobile ? '12px' : '32px' }}>
          {isLoading ? (
            <div style={{ color: '#6b7280', fontSize: 13 }}>Finding {cityInput}...</div>
          ) : (
            <div ref={posterRef}
              style={{ position: 'relative', width: W, height: H, backgroundColor: colorTheme.bg, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden', flexShrink: 0 }}
            >
              {/* Map — always present, never unmounts */}
              <div id="map-container" style={mapDivStyle} />

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
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: `0 28px ${Math.round(H * 0.065)}px`, fontFamily: font.style }}>
                  {showTitle && <div style={{ fontSize: Math.round(W * 0.072), fontWeight: 700, letterSpacing: '0.15em', lineHeight: 1.05, textAlign: 'center', color: colorTheme.text }}>{displayTitle}</div>}
                  <div style={{ width: '40%', height: 1, background: colorTheme.accent, opacity: 0.5, margin: `${Math.round(H * 0.01)}px 0` }} />
                  {showSubtitle && coordLabel && <div style={{ fontSize: Math.round(W * 0.022), color: colorTheme.accent, letterSpacing: '0.2em', marginTop: 4, textTransform: 'uppercase' }}>{coordLabel}</div>}
                  {showWatermark && <div style={{ fontSize: Math.round(W * 0.015), color: colorTheme.accent, marginTop: 8, letterSpacing: '0.1em', opacity: 0.45 }}>wallify.app</div>}
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
                        <text key={i} x="50%" y={typoStartY + i * typoLineH} textAnchor="middle"
                          fontSize={typoFontSize} fontWeight="900" fontFamily="'Inter', sans-serif"
                          fill="black" textLength={Math.round(W * 0.94)} lengthAdjust="spacingAndGlyphs">{word}</text>
                      ))}
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill={colorTheme.bg} mask="url(#typo-mask)" />
                  {showTitle && (
                    <text x={W - Math.round(W * 0.05)} y={Math.round(H * 0.075)} textAnchor="end"
                      fill={colorTheme.text} fontSize={Math.round(W * 0.028)} fontFamily="'Inter', sans-serif"
                      fontWeight="600" letterSpacing="0.14em" opacity="0.9">{displayTitle}</text>
                  )}
                  <line x1={Math.round(W * 0.05)} y1={Math.round(H * 0.895)} x2={Math.round(W * 0.95)} y2={Math.round(H * 0.895)} stroke={colorTheme.accent} strokeWidth="0.6" opacity="0.3" />
                  {showSubtitle && coordLabel && (
                    <text x={Math.round(W * 0.05)} y={Math.round(H * 0.935)} fill={colorTheme.text}
                      fontSize={Math.round(W * 0.019)} fontFamily="'Inter', sans-serif" opacity="0.6" letterSpacing="0.06em">{coordLabel}</text>
                  )}
                  {showWatermark && (
                    <text x={W - Math.round(W * 0.05)} y={Math.round(H * 0.935)} textAnchor="end"
                      fill={colorTheme.accent} fontSize={Math.round(W * 0.017)} fontFamily="'Inter', sans-serif" opacity="0.45">wallify.app</text>
                  )}
                </svg>
              )}
            </div>
          )}
        </main>
      </div>

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
          <div style={{ overflowY: 'auto', flex: 1 }}><SidebarContent /></div>
        </div>
      )}

    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 10, color: '#6b7280', marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }
