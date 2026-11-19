// photos.js: loading photos from the machine and drawing one into a panel
// with crop / position (cover or contain, zoom, pan offsets). Photos are
// read with FileReader / object URLs and never leave the machine.

/** Loads an image from a URL (object URL or a file under app/), resolving once drawable. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image'));
    img.src = url;
  });
}

/** Reads a File into an image via FileReader (no upload, local only). */
export function loadFileImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      loadImage(reader.result).then(resolve, reject);
    };
    reader.onerror = () => reject(new Error('could not read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Draws `img` into rect `r` on `ctx`.
 * fit 'fill' crops to cover the rect (zoom + ox/oy pan, offsets in rect fractions);
 * fit 'fit' contains the whole photo, letterboxed on the panel colour.
 */
export function drawPhotoCover(ctx, img, r, opts) {
  const { zoom = 1, ox = 0, oy = 0, fit = 'fill' } = opts || {};
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (fit === 'fit') {
    const s = Math.min(r.w / iw, r.h / ih) * zoom;
    const dw = iw * s;
    const dh = ih * s;
    ctx.drawImage(img, r.x + (r.w - dw) / 2 + ox * r.w, r.y + (r.h - dh) / 2 + oy * r.h, dw, dh);
    return;
  }
  const s = Math.max(r.w / iw, r.h / ih) * zoom;
  const dw = iw * s;
  const dh = ih * s;
  ctx.drawImage(img, r.x + (r.w - dw) / 2 + ox * r.w, r.y + (r.h - dh) / 2 + oy * r.h, dw, dh);
}

/** A placeholder panel: dusk gradient + sun + palms, drawn when no photo is set. */
export function drawPlaceholderPanel(ctx, r, seed) {
  const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  g.addColorStop(0, '#3a1560');
  g.addColorStop(0.55, '#c22d72');
  g.addColorStop(1, '#ff9a4d');
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const cx = r.x + r.w * (0.3 + 0.4 * ((seed % 3) / 2));
  const cy = r.y + r.h * 0.42;
  const rad = Math.min(r.w, r.h) * 0.16;
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(20, 8, 32, 0.9)';
  ctx.fillRect(r.x, r.y + r.h * 0.72, r.w, r.h * 0.28);
  ctx.strokeStyle = 'rgba(20, 8, 32, 0.9)';
  ctx.lineWidth = Math.max(2, r.w * 0.01);
  ctx.beginPath();
  ctx.moveTo(r.x + r.w * 0.12, r.y + r.h * 0.74);
  ctx.lineTo(r.x + r.w * 0.22, r.y + r.h * 0.5);
  ctx.moveTo(r.x + r.w * 0.88, r.y + r.h * 0.74);
  ctx.lineTo(r.x + r.w * 0.78, r.y + r.h * 0.52);
  ctx.stroke();
}
