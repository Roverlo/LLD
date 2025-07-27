# 项目代码规范 (Coding Style Guide)

本文档旨在为 ZTE uSmartView LLD Generator 项目建立一套统一的编码规范和最佳实践，以提高代码质量、可读性、可维护性和安全性。所有项目贡献者都应遵循此规范。

---

## 1. 架构与设计原则 (Architecture & Design)

### 1.1. Electron 安全最佳实践

为了保证应用的安全性，必须遵循 Electron 的核心安全原则。

- **必须** 将 `contextIsolation` 设置为 `true`。这是 Electron 现代安全模型的基石，可以有效防止渲染器进程受到恶意脚本的攻击。
  ```javascript
  // main.js -> webPreferences
  webPreferences: {
      contextIsolation: true, // 必须为 true
      nodeIntegration: false, // 必须为 false
      preload: path.join(__dirname, 'preload.js')
  }
  ```

- **必须** 将 `nodeIntegration` 设置为 `false`。禁止在渲染器进程中直接访问 Node.js API。

- **必须** 使用 `preload.js` 脚本和 `contextBridge` 作为主进程和渲染器进程之间通信的唯一桥梁。只暴露完成任务所必需的最小 API 集合。
  ```javascript
  // preload.js
  const { contextBridge, ipcRenderer } = require('electron');

  contextBridge.exposeInMainWorld('electronAPI', {
    generatePlan: (params) => ipcRenderer.invoke('generate-plan', params)
  });
  ```

### 1.2. 模块化与职责分离

- **主进程 (`main.js`)**: 只负责应用生命周期、窗口管理、菜单创建和与操作系统原生 API 的交互（如文件对话框）。
- **渲染器进程 (`renderer.js`)**: 只负责 UI 逻辑、用户事件处理和与预加载脚本的交互。
- **预加载脚本 (`preload.js`)**: 只负责设置 `contextBridge`，作为安全的 IPC 通道。
- **业务逻辑 (`generator.js`)**: 封装所有核心业务逻辑，使其与 Electron 的 API 解耦。理想情况下，`generator.js` 应该可以在任何 Node.js 环境中独立运行。

### 1.3. 业务逻辑抽象 (推荐)

- **推荐** 将核心业务逻辑与UI和主进程分离（当前已通过 `generator.js` 实现）。
- **未来方向**: 为了进一步提升可维护性，可以考虑将易变的业务规则（如虚机规格、IP 分配策略等）从 `generator.js` 中抽离到独立的JSON或JS配置文件中。这在需求频繁变更时会非常有用，但对于当前稳定的项目不是必需的。

### 1.4. 目录与文件结构 (Directory & File Structure)

为了保持项目清晰，推荐使用以下目录结构。

```
ZTEuSmartViewLLD/
├── dist/                  # 打包输出目录 (由 .gitignore 忽略)
├── build/                 # 构建资源目录 (如图标)
│   └── logo5.ico
├── src/                   # 源代码目录
│   ├── main/              # 主进程相关代码
│   │   ├── main.js        # 应用主入口
│   │   └── generator.js   # 核心业务逻辑
│   ├── renderer/          # 渲染器进程相关代码
│   │   ├── index.html     # UI 页面
│   │   ├── renderer.js    # UI 逻辑
│   │   ├── style.css      # UI 样式
│   │   └── assets/        # UI 静态资源 (图片, 字体等)
│   │       └── logo.png
│   └── preload.js         # 预加载脚本
├── .gitignore             # Git 忽略文件
├── CODING_STYLE.md        # 本代码规范
├── package.json           # 项目元数据和依赖
└── README.md              # 项目说明文档
```

- **`src/`**: 所有源代码都应放在 `src` 目录下，以实现源码与项目根目录下其他配置文件（如 `package.json`, `.gitignore`）的分离。
- **`src/main/`**: 存放所有主进程相关的代码。
- **`src/renderer/`**: 存放所有渲染器进程相关的代码，包括 HTML, CSS, JS 和静态资源。
- **`dist/`**: 用于存放 `electron-builder` 打包后的输出文件，此目录应被 `.gitignore` 忽略。
- **`build/`**: 用于存放构建过程中需要的静态资源，例如应用图标。

## 2. 代码风格与语法 (Code Style & Syntax)

### 2.1. 格式化

