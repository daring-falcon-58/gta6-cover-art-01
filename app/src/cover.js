// cover.js: renderCover draws the whole cover — panels, grade, effects and
// the bold caption lettering — onto any canvas at that canvas's own size.

import { layoutPanels } from './layouts.js';
import { drawPhotoCover, drawPlaceholderPanel } from './photos.js';
import {
  applySunsetGrade, applyNeonGlow, applyGrain, applyVignette, applyHalftone,
} from './grades.js';

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

/** The export sizes the editor offers, in menu order. */
export const EXPORT_SIZES = [
  { id: '1920x1080', label: '1920 x 1080 (wide)' },
  { id: '1080x1080', label: '1080 x 1080 (square)' },
  { id: '1080x1350', label: '1080 x 1350 (portrait)' },
];

/** Width/height for a size id. */
export function sizeOf(sizeId) {
  return SIZES[sizeId] || SIZES['1920x1080'];
}

/** Fits a font size so `text` fits `maxWidth` on `ctx` with `fontFor(size)`. */
export function fitFontSize(ctx, text, maxWidth, start, fontFor) {
  let size = start;
  ctx.font = fontFor(size);
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = fontFor(size);
  }
  return size;
}

/** Draws the title + subtitle lettering over the cover. */
export function renderCaption(ctx, w, h, state) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  if (!title && !subtitle) return;
  const atTop = state.captionPos === 'top';
  const bandH = h * (title && subtitle ? 0.26 : 0.19);
  const bandY = atTop ? 0 : h - bandH;
  // soft dark band so the lettering reads over any photo
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (atTop) {
    band.addColorStop(0, 'rgba(12, 4, 24, 0.72)');
    band.addColorStop(1, 'rgba(12, 4, 24, 0)');
  } else {
    band.addColorStop(0, 'rgba(12, 4, 24, 0)');
    band.addColorStop(1, 'rgba(12, 4, 24, 0.72)');
  }
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);

  const cx = w / 2;
  const titleY = atTop ? bandY + bandH * 0.62 : h - h * 0.075 - (subtitle ? h * 0.058 : 0);
  const subY = atTop ? bandY + bandH * 0.88 : h - h * 0.038;
  if (title) {
    const size = fitFontSize(
      ctx, title, w * 0.92, h * 0.115,
      (s) => `900 ${s}px Anton, 'Arial Narrow', sans-serif`,
    );
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = `${Math.round(size * 0.02)}px`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(16, 4, 28, 0.95)';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeText(title, cx, titleY);
    if (state.lettering === 'neon') {
      ctx.shadowColor = '#ff2d95';
      ctx.shadowBlur = size * 0.35;
      ctx.fillStyle = '#ff5db1';
    } else if (state.lettering === 'white') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = size * 0.12;
      ctx.fillStyle = '#ffffff';
    } else {
      // sunset gradient fill: orange -> pink -> white
      const grad = ctx.createLinearGradient(0, titleY - size * 0.5, 0, titleY + size * 0.5);
      grad.addColorStop(0, '#ffe9b0');
      grad.addColorStop(0.45, '#ff8a3d');
      grad.addColorStop(0.75, '#ff2d95');
      grad.addColorStop(1, '#ffffff');
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = size * 0.14;
      ctx.fillStyle = grad;
    }
    ctx.fillText(title, cx, titleY);
    ctx.shadowBlur = 0;
    if (typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = '0px';
  }
  if (subtitle) {
    const size = fitFontSize(
      ctx, subtitle, w * 0.8, h * 0.052,
      (s) => `${s}px Pacifico, cursive`,
    );
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = state.neon ? '#00e5ff' : 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = state.neon ? size * 0.5 : size * 0.15;
    ctx.fillStyle = state.neon ? '#b8f6ff' : '#ffe9b0';
    ctx.fillText(subtitle, cx, subY);
    ctx.shadowBlur = 0;
  }
}

/**
 * Renders the cover for `state` onto `canvas` at the canvas's own size.
 * opts.highlight: panel index to outline (editor preview only, never exported).
 */
export function renderCover(canvas, state, opts) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const highlight = opts && typeof opts.highlight === 'number' ? opts.highlight : -1;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);

  const rects = layoutPanels(state.layout, w, h);
  rects.forEach((r, i) => {
    const panel = (state.panels && state.panels[i]) || { photo: 0, zoom: 1, ox: 0, oy: 0, fit: 'fill' };
    const img = state.photos ? state.photos[panel.photo] : null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    if (img) drawPhotoCover(ctx, img, r, panel);
    else drawPlaceholderPanel(ctx, r, i);
    ctx.restore();
    // thin white poster frame around each panel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    if (i === highlight) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.008);
      ctx.strokeRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
    }
  });

  applySunsetGrade(ctx, w, h, state.grade);
  applyNeonGlow(ctx, w, h, state.neon);
  applyHalftone(ctx, w, h, state.halftone);
  applyVignette(ctx, w, h, state.vignette);
  applyGrain(ctx, w, h, state.grain);
  renderCaption(ctx, w, h, state);
  ctx.restore();
}
