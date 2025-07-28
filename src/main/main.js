/**
 * 主进程入口文件 (重构版)
 */

const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { generatePlan } = require('./generator.js');
const { generateExcelFile } = require('./services/excel-service');
const { logger } = require('./services/logger');

/**
 * 验证缓存比是否满足要求
 * @param {Object} params - 参数对象
 * @returns {Object} 验证结果
 */
function validateCacheRatio(params) {
    const { ssdCount = 2, ssdSpec = '1.92TB', hddCount = 4, hddSpec = '8TB', osdReservedSize = 0 } = params;

    // 解析SSD和HDD规格（去掉TB后缀）
    const ssdSizePerDisk = parseFloat(ssdSpec.replace(/TB/i, ''));
    const hddSizePerDisk = parseFloat(hddSpec.replace(/TB/i, ''));

    // 计算缓存比：(ssd个数 * ssd磁盘大小 - 单盘OSD预留大小 * ssd个数) / (hdd个数 * hdd磁盘大小)
    const totalSsdSize = ssdCount * ssdSizePerDisk;
    const totalReservedSize = ssdCount * osdReservedSize;
    const availableCacheSize = totalSsdSize - totalReservedSize;
    const totalHddSize = hddCount * hddSizePerDisk;

    if (totalHddSize <= 0) {
        return {
            valid: false,
            error: 'HDD配置无效，无法计算缓存比',
        };
    }

    const cacheRatio = availableCacheSize / totalHddSize;

    if (cacheRatio < 0.07) {
        return {
            valid: false,
            error: `缓存比过低：${(cacheRatio * 100).toFixed(1)}%，要求至少7%。请调整SSD/HDD配置或减少OSD预留大小。`,
        };
    }

    return {
        valid: true,
        cacheRatio: cacheRatio,
    };
}

// --- 应用信息常量 ---
const APP_INFO = {
    title: '关于 ZTEuSmartViewLLD',
    message: 'ZTEuSmartViewLLD v1.0.1',
    detail: '软件作者：罗发文\n联系方式：15029342400\n\n版本号：v1.0.1\n更新日期：2025-07-27\n\n云电脑LLD生成工具\n© 2025 网络服务处视频交付科\n\n版本更新：\n• 修复CAG虚机IP分配规则\n• 优化Excel表格列名\n• 增加特别鸣谢功能\n• 去掉规划摘要sheet页',
};

/**
 * 创建主窗口
 */
function createWindow() {
    logger.info('Creating main window');

    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 900,
        minHeight: 650,
        icon: path.join(__dirname, '../../build/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // 开发环境下打开开发者工具
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // 创建菜单
    createMenu(mainWindow);

    // 窗口事件监听
    mainWindow.on('closed', () => {
        logger.info('Main window closed');
    });

    mainWindow.on('ready-to-show', () => {
        logger.info('Main window ready to show');
    });

    return mainWindow;
}

/**
 * 创建应用菜单
 * @param {BrowserWindow} mainWindow - 主窗口
 */
function createMenu(mainWindow) {
    const menuTemplate = [
        {
            label: '关于',
            click: () => {
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: APP_INFO.title,
                    message: APP_INFO.message,
                    detail: APP_INFO.detail,
                    buttons: [],
                    noLink: true,
                    textWidth: 300,
                });
            },
        },
        {
            label: '特别鸣谢',
            click: () => {
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: '特别鸣谢',
                    message: '感谢内测团队的大力支持！',
                    detail: '特别感谢以下同事在内测过程中提供的宝贵帮助和建议：\n\n内测团队成员（按姓氏首字母排序）：\n• 杨帅6000021393\n• 同事B\n• 同事C\n• 同事D\n• 同事E\n• 同事F\n\n感谢大家在功能测试、用户体验优化、错误反馈等方面的大力支持！\n\n——ZTE uSmartView LLD Generator 开发团队',
                    buttons: [],
                    noLink: true,
                    textWidth: 400,
                });
            },
        },
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

/**
 * 应用程序就绪时的处理
 */
