/**
 * 日志服务
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * 日志级别
 */
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
};

/**
 * 日志级别名称
 */
const LOG_LEVEL_NAMES = {
    0: 'ERROR',
    1: 'WARN',
    2: 'INFO',
    3: 'DEBUG',
};

/**
 * Logger类
 */
class Logger {
    constructor(options = {}) {
        this.level = options.level || LOG_LEVELS.INFO;
        this.enableConsole = options.enableConsole !== false;
        this.enableFile = options.enableFile !== false;
        this.logDir = options.logDir || path.join(app.getPath('userData'), 'logs');
        this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
        this.maxFiles = options.maxFiles || 5;

        // 确保日志目录存在
        this.ensureLogDir();

        // 当前日志文件路径
        this.currentLogFile = path.join(this.logDir, `app-${this.getDateString()}.log`);
    }

    /**
     * 确保日志目录存在
     */
    ensureLogDir() {
        if (this.enableFile && !fs.existsSync(this.logDir)) {
            try {
                fs.mkdirSync(this.logDir, { recursive: true });
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to create log directory:', error);
                this.enableFile = false;
            }
        }
    }

    /**
     * 获取日期字符串
     * @returns {string} 日期字符串
     */
    getDateString() {
        return new Date().toISOString().slice(0, 10);
    }

    /**
     * 获取时间戳
     * @returns {string} 时间戳
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * 格式化日志消息
     * @param {number} level - 日志级别
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     * @returns {string} 格式化后的消息
     */
    formatMessage(level, message, meta = {}) {
        const timestamp = this.getTimestamp();
        const levelName = LOG_LEVEL_NAMES[level];
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${levelName}] ${message}${metaStr}`;
    }

    /**
     * 写入日志到文件
     * @param {string} formattedMessage - 格式化后的消息
     */
    writeToFile(formattedMessage) {
        if (!this.enableFile) return;

        try {
            // 检查文件大小，如果超过限制则轮转
            if (fs.existsSync(this.currentLogFile)) {
                const stats = fs.statSync(this.currentLogFile);
                if (stats.size > this.maxFileSize) {
                    this.rotateLogFile();
                }
            }

            // 写入日志
            fs.appendFileSync(this.currentLogFile, formattedMessage + '\n', 'utf8');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to write log to file:', error);
        }
    }

    /**
     * 轮转日志文件
     */
    rotateLogFile() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const rotatedFile = path.join(this.logDir, `app-${timestamp}.log`);
            fs.renameSync(this.currentLogFile, rotatedFile);

            // 清理旧日志文件
            this.cleanOldLogFiles();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to rotate log file:', error);
        }
    }

    /**
     * 清理旧日志文件
     */
    cleanOldLogFiles() {
        try {
            const files = fs
                .readdirSync(this.logDir)
                .filter((file) => file.startsWith('app-') && file.endsWith('.log'))
                .map((file) => ({
                    name: file,
                    path: path.join(this.logDir, file),
                    mtime: fs.statSync(path.join(this.logDir, file)).mtime,
                }))
                .sort((a, b) => b.mtime - a.mtime);

            // 删除超过最大文件数的旧文件
            if (files.length > this.maxFiles) {
                files.slice(this.maxFiles).forEach((file) => {
                    fs.unlinkSync(file.path);
                });
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to clean old log files:', error);
        }
    }

    /**
     * 记录日志
     * @param {number} level - 日志级别
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    log(level, message, meta = {}) {
        if (level > this.level) return;

        const formattedMessage = this.formatMessage(level, message, meta);

        // 输出到控制台
        if (this.enableConsole) {
            const consoleMethod = level === LOG_LEVELS.ERROR ? 'error' : level === LOG_LEVELS.WARN ? 'warn' : 'log';
            // eslint-disable-next-line no-console
            console[consoleMethod](formattedMessage);
        }

        // 写入文件
        this.writeToFile(formattedMessage);
    }

    /**
     * 错误日志
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    error(message, meta = {}) {
        this.log(LOG_LEVELS.ERROR, message, meta);
    }

    /**
     * 警告日志
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    warn(message, meta = {}) {
        this.log(LOG_LEVELS.WARN, message, meta);
    }

    /**
     * 信息日志
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    info(message, meta = {}) {
        this.log(LOG_LEVELS.INFO, message, meta);
    }

    /**
     * 调试日志
     * @param {string} message - 消息
     * @param {Object} meta - 元数据
     */
    debug(message, meta = {}) {
        this.log(LOG_LEVELS.DEBUG, message, meta);
    }

    /**
     * 获取日志文件列表
     * @returns {string[]} 日志文件路径列表
     */
    getLogFiles() {
        if (!this.enableFile || !fs.existsSync(this.logDir)) {
            return [];
        }

        try {
            return fs
                .readdirSync(this.logDir)
                .filter((file) => file.startsWith('app-') && file.endsWith('.log'))
                .map((file) => path.join(this.logDir, file));
        } catch (error) {
            this.error('Failed to get log files', { error: error.message });
            return [];
        }
    }

    /**
     * 清理所有日志文件
     */
    clearAllLogs() {
        const logFiles = this.getLogFiles();
        logFiles.forEach((file) => {
            try {
                fs.unlinkSync(file);
            } catch (error) {
                this.error('Failed to delete log file', { file, error: error.message });
            }
        });
    }
}

// 创建默认logger实例
const logger = new Logger({
    level: process.env.NODE_ENV === 'development' ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO,
    enableConsole: true,
    enableFile: true,
});

module.exports = {
    Logger,
    LOG_LEVELS,
    logger,
};
