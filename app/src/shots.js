// shots.js: fixed scenes for screenshots, driven by ?shot= query params.
// ?shot=cover shows the cover alone (controls hidden); ?shot=editor shows the
// editor with a photo loaded. Params: photo (boulevard|neon), caption, subtitle,
// layout, size, grade. window.__shotReady is set once painted.

/**
 * Applies a shot scene: loads the sample photo, applies the query's settings,
 * renders, then marks the scene ready for a screenshot.
 */
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') || 'boulevard';
  const caption = query.get('caption') || 'Neon Coast';
  const subtitle = query.get('subtitle') || 'vice city nights';
  const layout = query.get('layout') || 'hero';
  const size = query.get('size') || '1920x1080';
  const grade = query.get('grade') || 'sunset';
  await api.loadSample(photo, caption, subtitle, layout, size, grade);
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
