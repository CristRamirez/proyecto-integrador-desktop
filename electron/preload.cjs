const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('app', {
  platform: process.platform,
  version: process.versions.electron,
  guardarExcel: (nombre, datos) => ipcRenderer.invoke('guardar-excel', nombre, datos),
  guardarPdf: (nombre) => ipcRenderer.invoke('guardar-pdf', nombre),
})
