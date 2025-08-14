/**
 * 测试辅助工具函数
 * 提供测试中常用的工具方法
 */

/**
 * 生成随机IP地址
 * @param {string} network - 网络段，如 '192.168.1'
 * @returns {string} 完整的IP地址
 */
function generateRandomIp(network = '192.168.1') {
    const lastOctet = Math.floor(Math.random() * 254) + 1;
    return `${network}.${lastOctet}`;
}

/**
 * 生成随机服务器配置
 * @param {object} overrides - 覆盖默认配置的属性
 * @returns {object} 服务器配置对象
 */
function generateServerConfig(overrides = {}) {
    const defaultConfig = {
        name: `SRV-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        ip: generateRandomIp(),
        role: 'compute',
        specs: {
            cpu: '16C',
            memory: '32G',
            storage: '500G SSD',
        },
    };

    return { ...defaultConfig, ...overrides };
}

/**
 * 生成随机虚拟机配置
 * @param {object} overrides - 覆盖默认配置的属性
 * @returns {object} 虚拟机配置对象
 */
function generateVmConfig(overrides = {}) {
    const defaultConfig = {
        name: `VM-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        ip: generateRandomIp('10.0.1'),
        host: 'SRV-COMP-01',
        specs: {
            cpu: '4C',
            memory: '8G',
            storage: '100G',
        },
    };

    return { ...defaultConfig, ...overrides };
}

/**
 * 生成IP池配置
 * @param {string} type - IP池类型
 * @param {string} network - 网络段
 * @returns {object} IP池配置对象
 */
function generateIpPool(type = 'management', network = null) {
    const networks = {
        management: '192.168.1.0/24',
        business: '10.0.0.0/16',
        storage: '172.16.0.0/12',
    };

    return {
        network: network || networks[type] || '192.168.1.0/24',
        type,
        description: `${type}网络段`,
    };
}

/**
 * 创建模拟的用户参数
 * @param {object} overrides - 覆盖默认参数的属性
 * @returns {object} 用户参数对象
 */
function createMockUserParams(overrides = {}) {
    const defaultParams = {
        userCount: 1000,
        mngNetwork: '192.168.1.0/24',
        bizNetwork: '10.0.0.0/16',
        storageNetwork: '172.16.0.0/12',
        serverPrefix: 'SRV',
        vmPrefix: 'VM',
        deploymentType: 'production',
        redundancy: true,
    };

    return { ...defaultParams, ...overrides };
}

/**
 * 验证IP地址格式
 * @param {string} ip - IP地址
 * @returns {boolean} 是否为有效IP地址
 */
function isValidIp(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

/**
 * 验证网络段格式
 * @param {string} network - 网络段，如 '192.168.1.0/24'
 * @returns {boolean} 是否为有效网络段
 */
function isValidNetwork(network) {
    const networkRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
    return networkRegex.test(network);
}

/**
 * 等待指定时间
 * @param {number} ms - 等待时间（毫秒）
 * @returns {Promise} Promise对象
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 创建模拟的Excel数据
 * @param {number} serverCount - 服务器数量
 * @param {number} vmCount - 虚拟机数量
 * @returns {object} Excel数据对象
 */
function createMockExcelData(serverCount = 2, vmCount = 4) {
    const servers = [];
    const vms = [];

    // 生成服务器数据
    for (let i = 1; i <= serverCount; i++) {
        servers.push(
            generateServerConfig({
                name: `SRV-${i.toString().padStart(2, '0')}`,
                ip: generateRandomIp('192.168.1'),
            })
        );
    }

    // 生成虚拟机数据
    for (let i = 1; i <= vmCount; i++) {
        vms.push(
            generateVmConfig({
                name: `VM-${i.toString().padStart(2, '0')}`,
                ip: generateRandomIp('10.0.1'),
                host: servers[i % serverCount].name,
            })
        );
    }

    return {
        servers,
        vms,
        summary: {
            totalServers: serverCount,
            totalVMs: vmCount,
            totalIPs: serverCount + vmCount,
            networks: [generateIpPool('management'), generateIpPool('business'), generateIpPool('storage')],
        },
        ipUsage: {
            management: {
                total: 254,
                used: serverCount + vmCount,
                available: 254 - serverCount - vmCount,
            },
            business: {
                total: 65534,
                used: vmCount,
                available: 65534 - vmCount,
            },
            storage: {
                total: 1048574,
                used: serverCount,
                available: 1048574 - serverCount,
            },
        },
    };
}

/**
 * 模拟异步操作
 * @param {any} result - 返回结果
 * @param {number} delay - 延迟时间（毫秒）
 * @param {boolean} shouldReject - 是否应该拒绝
 * @returns {Promise} Promise对象
 */
function mockAsync(result, delayMs = 100, shouldReject = false) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (shouldReject) {
                reject(new Error(result || '模拟异步错误'));
            } else {
                resolve(result);
            }
        }, delayMs);
    });
}

/**
 * 创建模拟的文件路径
 * @param {string} filename - 文件名
 * @param {string} extension - 文件扩展名
 * @returns {string} 模拟的文件路径
 */
function createMockFilePath(filename = 'test', extension = 'xlsx') {
    const timestamp = Date.now();
    return `/mock/path/${filename}_${timestamp}.${extension}`;
}

/**
 * 验证对象是否包含必需的属性
 * @param {object} obj - 要验证的对象
 * @param {string[]} requiredProps - 必需的属性列表
 * @returns {boolean} 是否包含所有必需属性
 */
function hasRequiredProperties(obj, requiredProps) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return requiredProps.every((prop) => obj.hasOwnProperty(prop));
}

/**
 * 深度克隆对象
 * @param {any} obj - 要克隆的对象
 * @returns {any} 克隆后的对象
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
        return obj.map((item) => deepClone(item));
    }

    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }

    return cloned;
}

// 添加mockUserParams函数
function mockUserParams(overrides = {}) {
    return createMockUserParams(overrides);
}

module.exports = {
    generateRandomIp,
    generateServerConfig,
    generateVmConfig,
    generateIpPool,
    createMockUserParams,
    mockUserParams,
    isValidIp,
    isValidNetwork,
    delay,
    createMockExcelData,
    mockAsync,
    createMockFilePath,
    hasRequiredProperties,
    deepClone,
};
