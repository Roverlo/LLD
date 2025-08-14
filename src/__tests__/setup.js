/**
 * Jest测试环境设置文件
 * 配置全局测试环境和模拟对象
 */

// 模拟Electron环境
jest.mock('electron', () => ({
    app: {
        getPath: jest.fn(() => '/mock/path'),
        getName: jest.fn(() => 'ZTEuSmartViewLLD'),
        getVersion: jest.fn(() => '1.0.2'),
        quit: jest.fn(),
        on: jest.fn(),
        whenReady: jest.fn(() => Promise.resolve()),
    },
    BrowserWindow: jest.fn().mockImplementation(() => ({
        loadFile: jest.fn(),
        on: jest.fn(),
        webContents: {
            send: jest.fn(),
            on: jest.fn(),
        },
        show: jest.fn(),
        close: jest.fn(),
        isDestroyed: jest.fn(() => false),
    })),
    ipcMain: {
        handle: jest.fn(),
        on: jest.fn(),
        removeAllListeners: jest.fn(),
    },
    ipcRenderer: {
        invoke: jest.fn(),
        on: jest.fn(),
        removeAllListeners: jest.fn(),
    },
    Menu: {
        setApplicationMenu: jest.fn(),
        buildFromTemplate: jest.fn(),
    },
    dialog: {
        showSaveDialog: jest.fn(() => Promise.resolve({ filePath: '/mock/save/path.xlsx' })),
        showErrorBox: jest.fn(),
        showMessageBox: jest.fn(),
    },
}));

// 模拟文件系统操作
jest.mock('fs', () => ({
    existsSync: jest.fn(() => true),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(() => 'mock file content'),
    mkdirSync: jest.fn(),
    statSync: jest.fn(() => ({
        isDirectory: () => true,
        mtime: new Date(),
    })),
}));

// 模拟路径操作
jest.mock('path', () => ({
    join: jest.fn((...args) => args.join('/')),
    resolve: jest.fn((...args) => '/' + args.join('/')),
    dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
    basename: jest.fn((path) => path.split('/').pop()),
    extname: jest.fn((path) => {
        const parts = path.split('.');
        return parts.length > 1 ? '.' + parts.pop() : '';
    }),
}));

// 全局测试配置
global.console = {
    ...console,
    // 在测试中静默某些日志
    log: console.log, // 临时启用console.log用于调试
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn,
    error: console.error,
};

// 设置测试超时时间
jest.setTimeout(10000);

// 每个测试前清理模拟
beforeEach(() => {
    jest.clearAllMocks();
});
