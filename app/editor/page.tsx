"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Toolbar from "@/components/editor/Toolbar";
import Sidebar from "@/components/editor/Sidebar";
import type { PosterSize, PosterCanvasHandle } from "@/components/editor/PosterCanvas";

// Load canvas with SSR disabled (uses browser APIs)
const PosterCanvas = dynamic(() => import("@/components/editor/PosterCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center"
      style={{ width: 420, height: 595, background: "#ffffff", borderRadius: 4, boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}
    >
      <div className="text-center" style={{ color: "#6b7280" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #2a2a2a", borderTopColor: "#8b5cf6", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: 13 }}>Loading canvas…</span>
      </div>
    </div>
  ),
});

export default function EditorPage() {
  const canvasRef = useRef<PosterCanvasHandle>(null);
  const [size, setSize] = useState<PosterSize>("A4");
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleBuyAndDownload() {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    try {
      // Export canvas image and store for after payment
      const dataUrl = canvasRef.current.getDataURL();
      localStorage.setItem("wallify_posterDataUrl", dataUrl);
      localStorage.setItem("wallify_posterSize", size);

      // Call API to create Stripe checkout session
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size }),
      });

      if (!res.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0a0a0a",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Toolbar */}
      <Toolbar
        size={size}
        onSizeChange={setSize}
        canvasRef={canvasRef}
        onBuyAndDownload={handleBuyAndDownload}
        isProcessing={isProcessing}
      />

      {/* Main editor area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <Sidebar canvasRef={canvasRef} />

        {/* Canvas area */}
        <main
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1a1a1a",
            overflow: "auto",
            padding: 32,
            position: "relative",
          }}
        >
          {/* Size label */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#111111",
              border: "1px solid #2a2a2a",
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 11,
              color: "#6b7280",
              fontWeight: 500,
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
            }}
          >
            {size === "A4" ? "A4 — 210 × 297 mm" : "A3 — 297 × 420 mm"} · portrait
          </div>

          <PosterCanvas ref={canvasRef} size={size} />
        </main>

        {/* Right properties panel */}
        <aside
          style={{
            width: 220,
            background: "#111111",
            borderLeft: "1px solid #2a2a2a",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #2a2a2a" }}>
            <h3 style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Properties
            </h3>
          </div>
          <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
              <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 500 }}>Format</p>
              <p style={{ fontSize: 13, color: "#ffffff", fontWeight: 600 }}>{size} Portrait</p>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                {size === "A4" ? "210 × 297 mm" : "297 × 420 mm"}
              </p>
            </div>

            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
              <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 500 }}>Tips</p>
              <ul style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.7, paddingLeft: 16, margin: 0 }}>
                <li>Click to select elements</li>
                <li>Double-click to edit text</li>
                <li>Drag to reposition</li>
                <li>Use corners to resize</li>
                <li>Delete key removes selected</li>
              </ul>
            </div>

            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
              <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: 500 }}>Pricing</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#ffffff" }}>PDF download</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#8b5cf6" }}>€5</span>
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                Preview PNG is always free.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
