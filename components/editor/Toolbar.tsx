"use client";

import Link from "next/link";
import { Undo2, Redo2, Download, CreditCard, Trash2, ChevronDown } from "lucide-react";
import type { PosterSize, PosterCanvasHandle } from "./PosterCanvas";
import { useState, useRef, useEffect } from "react";

interface ToolbarProps {
  size: PosterSize;
  onSizeChange: (size: PosterSize) => void;
  canvasRef: React.RefObject<PosterCanvasHandle | null>;
  onBuyAndDownload: () => void;
  isProcessing: boolean;
}

export default function Toolbar({
  size,
  onSizeChange,
  canvasRef,
  onBuyAndDownload,
  isProcessing,
}: ToolbarProps) {
  const [sizeOpen, setSizeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSizeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handlePreviewDownload() {
    const dataUrl = canvasRef.current?.getDataURL();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `wallify-preview-${size.toLowerCase()}.png`;
    a.click();
  }

  return (
    <header
      className="flex items-center justify-between px-4 border-b border-[#2a2a2a] bg-[#0d0d0d] shrink-0"
      style={{ height: 56 }}
    >
      {/* Left: Logo + Size selector */}
      <div className="flex items-center gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Wall<span className="text-[#8b5cf6]">ify</span>
        </Link>

        <div className="w-px h-5 bg-[#2a2a2a]" />

        {/* Size dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setSizeOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-lg text-sm text-white transition-colors"
          >
            <span className="font-medium">{size}</span>
            <span className="text-[#6b7280] text-xs">
              {size === "A4" ? "210×297mm" : "297×420mm"}
            </span>
            <ChevronDown size={12} className="text-[#6b7280]" />
          </button>
          {sizeOpen && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50 overflow-hidden">
              {(["A4", "A3"] as PosterSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { onSizeChange(s); setSizeOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-[#222222] transition-colors ${
                    s === size ? "text-[#8b5cf6]" : "text-white"
                  }`}
                >
                  <span className="font-medium">{s}</span>
                  <span className="text-[#6b7280] text-xs">
                    {s === "A4" ? "210×297mm" : "297×420mm"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-[#2a2a2a]" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => canvasRef.current?.undo()}
            title="Undo"
            className="p-2 rounded-lg hover:bg-[#1a1a1a] text-[#6b7280] hover:text-white transition-colors"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={() => canvasRef.current?.redo()}
            title="Redo"
            className="p-2 rounded-lg hover:bg-[#1a1a1a] text-[#6b7280] hover:text-white transition-colors"
          >
            <Redo2 size={16} />
          </button>
        </div>

        <div className="w-px h-5 bg-[#2a2a2a]" />

        {/* Delete selected */}
        <button
          onClick={() => canvasRef.current?.deleteSelected()}
          title="Delete selected"
          className="p-2 rounded-lg hover:bg-[#1a1a1a] text-[#6b7280] hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Right: Download actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePreviewDownload}
          className="flex items-center gap-2 px-4 py-2 border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-lg text-sm text-[#6b7280] hover:text-white transition-colors"
        >
          <Download size={14} />
          <span>Preview PNG</span>
          <span className="text-[10px] text-[#8b5cf6] font-medium bg-[#8b5cf6]/10 px-1.5 py-0.5 rounded">FREE</span>
        </button>

        <button
          onClick={onBuyAndDownload}
          disabled={isProcessing}
          className="flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#8b5cf6]/20"
        >
          <CreditCard size={14} />
          <span>{isProcessing ? "Processing…" : "Buy & Download PDF"}</span>
          <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">€5</span>
        </button>
      </div>
    </header>
  );
}