- **推荐** 使用 Prettier 或类似的自动化代码格式化工具来保证风格统一。
- **缩进**: 使用 4 个空格进行缩进。
- **分号**: 推荐在语句末尾使用分号 (`;`)，以避免潜在的自动分号插入问题。
- **引号**: 推荐使用单引号 (`'`) 或双引号 (`"`)，并确保在整个项目中保持风格统一。
- **行长度**: 每行代码长度不应超过 120 个字符。

### 2.2. 命名规范

- **变量与函数**: 使用小驼峰命名法 (camelCase)，例如 `myVariable`, `generatePlan`。
- **类与构造函数**: 使用大驼峰命名法 (PascalCase)，例如 `class MyClass {}`。
- **常量**: 使用全大写和下划线命名 (UPPER_CASE_SNAKE)，例如 `const NOT_APPLICABLE_TEXT = '不涉及';`。
- **文件名**: 使用小写字母和连字符 (kebab-case)，例如 `coding-style.md`，或遵循现有项目风格。

### 2.3. 变量声明

- **优先** 使用 `const` 声明变量，除非该变量需要被重新赋值。
- 如果变量需要被重新赋值，则使用 `let`。
- **禁止** 使用 `var`。

### 2.4. 函数

- **推荐** 使用函数声明 (`function myFunction() {}`) 或函数表达式 (`const myFunction = () => {}`)。对于简单的回调，箭头函数是首选。
- 函数应保持简短，并只做一件事。如果一个函数过于复杂，应将其拆分为更小的辅助函数。

## 3. 安全性 (Security)

### 3.1. 移除硬编码的敏感信息

- **严禁** 在代码中硬编码任何密码、密钥或其它敏感信息。
- **推荐** 将此类信息存储在安全的环境变量或受保护的配置文件中，并在运行时读取。对于此项目，可以考虑让用户在 UI 上输入或从外部安全文件中导入。

### 3.2. 内容安全策略 (CSP)

- **必须** 在 `index.html` 中设置严格的 `Content-Security-Policy`。
- **一般情况应避免** 使用 `'unsafe-inline'` 和 `'unsafe-eval'` 以遵循最佳安全实践。
- **本项目例外**: 为了保证 `tsparticles` 库的动态烟雾和粒子效果正常渲染，当前必须做出以下权衡：
  - `style-src` **必须**包含 `'unsafe-inline'`，因为该库会动态注入样式来创建其Canvas画布。
  - `script-src` **必须**包含 `'unsafe-eval'`，因为该库依赖此机制来解析和执行其复杂的动画配置。
  - 这是一个为了实现核心视觉效果而接受的、在可控范围内的安全风险。

## 4. 其他最佳实践

### 4.1. 错误处理

- **必须** 对所有可能失败的操作（如文件 I/O、IPC 调用、API 请求）进行错误处理。
- 使用 `try...catch` 块来捕获同步代码中的异常。
- 对于 Promise，使用 `.catch()` 或 `async/await` 配合 `try...catch`。
- 向用户提供清晰、有意义的错误信息，而不是直接暴露底层的技术错误。

### 4.2. 注释

- 为复杂的逻辑、算法或不直观的代码段添加注释，解释其“为什么”这么做，而不仅仅是“做了什么”。
- **推荐** 使用 JSDoc 格式为主要函数添加文档注释。

---

本规范将作为项目开发的基准。随着项目的发展，可以对其进行修订和完善。

---

## 5. 源码管理 (Source Control)

### 5.1. Git 工作流

- **分支模型**: 推荐使用 `Git Flow` 或类似的简化模型。
  - `main` (或 `master`): 用于存放发布版本的稳定代码。只接受来自 `develop` 分支的合并。
  - `develop`: 日常开发的主分支。所有新功能分支都从这里创建。
  - `feature/xxx`: 用于开发新功能的分支，例如 `feature/add-password-input`。完成后合并回 `develop`。
  - `release/vx.x.x`: 用于准备发布新版本的分支，主要进行版本号更新和最后的测试。
  - `hotfix/xxx`: 用于修复线上版本的紧急 bug。

### 5.2. 提交信息 (Commit Messages)

- **推荐** 遵循 `Conventional Commits` 规范，这有助于自动化生成 CHANGELOG 和版本管理，使提交历史更清晰。
- 格式: `<type>(<scope>): <subject>`
  - `type`: `feat` (新功能), `fix` (bug修复), `docs` (文档), `style` (格式), `refactor` (重构), `test` (测试), `chore` (构建或辅助工具) 等。
  - `scope` (可选): 修改的范围，如 `generator`, `ui`, `build`。
  - `subject`: 简短的提交描述。
