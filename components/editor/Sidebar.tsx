"use client";

import { useState, useRef } from "react";
import { Type, Palette, Image, LayoutTemplate } from "lucide-react";
import type { PosterCanvasHandle } from "./PosterCanvas";

interface SidebarProps {
  canvasRef: React.RefObject<PosterCanvasHandle | null>;
}

const TEMPLATES = [
  { id: "minimal_white", label: "Minimal White", bg: "#ffffff", accent: "#111111" },
  { id: "bold_dark", label: "Bold Dark", bg: "#0d0d0d", accent: "#8b5cf6" },
  { id: "sunset", label: "Sunset", bg: "#ff6b6b", accent: "#ff8e53" },
  { id: "neon_night", label: "Neon Night", bg: "#050510", accent: "#00f5ff" },
  { id: "pastel_dream", label: "Pastel Dream", bg: "#fce4ec", accent: "#c2185b" },
  { id: "editorial", label: "Editorial", bg: "#f5f5f0", accent: "#1a1a1a" },
];

const BG_COLORS = [
  "#ffffff", "#0a0a0a", "#f5f5f0", "#fce4ec",
  "#e3f2fd", "#e8f5e9", "#fff8e1", "#fbe9e7",
  "#ede7f6", "#e0f2f1", "#ff6b6b", "#1a1a2e",
];

const TEXT_PRESETS = [
  { label: "Heading", text: "Your Headline", fontSize: 48, fontWeight: "bold" },
  { label: "Subheading", text: "A compelling subheading", fontSize: 28, fontWeight: "normal" },
  { label: "Body", text: "Body text goes here. Describe your poster content.", fontSize: 18, fontWeight: "normal" },
  { label: "Caption", text: "Small caption text", fontSize: 13, fontWeight: "normal" },
];

type TabId = "templates" | "text" | "background" | "images";

const TABS: { id: TabId; label: string; icon: typeof Type }[] = [
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "text", label: "Text", icon: Type },
  { id: "background", label: "Background", icon: Palette },
  { id: "images", label: "Images", icon: Image },
];

export default function Sidebar({ canvasRef }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>("templates");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAddText(preset: typeof TEXT_PRESETS[0]) {
    canvasRef.current?.addText(preset.text, {
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
    });
  }

  function handleSetBackground(color: string) {
    canvasRef.current?.setBackground(color);
  }

  function handleApplyTemplate(id: string) {
    canvasRef.current?.applyTemplate(id);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      canvasRef.current?.addImage(dataUrl);
    };
    reader.readAsDataURL(file);
    // reset so same file can be re-uploaded
    e.target.value = "";
  }

  return (
    <aside className="flex flex-col bg-[#111111] border-r border-[#2a2a2a]" style={{ width: 260 }}>
      {/* Tab bar */}
      <div className="flex border-b border-[#2a2a2a]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
              activeTab === tab.id
                ? "text-[#8b5cf6] border-b-2 border-[#8b5cf6] bg-[#1a1a1a]"
                : "text-[#6b7280] hover:text-white hover:bg-[#1a1a1a]"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Templates */}
        {activeTab === "templates" && (
          <div>
            <p className="text-xs text-[#6b7280] mb-3 font-medium uppercase tracking-wider">
              Choose a template
            </p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl.id)}
                  className="group relative rounded-lg overflow-hidden border-2 border-transparent hover:border-[#8b5cf6] transition-all"
                >
                  <div
                    className="aspect-[3/4] w-full"
                    style={{ background: tmpl.bg }}
                  >
                    <div
                      className="absolute top-2 left-2 right-2 h-1 rounded"
                      style={{ background: tmpl.accent, opacity: 0.7 }}
                    />
                    <div
                      className="absolute top-4 left-2 right-4 h-0.5 rounded"
                      style={{ background: tmpl.accent, opacity: 0.3 }}
                    />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div
                        className="h-2 rounded mb-1"
                        style={{ background: tmpl.accent, opacity: 0.8, width: "70%" }}
                      />
                      <div
                        className="h-1.5 rounded"
                        style={{ background: tmpl.accent, opacity: 0.4, width: "50%" }}
                      />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 px-1.5">
                    <span className="text-[9px] text-white font-medium">{tmpl.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text */}
        {activeTab === "text" && (
          <div>
            <p className="text-xs text-[#6b7280] mb-3 font-medium uppercase tracking-wider">
              Add text
            </p>
            <div className="flex flex-col gap-2">
              {TEXT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleAddText(preset)}
                  className="w-full text-left px-3 py-3 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-white"
                      style={{
                        fontSize: Math.min(preset.fontSize / 3, 20),
                        fontWeight: preset.fontWeight as "bold" | "normal",
                        lineHeight: 1.2,
                      }}
                    >
                      {preset.label}
                    </span>
                    <span className="text-[10px] text-[#6b7280] group-hover:text-[#8b5cf6] transition-colors">
                      + Add
                    </span>
                  </div>
                  <div className="text-[10px] text-[#6b7280] mt-0.5">
                    {preset.fontSize}px
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              <p className="text-[10px] text-[#6b7280] mb-1">Tip</p>
              <p className="text-[11px] text-[#9ca3af]">
                Double-click any text on the canvas to edit it directly.
              </p>
            </div>
          </div>
        )}

        {/* Background */}
        {activeTab === "background" && (
          <div>
            <p className="text-xs text-[#6b7280] mb-3 font-medium uppercase tracking-wider">
              Background color
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {BG_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleSetBackground(color)}
                  className="aspect-square rounded-lg border-2 border-[#2a2a2a] hover:border-[#8b5cf6] transition-all hover:scale-110"
                  style={{ background: color }}
                  title={color}
                />
              ))}
            </div>
            <div>
              <p className="text-xs text-[#6b7280] mb-2 font-medium uppercase tracking-wider">
                Custom color
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded-lg border border-[#2a2a2a] cursor-pointer bg-transparent"
                  defaultValue="#ffffff"
                  onChange={(e) => handleSetBackground(e.target.value)}
                />
                <span className="text-xs text-[#6b7280]">Pick any color</span>
              </div>
            </div>
          </div>
        )}

        {/* Images */}
        {activeTab === "images" && (
          <div>
            <p className="text-xs text-[#6b7280] mb-3 font-medium uppercase tracking-wider">
              Add images
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-3 p-6 border-2 border-dashed border-[#2a2a2a] hover:border-[#8b5cf6] rounded-xl transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center group-hover:bg-[#8b5cf6]/10 transition-colors">
                <Image size={20} className="text-[#6b7280] group-hover:text-[#8b5cf6]" />
              </div>
              <div className="text-center">
                <p className="text-sm text-white font-medium">Upload image</p>
                <p className="text-xs text-[#6b7280] mt-1">PNG, JPG, GIF, SVG</p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              <p className="text-[10px] text-[#6b7280] mb-1">Supported formats</p>
              <p className="text-[11px] text-[#9ca3af]">
                PNG, JPG, GIF, WebP, and SVG files. Images can be resized and repositioned on the canvas.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
