// grades.js: the Vice City colour grades and poster effects, all Canvas 2D.
// applySunsetGrade tints the whole cover; applyNeonGlow, applyGrain,
// applyVignette and applyHalftone add the print-poster finish.

/** The grades the editor offers: id, label, and the overlay stops it paints. */
export const GRADES = [
  { id: 'sunset', label: 'Vice Sunset' },
  { id: 'neon', label: 'Neon Night' },
  { id: 'golden', label: 'Golden Hour' },
  { id: 'noir', label: 'Noir Pink' },
];

function overlayGradient(ctx, w, h, stops, mode, alpha) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [pos, colour] of stops) g.addColorStop(pos, colour);
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Paints the selected grade over the finished panels: magenta/orange/teal washes. */
export function applySunsetGrade(ctx, w, h, grade) {
  if (grade === 'neon') {
    overlayGradient(ctx, w, h, [
      [0, 'rgba(20, 8, 60, 0.55)'],
      [0.5, 'rgba(255, 45, 149, 0.20)'],
      [1, 'rgba(0, 229, 255, 0.28)'],
    ], 'overlay', 0.9);
    overlayGradient(ctx, w, h, [
      [0, 'rgba(0, 0, 0, 0)'],
      [1, 'rgba(255, 45, 149, 0.35)'],
    ], 'soft-light', 1);
  } else if (grade === 'golden') {
    overlayGradient(ctx, w, h, [
      [0, 'rgba(255, 190, 90, 0.10)'],
      [0.6, 'rgba(255, 140, 60, 0.30)'],
      [1, 'rgba(200, 60, 40, 0.35)'],
    ], 'soft-light', 1);
    overlayGradient(ctx, w, h, [
      [0, 'rgba(255, 220, 140, 0.25)'],
      [1, 'rgba(255, 220, 140, 0)'],
    ], 'screen', 0.6);
  } else if (grade === 'noir') {
    overlayGradient(ctx, w, h, [
      [0, 'rgba(10, 10, 26, 0.5)'],
      [0.55, 'rgba(255, 45, 149, 0.22)'],
      [1, 'rgba(10, 10, 26, 0.55)'],
    ], 'overlay', 0.9);
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  } else {
    // sunset (default): purple sky wash, magenta mid, orange foot
    overlayGradient(ctx, w, h, [
      [0, 'rgba(58, 21, 96, 0.45)'],
      [0.45, 'rgba(194, 45, 114, 0.22)'],
      [1, 'rgba(255, 154, 77, 0.30)'],
    ], 'overlay', 0.9);
    overlayGradient(ctx, w, h, [
      [0, 'rgba(255, 120, 80, 0)'],
      [1, 'rgba(255, 90, 120, 0.30)'],
    ], 'soft-light', 1);
  }
}

/** A soft pink/teal edge glow, for the neon look. */
export function applyNeonGlow(ctx, w, h, on) {
  if (!on) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.22);
  top.addColorStop(0, 'rgba(255, 45, 149, 0.35)');
  top.addColorStop(1, 'rgba(255, 45, 149, 0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.22);
  const bottom = ctx.createLinearGradient(0, h * 0.78, 0, h);
  bottom.addColorStop(0, 'rgba(0, 229, 255, 0)');
  bottom.addColorStop(1, 'rgba(0, 229, 255, 0.32)');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  ctx.restore();
}

let noiseCanvas = null;
/** Deterministic film grain from a seeded pattern (same grain every render). */
export function applyGrain(ctx, w, h, on) {
  if (!on) return;
  if (!noiseCanvas) {
    noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 256;
    noiseCanvas.height = 256;
    const nctx = noiseCanvas.getContext('2d');
    const data = nctx.createImageData(256, 256);
    let seed = 1234567;
    const next = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.floor(next() * 255);
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 28;
    }
    nctx.putImageData(data, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = 0.5;
  const pattern = ctx.createPattern(noiseCanvas, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Darkens the corners so the centre pops, like a printed poster. */
export function applyVignette(ctx, w, h, on) {
  if (!on) return;
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(10, 4, 20, 0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Halftone dots in the two top corners, the print-poster signature. */
export function applyHalftone(ctx, w, h, on) {
  if (!on) return;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  const step = Math.max(10, w * 0.012);
  for (const corner of [{ x: 0, y: 0 }, { x: w, y: 0 }]) {
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7 - row; col++) {
        const px = corner.x === 0
          ? corner.x + col * step + step / 2
          : corner.x - col * step - step / 2;
        const py = corner.y + row * step + step / 2;
        const r = Math.max(1, (7 - row) * step * 0.09);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}
