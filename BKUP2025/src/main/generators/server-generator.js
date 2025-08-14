/**
 * 服务器生成模块
 */

const { NOT_APPLICABLE_TEXT, SERVER_TYPES } = require('../constants');
const { pad } = require('../utils/ip-utils');

/**
 * 生成服务器名称
 * @param {string} type - 服务器类型
 * @param {number} idx - 索引
 * @param {Object} prefixes - 前缀配置
 * @returns {string} 服务器名称
 */
const generateServerName = (type, idx, prefixes) => {
    let prefix = NOT_APPLICABLE_TEXT;
    switch (type) {
        case SERVER_TYPES.MANAGEMENT:
            prefix = prefixes.mng;
            break;
        case SERVER_TYPES.COMPUTE:
        case SERVER_TYPES.FUSION:
            prefix = prefixes.fusion;
            break;
        case SERVER_TYPES.STORAGE:
            prefix = prefixes.stor;
            break;
        case SERVER_TYPES.CAG:
            prefix = prefixes.cag || 'CAG';
            break;
        default:
            return NOT_APPLICABLE_TEXT;
    }

    if (prefix === NOT_APPLICABLE_TEXT || idx === 0) {
        return prefix;
    }
    return `${prefix}${pad(idx)}`;
};

/**
 * 创建服务器对象
 * @param {string} hostname - 主机名
 * @param {string} role - 角色
 * @param {string} mngIp - 管理网IP
 * @param {string} bizIp - 业务网IP
 * @param {string} pubIp - 存储公共网IP
 * @param {string} cluIp - 存储集群网IP
 * @param {string} floatIp - 浮动IP
 * @returns {Object} 服务器对象
 */
const createServerObject = (hostname, role, mngIp, bizIp, pubIp, cluIp, floatIp) => {
    // 检查是否为浮动IP服务器
    const isFloatingIp = role.includes('浮动IP') || role.includes('浮动');

    return {
        hostname,
        role,
        mngIp,
        bizIp,
        pubIp,
        cluIp,
        floatIp,
        isFloatingIp, // 添加标识字段
        specs: getServerSpecs(role),
    };
};

/**
 * 获取服务器规格
 * @param {string} role - 服务器角色
 * @returns {Object} 服务器规格
 */
const getServerSpecs = (role) => {
    const specs = {
        cpu: '待定',
        memory: '待定',
        storage: '待定',
        network: '待定',
    };

    switch (role) {
        case SERVER_TYPES.MANAGEMENT:
            specs.cpu = '16C';
            specs.memory = '32G';
            specs.storage = '500G SSD';
            specs.network = '4*10GE';
            break;
        case SERVER_TYPES.COMPUTE:
            specs.cpu = '32C';
            specs.memory = '128G';
            specs.storage = '500G SSD';
            specs.network = '4*10GE';
            break;
        case SERVER_TYPES.FUSION:
            specs.cpu = '32C';
            specs.memory = '128G';
            specs.storage = '500G SSD + 4*2T HDD';
            specs.network = '4*10GE';
            break;
        case SERVER_TYPES.STORAGE:
            specs.cpu = '16C';
            specs.memory = '64G';
            specs.storage = '500G SSD + 8*2T HDD';
            specs.network = '4*10GE';
            break;
        case SERVER_TYPES.CAG:
            specs.cpu = '8C';
            specs.memory = '16G';
            specs.storage = '500G SSD';
            specs.network = '4*10GE';
            break;
    }

    return specs;
};

/**
 * 生成管理服务器
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 服务器列表
 */
const generateManagementServers = (params, ipManager) => {
    const { countMng, isDualNode, isCephDual, prefixMng, alignFloatIp } = params;
    const servers = [];

    for (let i = 1; i <= countMng; i++) {
        const hostname = generateServerName(SERVER_TYPES.MANAGEMENT, i, { mng: prefixMng });
        const mngIp = ipManager.getNextIp('management');
        const bizIp = params.isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business');
        const pubIp = ipManager.getNextIp('storagePublic');
        const cluIp = ipManager.getNextIp('storageCluster');

        servers.push(
            createServerObject(hostname, SERVER_TYPES.MANAGEMENT, mngIp, bizIp, pubIp, cluIp, NOT_APPLICABLE_TEXT)
        );

        // 在第2台管理服务器后生成浮动IP服务器条目（按照原始js1.txt逻辑）
        if (i === 2 && isDualNode) {
            // 生成管理节点浮动IP
            const mngFloatIp = ipManager.getNextIp('management');
            const bizFloatIp = params.isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business');
            // 根据alignFloatIp选项决定是否为浮动IP分配存储地址
            const pubFloatIp = alignFloatIp ? ipManager.getNextIp('storagePublic') : NOT_APPLICABLE_TEXT;
            const cluFloatIp = alignFloatIp ? ipManager.getNextIp('storageCluster') : NOT_APPLICABLE_TEXT;
            servers.push(
                createServerObject(
                    '管理节点浮动IP',
                    '管理节点浮动IP',
                    mngFloatIp,
                    bizFloatIp,
                    pubFloatIp,
                    cluFloatIp,
                    NOT_APPLICABLE_TEXT
                )
            );

            // 如果启用了Ceph双机，生成ceph管理浮动IP
            if (isCephDual) {
                const cephFloatIp = ipManager.getNextIp('management');
                // ceph管理浮动IP不需要业务网，但可能需要存储网（根据alignFloatIp选项）
                const cephPubFloatIp = alignFloatIp ? ipManager.getNextIp('storagePublic') : NOT_APPLICABLE_TEXT;
                const cephCluFloatIp = alignFloatIp ? ipManager.getNextIp('storageCluster') : NOT_APPLICABLE_TEXT;
                servers.push(
                    createServerObject(
                        'ceph管理浮动IP',
                        'ceph管理浮动IP',
                        cephFloatIp,
                        NOT_APPLICABLE_TEXT,
                        cephPubFloatIp,
                        cephCluFloatIp,
                        NOT_APPLICABLE_TEXT
                    )
                );
            }
        }
    }

    return servers;
};

