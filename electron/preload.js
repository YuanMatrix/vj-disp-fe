// Preload script (可选，用于安全地暴露 Node.js API 到渲染进程)
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // 在这里可以暴露需要的 API
  platform: process.platform,
});
