'use client'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const MapEditor = dynamic(() => import('@/components/editor/MapEditor'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280', fontSize: 14 }}>Loading editor...</div>
    </div>
  ),
})

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <MapEditor />
    </Suspense>
  )
}
