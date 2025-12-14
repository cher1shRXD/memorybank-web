import { useEffect, useRef } from 'react';

interface UseGesturesProps {
  onZoom?: (delta: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  element: HTMLElement | null;
}

export function useGestures({ onZoom, onPan, element }: UseGesturesProps) {
  const lastDistanceRef = useRef(0);
  const lastTouchesRef = useRef<TouchList | null>(null);

  useEffect(() => {
    if (!element) return;

    let isPanning = false;
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      } else if (e.touches.length === 1) {
        // Pan with single finger
        isPanning = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      lastTouchesRef.current = e.touches;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchesRef.current?.length === 2 && onZoom) {
        // Calculate pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (lastDistanceRef.current > 0) {
          const delta = (distance - lastDistanceRef.current) * 0.01;
          onZoom(delta);
        }
        
        lastDistanceRef.current = distance;
        e.preventDefault();
      } else if (e.touches.length === 1 && isPanning && onPan) {
        // Pan
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        onPan(deltaX, deltaY);
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      lastTouchesRef.current = e.touches;
    };

    const handleTouchEnd = () => {
      isPanning = false;
      lastDistanceRef.current = 0;
      lastTouchesRef.current = null;
    };

    const handleWheel = (e: WheelEvent) => {
      if (onZoom && e.ctrlKey) {
        e.preventDefault();
        onZoom(-e.deltaY * 0.001);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('wheel', handleWheel);
    };
  }, [onZoom, onPan, element]);
}