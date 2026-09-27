// Desktop app (launch checklist ⛔ 데스크톱 앱 포장): an Electron window around the release build in dist/
// (`node tools/release/release.mjs`), served through app:// (see app-path.cjs). The game code is unchanged —
// the release flag in dist/ already keeps the dev bar off. The save is a file in <userData>/saves/ (save-file.cjs),
// the folder Steam Auto-Cloud syncs.
const { app, BrowserWindow, ipcMain, net, protocol } = require('electron')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { APP_ORIGIN, ENTRY, resolveAppPath } = require('./app-path.cjs')
const { createSaveFile } = require('./save-file.cjs')

const ROOT = path.join(__dirname, '..', 'dist')
const WINDOW = { width: 1280, height: 800, minWidth: 960, minHeight: 600 } // the 1280×800 stage, fitted by fit.js

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

function createWindow() {
  const win = new BrowserWindow({
    ...WINDOW,
    title: '마라부자',
    backgroundColor: '#0a0a1e',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: true, devTools: !app.isPackaged,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })
  win.removeMenu()
  // the game never opens windows or leaves its own pages
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${APP_ORIGIN}/`)) event.preventDefault()
  })
  win.loadURL(`${APP_ORIGIN}/${ENTRY}`)
}

/** Answers the preload's save calls from the game page only. */
function handleSaves(saves) {
  const fromGame = (event) => event.senderFrame?.url.startsWith(`${APP_ORIGIN}/`)
  ipcMain.on('save:get', (event, key) => { event.returnValue = fromGame(event) ? saves.getItem(key) : null })
  ipcMain.on('save:set', (event, key, value) => { event.returnValue = fromGame(event) ? saves.setItem(key, value) : false })
  ipcMain.on('save:remove', (event, key) => { event.returnValue = fromGame(event) ? saves.removeItem(key) : false })
}

app.whenReady().then(() => {
  handleSaves(createSaveFile(path.join(app.getPath('userData'), 'saves')))
  protocol.handle('app', (request) => {
    const file = resolveAppPath(request.url, ROOT)
    return file ? net.fetch(pathToFileURL(file).toString()) : new Response('Not found', { status: 404 })
  })
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