- **示例**:
  - `feat(ui): add input field for server password`
  - `fix(generator): correct IP allocation logic for dual-node setup`
  - `docs(readme): update usage instructions`

### 5.3. .gitignore

- **必须** 维护一个全面的 `.gitignore` 文件，以避免将不必要的文件提交到仓库中。
- **必须** 忽略的文件包括:
  - `node_modules/`
  - `dist/` 或其它构建输出目录
  - `.env` 或其它本地配置文件
  - 操作系统生成的文件 (如 `.DS_Store`, `Thumbs.db`)
  - IDE 或编辑器的配置文件 (如 `.vscode/`, `.idea/`)

## 6. 构建与打包 (Build & Packaging)

### 6.1. 版本号管理

- **必须** 遵循 `语义化版本 (Semantic Versioning)` 规范 (主版本号.次版本号.修订号)。
  - `主版本号 (MAJOR)`: 当你做了不兼容的 API 修改。
  - `次版本号 (MINOR)`: 当你做了向下兼容的功能性新增。
  - `修订号 (PATCH)`: 当你做了向下兼容的问题修正。
- 版本号的更新应在 `package.json` 中进行。

### 6.2. 打包配置

- **打包目标**: 项目已配置为生成 `portable` (便携版/绿色版)，这是一个很好的实践，方便用户使用。
- **图标和元数据**:
  - **必须** 确保 `electron-builder` 配置 (`package.json` 中的 `build` 字段) 中包含了所有必要的元数据，如 `appId`, `productName`, `author` 等。
  - **必须** 为所有目标平台提供高质量的应用图标。
- **文件包含**:
  - `build.files` 配置应尽可能精确，只包含应用运行所必需的文件，以减小最终包的体积。避免使用过于宽泛的模式如 `**/*`，除非确实需要。
- **代码签名**: 对于正式发布的版本，**强烈推荐** 进行代码签名，以提升应用在 Windows 和 macOS 上的可信度，避免被安全软件拦截。

### 6.3. 持续集成 (CI)

- **推荐** 引入持续集成/持续部署 (CI/CD) 流程 (如使用 GitHub Actions, GitLab CI)。
- CI 流程应至少包含以下步骤:
  1. 安装依赖 (`yarn install`)
  2. 代码风格检查/Linter (`yarn lint`)
  3. 自动化测试 (`yarn test`)
  4. 构建和打包 (`yarn dist`)
  5. (可选) 创建 Release 并上传构建产物。

### 6.4. 推荐的构建流程

为了解决在国内网络环境下依赖安装可能出现的下载失败问题，并确保打包过程的稳定性，强烈推荐遵循以下流程：

1.  **环境准备**:
    - **安装 Yarn**: 本项目**必须**使用 `Yarn` 作为包管理器，它在处理依赖和缓存方面通常比 `npm` 更稳定。如果您的系统中没有 `Yarn`，请先通过 `npm` 全局安装：
      ```bash
      npm install -g yarn
      ```
    - **镜像配置**: 项目根目录下已包含一个 `.npmrc` 文件，它会自动将 `yarn` 的下载源指向国内的淘宝镜像，并为 `Electron` 的下载配置专用镜像。**请不要删除此文件**。

2.  **首次构建或遇到问题时**:
    - **彻底清理**: 如果是第一次构建，或之前的构建失败了，请先执行清理命令，删除所有旧的依赖和锁定文件，确保一个干净的环境。在项目根目录 (`ZTEuSmartViewLLD/`) 下打开终端并执行：
      ```powershell
      # For Windows (PowerShell)
      Remove-Item -Recurse -Force node_modules, yarn.lock
      ```
      *注：本项目已移除对 `npm` 的支持，只保留 `yarn.lock` 锁定文件。*

3.  **执行构建**:
    - **安装依赖**: 在项目根目录下，运行以下命令来安装所有依赖。`Yarn` 会自动读取 `.npmrc` 配置进行加速。
      ```bash
      yarn install
      ```
    - **启动开发服务器**: 开发时运行：
      ```bash
      yarn start
      ```
    - **执行打包**: 构建生产版本时运行：
      ```bash
      yarn dist
      ```

4.  **获取产物**:
    - 打包成功后，您需要的免安装绿色版软件将会出现在项目根目录下的 `dist/` 文件夹内。

### 6.5. 包管理器规范

