// Fixed game stage scaled to the window, like a desktop game (Steam build: no page scroll at any window size;
// feedback 2026-09-27). The screens are laid out once at STAGE size; the whole stage is then scaled by --fit.
// CSS side: #app in src/self-serve.css.

/** Design size of the stage in CSS px: the 1280-wide business screen (849px tall) plus #app's 16px padding. */
export const STAGE = { w: 1280, h: 884 }

/**
 * Scale that fits the stage inside a window, keeping its aspect ratio.
 * @param {number} winW window inner width, px
 * @param {number} winH window inner height, px
 * @returns {number} scale factor (above 1 on large windows)
 */
export function fitScale(winW, winH) {
  if (!(winW > 0) || !(winH > 0)) return 1
  return Math.floor(Math.min(winW / STAGE.w, winH / STAGE.h) * 1000) / 1000
}

/**
 * Keeps the stage scaled to the window: sets --fit on the root element now and on every resize.
 * @param {Window} win
 */
export function mountStageFit(win = window) {
  const apply = () => win.document.documentElement.style.setProperty('--fit', String(fitScale(win.innerWidth, win.innerHeight)))
  apply()
  win.addEventListener('resize', apply)
  return apply
}
