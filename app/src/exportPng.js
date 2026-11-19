// exportPng.js: renders the cover at the exact selected post size and
// downloads it as a PNG. The export canvas is off-screen; nothing is
// uploaded, the PNG is written by the browser from the canvas itself.

import { renderCover, sizeOf } from './cover.js';

/** Renders the cover at the exact export size and resolves with the PNG blob. */
export function exportPng(state) {
  const [w, h] = sizeOf(state.size);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  renderCover(canvas, state);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('export failed'));
    }, 'image/png');
  });
}

/** Exports and downloads `cover-<size>.png`, reporting the result in `status`. */
export async function downloadExport(state, status) {
  try {
    const blob = await exportPng(state);
    const [w, h] = sizeOf(state.size);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-${w}x${h}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    if (status) status.textContent = `Saved cover-${w}x${h}.png — ${w} x ${h}, PNG.`;
    return true;
  } catch (err) {
    if (status) status.textContent = `Export failed: ${err.message}`;
    return false;
  }
}
