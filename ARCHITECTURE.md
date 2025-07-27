# 如何运行

## 开发模式

如果你需要修改代码并立即看到效果，可以使用开发模式：

1.  **安装依赖** (仅在第一次或依赖更新后需要):
    ```bash
    cd ip-generator-app
    npm install
    ```

2.  **启动应用**:
    ```bash
    cd ip-generator-app
    npm start
    ```

## 生产模式 (推荐)

为了方便日常使用和分发，你可以将应用打包成一个独立的可执行文件。

1.  **打包应用**:
    ```bash
    cd ip-generator-app
    npm run dist
    ```

2.  **运行应用**:
    *   打包成功后，进入 `ip-generator-app/dist` 目录。
    *   找到并双击运行 `IP Generator Setup 1.0.1.exe` 文件。
    *   这会安装应用程序，之后你就可以从桌面或开始菜单直接启动它，无需任何命令行操作。

# 软件架构

## 1. 架构概览

本应用是一个使用 Electron 构建的桌面应用，旨在根据用户输入的参数生成 IP 地址规划的 Excel 文件。

### 1.1 设计模式和架构风格

**核心架构模式：**
- **分层架构（Layered Architecture）**：UI层、业务逻辑层、数据处理层清晰分离
- **MVC模式变体**：渲染进程作为View，generator.js作为Model，主进程作为Controller
- **观察者模式**：通过IPC事件机制实现进程间通信
- **策略模式**：不同的IP分配策略和虚机配置策略
- **工厂模式**：generators目录下的各种规划生成器
- **单例模式**：日志服务、配置管理等全局服务

**架构风格：**
- **事件驱动架构**：基于Electron的IPC事件机制
- **模块化架构**：高内聚、低耦合的模块设计
- **微服务风格**：每个功能模块独立，通过明确的接口通信

### 1.2 技术栈详解

**前端技术栈：**
```
表现层 (Presentation Layer)
├── HTML5 - 语义化标记，现代Web标准
├── CSS3 - 响应式设计，Flexbox布局
├── 原生JavaScript - ES2021语法，无框架依赖
└── tsParticles - 背景粒子效果增强用户体验
```

**后端技术栈：**
```
业务逻辑层 (Business Logic Layer)
├── Node.js - JavaScript运行时环境
├── ExcelJS 4.4.0 - Excel文件生成和操作
├── 原生模块化架构 - CommonJS模块系统
└── 事件驱动编程模型
```

**开发工具链：**
```
开发与构建工具
├── Electron 22.0.0 - 跨平台桌面应用框架
├── electron-builder 22.14.13 - 应用打包工具
├── Yarn - 包管理器，支持离线安装
├── Jest 29.7.0 - 测试框架，44个测试用例
├── ESLint 8.57.0 - 代码质量检查
└── Prettier 3.2.5 - 代码格式化工具
```
- **安全优先架构**：遵循Electron安全最佳实践

### 1.2 技术栈详细说明

**运行时环境：**
- **Electron 22.0.0**：提供跨平台桌面应用能力，兼容Windows 7+
- **Node.js 16.17.1**：后端逻辑处理（Electron内置）
- **Chromium 108.0.5359.215**：前端渲染引擎（Electron内置）

**核心依赖库：**
- **ExcelJS 4.4.0**：Excel文件生成和操作
- **Jest 29.7.0**：单元测试框架
- **electron-builder 22.14.13**：应用打包和分发

**开发工具链：**
- **Yarn**：包管理器（强制使用，配置淘宝镜像）
- **PowerShell**：Windows环境下的构建脚本

### 1.3 模块架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    ZTE uSmartView LLD                       │
├─────────────────────────────────────────────────────────────┤
│  渲染进程 (Renderer Process)                                │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   index.html    │  │  renderer.js    │                  │
│  │   (UI Layout)   │  │  (UI Logic)     │                  │
│  └─────────────────┘  └─────────────────┘                  │
├─────────────────────────────────────────────────────────────┤
│  预加载脚本 (Preload Script)                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              preload.js                                 ││
│  │           (Security Bridge)                             ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  主进程 (Main Process)                                      │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │     main.js     │  │  generator.js   │                  │
│  │ (App Lifecycle) │  │ (Business Logic)│                  │
│  └─────────────────┘  └─────────────────┘                  │
├─────────────────────────────────────────────────────────────┤
│  外部依赖 (External Dependencies)                           │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │    ExcelJS      │  │   File System   │                  │
│  │ (Excel Export)  │  │   (OS APIs)     │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

其核心架构遵循 Electron 的主进程-渲染进程模型：

*   **主进程 (`main.js`)**:
    *   负责创建和管理应用的生命周期和浏览器窗口 (`BrowserWindow`)。
    *   通过 `ipcMain` 监听来自渲染进程的事件 (`generate-excel`)。
    *   调用核心的 IP 规划逻辑 (`generator.js`)。
    *   使用 `exceljs` 库生成 Excel 文件。
    *   处理文件保存对话框。

