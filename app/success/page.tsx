"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, CheckCircle, ArrowLeft, FileText, Share2 } from "lucide-react";

type Format = "pdf" | "png" | "svg";

function SuccessContent() {
  const searchParams = useSearchParams();
  const size = (searchParams.get("size") || "A4") as "A4" | "A3";
  const city = searchParams.get("city") || "your city";
  const sessionId = searchParams.get("session_id");

  const [isDownloading, setIsDownloading] = useState<Format | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [hasPosterData, setHasPosterData] = useState(false);
  const [posterSize, setPosterSize] = useState<"A4" | "A3">(size);
  const [posterCity, setPosterCity] = useState(city);

  useEffect(() => {
    const data = localStorage.getItem("wallify_poster_data");
    const storedSize = localStorage.getItem("wallify_poster_size") as "A4" | "A3" | null;
    const storedCity = localStorage.getItem("wallify_poster_city");
    setHasPosterData(!!data);
    if (storedSize) setPosterSize(storedSize);
    if (storedCity) setPosterCity(storedCity);
  }, []);

  const slug = `wallify-${posterCity.toLowerCase().replace(/\s+/g, "-")}-${posterSize.toLowerCase()}`;

  async function handleDownload(fmt: Format) {
    setIsDownloading(fmt);
    try {
      const dataUrl = localStorage.getItem("wallify_poster_data");
      if (!dataUrl) { alert("Poster data not found. Please return to the editor."); return; }

      if (fmt === "png") {
        const a = document.createElement("a");
        a.href = dataUrl; a.download = `${slug}.png`; a.click();
      } else if (fmt === "pdf") {
        const { default: jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: posterSize.toLowerCase() as "a4" | "a3" });
        const w = posterSize === "A4" ? 210 : 297;
        const h = posterSize === "A4" ? 297 : 420;
        const imgFormat = dataUrl.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
        pdf.addImage(dataUrl, imgFormat, 0, 0, w, h);
        pdf.save(`${slug}.pdf`);
      } else {
        const mmW = posterSize === "A4" ? "210" : "297";
        const mmH = posterSize === "A4" ? "297" : "420";
        const pxW = posterSize === "A4" ? 2480 : 3508;
        const pxH = posterSize === "A4" ? 3508 : 4961;
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${mmW}mm" height="${mmH}mm" viewBox="0 0 ${pxW} ${pxH}"><image href="${dataUrl}" width="${pxW}" height="${pxH}"/></svg>`;
        const blob = new Blob([svgContent], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${slug}.svg`; a.click();
        URL.revokeObjectURL(url);
      }

      setDownloaded(true);
      localStorage.removeItem("wallify_poster_data");
      localStorage.removeItem("wallify_poster_size");
      localStorage.removeItem("wallify_poster_city");
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to generate file. Please try again.");
    } finally {
      setIsDownloading(null);
    }
  }

  async function handleInstagramShare() {
    setIsSharing(true);
    try {
      const dataUrl = localStorage.getItem("wallify_poster_data");
      if (!dataUrl) { alert("Poster data not found. Please return to the editor."); return; }
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${slug}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${posterCity} Map Poster` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
        URL.revokeObjectURL(url);
        alert("Poster downloaded! Open Instagram and create a new post to share it.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") { console.error(e); alert("Could not share. Please try again."); }
    } finally {
      setIsSharing(false);
    }
  }

  const busy = isDownloading !== null || isSharing;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Inter, sans-serif" }}>
      <div style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: 24, padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center" }}>

        <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <CheckCircle size={36} color="#ffffff" />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Payment successful!</h1>
        <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
          {downloaded
            ? "Your poster has been downloaded. Enjoy your print!"
            : `Your ${posterSize} map poster of ${posterCity} is ready. Choose a format to download.`}
        </p>

        {sessionId && (
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 16px", marginBottom: 24, fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={14} />
            <span>Order ID: <code style={{ color: "#9ca3af", fontSize: 11 }}>{sessionId.slice(-12)}</code></span>
          </div>
        )}

        {!downloaded && hasPosterData && (
          <div style={{ marginBottom: 16 }}>
            {/* Format download buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              {(["pdf", "png", "svg"] as Format[]).map(fmt => (
                <button key={fmt} onClick={() => handleDownload(fmt)} disabled={busy}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "#1a1a1a", color: isDownloading === fmt ? "#6b7280" : "#fff", border: `1px solid ${isDownloading === fmt ? "#8b5cf6" : "#2a2a2a"}`, borderRadius: 10, padding: "14px 8px", fontSize: 13, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}
                  onMouseEnter={e => { if (!busy) e.currentTarget.style.borderColor = "#8b5cf6"; }}
                  onMouseLeave={e => { if (isDownloading !== fmt) e.currentTarget.style.borderColor = "#2a2a2a"; }}>
                  <Download size={18} />
                  {isDownloading === fmt ? "…" : fmt.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Instagram share */}
            <button onClick={handleInstagramShare} disabled={busy}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 24px", fontSize: 14, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: isSharing ? 0.7 : 1 }}>
              <Share2 size={18} />
              {isSharing ? "Preparing…" : "Share on Instagram"}
            </button>
          </div>
        )}

        {downloaded && (
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "#0d2a0d", border: "1px solid #166534", color: "#4ade80", borderRadius: 12, padding: "14px 24px", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            <CheckCircle size={20} />
            Downloaded successfully!
          </div>
        )}

        {!hasPosterData && !downloaded && (
          <p style={{ fontSize: 13, color: "#f59e0b", marginBottom: 16, lineHeight: 1.5 }}>
            Poster data not found in this browser session. Return to the editor to recreate your design.
          </p>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
          <Link href="/editor" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #2a2a2a", color: "#6b7280", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            <ArrowLeft size={16} />Back to editor
          </Link>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid #2a2a2a", color: "#6b7280", padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            Home
          </Link>
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: "#4b5563", textAlign: "center" }}>
        Secured by Stripe · Payment confirmed · No data stored on our servers
      </p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#6b7280" }}>Loading…</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
