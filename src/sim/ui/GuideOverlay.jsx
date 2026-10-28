import { useEffect, useRef, useState } from 'react';

// Highlights the registered target element. Pointer events pass straight through, so the
// learner can still click anything (wrong clicks are explained by the guide, never blocked).
export default function GuideOverlay({ registry, targetId, fallbackId, replayNonce, active }) {
  const hostRef = useRef(null);
  const [box, setBox] = useState(null);
  const [version, setVersion] = useState(0);
  const lastBox = useRef(null);
  const lastScrolled = useRef(null);

  useEffect(() => registry.subscribe(() => setVersion((v) => v + 1)), [registry]);

  useEffect(() => {
    if (!active || !targetId) { lastBox.current = null; setBox(null); return undefined; }
    let raf = 0;
    const tick = () => {
      const el = registry.get(targetId) ?? (fallbackId ? registry.get(fallbackId) : null);
      const host = hostRef.current;
      let next = null;
      if (el && host && el.isConnected && el.getClientRects().length) {
        const r = el.getBoundingClientRect();
        const h = host.getBoundingClientRect();
        next = { x: r.left - h.left, y: r.top - h.top, w: r.width, h: r.height, hw: h.width, hh: h.height };
        if (lastScrolled.current !== el) { lastScrolled.current = el; el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }); }
      }
      const prev = lastBox.current;
      const same = (!prev && !next) || (prev && next && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h && prev.hw === next.hw);
      if (!same) { lastBox.current = next; setBox(next); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [registry, targetId, fallbackId, active, version]);

  const pad = 4;
  if (!box || !active) return <div className="guide-overlay" ref={hostRef} aria-hidden="true" />;
  const below = box.y + box.h + 34 < box.hh; // place the pointer cue where there is room
  return (
    <div className="guide-overlay" ref={hostRef} aria-hidden="true">
      <div key={replayNonce} className="guide-ring" style={{ left: box.x - pad, top: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2 }} />
      <div className={`guide-pointer ${below ? 'is-below' : 'is-above'}`}
        style={{ left: Math.min(Math.max(box.x + box.w / 2 - 8, 4), box.hw - 20), top: below ? box.y + box.h + pad + 4 : box.y - pad - 20 }} />
    </div>
  );
}
