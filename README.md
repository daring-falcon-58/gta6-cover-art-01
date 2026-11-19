# Neon Coast Cover Studio — GTA-style cover art maker

**Method:** an offline single-page editor (vanilla JS + Canvas 2D, no libraries, no network) that turns any photo + caption into a multi-panel GTA-poster-style cover: `renderCover` in `app/src/cover.js` draws the panels (`layoutPanels`: hero+2, 3 strips, 2x2 grid, full bleed), then `applySunsetGrade` paints the Vice City magenta→orange→teal grade, `applyNeonGlow` / `applyGrain` / `applyVignette` / `applyHalftone` finish it like print poster art, and the caption is set in Anton (sunset-gradient, white, or neon lettering) with a Pacifico script subtitle. Every panel takes its own photo with drag-to-pan crop and a zoom slider (`drawPhotoCover`, fit/fill per panel), and `exportPng` writes the exact post size — 1920×1080, 1080×1080, or 1080×1350 — as a PNG in one click. Photos are read with FileReader and never leave the machine.

**Features:** upload up to 3 photos; 4 panel layouts; per-panel photo assignment, drag pan, zoom, fit/fill; editable title + subtitle, caption top/bottom, 3 lettering styles; 4 colour grades (Vice Sunset, Neon Night, Golden Hour, Noir Pink) + neon glow, grain, vignette, halftone toggles; live preview; one-click PNG export at exact size; two original sample photos (sunset boulevard + neon street, drawn in code with PIL); deterministic `?shot=` scenes for screenshots.

**Originality:** all art is ours — the sample photos are drawn in code, the lettering is Anton + Pacifico (SIL Open Font License, files + OFL text under `app/fonts/`), and nothing uses a Rockstar Games logo, artwork, character, or font. Fan-made, not affiliated with Rockstar Games.

**Try it:** `node serve.ts`, open http://localhost:8080, load sample photos, pick a layout, drag a panel, export.
