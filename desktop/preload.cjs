// Gives the game its desktop save file (desktop/save-file.cjs) as `window.marabuzaSave`, the same shape as
// localStorage (src/js/self-serve/save-store.js picks it up). Sync IPC: the save is small and saveGame is synchronous.
const { contextBridge, ipcRenderer } = require('electron')

// The window allows audio without a click (main.cjs autoplayPolicy): the title music starts at launch.
contextBridge.exposeInMainWorld('marabuzaDesktop', { autoplayAudio: true })

contextBridge.exposeInMainWorld('marabuzaSave', {
  getItem: (key) => ipcRenderer.sendSync('save:get', key),
  setItem: (key, value) => ipcRenderer.sendSync('save:set', key, String(value)),
  removeItem: (key) => ipcRenderer.sendSync('save:remove', key),
})
