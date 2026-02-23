# Electron 应用打包指南

## 📦 生成安装文件

### 1. 快速打包（推荐）

在项目根目录执行：

```bash
npm run electron:build:mac
```

这个命令会：
1. 构建 Angular 应用（生产模式）
2. 使用 electron-builder 打包 macOS 应用

### 2. 打包所有平台

如果需要为其他平台打包：

```bash
# 仅 macOS
npm run electron:build:mac

# 所有配置的平台（macOS, Windows, Linux）
npm run electron:build
```

## 📍 安装文件位置

打包完成后，安装文件位于：

```
release/
├── Matthew学习工具-0.0.0.dmg          # macOS 安装包（推荐）
├── Matthew学习工具-0.0.0-mac.zip      # macOS 压缩包
└── mac/                                # macOS 应用目录
    └── Matthew学习工具.app             # 可直接运行的应用
```

## 🎯 打包配置说明

当前配置（在 `package.json` 中）：

- **应用名称**: Matthew学习工具
- **应用图标**: `public/app_icon.jpg`（您的可爱小猪图标）
- **输出目录**: `release/`
- **macOS 格式**: DMG 安装包 + ZIP 压缩包
- **Windows 格式**: NSIS 安装程序 + ZIP 压缩包（如需打包）
- **Linux 格式**: AppImage + DEB 安装包（如需打包）

## 🚀 完整工作流程

### 每次修改代码后重新打包：

```bash
# 1. 确保代码已保存
# 2. 运行打包命令
npm run electron:build:mac

# 3. 等待打包完成（可能需要几分钟）
# 4. 在 release/ 目录查找安装文件
```

### 安装和使用：

1. **开发测试**: 
   ```bash
   npm run electron
   ```

2. **用户安装**:
   - 双击 `release/Matthew学习工具-0.0.0.dmg`
   - 将应用拖到 Applications 文件夹
   - 从启动台或 Applications 运行

## ⚙️ 当前应用特性

- ✅ 全屏启动
- ✅ 自定义应用图标（小猪图标）
- ✅ 生产环境优化
- ✅ 安全配置（contextIsolation）

## 📝 注意事项

1. **首次打包**: 首次打包可能需要下载依赖，时间较长
2. **图标格式**: 虽然当前使用 JPG，但建议转换为 PNG 或 ICNS 格式以获得更好的显示效果
3. **代码签名**: 在 macOS 上分发应用可能需要 Apple 开发者账号进行代码签名
4. **版本号**: 当前版本是 0.0.0，可以在 package.json 中修改版本号

## 🔄 更新版本号

修改 `package.json` 中的版本号：

```json
{
  "version": "1.0.0"  // 从 0.0.0 改为您想要的版本
}
```

## 🎨 优化建议

为了更好的应用图标显示，建议：

1. 将 `app_icon.jpg` 转换为 PNG 格式
2. 或为 macOS 创建 ICNS 格式图标（1024x1024 像素）
3. 更新 package.json 中的图标路径

转换命令示例（需要 ImageMagick）：
```bash
convert public/app_icon.jpg -resize 1024x1024 public/app_icon.png