# plugflow

工具插板：lightBox的子应用，采用vue3 + electron + vue-router + typescript + vite + vue-flow等工具搭建。

## ✨ 功能特性

- 🤖 **流程展示**：提供流程图模式展示工作流
- 🤖 **个性化节点**：自定义节点设计
- 📸 **本地数据调试**：本地配置数据优先读取本地数据，如没有则请求服务器数据
- 🎥 **工具与文档**：根据流程步骤展示对应工具文档，可工具运行，文档查看
- 🎯 **全局查询**：查询所有工具和文档
- 🔧 **右键菜单**：便捷的操作菜单，包括工具右键，调试工具

## 🛠️ 技术栈

- **前端框架**：Vue 3 + TypeScript
- **桌面框架**：Electron
- **构建工具**：Vite + electron-vite
- **UI 组件**：t-design-vue
- **样式**： less

## 📋 开发环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Windows 10/11 (主要支持平台)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd 
```

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式

```bash
npm run electron:dev
```

### 4. 构建应用

```bash
# 构建 Windows 版本
npm run electron:build

# 构建 macOS 版本
npm run build:mac

# 构建 Linux 版本
npm run build:linux

# 仅构建不打包 (用于调试)
npm run build:unpack
```

**输出文件位置：**
- `dist/win-unpacked/` - 未打包的应用程序目录
- `dist/plugflow-<version>.zip` - 可分发的ZIP压缩包

### 项目结构

```
electron/
├── window/               # 主进程代码
│   └── mainWindow.js     # 主窗口
└── main.js               # 主进程代码
└── preload.js            # 预加载
src/
└── renderer/            # 渲染进程代码
    └── views/
        ├── components/  # 通用组件
        ├── topBar/      # 头部组件
        └── vueFlow/     # 流程组件
```

### 主要窗口

- **mainWindow**：主窗口

### 
