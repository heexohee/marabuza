// Story screens for the self-serve variant: character creation, opening cutscene, and the
// protagonist sprite used on the counter and in the day summary.
// design/quick-specs/story-character-2026-09-25.md
import { spriteImg } from '../sprites.js'
import { APRON_COLORS, HAIR_COLORS, HAIR_STYLES, characterSprite } from './character.js'
import { NAME_MAX_LEN } from './data.js'
import { OPENING_SCENES, lineText, speakerName, storyName } from './story.js'

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escapes player-typed text (the protagonist's name) before it goes into HTML. */
export const esc = (text) => String(text).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch])

/** <img> of the protagonist; size it with a CSS class (it is 16×20 px, drawn pixelated). */
export const heroImg = (look, cls = '') =>
  `<img class="hero-sprite ${cls}" src="${characterSprite(look)}" alt="${esc(look.name)}" draggable="false">`

// ---------- character creation ----------

function optionRow(title, key, list, current, isSwatch) {
  const buttons = list.map((o) => `
    <button class="opt-btn ${o.id === current ? 'on' : ''}" data-action="charOpt" data-arg="${key}:${o.id}" title="${o.label}">
      ${isSwatch ? `<i class="swatch" style="background:${o.hex}"></i>` : ''}${o.label}
    </button>`).join('')
  return `<div class="opt-row"><span class="opt-title">${title}</span><div class="opt-btns">${buttons}</div></div>`
}

/** Character creation screen. The name input is not part of the re-render key, so typing keeps focus. */
export function createHtml(s) {
  const c = s.character
  return `
    <div class="create-screen">
      <h1 class="title-logo small">사장님 준비</h1>
      <p class="create-sub">마라판다를 인수했다! 이름과 모습을 정하고, 사장님이 건넨 앞치마를 골라요.</p>
      <div class="create-body">
        <div class="create-preview">${heroImg(c, 'hero-big')}<span class="preview-note">앞치마 착용 완료!</span></div>
        <div class="create-options">
          <label class="opt-row"><span class="opt-title">이름</span>
            <input class="name-input" data-input="name" maxlength="${NAME_MAX_LEN}" value="${esc(c.name)}" placeholder="이름 (최대 ${NAME_MAX_LEN}자)" autocomplete="off">
          </label>
          ${optionRow('머리 기장', 'hair', HAIR_STYLES, c.hair, false)}
          ${optionRow('머리색', 'hairColor', HAIR_COLORS, c.hairColor, true)}
          ${optionRow('앞치마', 'apron', APRON_COLORS, c.apron, true)}
        </div>
      </div>
      <button class="bubble-btn" data-action="charDone">앞치마 입고 가게로!</button>
    </div>`
}

export const createKey = (s) => `create|${s.character.hair}|${s.character.hairColor}|${s.character.apron}`

// ---------- opening cutscene ----------

const castSprite = (who, look) => (who === 'me' ? heroImg(look, 'hero-scene') : spriteImg('🐼', 24, 'cast-panda'))

/** One line of the opening: scene art on top, dialogue box below. Clicking anywhere advances. */
export function openingHtml(s) {
  const { scene: sceneIdx, line: lineIdx } = s.story
  const scene = OPENING_SCENES[sceneIdx]
  const line = scene.lines[lineIdx]
  const props = scene.props.map((p, i) => `<span class="prop prop-${i}">${spriteImg(p, 20, 'prop-img')}</span>`).join('')
  const cast = scene.cast.map((who) =>
    `<span class="cast cast-${who} ${line.who === who ? 'talking' : ''}">${castSprite(who, s.character)}</span>`).join('')
  const dots = OPENING_SCENES.map((_, i) => `<i class="${i === sceneIdx ? 'on' : ''}"></i>`).join('')
  return `
    <div class="opening-screen" data-action="storyNext">
      <div class="scene ${scene.bg}">${props}${cast}</div>
      <div class="dialogue ${line.who === 'notice' ? 'is-notice' : ''}">
        <b class="speaker">${esc(speakerName(line.who, storyName(sceneIdx, s.character.name)))}</b>
        <p>${esc(lineText(line.text, s.character.name))}</p>
        <span class="next-hint">▶ 클릭 / Space</span>
      </div>
      <div class="opening-foot">
        <div class="scene-dots">${dots}</div>
        <button class="btn ghost skip-btn" data-action="storySkip">건너뛰기 ⏭</button>
      </div>
    </div>`
}

export const openingKey = (s) => `opening|${s.story.scene}|${s.story.line}`
