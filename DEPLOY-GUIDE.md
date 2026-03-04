# 增强部署指南

本指南说明如何使用增强的 `npm run deploy` 命令进行完整部署。

## 功能概览

增强的部署命令会自动执行以下操作：

1. ✅ 自动更新版本号（patch 版本 +1）
2. ✅ 创建带时间戳的 Git commit（不推送）
3. ✅ 构建 Angular Web 应用
4. ✅ 构建 Android APK（Release 版本）
5. ✅ 构建 macOS Electron 应用
6. ✅ 压缩并部署所有文件到 GitHub Pages
7. ✅ 生成包含下载链接的版本信息
8. ✅ 创建精美的下载页面
9. ✅ 提交到部署仓库

## 使用方法

### 一键部署所有平台

```bash
npm run deploy
```

这会构建并部署：
- Web 应用（主站点）
- Android APK
- macOS App

## 部署流程详解

### Step 1: 更新版本号
```
当前版本: 0.0.3
新版本: 0.0.4
```

版本号会自动递增并同步到：
- `package.json`
- `cordova-app/config.xml`

### Step 2: 创建 Git Commit
```bash
git add .
git commit -m "Deploy 2026-03-04 16-30-45"
```

**注意**：仅在本地创建 commit，不会自动推送到远程。

### Step 3: 构建 Android APK

```bash
# 同步版本号到 Cordova
# 复制 Web 构建文件到 cordova-app/www/
# 构建 Release APK
npx cordova build android --release
```

生成文件：
```
cordova-app/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Step 4: 构建 macOS App

```bash
npm run electron:pack
```

生成文件：
```
release/MatthewTools-darwin-arm64/MatthewTools.app
```

### Step 5: 部署到 GitHub Pages

复制所有文件到：
```
/Users/I340818/workspace/personal/workspace/sssunsha.github.io/
```

### Step 6: 复制应用包

创建 `downloads/` 目录并复制：
- `MatthewTools-0.0.4.apk` - Android 安装包
- `MatthewTools-0.0.4-macos.zip` - macOS 应用（已压缩）

### Step 7: 生成增强版本信息

创建 `version.json`：
```json
{
  "version": "0.0.4",
  "timestamp": "2026-03-04T08:30:45.123Z",
  "buildDate": "2026-03-04 16:30:45",
  "packages": {
    "android": {
      "filename": "MatthewTools-0.0.4.apk",
      "size": "25.6 MB",
      "path": "downloads/MatthewTools-0.0.4.apk"
    },
    "macos": {
      "filename": "MatthewTools-0.0.4-macos.zip",
      "size": "89.2 MB",
      "path": "downloads/MatthewTools-0.0.4-macos.zip"
    }
  }
}
```

### Step 8: 创建下载页面

生成 `downloads.html`，包含：
- 版本信息展示
- Android APK 下载链接
- macOS App 下载链接
- 精美的 UI 设计

访问地址：`https://sssunsha.github.io/downloads.html`

### Step 9: 提交更改

```bash
cd sssunsha.github.io
git add -A
git commit -m "Deploy 2026-03-04 16:30:45"
```

**注意**：需要手动推送到远程：
```bash
cd /Users/I340818/workspace/personal/workspace/sssunsha.github.io
git push
```

## 部署后操作

### 1. 推送本地项目更改
```bash
git push origin main
```

### 2. 推送部署更改
```bash
cd /Users/I340818/workspace/personal/workspace/sssunsha.github.io
git push origin main
```

### 3. 访问网站
- 主站：https://sssunsha.github.io/
- 下载页：https://sssunsha.github.io/downloads.html
- 版本信息：https://sssunsha.github.io/version.json

## 下载安装

### Android APK 安装

1. 从下载页下载 APK 文件
2. 在 Android 设备上启用"未知来源"安装
3. 点击 APK 文件安装

**签名 APK（可选）**：
```bash
# 生成密钥（首次）
keytool -genkey -v -keystore matthew-tools.keystore \
  -alias matthew-tools -keyalg RSA -keysize 2048 -validity 10000

# 签名 APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore matthew-tools.keystore \
  cordova-app/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk \
  matthew-tools

# 对齐 APK
zipalign -v 4 \
  cordova-app/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk \
  MatthewTools-signed.apk
```

### macOS App 安装

1. 从下载页下载 ZIP 文件
2. 解压 ZIP 文件
3. 将 `.app` 文件拖到 Applications 文件夹
4. 首次打开时，右键点击选择"打开"（跳过安全检查）

## 前置要求

### Android 构建
- Java JDK 17
- Android SDK
- Android Studio（推荐）

安装：
```bash
brew install openjdk@17
```

配置环境变量：
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### macOS 构建
- Node.js
- Electron Packager（已包含在项目中）

## 故障排除

### Android 构建失败
```bash
cd cordova-app
npx cordova clean android
npx cordova platform remove android
npx cordova platform add android
npx cordova build android --release
```

### macOS 构建失败
```bash
rm -rf release/
npm run electron:pack
```

### 构建文件未找到
确保先运行构建：
```bash
npm run build:compress
```

### 版本号未更新
手动更新版本：
```bash
npm version patch  # 0.0.3 → 0.0.4
```

## 文件结构

部署后的 GitHub Pages 目录结构：
```
sssunsha.github.io/
├── index.html              # 主应用
├── downloads.html          # 下载页面
├── version.json           # 版本信息
├── downloads/             # 应用包目录
│   ├── MatthewTools-0.0.4.apk
│   └── MatthewTools-0.0.4-macos.zip
├── assets/                # 静态资源
├── styles.css
└── ... (其他 Web 文件)
```

## 版本管理

### 自动版本递增
部署时自动执行 patch 版本 +1：
- 0.0.3 → 0.0.4
- 0.0.9 → 0.0.10
- 0.0.99 → 0.0.100

### 手动版本管理
```bash
npm version patch   # 0.0.3 → 0.0.4
npm version minor   # 0.0.3 → 0.1.0
npm version major   # 0.0.3 → 1.0.0
```

## 最佳实践

1. **部署前测试**：在本地测试所有功能
2. **版本号管理**：确保版本号递增合理
3. **定期备份**：备份重要的配置文件
4. **签名 APK**：生产环境使用签名的 APK
5. **推送更改**：部署后记得推送到远程仓库

## CI/CD 集成（未来）

可以考虑使用 GitHub Actions 自动化部署：
```yaml
name: Deploy
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
      - name: Deploy
        run: npm run deploy
```

## 相关文档

- [Android 构建指南](./ANDROID-BUILD.md)
- [Electron 版本检查](./ELECTRON-VERSION-CHECK.md)
- [构建指南](./BUILD-GUIDE.md)

## 支持

如有问题，请查看相关文档或提交 Issue。