/**
 * 生成计算服务器
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 服务器列表
 */
const generateComputeServers = (params, ipManager) => {
    const { countCalc, prefixFusion } = params;
    const servers = [];

    for (let i = 1; i <= countCalc; i++) {
        const hostname = generateServerName(SERVER_TYPES.COMPUTE, i, { fusion: prefixFusion });
        const mngIp = ipManager.getNextIp('management');
        const bizIp = params.isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business');
        const pubIp = ipManager.getNextIp('storagePublic');
        const cluIp = NOT_APPLICABLE_TEXT; // 计算服务器不需要集群网

        servers.push(
            createServerObject(hostname, SERVER_TYPES.COMPUTE, mngIp, bizIp, pubIp, cluIp, NOT_APPLICABLE_TEXT)
        );
    }

    return servers;
};

/**
 * 生成超融合服务器
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 服务器列表
 */
const generateFusionServers = (params, ipManager) => {
    const { countFusion, prefixFusion } = params;
    const servers = [];

    for (let i = 1; i <= countFusion; i++) {
        const hostname = generateServerName(SERVER_TYPES.FUSION, i, { fusion: prefixFusion });
        const mngIp = ipManager.getNextIp('management');
        const bizIp = params.isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business');
        const pubIp = ipManager.getNextIp('storagePublic');
        const cluIp = ipManager.getNextIp('storageCluster');

        servers.push(
            createServerObject(hostname, SERVER_TYPES.FUSION, mngIp, bizIp, pubIp, cluIp, NOT_APPLICABLE_TEXT)
        );
    }

    return servers;
};

/**
 * 生成存储服务器
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 服务器列表
 */
const generateStorageServers = (params, ipManager) => {
    const { countStor, prefixStor } = params;
    const servers = [];

    for (let i = 1; i <= countStor; i++) {
        const hostname = generateServerName(SERVER_TYPES.STORAGE, i, { stor: prefixStor });
        const mngIp = ipManager.getNextIp('management');
        const bizIp = NOT_APPLICABLE_TEXT; // 存储服务器不需要业务网
        const pubIp = ipManager.getNextIp('storagePublic');
        const cluIp = ipManager.getNextIp('storageCluster');

        servers.push(
            createServerObject(hostname, SERVER_TYPES.STORAGE, mngIp, bizIp, pubIp, cluIp, NOT_APPLICABLE_TEXT)
        );
    }

    return servers;
};

/**
 * 生成CAG服务器
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 服务器列表
 */
const generateCAGServers = (params, ipManager) => {
    const { countCAG, prefixCAG } = params;
    const servers = [];

    for (let i = 1; i <= countCAG; i++) {
        const hostname = generateServerName(SERVER_TYPES.CAG, i, { cag: prefixCAG });
        const mngIp = ipManager.getNextIp('management');
        const bizIp = params.isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business');
        const pubIp = NOT_APPLICABLE_TEXT; // CAG服务器不需要存储网
        const cluIp = NOT_APPLICABLE_TEXT;

        servers.push(createServerObject(hostname, SERVER_TYPES.CAG, mngIp, bizIp, pubIp, cluIp, NOT_APPLICABLE_TEXT));
    }

    return servers;
};

/**
 * 生成所有服务器
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 服务器列表
 */
const generateAllServers = (params, ipManager) => {
    const servers = [];

    // 生成管理服务器
    servers.push(...generateManagementServers(params, ipManager));

    // 根据模式生成计算/超融合服务器
    if (params.isFusionNode) {
        servers.push(...generateFusionServers(params, ipManager));
    } else {
        servers.push(...generateComputeServers(params, ipManager));
        servers.push(...generateStorageServers(params, ipManager));
    }

    // 注意：CAG服务器不在物理服务器规划中生成
    // CAG虚机在功能虚机规划中生成

    return servers;
};

module.exports = {
    generateServerName,
    createServerObject,
    getServerSpecs,
    generateManagementServers,
    generateComputeServers,
    generateFusionServers,
    generateStorageServers,
    generateCAGServers,
    generateAllServers,
};
