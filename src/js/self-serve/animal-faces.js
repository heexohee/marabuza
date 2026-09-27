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
