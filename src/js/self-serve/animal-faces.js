// Approved front-facing portraits. Emoji keys preserve existing customer/save data.
import { spriteImg } from '../sprites.js'

export const ANIMAL_FACES = Object.freeze({
  '🐸': ['frog', '개구리'], '🐱': ['cat', '고양이'], '🐰': ['rabbit', '토끼'],
  '🐦': ['sparrow', '참새'], '🐯': ['tiger', '호랑이'], '🐷': ['pig', '돼지'],
  '🦝': ['raccoon', '너구리'], '🐻': ['bear', '곰'], '🐧': ['penguin', '펭귄'],
  '🐶': ['dog', '강아지'], '🦊': ['fox', '여우'], '🐨': ['koala', '코알라'],
  '🐹': ['hamster', '햄스터'], '🐼': ['panda', '판다'],
})

export function queueFaceImg(face) {
  const portrait = Object.hasOwn(ANIMAL_FACES, face) ? ANIMAL_FACES[face] : null
  if (!portrait) return spriteImg(face, 16, 'queue-portrait')
  const [file, name] = portrait
  return `<img class="px queue-portrait" src="img/animal-faces/${file}.png?v=1" width="48" height="48" alt="${name} 손님" draggable="false">`
}

// Fur remains independent of furniture upgrades; the dining bib is always cream.
const FUR = {
  '🐸': ['#80954d', '#80954d'], '🐱': ['#77716c', '#eee5d6'],
  '🐰': ['#eee5d6', '#eee5d6'], '🐦': ['#9c5735', '#9c5735'],
  '🐯': ['#d99136', '#f3dfbf'], '🐷': ['#df948a', '#df948a'],
  '🦝': ['#94806a', '#645343'], '🐻': ['#92654b', '#92654b'],
  '🐧': ['#343033', '#343033'], '🐶': ['#c79862', '#eee0c5'],
  '🦊': ['#bc6337', '#bc6337'], '🐨': ['#a6a09b', '#a6a09b'],
  '🐹': ['#c89753', '#edddbe'], '🐼': ['#252223', '#252223'],
}

export function seatedCustomerHtml(face) {
  const [fur, paw] = Object.hasOwn(FUR, face) ? FUR[face] : ['#94806a', '#eee5d6']
  return `<span class="seated-customer" data-animal="${Object.hasOwn(ANIMAL_FACES, face) ? ANIMAL_FACES[face][0] : 'unknown'}" style="--customer-fur:${fur};--customer-paw:${paw}">
    <i class="customer-torso" aria-hidden="true"><i class="dining-bib"></i></i>
    <span class="seated-head">${queueFaceImg(face)}</span>
    <i class="customer-paw paw-left" aria-hidden="true"></i>
    <i class="customer-paw paw-right" aria-hidden="true"></i>
  </span>`
}
