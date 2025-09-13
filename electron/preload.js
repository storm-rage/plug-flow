import { contextBridge, ipcRenderer, shell } from 'electron'

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron : true,
  setTitle: (title) => ipcRenderer.send('set-title', title),
  openExternal: (url) => shell.openExternal(url),
  getCookies: (url) => ipcRenderer.invoke('get-cookies', url),


  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  once: (channel, func) => ipcRenderer.once(channel, (event, ...args) => func(...args)),
  removeListener: (channel, func) => ipcRenderer.removeListener(channel, func)
})