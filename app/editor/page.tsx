import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const MapEditor = dynamic(() => import('@/components/editor/MapEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-[#6b7280] text-sm">Loading editor...</div>
    </div>
  )
})

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <MapEditor />
    </Suspense>
  )
}
