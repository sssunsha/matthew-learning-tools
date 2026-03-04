# Android App Build Guide

本指南说明如何使用 Cordova 构建 Android 平板应用。

## 前置要求

在构建 Android 应用之前，需要安装以下工具：

### 1. Java Development Kit (JDK)
```bash
# macOS 使用 Homebrew
brew install openjdk@17

# 添加到环境变量
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 2. Android Studio 和 Android SDK
1. 下载并安装 [Android Studio](https://developer.android.com/studio)
2. 安装后，打开 Android Studio 并完成初始设置
3. 通过 SDK Manager 安装：
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools

### 3. 配置环境变量
```bash
# 编辑 ~/.zshrc 或 ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/emulator

# 应用更改
source ~/.zshrc
```

### 4. 验证安装
```bash
java -version
android --version  # 或 sdkmanager --list
```

## 构建命令

### 构建 Debug 版本（用于测试）
```bash
npm run android:debug
```

构建完成后，APK 文件位置：
```
cordova-app/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

### 构建 Release 版本（用于发布）
```bash
npm run android:release
```

构建完成后，APK 文件位置：
```
cordova-app/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

**注意：** Release 版本需要签名才能安装。

## 签名 Release APK

### 1. 生成密钥库（首次）
```bash
keytool -genkey -v -keystore matthew-tools.keystore -alias matthew-tools -keyalg RSA -keysize 2048 -validity 10000
```

### 2. 签名 APK
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore matthew-tools.keystore \
  cordova-app/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk \
  matthew-tools
```

### 3. 对齐 APK（优化）
```bash
zipalign -v 4 \
  cordova-app/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk \
  matthew-tools-release.apk
```

## 在设备上运行

### 连接真实设备
1. 在 Android 设备上启用"开发者选项"和"USB 调试"
2. 通过 USB 连接设备
3. 运行：
```bash
npm run android:run
```

### 使用模拟器
1. 在 Android Studio 中创建 AVD（Android Virtual Device）
2. 运行：
```bash
npm run android:emulate
```

## 平板优化配置

项目已针对平板设备进行优化：

- **方向设置**：横屏模式（landscape）
- **最小 SDK**：Android 7.0（API 24）
- **目标 SDK**：Android 14（API 34）
- **权限**：网络访问、存储读写

## 构建流程说明

`npm run android:debug` 或 `npm run android:release` 会执行以下步骤：

1. **构建 Angular 应用**
   - 运行 `npm run build` 生成优化的 web 文件

2. **同步版本号**
   - 从 `package.json` 同步版本号到 Cordova `config.xml`

3. **复制文件**
   - 将构建的文件复制到 `cordova-app/www/` 目录

4. **构建 Android APK**
   - 使用 Cordova 将 web 应用打包为原生 Android 应用

## 常见问题

### Gradle 构建失败
```bash
cd cordova-app
npx cordova clean android
npx cordova build android
```

### 找不到 Android SDK
确保 `ANDROID_HOME` 环境变量正确设置并指向 Android SDK 目录。

### 构建速度慢
首次构建需要下载 Gradle 和依赖，可能需要较长时间。后续构建会快很多。

### APK 安装失败
- 检查设备是否允许安装未知来源的应用
- Release 版本必须签名后才能安装

## 发布到 Google Play

1. 构建并签名 Release APK
2. 在 [Google Play Console](https://play.google.com/console) 创建应用
3. 上传签名的 APK
4. 完成应用信息、截图等内容
5. 提交审核

## 项目结构

```
cordova-app/
├── config.xml           # Cordova 配置文件
├── platforms/           # 平台特定代码（自动生成）
│   └── android/         # Android 平台文件
├── plugins/             # Cordova 插件
├── www/                 # Web 应用文件（构建时复制）
└── res/                 # 资源文件（图标、启动画面等）
```

## 额外资源

- [Cordova Android Platform Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/android/)
- [Android Developer Documentation](https://developer.android.com/docs)
- [Publishing on Google Play](https://developer.android.com/distribute/console)