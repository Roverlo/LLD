# 代码规范 (Coding Standards)

## 1. 日志规范 (Logging Standards)

### 1.1 日志语言
- **所有日志消息必须使用英文**，避免中文乱码问题
- 使用清晰、简洁的英文描述

### 1.2 日志级别
- `ERROR`: 错误信息，系统无法继续执行
- `WARN`: 警告信息，系统可以继续但需要注意
- `INFO`: 一般信息，记录重要的系统状态变化
- `DEBUG`: 调试信息，仅在开发环境使用

### 1.3 日志格式示例
```javascript
// ✅ 正确示例
logger.info('Application started', { version: app.getVersion(), platform: process.platform });
logger.info('Main window created');
logger.error('Failed to generate Excel file', { error: error.message });

// ❌ 错误示例 - 避免中文
logger.info('应用程序启动');
logger.info('主窗口已创建');
```

### 1.4 日志内容规范
- 使用动词过去时描述已完成的动作：`created`, `started`, `closed`
- 使用现在进行时描述正在进行的动作：`creating`, `starting`, `closing`
- 包含相关的元数据信息，使用对象形式传递

## 2. 文件编码规范 (File Encoding Standards)

### 2.1 文件编码
- 所有源代码文件使用 **UTF-8** 编码
- 确保编辑器设置为 UTF-8 编码

### 2.2 换行符
- 使用 LF (`\n`) 作为换行符
- 避免使用 CRLF (`\r\n`)

## 3. 命名规范 (Naming Conventions)

### 3.1 变量和函数
- 使用 camelCase：`userName`, `createWindow`, `generateExcel`
- 布尔值使用 `is`, `has`, `can` 前缀：`isVisible`, `hasData`, `canEdit`

### 3.2 常量
- 使用 UPPER_SNAKE_CASE：`LOG_LEVELS`, `MAX_FILE_SIZE`

### 3.3 类名
- 使用 PascalCase：`Logger`, `ExcelGenerator`

## 4. 注释规范 (Comment Standards)

### 4.1 JSDoc 注释
```javascript
/**
 * 创建主窗口
 * @returns {BrowserWindow} 主窗口实例
 */
function createWindow() {
    // 实现代码
}
```

### 4.2 行内注释
- 使用中文注释说明复杂逻辑
- 英文注释用于代码示例和API说明

## 5. 错误处理规范 (Error Handling Standards)

### 5.1 错误日志
```javascript
try {
    // 业务逻辑
} catch (error) {
    logger.error('Operation failed', { 
        operation: 'generateExcel',
        error: error.message,
        stack: error.stack 
    });
}
```

### 5.2 用户友好的错误消息
- 日志使用英文，用户界面可以使用中文
- 提供具体的错误信息和解决建议

## 6. 性能规范 (Performance Standards)

### 6.1 日志性能
- 避免在循环中频繁记录日志
- 使用适当的日志级别
- 生产环境避免使用 DEBUG 级别

### 6.2 文件操作
- 使用异步操作避免阻塞主线程
- 合理设置日志文件大小和轮转策略

## 7. 安全规范 (Security Standards)

### 7.1 敏感信息
- 不在日志中记录密码、密钥等敏感信息
- 对用户输入进行适当的过滤和验证

## 8. 版本控制规范 (Version Control Standards)

### 8.1 提交消息
- 使用英文编写提交消息
- 格式：`type: description`
- 类型：`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

示例：
```
feat: add custom dropdown component
fix: resolve Chinese character encoding issue in logs
docs: update coding standards
```

## 9. 测试规范 (Testing Standards)

### 9.1 测试文件命名
- 测试文件以 `.test.js` 结尾
- 与被测试文件同名：`logger.js` -> `logger.test.js`

### 9.2 测试描述
- 使用英文描述测试用例
- 描述应该清晰说明测试的功能和预期结果

## 10. IP地址池输入规范 (IP Pool Input Standards)

### 10.1 支持的分隔符
IP地址池输入支持多种分隔符，提高用户体验：

- **中文分号**: ；
- **英文分号**: ;
- **中文逗号**: ，
- **英文逗号**: ,
- **空格**: 单个或多个空格
- **换行符**: \n, \r\n, \r
- **制表符**: \t

### 10.2 输入示例
```
# 支持的输入格式
192.168.1.1-100；192.168.2.1-50
192.168.1.1-100，192.168.2.1-50
192.168.1.1-100 192.168.2.1-50
192.168.1.1-100
192.168.2.1-50

