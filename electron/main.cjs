const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const fs = require('node:fs/promises')
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

async function elegirDestino(event, nombre, extension, tipo) {
  const limpio = String(nombre).replace(/[\\/:*?"<>|]/g, '-')
  const { canceled, filePath } = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), {
    defaultPath: path.join(app.getPath('downloads'), `${limpio}.${extension}`),
    filters: [{ name: tipo, extensions: [extension] }],
  })
  return canceled ? null : filePath
}

ipcMain.handle('guardar-excel', async (event, nombre, datos) => {
  const destino = await elegirDestino(event, nombre, 'xlsx', 'Excel')
  if (!destino) return null
  await fs.writeFile(destino, Buffer.from(datos))
  return destino
})

ipcMain.handle('guardar-pdf', async (event, nombre) => {
  const destino = await elegirDestino(event, nombre, 'pdf', 'PDF')
  if (!destino) return null
  const win = BrowserWindow.fromWebContents(event.sender)
  const fondo = win.getBackgroundColor()
  win.setBackgroundColor('#fffdf9')
  try {
    const pdf = await event.sender.printToPDF({
      pageSize: 'A4',
      scale: 0.8,
      printBackground: true,
      margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
    })
    await fs.writeFile(destino, pdf)
  } finally {
    win.setBackgroundColor(fondo)
  }
  return destino
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
