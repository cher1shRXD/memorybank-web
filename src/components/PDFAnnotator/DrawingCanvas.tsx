import { useEffect, useRef, useState } from "react";
import { Canvas, PencilBrush } from "fabric";
import type { DrawingTool } from "./types";

interface DrawingCanvasProps {
  width: number;
  height: number;
  tool: DrawingTool;
  pageNumber: number;
  scale: number;
  onCanvasReady: (canvas: Canvas) => void;
  readOnly?: boolean;
}

export default function DrawingCanvas({
  width,
  height,
  tool,
  pageNumber,
  scale,
  onCanvasReady,
  readOnly = false,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new Canvas(canvasRef.current, {
      isDrawingMode: !readOnly && tool.type !== "select",
      selection: tool.type === "select",
      width: width * scale,
      height: height * scale,
    });

    fabricCanvas.setZoom(scale);
    setCanvas(fabricCanvas);
    onCanvasReady(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, [width, height, scale, pageNumber]);

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
          result[3],
          16
        )}`
      : "0, 0, 0";
  };

  useEffect(() => {
    if (!canvas) return;

    // Use Canvas methods to update properties
    canvas.set({
      isDrawingMode: !readOnly && tool.type !== "select",
      selection: tool.type === "select"
    });

    if (tool.type === "pen" || tool.type === "highlighter") {
      const brush = new PencilBrush(canvas);
      brush.color =
        tool.type === "highlighter"
          ? `rgba(${hexToRgb(tool.color)}, ${tool.opacity * 0.3})`
          : tool.color;
      brush.width = tool.width;
      canvas.set({ freeDrawingBrush: brush });
    } else if (tool.type === "eraser") {
      // Use white pen as eraser for now (fabric.js v6 doesn't have EraserBrush)
      const eraserBrush = new PencilBrush(canvas);
      eraserBrush.color = "#FFFFFF";
      eraserBrush.width = tool.width * 2;
      canvas.set({ freeDrawingBrush: eraserBrush });
    }

    // Force re-render of canvas
    canvas.renderAll();
  }, [canvas, tool, readOnly]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 touch-none"
      style={{
        pointerEvents: readOnly ? "none" : "auto",
        cursor:
          tool.type === "pen"
            ? "crosshair"
            : tool.type === "eraser"
            ? "grab"
            : tool.type === "select"
            ? "default"
            : "crosshair",
      }}
    />
  );
}