app.whenReady().then(() => {
    logger.info('Application started', { version: app.getVersion(), platform: process.platform });

    createWindow();

    app.on('activate', () => {
        // macOS 特有行为
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

/**
 * 所有窗口关闭时的处理
 */
app.on('window-all-closed', () => {
    logger.info('All windows closed');

    // macOS 上除非用户明确退出，否则保持应用运行
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/**
 * 处理打开日志文件的IPC请求
 */
ipcMain.handle('open-log-file', async () => {
    try {
        const { shell } = require('electron');
        const logPath = path.join(__dirname, '../../logs/app.log');

        // 检查日志文件是否存在
        if (fs.existsSync(logPath)) {
            await shell.openPath(logPath);
            return { success: true };
        } else {
            return { success: false, error: '日志文件不存在' };
        }
    } catch (error) {
        logger.error('Failed to open log file', { error: error.message });
        return { success: false, error: error.message };
    }
});

/**
 * 处理生成Excel文件的IPC请求
 */
ipcMain.handle('generate-excel', async (event, params) => {
    const startTime = Date.now();
    logger.info('Starting Excel generation', {
        params: {
            userCount: params.userCount,
            scene: params.scene,
            isNetCombined: params.isNetCombined,
            isDualNode: params.isDualNode,
        },
    });

    try {
        // 1. 验证缓存比
        const cacheRatioValidation = validateCacheRatio(params);
        if (!cacheRatioValidation.valid) {
            logger.error('缓存比验证失败', { error: cacheRatioValidation.error });
            return {
                success: false,
                error: cacheRatioValidation.error,
                code: 'CACHE_RATIO_TOO_LOW',
            };
        }

        // 2. 生成规划
        const plan = generatePlan(params);

        if (plan.error) {
            logger.error('规划生成失败', { error: plan.error, code: plan.code });
            return {
                success: false,
                error: plan.error,
                code: plan.code,
            };
        }

        logger.info('Planning generated successfully', {
            servers: plan.servers.length,
            vms: plan.vms.length,
            clusters: plan.storagePlan.length,
        });

        // 2. 生成Excel文件
        const result = await generateExcelFile(plan, BrowserWindow.getFocusedWindow());

        const duration = Date.now() - startTime;

        if (result.success) {
            logger.info('Excel file generated successfully', {
                filePath: result.filePath,
                duration: `${duration}ms`,
            });
            return {
                success: true,
                filePath: result.filePath,
                summary: plan.summary,
                duration,
            };
        } else {
            logger.warn('Excel文件生成取消或失败', {
                message: result.message,
                duration: `${duration}ms`,
            });
            return {
                success: false,
                error: result.message || result.error,
                duration,
            };
        }
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('生成Excel文件时发生异常', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`,
        });

        return {
            success: false,
            error: `生成失败: ${error.message}`,
            duration,
        };
    }
});

/**
 * 处理获取应用信息的IPC请求
 */
ipcMain.handle('get-app-info', async () => {
    return {
        version: app.getVersion(),
        name: app.getName(),
        platform: process.platform,
        arch: process.arch,
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
    };
});

/**
 * 处理应用程序错误
 */
process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常', { error: error.message, stack: error.stack });
    // 显示错误对话框但不退出应用
    dialog.showErrorBox('应用程序错误', `发生未预期的错误：${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝', { reason: reason?.toString(), promise: promise?.toString() });
});

/**
 * 应用程序退出时的清理
 */
app.on('before-quit', () => {
    logger.info('Application about to quit');

    // 这里可以添加清理逻辑
    // 如果需要阻止退出，可以调用 event.preventDefault()
});

app.on('will-quit', () => {
    logger.info('Application will quit');
});

/**
 * 安全相关设置
 */
app.on('web-contents-created', (event, contents) => {
    // 阻止新窗口创建
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        logger.warn('阻止创建新窗口', { url: navigationUrl });
    });

    // 阻止导航到外部URL
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.origin !== 'file://') {
            event.preventDefault();
            logger.warn('阻止导航到外部URL', { url: navigationUrl });
        }
    });
});

logger.info('Main process module loaded');
