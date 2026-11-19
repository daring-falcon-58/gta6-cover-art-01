// layoutPanels: the panel rectangles for each cover layout, in cover pixels.
// Layouts: hero (one big panel + two stacked), strips (three vertical strips),
// grid (2x2), full (one full-bleed panel). Every rect is {x, y, w, h}.

/** Returns the panel rects for `layout` inside a cover of width `w`, height `h`. */
export function layoutPanels(layout, w, h) {
  const g = Math.max(6, Math.round(Math.min(w, h) * 0.008)); // gutter
  const m = Math.max(10, Math.round(Math.min(w, h) * 0.018)); // outer margin
  const inner = { x: m, y: m, w: w - 2 * m, h: h - 2 * m };
  if (layout === 'strips') {
    const pw = (inner.w - 2 * g) / 3;
    return [0, 1, 2].map((i) => ({
      x: inner.x + i * (pw + g), y: inner.y, w: pw, h: inner.h,
    }));
  }
  if (layout === 'grid') {
    const pw = (inner.w - g) / 2;
    const ph = (inner.h - g) / 2;
    return [
      { x: inner.x, y: inner.y, w: pw, h: ph },
      { x: inner.x + pw + g, y: inner.y, w: pw, h: ph },
      { x: inner.x, y: inner.y + ph + g, w: pw, h: ph },
      { x: inner.x + pw + g, y: inner.y + ph + g, w: pw, h: ph },
    ];
  }
  if (layout === 'full') {
    return [{ x: inner.x, y: inner.y, w: inner.w, h: inner.h }];
  }
  // hero: big panel left, two stacked panels right
  const heroW = inner.w * 0.62;
  const sideW = inner.w - heroW - g;
  const sideH = (inner.h - g) / 2;
  return [
    { x: inner.x, y: inner.y, w: heroW, h: inner.h },
    { x: inner.x + heroW + g, y: inner.y, w: sideW, h: sideH },
    { x: inner.x + heroW + g, y: inner.y + sideH + g, w: sideW, h: sideH },
  ];
}

/** The panel layouts the editor offers, in menu order. */
export const LAYOUTS = [
  { id: 'hero', label: 'Hero + 2 panels' },
  { id: 'strips', label: '3 vertical strips' },
  { id: 'grid', label: '2 x 2 grid' },
  { id: 'full', label: 'Full bleed' },
];

/** How many panels a layout has. */
export function panelCount(layout) {
  return layoutPanels(layout, 100, 100).length;
}