- **必须** 使用 `Yarn` 作为唯一的包管理器。
- **禁止** 使用 `npm` 进行依赖安装或脚本执行。
- **禁止** 提交 `package-lock.json` 文件到版本控制系统。
- **必须** 提交 `yarn.lock` 文件到版本控制系统以确保依赖版本一致性。

---

## 7. 测试策略 (Testing Strategy)

为保证代码质量和功能稳定性，尤其是在进行功能更新或重构时，必须建立测试策略。

- **单元测试 (Unit Tests)**:
  - **范围**: **强烈推荐** 为核心业务逻辑 (`generator.js`) 编写单元测试。这能极大地保证代码质量，并在未来重构或添加新功能时提供信心。
  - **工具**: 推荐使用 `Jest` 或 `Mocha` 等流行的测试框架。
  - **位置**: 测试文件应与源文件放在一起，并以 `.test.js` 或 `.spec.js` 结尾 (例如 `generator.test.js`)。

- **端到端测试 (End-to-End Tests)**:
  - **范围**: **推荐** 为关键的用户操作流程编写端到端测试，例如“填写表单 -> 点击生成 -> 验证文件保存对话框弹出”。
  - **工具**: 推荐使用 `Spectron` (已废弃，但适用于旧版Electron) 或 `Playwright` for Electron。

## 8. 依赖管理 (Dependency Management)

- **更新依赖**:
  - **定期审查**: 应定期（例如每季度）审查项目依赖，检查是否存在已知的安全漏洞。可以使用 `yarn audit` 命令进行检查。
  - **谨慎升级**: 在升级依赖，特别是主版本升级时，必须进行充分的测试，以确保没有引入不兼容的变更。

- **添加依赖**:
  - **最小化原则**: 只添加确实需要的依赖。避免为了一个简单的功能而引入一个庞大的库。
  - **区分类型**: 明确区分 `dependencies` (应用运行时需要) 和 `devDependencies` (仅在开发和构建时需要)。

## 9. 文档与变更日志 (Documentation & Changelog)

- **README.md**:
  - **必须** 保持 `README.md` 的更新。它应至少包含：项目简介、功能截图、如何安装和使用、如何参与开发。

- **变更日志 (CHANGELOG.md)**:
  - **必须** 维护一个 `CHANGELOG.md` 文件，记录每个版本的重要变更。
  - **自动化**: **强烈推荐** 使用 `standard-version` 或类似工具，它可以根据 `Conventional Commits` 规范自动生成或更新 `CHANGELOG.md` 并管理版本号。

---

## 10. 兼容性 (Compatibility)

### 10.1. 目标平台

- **核心要求**: 为了实现最大兼容性，本项目打包的绿色免安装软件 **必须** 能够在以下 Windows 操作系统上正常运行：
  - Windows 11
  - Windows 10
  - Windows 7

### 10.2. 技术选型与限制

- **Electron 版本**:
  - **必须** 使用 `Electron v22.x.x` 或更早的版本。从 `v23.0.0` 开始，Electron 已不再支持 Windows 7/8/8.1。
  - 当前项目的 `package.json` 中应明确锁定一个兼容的 Electron 版本，以防止意外升级导致兼容性问题。

- **Node.js 和 Chromium 版本**:
  - 开发者应知晓所选 Electron 版本捆绑的 Node.js 和 Chromium 版本。
  - **禁止** 使用目标平台（尤其是 Windows 7 的 Chromium 环境）不支持的 JavaScript (ES) 新特性或 Web API。例如，在编写 `renderer` 进程代码时，应避免使用过于前沿的 CSS 属性或 DOM API。
  - **推荐** 在 Can I use... 等网站上查询特性的兼容性。

### 10.3. 构建与打包

- **`electron-builder` 配置**:
  - 在 `package.json` 的 `build.win` 配置中，可以考虑为不同的 Windows 架构（如 `x64`, `ia32`）进行构建，以覆盖更多用户场景。
  - 目标配置应明确，例如：
    ```json
    "win": {
      "target": "portable",
      "icon": "build/logo5.ico"
    }
    ```

### 10.4. 代码实践

- **避免平台特有 API**:
  - **禁止** 在没有提供回退方案（fallback）的情况下，使用特定 Windows 版本独有的原生 API 或模块。
  - 如果必须使用，应通过代码检查操作系统版本，并为旧版本提供替代功能或优雅降级。
- **依赖项兼容性**:
  - 在添加新的 Node.js 依赖时，**必须** 检查其是否兼容 Windows 7。部分原生模块可能依赖于较新版本的 Windows API 或运行时库。
