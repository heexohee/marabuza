# Evidence — living title background (feedback 2026-09-27)

Request: rain falling, the neon sign flickering, clouds drifting, the reflected rainwater on the road shimmering.

- `title-anim-frame1.png`, `title-anim-frame2.png` — 1280×720, two moments of the running title (headless Chrome):
  rain streaks and road ripples differ between the frames; the clouds sit behind the roof sign and buildings.
- Only the roof sign flickers; the subtitle sign (퇴사하고 마라탕집 사장님) stays lit (feedback 2026-09-27).
- Neon flicker observed live: the roof-sign text pixel (242, 83) sampled for 30 s read 741 (lit) and 293 (unlit).
- The canvas hides and its loop stops off the title screen (data-screen `shop` → `.title-anim` display none).
- With `prefers-reduced-motion: reduce` the canvas stays hidden and the still `img/title-bg.png` shows (by code
  path in `mountTitleAnim`; not observed in a browser).
- Fixed while here: `html { scrollbar-gutter: stable }` left a 15px dead strip at the right of every window.
- Tests: `tests/unit/self-serve/title_anim_test.mjs` (6).

Files: `tools/art/title_bg.py` (clouds/rain/neon flags; default output byte-identical),
`tools/art/title_layers.py` (new), `src/img/title-{sky,fg,off,clouds}.png` (new),
`src/js/self-serve/title-anim.js` (new), `src/js/self-serve/main.js`, `src/self-serve.css`.
