# ZTE uSmartView LLD Generator

一个基于Electron的桌面应用程序，用于生成ZTE uSmartView低层设计文档。

## 功能特性

- 🚀 基于Electron框架开发的跨平台桌面应用
- 📊 自动生成Excel格式的LLD文档
- 🎯 支持多种网络配置参数收集
- 💾 绿色免安装版本，开箱即用
- 🔧 可配置的参数验证和IP管理

## 技术栈

- **框架**: Electron
- **前端**: HTML5, CSS3, JavaScript
- **后端**: Node.js
- **文档生成**: ExcelJS
- **打包工具**: electron-builder

## 项目结构

```
├── src/
│   ├── main/           # 主进程代码
│   │   ├── generators/ # 文档生成器
│   │   ├── managers/   # 管理器模块
│   │   ├── services/   # 服务层
│   │   ├── utils/      # 工具函数
│   │   └── validators/ # 参数验证
│   ├── renderer/       # 渲染进程代码
│   │   ├── assets/     # 静态资源
│   │   └── modules/    # 前端模块
│   └── __tests__/      # 测试文件
├── build/              # 构建资源
└── dist/               # 打包输出
```

## 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm start
```

### 构建应用

```bash
# 构建绿色免安装版本
npm run dist
```

构建完成后，可执行文件位于 `dist/` 目录下。

## 使用说明

1. 启动应用程序
2. 填写网络配置参数
3. 选择生成选项
4. 点击生成按钮
5. 导出Excel文档

详细使用说明请参考 `使用说明.txt` 文件。

## 开发指南

### 代码规范

项目使用ESLint和Prettier进行代码格式化：

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 测试

```bash
# 运行测试
npm test

# 生成测试覆盖率报告
npm run test:coverage
```

## 版本历史

- **v1.0.2** - 当前版本
  - 优化用户界面
  - 修复已知问题
  - 添加新的配置选项

## 许可证

本项目仅供内部使用。

## 贡献

欢迎提交Issue和Pull Request来改进项目。

## 联系方式

如有问题或建议，请联系开发团队。
