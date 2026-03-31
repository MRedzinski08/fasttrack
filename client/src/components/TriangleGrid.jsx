import { useEffect, useRef } from 'react';

export default function TriangleGrid({ className, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Build row Y positions with perspective compression
      // Rows get closer together near the top (horizon)
      const rowCount = 30;
      const yPositions = [];
      for (let i = 0; i <= rowCount; i++) {
        // i=0 is bottom (viewer), i=rowCount is top (horizon)
        const t = i / rowCount;
        // Perspective: exponential compression toward top
        const y = h * (1 - Math.pow(t, 0.5));
        yPositions.push(y);
      }

      // Draw tessellated triangles between each pair of rows
      for (let row = 0; row < rowCount; row++) {
        const yBottom = yPositions[row];
        const yTop = yPositions[row + 1];
        const rowH = yBottom - yTop;

        // Progress: 1 at bottom, 0 at top
        const progress = yBottom / h;
        const alpha = Math.pow(progress, 1.2) * 0.85;
        const lw = Math.max(0.3, 1.2 * progress);

        // Triangle width scales with row height to maintain proportions
        const triW = rowH * 3.75; // wide obtuse triangles
        const halfW = triW / 2;
        const cols = Math.ceil(w / halfW) + 4;

        ctx.strokeStyle = `rgba(255, 170, 0, ${alpha})`;
        ctx.lineWidth = lw;

        for (let col = -3; col < cols; col++) {
          const x = col * halfW;

          ctx.beginPath();
          if (col % 2 === 0) {
            // Upward triangle
            ctx.moveTo(x, yBottom);
            ctx.lineTo(x + halfW, yTop);
            ctx.lineTo(x + triW, yBottom);
          } else {
            // Downward triangle
            ctx.moveTo(x, yTop);
            ctx.lineTo(x + halfW, yBottom);
            ctx.lineTo(x + triW, yTop);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(canvas.parentElement || canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={style}
    />
  );
}
