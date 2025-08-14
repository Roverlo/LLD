# ZTE uSmartView LLD 项目快速部署指南

## 项目简介
这是一个基于 Electron 的桌面应用程序，用于生成智能视图低层设计（LLD）的 Excel 文件。

## 最新更新
- **条件禁用功能优化**：当选择"管理/业务网合设"或"计算/存储合设"时，相关输入框会自动禁用并显示"已禁填"提示
- **视觉反馈增强**：禁用的输入区域具有灰色背景和降低的透明度
- **数据保护**：禁用时自动保存原始值，启用时自动恢复

## 系统要求
- Windows 10 或更高版本
- Node.js 16.x 或更高版本
- npm 或 yarn 包管理器

## 快速部署步骤

### 1. 安装 Node.js
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载并安装 LTS 版本（推荐 16.x 或更高版本）
3. 安装完成后，打开命令提示符验证安装：
   ```bash
   node --version
   npm --version
   ```

### 2. 克隆或复制项目文件
将 BKUP2025 文件夹中的所有文件复制到目标机器的项目目录中。

### 3. 安装项目依赖
在项目根目录打开命令提示符或 PowerShell，执行：
```bash
npm install
```

或者如果使用 yarn：
```bash
yarn install
```

### 4. 启动应用程序
```bash
npm start
```

或者：
```bash
yarn start
```

## 项目结构
```
├── src/
│   ├── main/           # 主进程代码
│   │   ├── main.js     # 应用程序入口
│   │   ├── generator.js # 核心生成器
│   │   ├── services/   # 服务层（Excel生成等）
│   │   ├── managers/   # 管理器（IP管理等）
│   │   ├── generators/ # 各种生成器
│   │   ├── utils/      # 工具函数
│   │   └── validators/ # 验证器
│   ├── renderer/       # 渲染进程代码
│   │   ├── index.html  # 主界面
│   │   ├── renderer.js # 渲染进程逻辑
│   │   ├── style.css   # 样式文件
│   │   └── modules/    # 模块化组件
│   └── preload.js      # 预加载脚本
├── package.json        # 项目配置和依赖
└── README.md          # 本文件
```

## 功能特性
- 服务器配置信息管理
- IP 规划自动生成
- 虚拟机配置规划
- 存储配置规划
- 网卡绑定配置
- 端口规划（服务器和网络设备）
- 网络策略配置
- Excel 文件导出

## 开发规范
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循模块化开发原则
- 代码注释使用中文

## 故障排除

### 常见问题
1. **npm install 失败**
   - 检查网络连接
   - 尝试使用国内镜像：`npm config set registry https://registry.npmmirror.com/`

2. **应用启动失败**
   - 确保 Node.js 版本符合要求
   - 删除 node_modules 文件夹后重新安装依赖

3. **Excel 生成失败**
   - 检查文件权限
   - 确保目标目录存在且可写

## 技术栈
- **前端框架**: Electron
- **UI**: HTML5 + CSS3 + JavaScript
- **后端**: Node.js
- **Excel 处理**: ExcelJS
- **代码规范**: ESLint + Prettier

## 联系信息
如有问题，请联系开发团队。