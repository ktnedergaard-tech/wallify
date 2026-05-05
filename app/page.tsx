import Link from "next/link";
import { ArrowRight, Download, CreditCard, Layers, Zap, FileImage } from "lucide-react";

const samplePosters = [
  { bg: "#1a1a2e", accent: "#e94560", label: "Bold Dark" },
  { bg: "#f8f0e3", accent: "#5c3d2e", label: "Warm Minimal" },
  { bg: "#0d1b2a", accent: "#00b4d8", label: "Neon Night" },
  { bg: "#fce4ec", accent: "#c2185b", label: "Pastel Dream" },
  { bg: "#1b2838", accent: "#66c0f4", label: "Editorial" },
  { bg: "#fff8e1", accent: "#ff6f00", label: "Sunset" },
];

const features = [
  {
    icon: Layers,
    title: "A3 & A4 formats",
    desc: "Design in print-ready portrait dimensions. Perfect for home printing or professional print shops.",
  },
  {
    icon: Zap,
    title: "Instant editor",
    desc: "Powerful canvas editor with templates, text layers, backgrounds, and image uploads.",
  },
  {
    icon: CreditCard,
    title: "Pay only €5",
    desc: "One flat fee per poster. No subscription, no hidden costs. Pay and download immediately.",
  },
  {
    icon: Download,
    title: "PDF download",
    desc: "Get a high-quality print-ready PDF delivered instantly after payment.",
  },
  {
    icon: FileImage,
    title: "Free preview",
    desc: "Download a free PNG preview before you commit. See exactly what you'll get.",
  },
  {
    icon: ArrowRight,
    title: "No account needed",
    desc: "Jump straight into the editor. Design, pay, download — no sign-up required.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#ffffff" }}>
      {/* Navbar */}
      <nav style={{ borderBottom: "1px solid #2a2a2a", background: "#0d0d0d" }}>
        <div className="max-w-7xl mx-auto px-6" style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Wall<span style={{ color: "#8b5cf6" }}>ify</span>
          </span>
          <Link
            href="/editor"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#8b5cf6", color: "#fff",
              padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Open Editor
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6" style={{ paddingTop: 96, paddingBottom: 80, textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#1a1a1a", border: "1px solid #2a2a2a",
          borderRadius: 999, padding: "6px 16px",
          fontSize: 13, color: "#8b5cf6", fontWeight: 500, marginBottom: 32,
        }}>
          <span style={{ width: 6, height: 6, background: "#8b5cf6", borderRadius: "50%", display: "inline-block" }} />
          From €5 per poster · Print at home or at a shop
        </div>
        <h1 style={{ fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 24 }}>
          Design.{" "}
          <span style={{ background: "linear-gradient(135deg, #8b5cf6, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Print.
          </span>{" "}
          Done.
        </h1>
        <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Create beautiful A3 and A4 posters in minutes with our professional
          design editor. Pay once, download your print-ready PDF instantly.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/editor"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#8b5cf6", color: "#fff",
              padding: "14px 32px", borderRadius: 12, fontSize: 17, fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Start designing free
          </Link>
          <a
            href="#features"
            style={{
              display: "inline-flex", alignItems: "center",
              border: "1px solid #2a2a2a", color: "#6b7280",
              padding: "14px 32px", borderRadius: 12, fontSize: 17, fontWeight: 500,
              textDecoration: "none",
            }}
          >
            See how it works
          </a>
        </div>
      </section>

      {/* Sample Posters Grid */}
      <section className="max-w-7xl mx-auto px-6" style={{ paddingBottom: 96 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
          {samplePosters.map((poster, i) => (
            <Link href="/editor" key={i} style={{ textDecoration: "none" }}>
              <div style={{ background: poster.bg, borderRadius: 12, aspectRatio: "3/4", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 12, left: 12, right: 12, height: 4, borderRadius: 2, background: poster.accent, opacity: 0.7 }} />
                <div style={{ position: "absolute", top: 22, left: 12, right: 24, height: 2, borderRadius: 2, background: poster.accent, opacity: 0.3 }} />
                <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
                  <div style={{ height: 20, borderRadius: 4, background: poster.accent, opacity: 0.8, width: "60%", marginBottom: 6 }} />
                  <div style={{ height: 12, borderRadius: 4, background: poster.accent, opacity: 0.4, width: "80%", marginBottom: 4 }} />
                  <div style={{ height: 12, borderRadius: 4, background: poster.accent, opacity: 0.4, width: "50%" }} />
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 11, color: "#6b7280", marginTop: 8 }}>{poster.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ borderTop: "1px solid #2a2a2a", background: "#0d0d0d" }}>
        <div className="max-w-7xl mx-auto px-6" style={{ paddingTop: 96, paddingBottom: 96 }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16 }}>Everything you need</h2>
            <p style={{ color: "#6b7280", fontSize: 17, maxWidth: 480, margin: "0 auto" }}>
              A complete poster design workflow from blank canvas to print-ready file.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {features.map((feature, i) => (
              <div key={i} style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: 16, padding: 24 }}>
                <div style={{ width: 40, height: 40, background: "#1a1a1a", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <feature.icon size={20} color="#8b5cf6" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="max-w-7xl mx-auto px-6" style={{ paddingTop: 96, paddingBottom: 96, textAlign: "center" }}>
        <div style={{ background: "linear-gradient(135deg, #1a1a2e, #0d0d0d)", border: "1px solid #2a2a2a", borderRadius: 24, padding: "64px 32px", position: "relative", overflow: "hidden" }}>
          <div style={{ fontSize: 72, fontWeight: 800, marginBottom: 8 }}>
            <span style={{ background: "linear-gradient(135deg, #8b5cf6, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              €5
            </span>
          </div>
          <p style={{ color: "#6b7280", marginBottom: 8 }}>per poster · one-time payment</p>
          <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 16 }}>
            Start designing, pay when you're happy
          </h2>
          <p style={{ color: "#6b7280", maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Use the full editor for free. Only pay when you want to download your
            print-ready PDF. Simple as that.
          </p>
          <Link
            href="/editor"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#8b5cf6", color: "#fff",
              padding: "14px 40px", borderRadius: 12, fontSize: 17, fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Open the editor
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #2a2a2a", background: "#0d0d0d" }}>
        <div className="max-w-7xl mx-auto px-6" style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            Wall<span style={{ color: "#8b5cf6" }}>ify</span>
          </span>
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            © {new Date().getFullYear()} Wallify. All rights reserved.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
            <span style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%", display: "inline-block" }} />
            Payments secured by Stripe
          </div>
        </div>
      </footer>
    </div>
  );
}
