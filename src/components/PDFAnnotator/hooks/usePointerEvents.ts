import { useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';

interface UsePointerEventsProps {
  canvas: Canvas | null;
  tool: { type: string; width: number; color: string };
}

export function usePointerEvents({ canvas, tool }: UsePointerEventsProps) {
  const isPenDrawingRef = useRef(false);
  const lastPressureRef = useRef(0);

  useEffect(() => {
    if (!canvas) return;

    const canvasElement = canvas.getElement();
    let points: Array<{ x: number; y: number; pressure: number }> = [];

    const handlePointerDown = (e: PointerEvent) => {
      // Only respond to pen/stylus or mouse
      if (e.pointerType === 'touch') return;
      
      isPenDrawingRef.current = true;
      const pointer = canvas.getPointer(e);
      points = [{ x: pointer.x, y: pointer.y, pressure: e.pressure || 0.5 }];
      lastPressureRef.current = e.pressure || 0.5;

      if (tool.type === 'pen' || tool.type === 'highlighter') {
        canvas.isDrawingMode = true;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPenDrawingRef.current) return;
      
      const pointer = canvas.getPointer(e);
      const pressure = e.pressure || lastPressureRef.current;
      points.push({ x: pointer.x, y: pointer.y, pressure });

      // Dynamically adjust brush width based on pressure
      if (canvas.freeDrawingBrush && (e.pressure > 0)) {
        const baseWidth = tool.width;
        const pressureWidth = baseWidth * (0.5 + pressure * 0.5);
        canvas.freeDrawingBrush.width = pressureWidth;
      }
    };

    const handlePointerUp = () => {
      isPenDrawingRef.current = false;
      points = [];
      
      // Reset brush width
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = tool.width;
      }
    };

    // Prevent default touch behaviors
    const preventTouch = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
      }
    };

    canvasElement.addEventListener('pointerdown', handlePointerDown);
    canvasElement.addEventListener('pointermove', handlePointerMove);
    canvasElement.addEventListener('pointerup', handlePointerUp);
    canvasElement.addEventListener('pointercancel', handlePointerUp);
    canvasElement.addEventListener('touchstart', preventTouch, { passive: false });
    canvasElement.addEventListener('touchmove', preventTouch, { passive: false });

    return () => {
      canvasElement.removeEventListener('pointerdown', handlePointerDown);
      canvasElement.removeEventListener('pointermove', handlePointerMove);
      canvasElement.removeEventListener('pointerup', handlePointerUp);
      canvasElement.removeEventListener('pointercancel', handlePointerUp);
      canvasElement.removeEventListener('touchstart', preventTouch);
      canvasElement.removeEventListener('touchmove', preventTouch);
    };
  }, [canvas, tool]);

}