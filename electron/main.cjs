const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const DEV_SERVER_URL = 'http://localhost:5173'
const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    show: false,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#f2f1ec',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.maximize()
  win.once('ready-to-show', () => win.show())

  if (isDev) {
    win.loadURL(DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
