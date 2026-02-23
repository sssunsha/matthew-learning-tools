# Matthew学习工具 - Electron版本

本项目已成功封装为Electron桌面应用。

## 开发模式

### 方式1：直接运行已构建的应用
```bash
# 1. 先构建Angular应用
npm run build

# 2. 运行Electron应用
npm run electron
```

### 方式2：开发模式（热重载）
```bash
# 同时启动Angular开发服务器和Electron
npm run electron:dev
```

## 构建应用

### 构建macOS应用
```bash
# 构建dmg和zip格式的安装包
npm run electron:build:mac
```

构建完成后，可执行文件将生成在 `release` 目录中。

### 通用构建命令
```bash
# 自动检测当前平台并构建
npm run electron:build
```

## 项目结构

- `electron.js` - Electron主进程文件
- `src/` - Angular应用源代码
- `dist/` - Angular构建输出目录
- `release/` - Electron应用构建输出目录

## 可用命令

- `npm start` - 启动Angular开发服务器
- `npm run build` - 构建Angular应用（生产模式）
- `npm run electron` - 运行Electron应用
- `npm run electron:dev` - 开发模式（Angular + Electron同时运行）
- `npm run electron:build` - 构建Electron应用
- `npm run electron:build:mac` - 构建macOS应用

## 注意事项

1. 首次运行需要先执行 `npm install` 安装所有依赖
2. 开发模式下修改代码会自动重载Angular部分，但Electron主进程修改需要重启
3. 构建的应用包含了完整的Angular应用和Electron运行环境

## 应用特性

- ✅ 跨平台桌面应用
- ✅ 原生窗口体验
- ✅ 离线可用
- ✅ 快速启动
- ✅ 完整的Angular功能支持