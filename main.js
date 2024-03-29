const { windowManager } = require('node-window-manager')

const { app, BrowserWindow, ipcMain, Tray, screen } = require('electron')

const ioHook = require('iohook')

const path = require('path')
const assetsDirectory = path.join(__dirname, 'assets')

let tray = undefined
let window = undefined

// Don't show the app in the doc
app.dock.hide()

app.on('ready', () => {
  createTray()
  createWindow()

  ioHook.start(false)
  ioHook.on('keydown', key => {
    window.webContents.send('keydown', key)
  })
  ioHook.on('keyup', key => {
    window.webContents.send('keyup', key)
  })
})

app.on('before-quit', () => {
  ioHook.unload()
  ioHook.stop()
})

const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, 'iconTemplate.png'))
  tray.on('click', function (event) {
    app.quit()
  })
}

const createWindow = () => {
  window = new BrowserWindow({
    width: 600, // Window width
    height: 300, // Window height
    show: true,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    vibrancy: 'popover',
    visualEffectState: 'followWindow',
    webPreferences: {
      // Prevents renderer process code from not running when window is hidden
      //backgroundThrottling: false,
      preload: path.join(app.getAppPath(), 'renderer.js')
    }
  })
  window.hide()

  window.loadURL(`file://${path.join(__dirname, 'renderer.html')}`)

  // window.openDevTools({ mode: 'detach' })
}

// ======================
// MESSAGES FROM THE VIEW
// ======================

ipcMain.on('show-window', (event, width, height) => {
  window.setSize(width, height)
  window.center()
  window.show()
  window.focus()
})

ipcMain.on('hide-window', () => {
  window.hide()
})

ipcMain.on('focus', (event, id) => {
  windowManager.getWindows().forEach(window => {
    if (window.id == id) {
      window.bringToTop()
    }
  })
})
