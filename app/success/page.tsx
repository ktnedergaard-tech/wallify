"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, CheckCircle, ArrowLeft, FileText } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const size = (searchParams.get("size") || "A4") as "A4" | "A3";
  const city = searchParams.get("city") || "your city";
  const sessionId = searchParams.get("session_id");

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [hasPosterData, setHasPosterData] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("wallify_poster_data") || localStorage.getItem("wallify_posterDataUrl");
    setHasPosterData(!!data);
  }, []);

  async function handleDownloadPDF() {
    setIsDownloading(true);
    try {
      const dataUrl = localStorage.getItem("wallify_poster_data") || localStorage.getItem("wallify_posterDataUrl");
      const posterSize = (localStorage.getItem("wallify_poster_size") || localStorage.getItem("wallify_posterSize") || size) as "A4" | "A3";

      if (!dataUrl) {
        alert("Poster data not found. Please return to the editor and try again.");
        return;
      }

      const { default: jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: posterSize.toLowerCase() as "a4" | "a3",
      });

      const width = posterSize === "A4" ? 210 : 297;
      const height = posterSize === "A4" ? 297 : 420;

      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      pdf.save(`wallify-${city.toLowerCase().replace(/\s+/g, '-')}-${posterSize.toLowerCase()}.pdf`);

      setDownloaded(true);
      // Clean up stored data after successful download
      localStorage.removeItem("wallify_poster_data");
      localStorage.removeItem("wallify_poster_size");
      localStorage.removeItem("wallify_poster_city");
      localStorage.removeItem("wallify_posterDataUrl");
      localStorage.removeItem("wallify_posterSize");
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Card */}
      <div
        style={{
          background: "#111111",
          border: "1px solid #2a2a2a",
          borderRadius: 24,
          padding: "48px 40px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Success icon */}
        <div
          style={{
            width: 72,
            height: 72,
            background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <CheckCircle size={36} color="#ffffff" />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Payment successful!
        </h1>
        <p style={{ color: "#6b7280", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
          {downloaded
            ? "Your poster PDF has been downloaded. Enjoy your print!"
            : `Your ${size} map poster of ${city} is ready to download. Click below to get your print-ready PDF.`}
        </p>

        {/* Session info */}
        {sessionId && (
          <div
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              padding: "10px 16px",
              marginBottom: 24,
              fontSize: 12,
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FileText size={14} />
            <span>Order ID: <code style={{ color: "#9ca3af", fontSize: 11 }}>{sessionId.slice(-12)}</code></span>
          </div>
        )}

        {/* Download button */}
        {!downloaded && (
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading || !hasPosterData}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: isDownloading || !hasPosterData ? "#2a2a2a" : "#8b5cf6",
              color: isDownloading || !hasPosterData ? "#6b7280" : "#ffffff",
              border: "none",
              borderRadius: 12,
              padding: "14px 24px",
              fontSize: 16,
              fontWeight: 600,
              cursor: isDownloading || !hasPosterData ? "not-allowed" : "pointer",
              marginBottom: 16,
            }}
          >
            <Download size={20} />
            {isDownloading ? "Generating PDF…" : `Download ${size} PDF`}
          </button>
        )}

        {downloaded && (
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: "#0d2a0d",
              border: "1px solid #166534",
              color: "#4ade80",
              borderRadius: 12,
              padding: "14px 24px",
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            <CheckCircle size={20} />
            Downloaded successfully!
          </div>
        )}

        {!hasPosterData && !downloaded && (
          <p style={{ fontSize: 13, color: "#f59e0b", marginBottom: 16, lineHeight: 1.5 }}>
            Poster data not found in this browser session. Please return to the editor to recreate your design and download.
          </p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/editor"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #2a2a2a",
              color: "#6b7280",
              padding: "10px 20px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
            Back to editor
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #2a2a2a",
              color: "#6b7280",
              padding: "10px 20px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Home
          </Link>
        </div>
      </div>

      {/* Reassurance */}
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
