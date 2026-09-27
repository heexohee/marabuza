# Evidence — fine-weather day title, animated (feedback 2026-09-28)

Request: no washing line, no car; bigger scooter, cat and bench; add moving elements.

- `title-day-frame1.png`, `title-day-frame2.png` — 1280×720, `self-serve.html?title=day`, two moments (headless Chrome).
- Live check (in-app browser, 12 s, a sample every 0.4 s): the tree-top rows, the cloud band, the vent and the
  petal band all kept changing (17–30 distinct samples each); no console errors.
- Without `?title=day` the rainy night title still runs (`data-title-scene="night"`, canvas on).
- Tests: `tests/unit/self-serve/title_day_test.mjs` (7); suite 400 pass.

Moving: clouds drift right (tiling strip), the three tree crowns sway row by row (top most, trunk still) with
slow gusts, petals and leaves blow across tumbling, wind curls come and go, a flock of three birds flies over
every 9–18 s, steam rises from the kitchen vent and leans with the wind.

Files: `tools/art/title_day.py` (layers + still), `src/img/title-day-{sky,clouds,fg,crown-0,crown-1,crown-2}.png`,
`src/img/title-bg-day.png`, `src/js/self-serve/title-day.js` (new), `src/js/self-serve/title-anim.js` (scenes),
`src/js/self-serve/main.js`, `src/self-serve.css`.
