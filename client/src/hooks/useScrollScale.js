import { useEffect, useRef } from 'react';

export function useScrollScale(minScale = 0.92, threshold = 400) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId;

    function update() {
      const children = el.querySelectorAll('[data-scroll-scale]');
      const viewCenter = window.innerHeight / 2;

      children.forEach((child) => {
        const rect = child.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const distance = Math.abs(viewCenter - elCenter);
        const scale = Math.max(minScale, 1 - (distance / threshold) * (1 - minScale));
        const opacity = Math.max(0.6, 1 - (distance / threshold) * 0.4);
        child.style.transform = `scale(${scale})`;
        child.style.opacity = opacity;
      });

      rafId = requestAnimationFrame(update);
    }

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [minScale, threshold]);

  return ref;
}
