const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isDesktop: true,
  platform: process.platform,
  getHwid: () => ipcRenderer.invoke("get-hwid"),
  getServerStatus: () => ipcRenderer.invoke("get-server-status"),
  startServer: (config) => ipcRenderer.invoke("start-server", config),
  stopServer: () => ipcRenderer.invoke("stop-server"),
  readStorage: (key) => ipcRenderer.invoke("read-storage", key),
  writeStorage: (key, data) => ipcRenderer.invoke("write-storage", key, data),
});
