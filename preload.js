const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 保存照片到文件系统
  savePhoto: async (filename, base64Data) => {
    try {
      const result = await ipcRenderer.invoke('save-photo', filename, base64Data);
      return result;
    } catch (error) {
      console.error('Error in preload savePhoto:', error);
      return { success: false, error: error.message };
    }
  }
});