*   **渲染进程 (`renderer.js`)**:
    *   负责渲染 UI (`index.html`)。
    *   监听用户的输入和表单提交事件。
    *   通过 `window.electronAPI` 调用在 `preload.js` 中暴露的函数，向主进程发送数据。

*   **预加载脚本 (`preload.js`)**:
    *   作为主进程和渲染进程之间的桥梁。
    *   使用 `contextBridge` 安全地将主进程的 `ipc` 功能暴露给渲染进程，避免了 `nodeIntegration` 的安全风险。

# 功能清单

## 核心功能

1.  **Excel 生成**: 根据用户输入的参数，生成一个包含服务器 IP 规划、虚机 IP 规划和存储规划的 Excel 文件。
2.  **文件保存**: 允许用户选择保存生成后的 Excel 文件的位置。
3.  **状态显示**: 在生成过程中向用户显示“正在生成...”的状态，并在生成成功或失败后给出提示。

## 输入参数

### 核心架构
*   **管理/业务网合设 (`isNetCombined`)**: 是否将管理网和业务网合并。
*   **管理节点双机 (`isDualNode`)**: 管理节点是否采用双机热备。
*   **Ceph管理双机 (`isCephDual`)**: Ceph 管理是否采用双机。
*   **计算/存储合设 (`isFusionNode`)**: 是否将计算和存储节点合并（超融合）。
*   **管理节点也计入超融合 (`isMngAsFusion`)**: 是否将管理节点也作为超融合的一部分。

### 服务器数量
*   **管理服务器 (`countMng`)**: 管理服务器的数量。
*   **超融合/计算服务器 (`countFusion`)**: 超融合或计算服务器的数量。
*   **存储服务器 (`countStor`)**: 存储服务器的数量。
*   **CAG数量 (`countCAG`)**: CAG（云应用网关）的数量。

### 部署选项
*   **用户量 (`userCount`)**: 预计的用户数量。
*   **微服务场景 (`scene`)**: 选择不同的网络隔离和访问场景。
*   **部署ZXOPS (`isZXOPS`)**: 是否部署 ZXOPS 运维平台。
*   **Insight部署 (`insightDeployType`)**: Insight 平台的部署模式（非高可用/高可用）。
*   **部署终端网管 (`deployTerminalMgmt`)**: 是否部署终端网管。
*   **部署CAG门户 (`deployCAGPortal`)**: 是否部署 CAG 门户。
*   **部署DEM (`deployDEM`)**: 是否部署 DEM（桌面体验监控）。
*   **部署升级服务器 (`downloadType`)**: 升级服务器的部署模式（单机/集群）。
*   **存储安全 (`storageSecurity`)**: 存储的副本或纠删码策略。

### IP地址池
*   **管理网IP段 (`mngIpRange`)**: 管理网的 IP 地址范围。
*   **业务网IP段 (`bizIpRange`)**: 业务网的 IP 地址范围。
*   **存储公共网IP段 (`pubIpRange`)**: 存储公共网的 IP 地址范围。
*   **存储集群网IP段 (`cluIpRange`)**: 存储集群网的 IP 地址范围。

# 功能实现逻辑

1.  **用户交互**:
    *   用户在 `index.html` 提供的表单中填写参数。
    *   当用户点击“生成”按钮时，`renderer.js` 中的事件监听器被触发。

2.  **数据传递**:
    *   `renderer.js` 从表单中收集所有参数，并将它们打包成一个 `params` 对象。
    *   它调用 `window.electronAPI.generateExcel(params)`，这个函数是在 `preload.js` 中定义的。
    *   `preload.js` 接收到调用后，通过 `ipcRenderer.invoke('generate-excel', params)` 将数据发送到主进程。

3.  **核心逻辑**:
    *   `main.js` 中的 `ipcMain.handle('generate-excel', ...)` 监听器接收到数据。
    *   它调用 `generator.js` 中的 `generatePlan(params)` 函数。
    *   `generator.js` 根据传入的参数，计算出所有服务器和虚拟机的 IP 地址，并返回一个包含这些数据的 `plan` 对象。

4.  **文件生成**:
    *   `main.js` 接收到 `plan` 对象后，使用 `exceljs` 库创建一个新的工作簿 (`Workbook`)。
    *   它创建多个工作表 (`Worksheet`)，并将 `plan` 对象中的数据填充进去。
    *   它调用 `dialog.showSaveDialog` 来让用户选择保存路径。
    *   最后，它将工作簿写入用户选择的文件路径。

5.  **结果反馈**:
    *   `main.js` 将生成的结果（成功或失败、文件路径、错误信息等）返回给 `renderer.js`。
    *   `renderer.js` 根据返回的结果，通过 `alert` 和更新页面上的状态信息，向用户显示最终的结果。
