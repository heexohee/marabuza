// Decodes pictures before a scene needs them (BUG-002): a story beat that switches art then paints at once
// instead of showing its empty box while a 2–4MB PNG loads. The Image objects are kept for the session so
// the decoded pictures stay in the browser's memory cache.
const kept = []

/**
 * Starts loading and decoding every URL.
 * @param {string[]} urls
 * @param {() => { src: string, decode: () => Promise<void> }} [makeImage] Image factory (tests pass a fake)
 * @returns {Promise<number>} how many decoded; a file that fails counts 0 — its <img> shows the gap when used
 */
export function preloadImages(urls, makeImage = () => new Image()) {
  return Promise.all(urls.map((src) => {
    const img = makeImage()
    img.src = src
    kept.push(img)
    return img.decode().then(() => 1, () => 0)
  })).then((done) => done.reduce((sum, n) => sum + n, 0))
}
