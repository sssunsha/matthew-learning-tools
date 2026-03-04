const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

let mainWindow;

// 获取本地版本
function getLocalVersion() {
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

// 从远程获取版本信息
function getRemoteVersion() {
  return new Promise((resolve, reject) => {
    const versionUrl = 'https://sssunsha.github.io/version.json';
    
    https.get(versionUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const versionInfo = JSON.parse(data);
          resolve(versionInfo.version);
        } catch (error) {
          console.error('Failed to parse remote version:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('Failed to fetch remote version:', error);
      reject(error);
    });
  });
}

// 比较版本号
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;  // v1 is newer
    if (part1 < part2) return -1; // v2 is newer
  }
  
  return 0; // versions are equal
}

// 创建窗口
function createWindow(useRemote = false) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: path.join(__dirname, 'public/app_icon.jpg')
  });

  if (useRemote) {
    console.log('Loading remote version from https://sssunsha.github.io/');
    mainWindow.loadURL('https://sssunsha.github.io/');
  } else {
    const localVersion = getLocalVersion();
    console.log(`Loading local version ${localVersion}`);
    
    // 开发环境
    if (process.env.NODE_ENV === 'development') {
      mainWindow.loadURL('http://localhost:4200');
      mainWindow.webContents.openDevTools();
    } else {
      // 生产环境 - 修正路径
      const indexPath = path.join(__dirname, 'dist/matthew-learning-tools/browser/browser/index.html');
      console.log(`Loading local file: ${indexPath}`);
      console.log(`File exists: ${require('fs').existsSync(indexPath)}`);
      mainWindow.loadFile(indexPath);
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 添加调试信息
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM ready');
  });
}

// 应用启动逻辑
async function initApp() {
  const localVersion = getLocalVersion();
  console.log(`Local version: ${localVersion}`);
  
  try {
    // 尝试获取远程版本
    const remoteVersion = await getRemoteVersion();
    console.log(`Remote version: ${remoteVersion}`);
    
    // 比较版本
    const comparison = compareVersions(localVersion, remoteVersion);
    
    if (comparison >= 0) {
      // 本地版本相同或更新，使用本地版本
      if (comparison === 0) {
        console.log('Local version equals remote version, using local app');
      } else {
        console.log('Local version is newer, using local app');
      }
      createWindow(false);
    } else {
      // 远程版本更新，使用远程版本
      console.log('Remote version is newer, loading from web');
      createWindow(true);
    }
  } catch (error) {
    // 无法获取远程版本，使用本地版本
    console.error('Failed to check remote version, using local app:', error.message);
    createWindow(false);
  }
}

// 应用生命周期
app.whenReady().then(initApp);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initApp();
  }
});