const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let win;

function createWindow() {
  // 创建浏览器窗口
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true, // 设置为全屏
    icon: path.join(__dirname, 'public/app_icon.jpg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  // 判断是开发模式还是生产模式
  if (process.env.NODE_ENV === 'development') {
    // 开发模式下加载 Angular 开发服务器
    win.loadURL('http://localhost:4200');
    // 打开开发者工具
    win.webContents.openDevTools();
  } else {
    // 生产模式下加载打包后的文件
    const indexPath = path.join(__dirname, 'dist/matthew-learning-tools/browser/browser/index.html');
    win.loadFile(indexPath);
  }

  win.on('closed', () => {
    win = null;
  });
}

// Electron 初始化完成后创建窗口
app.on('ready', createWindow);

// 所有窗口关闭时退出应用 (macOS 除外)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 点击 dock 图标时重新创建窗口
app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