# 混合分隔符
192.168.1.1；192.168.2.1，192.168.3.1 192.168.4.1
```

### 10.3 实现原理
- 使用正则表达式统一处理各种分隔符
- 自动清理多余的分隔符和空白字符
- 保持IP地址格式的完整性

## 11. UI界面设计规范 (UI Design Standards)

### 11.1 主题色彩
应用界面以**渐变紫色**为主题，确保视觉一致性：

- **主色调**: `#9b59b6` (亮紫色)
- **渐变色**: `linear-gradient(45deg, #8a2be2, #9b59b6, #e91e63)`
- **背景色**: `#0a0a1a` (深色背景)
- **表面色**: `rgba(15, 15, 30, 0.75)` (半透明紫色)

### 11.2 按钮设计规范
- **正常状态**: 使用主渐变色 `var(--gemini-gradient)`
- **禁用状态**: 使用暗紫色渐变 `linear-gradient(45deg, #6a4c93, #7b68a6)` + 透明度
- **悬停状态**: 添加紫色阴影效果
- **避免使用**: 灰色 (#555, #666) 等非主题色

### 11.3 边框和装饰
- **边框色**: `rgba(155, 89, 182, 0.8)` (半透明紫色)
- **成功状态**: 绿色内容 + 紫色边框
- **错误状态**: 红色内容 + 紫色边框
- **信息状态**: 蓝色内容 + 紫色边框

### 11.4 视觉效果
- **阴影**: 使用紫色调阴影 `rgba(155, 89, 182, 0.x)`
- **渐变**: 优先使用紫色系渐变
- **透明度**: 保持紫色主题的同时使用透明度变化

## 12. 版本和更新日期管理 (Version and Update Date Management)

### 12.1 版本信息位置
版本信息统一在以下位置维护：

- **主进程**: `src/main/main.js` 中的 `APP_INFO` 常量
- **包配置**: `package.json` 中的 `version` 字段

### 12.2 更新日期规范
**每次软件更新时，必须同步更新以下信息**：

```javascript
// src/main/main.js
const APP_INFO = {
    title: '关于 ZTEuSmartViewLLD',
    message: 'ZTEuSmartViewLLD v1.0.0',
    detail: '软件作者：罗发文\n联系方式：15029342400\n\n版本号：v1.0.0\n更新日期：2025-07-26\n\n云电脑LLD生成工具\n© 2025 网络服务处视频交付科',
};
```

### 12.3 更新流程
1. **修改版本号**: 更新 `package.json` 和 `APP_INFO.message` 中的版本号
2. **更新日期**: 修改 `APP_INFO.detail` 中的更新日期为当前日期
3. **格式要求**: 日期格式统一使用 `YYYY-MM-DD`
4. **提交规范**: 版本更新的提交信息格式为 `release: v1.0.0 - 更新说明`

### 12.4 版本号规范
遵循语义化版本控制 (Semantic Versioning)：
- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

## 13. 代码格式化 (Code Formatting)

### 13.1 工具配置
- 使用 Prettier 进行代码格式化
- 使用 ESLint 进行代码质量检查
- 配置编辑器自动格式化

### 13.2 运行命令
```bash
# 格式化代码
yarn format

# 检查代码质量
yarn lint

# 启动应用
yarn start

# 运行测试
yarn test

# 打包应用
yarn dist
```

## 14. 项目技术架构详解 (Technical Architecture Details)

### 14.1 核心技术栈
```
前端技术栈：
├── HTML5 + CSS3 + 原生JavaScript (无框架依赖)
├── Electron 22.0.0 (桌面应用框架)
└── tsParticles (背景粒子效果)

后端技术栈：
├── Node.js (JavaScript运行时)
├── ExcelJS 4.4.0 (Excel文件生成)
└── 原生模块化架构

开发工具链：
├── Yarn (包管理器)
├── Jest 29.7.0 (测试框架)
├── ESLint 8.57.0 (代码检查)
├── Prettier 3.2.5 (代码格式化)
└── electron-builder 22.14.13 (打包工具)
```

### 14.2 架构模式详解
```
分层架构 (Layered Architecture)：
┌─────────────────────────────────────────┐
│  表现层 (Presentation Layer)            │
│  ├── index.html (UI结构)               │
│  ├── renderer.js (交互逻辑)            │
│  └── style.css (样式定义)              │
├─────────────────────────────────────────┤
│  业务逻辑层 (Business Logic Layer)      │
│  ├── generator.js (核心协调器)          │
│  ├── managers/ (管理器模块)             │
│  ├── generators/ (生成器模块)           │
│  └── validators/ (验证器模块)           │
├─────────────────────────────────────────┤
│  服务层 (Service Layer)                │
│  ├── excel-service.js (Excel服务)      │
│  └── logger.js (日志服务)              │
├─────────────────────────────────────────┤
│  工具层 (Utility Layer)                │
│  ├── ip-utils.js (IP处理工具)          │
│  └── constants/ (常量定义)             │
└─────────────────────────────────────────┘
```

### 14.3 设计模式应用
- **MVC变体模式**：主进程(Controller) + 渲染进程(View) + 业务逻辑(Model)
- **工厂模式**：generators/目录下的各种规划生成器
- **策略模式**：IP分配策略、虚机配置策略
- **观察者模式**：IPC事件驱动通信
- **单例模式**：日志服务、配置管理

### 14.4 数据流架构
```
用户输入 → 参数验证 → 业务处理 → 文件生成 → 结果输出
    ↓         ↓         ↓         ↓         ↓
renderer → validator → generator → excel → filesystem
    ↑                                       ↓
    └─────────── IPC通信反馈 ←──────────────┘
```

### 14.5 模块化设计原则
- **高内聚**：每个模块职责单一明确
- **低耦合**：模块间依赖关系清晰简单
- **可测试**：每个模块都有对应的测试用例
- **可扩展**：支持新功能模块的插入

## 15. AI助手工作规范 (AI Assistant Working Standards)

### 15.1 必读文件清单
AI助手在开始任何代码修改工作之前，**必须**按顺序阅读以下文件：

1. **CODING_STANDARDS.md** - 本文件，了解项目的核心规范
2. **CODING_STYLE.md** - 详细的代码风格指南
3. **package.json** - 了解项目依赖、脚本和配置
4. **ARCHITECTURE.md** - 项目架构说明（如存在）
5. **README.md** - 项目基本信息和使用说明

### 15.2 包管理器使用规范
- **必须** 使用 `yarn` 作为唯一的包管理器
- **禁止** 使用 `npm` 进行任何操作
- **必须** 使用以下命令：
  ```bash
  yarn start          # 启动应用
  yarn test           # 运行测试
  yarn lint           # 代码检查
  yarn format         # 代码格式化
  yarn dist           # 打包应用
  ```

### 15.3 工作流程规范
1. **信息收集阶段**：
   - 使用 `codebase-retrieval` 工具了解相关代码
   - 使用 `git-commit-retrieval` 工具了解历史变更
   - 阅读相关的规范文档

2. **代码修改阶段**：
   - 遵循现有的代码风格和架构模式
   - 使用 `str-replace-editor` 进行精确修改
   - 避免大范围重写，优先增量修改

3. **测试验证阶段**：
   - 使用 `yarn start` 启动应用进行测试
   - 检查修改是否符合预期
   - 确保没有引入新的错误

### 15.4 代码修改原则
- **保守修改**：尊重现有代码结构，避免不必要的重构
- **增量更新**：优先使用小范围的精确修改
- **规范遵循**：严格遵循项目的命名、格式和架构规范
- **测试驱动**：每次修改后都要进行功能验证

### 15.5 错误处理规范
- 如果发现自己违反了项目规范，应立即纠正
- 如果遇到不确定的情况，应询问用户而不是猜测
- 如果修改导致错误，应回滚到工作状态并重新分析

---

**注意**: 遵循这些规范可以确保代码的一致性、可维护性、国际化兼容性和视觉统一性。AI助手必须严格遵循第14节的工作规范。
