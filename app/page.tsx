'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Download, CreditCard, Map } from 'lucide-react'

const EXAMPLE_CITIES = ['Copenhagen', 'Paris', 'Tokyo', 'New York', 'Rome', 'London']

const POSTER_PREVIEWS = [
  { city: 'COPENHAGEN', bg: '#ffffff', text: '#000000', accent: '#555555', mapBg: '#e8e0d5', roads: '#ffffff' },
  { city: 'PARIS', bg: '#0a0a0a', text: '#ffffff', accent: '#888888', mapBg: '#1a1a2e', roads: '#2a2a4e' },
  { city: 'TOKYO', bg: '#f5f0e8', text: '#1a1a1a', accent: '#666666', mapBg: '#e0dbd0', roads: '#f5f0e8' },
  { city: 'NEW YORK', bg: '#0f1f3d', text: '#e8edf5', accent: '#a0b4cc', mapBg: '#162a4a', roads: '#1e3a6a' },
  { city: 'ROME', bg: '#3d1a0f', text: '#f5e8e0', accent: '#cc7a5a', mapBg: '#4a2a1a', roads: '#5a3a2a' },
  { city: 'LONDON', bg: '#1a2e1a', text: '#e8f5e8', accent: '#7ab87a', mapBg: '#223a22', roads: '#2e4e2e' },
]

function PosterPreview({ city, bg, text, accent, mapBg, roads }: typeof POSTER_PREVIEWS[0]) {
  return (
    <div
      className="relative overflow-hidden rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200"
      style={{ backgroundColor: bg, aspectRatio: '3/4' }}
    >
      {/* Fake map area */}
      <div className="absolute inset-0" style={{ bottom: '22%', backgroundColor: mapBg }}>
        {/* Fake road lines */}
        {[20, 40, 55, 70, 85].map(y => (
          <div key={y} className="absolute" style={{ top: `${y}%`, left: 0, right: 0, height: 1.5, backgroundColor: roads, opacity: 0.8 }} />
        ))}
        {[15, 35, 50, 65, 80].map(x => (
          <div key={x} className="absolute" style={{ left: `${x}%`, top: 0, bottom: 0, width: 1.5, backgroundColor: roads, opacity: 0.8 }} />
        ))}
        {/* A thicker "main road" */}
        <div className="absolute" style={{ top: '48%', left: 0, right: 0, height: 3, backgroundColor: roads }} />
        <div className="absolute" style={{ left: '48%', top: 0, bottom: 0, width: 3, backgroundColor: roads }} />
      </div>
      {/* Divider line */}
      <div className="absolute" style={{ bottom: '22%', left: 0, right: 0, height: 1, backgroundColor: accent, opacity: 0.4 }} />
      {/* Text area */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center"
        style={{ height: '22%', backgroundColor: bg }}
      >
        <div className="font-bold tracking-widest" style={{ color: text, fontSize: 'clamp(7px, 2vw, 11px)' }}>{city}</div>
        <div className="tracking-widest mt-0.5" style={{ color: accent, fontSize: 'clamp(5px, 1.2vw, 8px)' }}>55.67°N · 12.56°E</div>
      </div>
    </div>
  )
}

export default function Home() {
  const [cityInput, setCityInput] = useState('')
  const router = useRouter()

  const handleStart = (city?: string) => {
    const target = city || cityInput.trim()
    if (!target) return
    router.push(`/editor?city=${encodeURIComponent(target)}`)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#ffffff' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1a1a1a', background: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ height: 56 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Wall<span style={{ color: '#8b5cf6' }}>ify</span>
          </span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Free to design · €5 to download</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 text-center" style={{ paddingTop: 80, paddingBottom: 64 }}>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: 999, padding: '5px 14px',
            fontSize: 12, color: '#8b5cf6', fontWeight: 500, marginBottom: 28,
          }}
        >
          <span style={{ width: 6, height: 6, background: '#8b5cf6', borderRadius: '50%', display: 'inline-block' }} />
          Map posters for any city in the world
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 7vw, 68px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 20 }}>
          Turn any city into<br />
          <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            wall art
          </span>
        </h1>
        <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Type any city, customize the map style and colors, pay €5 and download a print-ready A4 or A3 poster.
        </p>

        {/* Search bar */}
        <div className="flex gap-2 max-w-md mx-auto" style={{ marginBottom: 16 }}>
          <div className="flex-1 relative">
            <MapPin
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#6b7280' }}
            />
            <input
              type="text"
              placeholder="Enter a city — e.g. Copenhagen"
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              style={{
                width: '100%', background: '#111111', border: '1px solid #2a2a2a',
                borderRadius: 12, paddingLeft: 40, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
                fontSize: 15, color: '#ffffff', outline: 'none',
              }}
            />
          </div>
          <button
            onClick={() => handleStart()}
            style={{
              background: '#8b5cf6', color: '#ffffff', border: 'none',
              padding: '0 24px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Create Poster →
          </button>
        </div>

        {/* Quick pick cities */}
        <div className="flex gap-2 justify-center flex-wrap">
          {EXAMPLE_CITIES.map(c => (
            <button
              key={c}
              onClick={() => handleStart(c)}
              style={{
                background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 999,
                padding: '4px 14px', fontSize: 12, color: '#6b7280', cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Poster previews */}
      <section className="max-w-6xl mx-auto px-6" style={{ paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {POSTER_PREVIEWS.map((p, i) => (
            <div key={i} onClick={() => handleStart(p.city.charAt(0) + p.city.slice(1).toLowerCase())}>
              <PosterPreview {...p} />
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#3a3a3a', marginTop: 16 }}>
          Click any poster to open in editor
        </p>
      </section>

      {/* How it works */}
      <section style={{ borderTop: '1px solid #1a1a1a', background: '#0d0d0d', padding: '80px 24px' }}>
        <div className="max-w-4xl mx-auto">
          <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, marginBottom: 48 }}>How it works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { icon: MapPin, step: '01', title: 'Choose a city', desc: 'Type any city in the world and the map loads instantly' },
              { icon: Map, step: '02', title: 'Customize', desc: 'Pick map style, colors, font, and poster size (A4 or A3)' },
              { icon: CreditCard, step: '03', title: 'Pay €5', desc: 'One-time payment via Stripe — no subscription, no account needed' },
              { icon: Download, step: '04', title: 'Download PDF', desc: 'Get a print-ready PDF delivered instantly. Print at home or at a shop' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} style={{ background: '#111111', border: '1px solid #1a1a1a', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, background: '#8b5cf6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color="white" />
                  </div>
                  <span style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 700, letterSpacing: '0.1em' }}>{step}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="max-w-lg mx-auto">
          <div style={{ fontSize: 56, fontWeight: 800, background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            €5
          </div>
          <p style={{ color: '#6b7280', marginBottom: 8 }}>per poster · one-time</p>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Design free, pay when you're ready</h2>
          <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
            Use the full editor at no cost. Only pay when you want to download your print-ready PDF.
          </p>
          <button
            onClick={() => handleStart('Copenhagen')}
            style={{
              background: '#8b5cf6', color: '#ffffff', border: 'none',
              padding: '14px 36px', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Start designing free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1a1a1a', background: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4" style={{ height: 56 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Wall<span style={{ color: '#8b5cf6' }}>ify</span></span>
          <p style={{ fontSize: 12, color: '#3a3a3a' }}>© {new Date().getFullYear()} Wallify</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#3a3a3a' }}>
            <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
            Payments by Stripe
          </div>
        </div>
      </footer>
    </div>
  )
}
