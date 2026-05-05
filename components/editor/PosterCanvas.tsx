"use client";

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

export type PosterSize = "A4" | "A3";

// Canonical poster dimensions in pixels (at 72dpi for screen)
const POSTER_DIMS: Record<PosterSize, { width: number; height: number }> = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
};

// Max display height on screen
const MAX_DISPLAY_HEIGHT = 680;

export interface PosterCanvasHandle {
  addText: (text: string, options?: Record<string, unknown>) => void;
  setBackground: (color: string) => void;
  applyTemplate: (templateId: string) => void;
  deleteSelected: () => void;
  getDataURL: () => string;
  undo: () => void;
  redo: () => void;
  addImage: (dataUrl: string) => void;
}

interface PosterCanvasProps {
  size: PosterSize;
  onSelectionChange?: (hasSelection: boolean) => void;
}

const PosterCanvas = forwardRef<PosterCanvasHandle, PosterCanvasProps>(
  function PosterCanvas({ size, onSelectionChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fabricRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historyRef = useRef<any[][]>([[]]); // stack of JSON states
    const historyIndexRef = useRef(0);
    const skipHistoryRef = useRef(false);

    const dims = POSTER_DIMS[size];
    const scale = Math.min(MAX_DISPLAY_HEIGHT / dims.height, 1);
    const displayWidth = Math.round(dims.width * scale);
    const displayHeight = Math.round(dims.height * scale);

    // Save state to history
    const saveHistory = useCallback(() => {
      if (skipHistoryRef.current) return;
      const canvas = fabricRef.current;
      if (!canvas) return;
      const json = canvas.getObjects().map((obj: Record<string, unknown>) => canvas.getObjects().indexOf(obj));
      const fullJson = canvas.toJSON();
      // Trim future states
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(fullJson);
      historyIndexRef.current = historyRef.current.length - 1;
      void json; // suppress lint
    }, []);

    // Initialize fabric canvas
    useEffect(() => {
      let canvas: unknown;
      let mounted = true;

      async function init() {
        const fabricModule = await import("fabric");
        if (!mounted || !canvasElRef.current) return;

        // If a canvas already exists, dispose it
        if (fabricRef.current) {
          fabricRef.current.dispose();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Canvas, Rect } = fabricModule as any;

        canvas = new Canvas(canvasElRef.current, {
          width: displayWidth,
          height: displayHeight,
          backgroundColor: "#ffffff",
          selection: true,
        });

        fabricRef.current = canvas;

        // Add subtle page shadow rect as background marker
        const bgRect = new Rect({
          left: 0,
          top: 0,
          width: displayWidth,
          height: displayHeight,
          fill: "#ffffff",
          selectable: false,
          evented: false,
          excludeFromExport: false,
          name: "__background__",
        });
        (canvas as Record<string, unknown> & { add: (obj: unknown) => void }).add(bgRect);
        (canvas as Record<string, unknown> & { sendObjectToBack: (obj: unknown) => void }).sendObjectToBack(bgRect);
        (canvas as Record<string, unknown> & { renderAll: () => void }).renderAll();

        // Save initial history
        saveHistory();

        // Track selection
        (canvas as Record<string, unknown> & { on: (event: string, cb: () => void) => void }).on("selection:created", () => onSelectionChange?.(true));
        (canvas as Record<string, unknown> & { on: (event: string, cb: () => void) => void }).on("selection:cleared", () => onSelectionChange?.(false));
        (canvas as Record<string, unknown> & { on: (event: string, cb: () => void) => void }).on("object:modified", saveHistory);
        (canvas as Record<string, unknown> & { on: (event: string, cb: () => void) => void }).on("object:added", saveHistory);
        (canvas as Record<string, unknown> & { on: (event: string, cb: () => void) => void }).on("object:removed", saveHistory);
      }

      init();

      return () => {
        mounted = false;
        if (fabricRef.current) {
          fabricRef.current.dispose();
          fabricRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size]);

    // Keyboard delete
    useEffect(() => {
      function handleKeyDown(e: KeyboardEvent) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        if ((e.key === "Delete" || e.key === "Backspace") && fabricRef.current) {
          const canvas = fabricRef.current;
          const active = canvas.getActiveObjects();
          active.forEach((obj: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((obj as any).name !== "__background__") {
              canvas.remove(obj);
            }
          });
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useImperativeHandle(ref, () => ({
      addText(text: string, options = {}) {
        if (!fabricRef.current) return;
        import("fabric").then((fabricModule) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { FabricText } = fabricModule as any;
          const obj = new FabricText(text, {
            left: displayWidth / 2,
            top: displayHeight / 2,
            originX: "center",
            originY: "center",
            fontFamily: "Inter, sans-serif",
            fontSize: 32,
            fill: "#000000",
            ...options,
          });
          fabricRef.current.add(obj);
          fabricRef.current.setActiveObject(obj);
          fabricRef.current.renderAll();
        });
      },

      setBackground(color: string) {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        // Find and update background rect
        const bgObj = canvas.getObjects().find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (o: any) => o.name === "__background__"
        );
        if (bgObj) {
          bgObj.set("fill", color);
        }
        canvas.backgroundColor = color;
        canvas.renderAll();
        saveHistory();
      },

      applyTemplate(templateId: string) {
        if (!fabricRef.current) return;
        import("fabric").then((fabricModule) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { FabricText, Rect } = fabricModule as any;
          const canvas = fabricRef.current;
          const w = displayWidth;
          const h = displayHeight;

          // Clear non-background objects
          const objects = canvas.getObjects().filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (o: any) => o.name !== "__background__"
          );
          objects.forEach((o: unknown) => canvas.remove(o));

          const templates: Record<string, () => void> = {
            minimal_white: () => {
              canvas.backgroundColor = "#ffffff";
              const bgObj = canvas.getObjects().find((o: Record<string, unknown>) => o.name === "__background__");
              if (bgObj) bgObj.set("fill", "#ffffff");
              canvas.add(new FabricText("MINIMAL", {
                left: w / 2, top: h * 0.35, originX: "center", originY: "center",
                fontFamily: "Georgia, serif", fontSize: Math.round(w * 0.1),
                fill: "#111111", fontWeight: "bold", charSpacing: 300,
              }));
              canvas.add(new FabricText("A clean, simple aesthetic", {
                left: w / 2, top: h * 0.48, originX: "center", originY: "center",
                fontFamily: "Inter, sans-serif", fontSize: Math.round(w * 0.028),
                fill: "#666666", charSpacing: 100,
              }));
              const line = new Rect({ left: w * 0.25, top: h * 0.42, width: w * 0.5, height: 1.5, fill: "#cccccc", selectable: false });
              canvas.add(line);
            },

            bold_dark: () => {
              canvas.backgroundColor = "#0d0d0d";
              const bgObj = canvas.getObjects().find((o: Record<string, unknown>) => o.name === "__background__");
              if (bgObj) bgObj.set("fill", "#0d0d0d");
              canvas.add(new FabricText("BOLD", {
                left: w / 2, top: h * 0.38, originX: "center", originY: "center",
                fontFamily: "Impact, sans-serif", fontSize: Math.round(w * 0.14),
                fill: "#ffffff", charSpacing: 400,
              }));
              canvas.add(new FabricText("STATEMENT", {
                left: w / 2, top: h * 0.52, originX: "center", originY: "center",
                fontFamily: "Impact, sans-serif", fontSize: Math.round(w * 0.08),
                fill: "#8b5cf6", charSpacing: 200,
              }));
              canvas.add(new FabricText("Make an impact", {
                left: w / 2, top: h * 0.62, originX: "center", originY: "center",
                fontFamily: "Inter, sans-serif", fontSize: Math.round(w * 0.025),
                fill: "#6b7280",
              }));
            },

            sunset: () => {
              canvas.backgroundColor = "#ff6b6b";
              const bgObj = canvas.getObjects().find((o: Record<string, unknown>) => o.name === "__background__");
              if (bgObj) bgObj.set("fill", "#ff6b6b");
              // Gradient blocks
              const block1 = new Rect({ left: 0, top: h * 0.5, width: w, height: h * 0.5, fill: "#ff8e53", selectable: false });
              canvas.add(block1);
              canvas.sendObjectToBack(block1);
              canvas.add(new FabricText("GOLDEN", {
                left: w / 2, top: h * 0.32, originX: "center", originY: "center",
                fontFamily: "Georgia, serif", fontSize: Math.round(w * 0.11),
                fill: "#fff7ed", fontWeight: "bold",
              }));
              canvas.add(new FabricText("HOUR", {
                left: w / 2, top: h * 0.44, originX: "center", originY: "center",
                fontFamily: "Georgia, serif", fontSize: Math.round(w * 0.11),
                fill: "#fff7ed", fontWeight: "bold",
              }));
              canvas.add(new FabricText("Embrace the warmth", {
                left: w / 2, top: h * 0.6, originX: "center", originY: "center",
                fontFamily: "Inter, sans-serif", fontSize: Math.round(w * 0.03),
                fill: "#ffffffcc",
              }));
            },

            neon_night: () => {
              canvas.backgroundColor = "#050510";
              const bgObj = canvas.getObjects().find((o: Record<string, unknown>) => o.name === "__background__");
              if (bgObj) bgObj.set("fill", "#050510");
              canvas.add(new FabricText("NEON", {
                left: w / 2, top: h * 0.35, originX: "center", originY: "center",
                fontFamily: "Impact, sans-serif", fontSize: Math.round(w * 0.13),
                fill: "#00f5ff", charSpacing: 300,
              }));
              canvas.add(new FabricText("NIGHT", {
                left: w / 2, top: h * 0.47, originX: "center", originY: "center",
                fontFamily: "Impact, sans-serif", fontSize: Math.round(w * 0.13),
                fill: "#ff00ff", charSpacing: 300,
              }));
              canvas.add(new FabricText("Live the night", {
                left: w / 2, top: h * 0.6, originX: "center", originY: "center",
                fontFamily: "Inter, sans-serif", fontSize: Math.round(w * 0.028),
                fill: "#ffffff88",
              }));
            },

            pastel_dream: () => {
              canvas.backgroundColor = "#fce4ec";
              const bgObj = canvas.getObjects().find((o: Record<string, unknown>) => o.name === "__background__");
              if (bgObj) bgObj.set("fill", "#fce4ec");
              canvas.add(new FabricText("dream", {
                left: w / 2, top: h * 0.38, originX: "center", originY: "center",
                fontFamily: "Georgia, serif", fontSize: Math.round(w * 0.1),
                fill: "#880e4f", fontStyle: "italic",
              }));
              canvas.add(new FabricText("softly", {
                left: w / 2, top: h * 0.5, originX: "center", originY: "center",
                fontFamily: "Georgia, serif", fontSize: Math.round(w * 0.07),
                fill: "#c2185b", fontStyle: "italic",
              }));
              canvas.add(new FabricText("— a gentle reminder", {
                left: w / 2, top: h * 0.62, originX: "center", originY: "center",
                fontFamily: "Inter, sans-serif", fontSize: Math.round(w * 0.025),
                fill: "#ad1457",
              }));
            },

            editorial: () => {
              canvas.backgroundColor = "#f5f5f0";
              const bgObj = canvas.getObjects().find((o: Record<string, unknown>) => o.name === "__background__");
              if (bgObj) bgObj.set("fill", "#f5f5f0");
              const topBar = new Rect({ left: 0, top: 0, width: w, height: h * 0.08, fill: "#1a1a1a", selectable: false });
              canvas.add(topBar);
              canvas.add(new FabricText("EDITORIAL", {
                left: w / 2, top: h * 0.04, originX: "center", originY: "center",
                fontFamily: "Georgia, serif", fontSize: Math.round(w * 0.055),
                fill: "#ffffff", charSpacing: 400,
              }));
              const divider = new Rect({ left: w * 0.1, top: h * 0.12, width: w * 0.8, height: 2, fill: "#1a1a1a", selectable: false });
              canvas.add(divider);
              canvas.add(new FabricText("ISSUE 01", {
                left: w * 0.12, top: h * 0.165, originX: "left", originY: "center",
                fontFamily: "Inter, sans-serif", fontSize: Math.round(w * 0.025),
                fill: "#666666", charSpacing: 200,
              }));
              canvas.add(new FabricText("THE MAIN\nHEADLINE\nGOES HERE", {
                left: w * 0.1, top: h * 0.32, originX: "left", originY: "center",
                fontFamily: "Georgia, serif", fontSize: Math.round(w * 0.08),
                fill: "#111111", fontWeight: "bold", lineHeight: 1.1,
              }));
              canvas.add(new FabricText("A compelling subheading that\ngives more context.", {
                left: w * 0.1, top: h * 0.62, originX: "left", originY: "center",
                fontFamily: "Inter, sans-serif", fontSize: Math.round(w * 0.028),
                fill: "#444444", lineHeight: 1.5,
              }));
            },
          };

          const fn = templates[templateId];
          if (fn) fn();
          canvas.renderAll();
          saveHistory();
        });
      },

      deleteSelected() {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        const active = canvas.getActiveObjects();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        active.forEach((obj: any) => {
          if (obj.name !== "__background__") canvas.remove(obj);
        });
        canvas.discardActiveObject();
        canvas.renderAll();
      },

      getDataURL() {
        if (!fabricRef.current) return "";
        return fabricRef.current.toDataURL({ format: "png", multiplier: 1 });
      },

      undo() {
        if (historyIndexRef.current <= 0) return;
        historyIndexRef.current--;
        const state = historyRef.current[historyIndexRef.current];
        if (!state || !fabricRef.current) return;
        skipHistoryRef.current = true;
        fabricRef.current.loadFromJSON(state, () => {
          fabricRef.current.renderAll();
          skipHistoryRef.current = false;
        });
      },

      redo() {
        if (historyIndexRef.current >= historyRef.current.length - 1) return;
        historyIndexRef.current++;
        const state = historyRef.current[historyIndexRef.current];
        if (!state || !fabricRef.current) return;
        skipHistoryRef.current = true;
        fabricRef.current.loadFromJSON(state, () => {
          fabricRef.current.renderAll();
          skipHistoryRef.current = false;
        });
      },

      addImage(dataUrl: string) {
        if (!fabricRef.current) return;
        import("fabric").then((fabricModule) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { FabricImage } = fabricModule as any;
          FabricImage.fromURL(dataUrl).then((img: unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const image = img as any;
            const maxW = displayWidth * 0.6;
            const maxH = displayHeight * 0.6;
            const scale = Math.min(maxW / image.width, maxH / image.height, 1);
            image.set({
              left: displayWidth / 2,
              top: displayHeight / 2,
              originX: "center",
              originY: "center",
              scaleX: scale,
              scaleY: scale,
            });
            fabricRef.current.add(image);
            fabricRef.current.setActiveObject(image);
            fabricRef.current.renderAll();
          });
        });
      },
    }));

    return (
      <div
        ref={containerRef}
        className="canvas-wrapper"
        style={{
          width: displayWidth,
          height: displayHeight,
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <canvas ref={canvasElRef} />
      </div>
    );
  }
);

PosterCanvas.displayName = "PosterCanvas";

export default PosterCanvas;
