// main.js: wires the Neon Coast Cover Studio editor — photo uploads, panel
// picking (click a panel, drag to pan, zoom slider), caption, grade, size and
// one-click PNG export. All state lives in `state`; every change re-renders
// the live preview canvas. Photos never leave the machine.

import { renderCover, sizeOf, EXPORT_SIZES } from './cover.js';
import { LAYOUTS, layoutPanels, panelCount } from './layouts.js';
import { GRADES } from './grades.js';
import { loadImage, loadFileImage } from './photos.js';
import { downloadExport } from './exportPng.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');

/** The editor state: photos, one crop setting per panel, caption, grade, size. */
export const state = {
  layout: 'hero',
  size: '1920x1080',
  grade: 'sunset',
  neon: true,
  grain: true,
  vignette: true,
  halftone: true,
  title: 'NEON COAST',
  subtitle: 'vice city nights',
  captionPos: 'bottom',
  lettering: 'sunset',
  photos: [null, null, null],
  panels: [
    { photo: 0, zoom: 1, ox: 0, oy: 0, fit: 'fill' },
    { photo: 1, zoom: 1, ox: 0, oy: 0, fit: 'fill' },
    { photo: 2, zoom: 1, ox: 0, oy: 0, fit: 'fill' },
    { photo: 0, zoom: 1, ox: 0, oy: 0, fit: 'fill' },
  ],
  selectedPanel: 0,
};

function panelState(i) {
  return state.panels[i] || state.panels[0];
}

function redraw() {
  const [w, h] = sizeOf(state.size);
  canvas.width = w;
  canvas.height = h;
  renderCover(canvas, state, { highlight: state.selectedPanel });
  document.getElementById('panelLabel').textContent =
    `Panel ${state.selectedPanel + 1} of ${panelCount(state.layout)}`;
}

/** Loads the sample photos (original art drawn for this app) into slots 1-2. */
export async function loadSamplePhotos() {
  const [a, b] = await Promise.all([
    loadImage('samples/boulevard.png'),
    loadImage('samples/neon.png'),
  ]);
  state.photos[0] = a;
  state.photos[1] = b;
  state.panels[1].photo = 1;
  state.panels[2].photo = 1;
  redraw();
}

function bind(id, event, fn) {
  document.getElementById(id).addEventListener(event, fn);
}

// --- photos: three upload slots + sample button ---
[0, 1, 2].forEach((slot) => {
  bind(`photo${slot + 1}`, 'change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      state.photos[slot] = await loadFileImage(file);
      document.getElementById(`photo${slot + 1}Name`).textContent = file.name;
      status.textContent = `Photo ${slot + 1} loaded: ${file.name} (stays on your machine).`;
      redraw();
    } catch (err) {
      status.textContent = `Could not load that file: ${err.message}`;
    }
  });
});
bind('loadSamples', 'click', async () => {
  status.textContent = 'Loading sample photos…';
  await loadSamplePhotos();
  status.textContent = 'Sample photos loaded: sunset boulevard + neon street.';
});

// --- layout ---
const layoutSelect = document.getElementById('layout');
LAYOUTS.forEach((l) => {
  const o = document.createElement('option');
  o.value = l.id;
  o.textContent = l.label;
  layoutSelect.appendChild(o);
});
layoutSelect.value = state.layout;
bind('layout', 'change', (e) => {
  state.layout = e.target.value;
  state.selectedPanel = 0;
  redraw();
});

// --- per-panel editing: click to pick, drag to pan ---
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}
function panelAt(x, y) {
  return layoutPanels(state.layout, canvas.width, canvas.height)
    .findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = panelAt(p.x, p.y);
  if (i < 0) return;
  state.selectedPanel = i;
  drag = { x: p.x, y: p.y, ox: panelState(i).ox, oy: panelState(i).oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const r = layoutPanels(state.layout, canvas.width, canvas.height)[state.selectedPanel];
  const panel = panelState(state.selectedPanel);
  panel.ox = drag.ox + (p.x - drag.x) / r.w;
  panel.oy = drag.oy + (p.y - drag.y) / r.h;
  panel.ox = Math.max(-0.6, Math.min(0.6, panel.ox));
  panel.oy = Math.max(-0.6, Math.min(0.6, panel.oy));
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

function syncPanelControls() {
  const panel = panelState(state.selectedPanel);
  document.getElementById('panelPhoto').value = String(panel.photo);
  document.getElementById('zoom').value = String(panel.zoom);
  document.getElementById('zoomValue').textContent = `${Math.round(panel.zoom * 100)}%`;
  document.getElementById('fitFill').value = panel.fit;
}
const panelPhoto = document.getElementById('panelPhoto');
[0, 1, 2].forEach((slot) => {
  const o = document.createElement('option');
  o.value = String(slot);
  o.textContent = `Photo ${slot + 1}`;
  panelPhoto.appendChild(o);
});
bind('panelPhoto', 'change', (e) => {
  panelState(state.selectedPanel).photo = Number(e.target.value);
  redraw();
});
bind('zoom', 'input', (e) => {
  panelState(state.selectedPanel).zoom = Number(e.target.value);
  syncPanelControls();
  redraw();
});
bind('fitFill', 'change', (e) => {
  panelState(state.selectedPanel).fit = e.target.value;
  redraw();
});
bind('resetPanel', 'click', () => {
  Object.assign(panelState(state.selectedPanel), { zoom: 1, ox: 0, oy: 0, fit: 'fill' });
  syncPanelControls();
  redraw();
});

// --- caption ---
bind('title', 'input', (e) => { state.title = e.target.value; redraw(); });
bind('subtitle', 'input', (e) => { state.subtitle = e.target.value; redraw(); });
bind('captionPos', 'change', (e) => { state.captionPos = e.target.value; redraw(); });
bind('lettering', 'change', (e) => { state.lettering = e.target.value; redraw(); });

// --- grade & effects ---
const gradeSelect = document.getElementById('grade');
GRADES.forEach((g) => {
  const o = document.createElement('option');
  o.value = g.id;
  o.textContent = g.label;
  gradeSelect.appendChild(o);
});
gradeSelect.value = state.grade;
bind('grade', 'change', (e) => { state.grade = e.target.value; redraw(); });
['neon', 'grain', 'vignette', 'halftone'].forEach((key) => {
  bind(key, 'change', (e) => { state[key] = e.target.checked; redraw(); });
});

// --- size & export ---
const sizeSelect = document.getElementById('size');
EXPORT_SIZES.forEach((s) => {
  const o = document.createElement('option');
  o.value = s.id;
  o.textContent = s.label;
  sizeSelect.appendChild(o);
});
sizeSelect.value = state.size;
bind('size', 'change', (e) => { state.size = e.target.value; redraw(); });
bind('export', 'click', () => downloadExport(state, status));

// --- shot scenes for screenshots ---
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, {
    loadSample: async (photo, caption, sub, layout, size, grade) => {
      const img = await loadImage(`samples/${photo}.png`);
      state.photos[0] = img;
      state.photos[1] = await loadImage('samples/neon.png');
      state.panels[1].photo = 1;
      state.panels[2].photo = 1;
      state.title = caption;
      state.subtitle = sub;
      state.layout = layout;
      state.size = size;
      state.grade = grade;
      document.getElementById('title').value = caption;
      document.getElementById('subtitle').value = sub;
      layoutSelect.value = layout;
      sizeSelect.value = size;
      gradeSelect.value = grade;
      redraw();
    },
  });
} else {
  loadSamplePhotos().then(() => {
    status.textContent = 'Sample photos loaded — pick your own photos, or export as-is.';
  });
  syncPanelControls();
  redraw();
}
