'use client';

import { useEffect, useRef } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function CursorRipple() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const rippleIdRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const ripple: Ripple = {
        id: rippleIdRef.current++,
        x: e.clientX,
        y: e.clientY,
      };

      ripplesRef.current.push(ripple);

      const rippleElement = document.createElement('div');
      rippleElement.className = 'ripple';
      rippleElement.style.left = `${ripple.x}px`;
      rippleElement.style.top = `${ripple.y}px`;
      rippleElement.id = `ripple-${ripple.id}`;

      container.appendChild(rippleElement);

      // Remove ripple after animation completes
      setTimeout(() => {
        rippleElement.remove();
        ripplesRef.current = ripplesRef.current.filter((r) => r.id !== ripple.id);
      }, 800);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
    />
  );
}
