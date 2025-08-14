/**
 * 存储规划生成模块
 */

const { STORAGE_POOLS } = require('../constants');

/**
 * 创建存储池对象
 * @param {string} pool - 存储池名称
 * @param {string} use - 用途
 * @param {string} replica - 副本策略
 * @param {string} type - 存储类型
 * @returns {Object} 存储池对象
 */
const createStoragePool = (pool, use, replica, type) => {
    return {
        pool,
        use,
        replica,
        type,
    };
};

/**
 * 创建存储集群对象
 * @param {string} name - 集群名称
 * @param {number} nodeCount - 节点数量
 * @param {Object[]} pools - 存储池列表
 * @returns {Object} 存储集群对象
 */
const createStorageCluster = (name, nodeCount, pools) => {
    return {
        name,
        nodeCount,
        nodes: Array.from({ length: nodeCount }, (_, i) => `节点${i + 1}`),
        pools,
        totalCapacity: '待计算',
        usableCapacity: '待计算',
    };
};

/**
 * 获取功能虚机存储池配置
 * @param {string} storageSecurity - 存储安全策略
 * @returns {Object[]} 存储池配置
 */
const getFuncVmPools = (storageSecurity) => {
    return STORAGE_POOLS.FUNC_VM.map((pool) => createStoragePool(pool.pool, pool.use, storageSecurity, pool.type));
};

/**
 * 获取桌面存储池配置
 * @param {string} storageSecurity - 存储安全策略
 * @param {boolean} hasHdd - 是否包含HDD
 * @returns {Object[]} 存储池配置
 */
const getDesktopPools = (storageSecurity, hasHdd = true) => {
    const pools = [];

    // SSD存储池
    pools.push(
        createStoragePool(
            STORAGE_POOLS.DESKTOP_SSD.pool,
            STORAGE_POOLS.DESKTOP_SSD.use,
            storageSecurity,
            STORAGE_POOLS.DESKTOP_SSD.type
        )
    );

    // HDD存储池（可选）
    if (hasHdd) {
        pools.push(
            createStoragePool(
                STORAGE_POOLS.DESKTOP_HDD.pool,
                STORAGE_POOLS.DESKTOP_HDD.use,
                storageSecurity,
                STORAGE_POOLS.DESKTOP_HDD.type
            )
        );
    }

    return pools;
};

/**
 * 生成Ceph集群规划
 * @param {Object} params - 参数
 * @returns {Object[]} 存储集群列表
 */
const generateCephClusters = (params) => {
    const { isFusionNode, isMngAsFusion, countMng, countFusion, countStor, storageSecurity, hasHdd = true } = params;

    const clusters = [];

    if (!isFusionNode || (isFusionNode && !isMngAsFusion)) {
        // 场景1: 分离模式 或 超融合模式但管理节点不参与
        const nodeCount = isFusionNode ? countFusion : countStor;
        const funcVmPools = getFuncVmPools(storageSecurity);
        const desktopPools = getDesktopPools(storageSecurity, hasHdd);

        const cluster = createStorageCluster('CEPH集群01', nodeCount, [...funcVmPools, ...desktopPools]);
        clusters.push(cluster);
    } else if (isFusionNode && isMngAsFusion) {
        // 场景2: 超融合模式且管理节点参与
        // 管理集群
        const mngCluster = createStorageCluster('CEPH_MNG', countMng, getFuncVmPools(storageSecurity));
        clusters.push(mngCluster);

        // 桌面集群
        const desktopCluster = createStorageCluster(
            'CEPH集群01',
            countFusion,
            getDesktopPools(storageSecurity, hasHdd)
        );
        clusters.push(desktopCluster);
    }

    return clusters;
};

/**
 * 计算存储容量
 * @param {Object} cluster - 存储集群
 * @param {string} storageSecurity - 存储安全策略
 * @returns {Object} 容量信息
 */
const calculateStorageCapacity = (cluster, storageSecurity) => {
    const { nodeCount } = cluster;

    // 假设每个节点的存储容量（这里需要根据实际硬件配置调整）
    const nodeCapacityTB = 8; // 每节点8TB
    const totalCapacityTB = nodeCount * nodeCapacityTB;

    let usableCapacityTB;
    let redundancyInfo;

    switch (storageSecurity) {
        case 'raid1':
            usableCapacityTB = totalCapacityTB / 2;
            redundancyInfo = '2副本';
            break;
        case 'raid5':
            usableCapacityTB = totalCapacityTB * 0.75; // 假设75%可用
            redundancyInfo = '3副本';
            break;
        case 'ec':
            usableCapacityTB = totalCapacityTB * 0.67; // 假设67%可用（4+2纠删码）
            redundancyInfo = '4+2纠删码';
            break;
        default:
            usableCapacityTB = totalCapacityTB * 0.5;
            redundancyInfo = '2副本';
    }

    return {
        totalCapacity: `${totalCapacityTB}TB`,
        usableCapacity: `${usableCapacityTB.toFixed(1)}TB`,
        redundancy: redundancyInfo,
    };
};

/**
 * 生成存储规划摘要
 * @param {Object[]} clusters - 存储集群列表
 * @param {string} storageSecurity - 存储安全策略
 * @returns {Object} 存储规划摘要
 */
const generateStorageSummary = (clusters, storageSecurity) => {
    let totalNodes = 0;
    let totalCapacityTB = 0;
    let totalUsableCapacityTB = 0;

    clusters.forEach((cluster) => {
        const capacity = calculateStorageCapacity(cluster, storageSecurity);
        totalNodes += cluster.nodeCount;
        totalCapacityTB += parseFloat(capacity.totalCapacity);
        totalUsableCapacityTB += parseFloat(capacity.usableCapacity);

        // 更新集群容量信息
        cluster.totalCapacity = capacity.totalCapacity;
        cluster.usableCapacity = capacity.usableCapacity;
        cluster.redundancy = capacity.redundancy;
    });

    return {
        totalClusters: clusters.length,
        totalNodes,
        totalCapacity: `${totalCapacityTB}TB`,
        totalUsableCapacity: `${totalUsableCapacityTB.toFixed(1)}TB`,
        redundancyStrategy: storageSecurity,
        clusters,
    };
};

/**
 * 验证存储配置
 * @param {Object} params - 参数
 * @returns {string[]} 警告信息
 */
const validateStorageConfig = (params) => {
    const { isFusionNode, countFusion, countStor, countMng, isMngAsFusion } = params;
    const warnings = [];

    if (!isFusionNode) {
        // 分离模式下，存储节点数量检查
        if (countStor < 3) {
            warnings.push('Ceph集群建议至少3个存储节点以保证高可用性');
        }
    } else {
        // 超融合模式下的检查
        if (isMngAsFusion) {
            if (countMng < 2) {
                warnings.push('管理节点参与存储时，建议至少2个管理节点');
            }
            if (countFusion < 3) {
                warnings.push('超融合集群建议至少3个节点以保证高可用性');
            }
        } else {
            if (countFusion < 3) {
                warnings.push('超融合集群建议至少3个节点以保证高可用性');
            }
        }
    }

    return warnings;
};

/**
 * 生成完整的存储规划
 * @param {Object} params - 参数
 * @returns {Object} 存储规划
 */
const generateStoragePlan = (params) => {
    const { storageSecurity } = params;

    // 验证存储配置
    const warnings = validateStorageConfig(params);

    // 生成Ceph集群
    const clusters = generateCephClusters(params);

    // 生成存储摘要
    const summary = generateStorageSummary(clusters, storageSecurity);

    return {
        summary,
        clusters,
        warnings,
        recommendations: generateStorageRecommendations(params, summary),
    };
};

/**
 * 生成存储建议
 * @param {Object} params - 参数
 * @param {Object} summary - 存储摘要
 * @returns {string[]} 建议列表
 */
const generateStorageRecommendations = (params, summary) => {
    const recommendations = [];
    const { userCount, storageSecurity } = params;

    // 基于用户量的建议
    if (userCount > 10000) {
        recommendations.push('用户量较大，建议使用纠删码以提高存储效率');
        recommendations.push('建议配置SSD缓存以提升性能');
    }

    // 基于存储策略的建议
    if (storageSecurity === 'raid1' && summary.totalNodes > 6) {
        recommendations.push('节点数量较多，建议考虑使用纠删码以提高存储利用率');
    }

    // 性能建议
    recommendations.push('建议定期监控存储性能和容量使用情况');
    recommendations.push('建议配置存储网络的冗余链路以提高可靠性');

    return recommendations;
};

module.exports = {
    createStoragePool,
    createStorageCluster,
    getFuncVmPools,
    getDesktopPools,
    generateCephClusters,
    calculateStorageCapacity,
    generateStorageSummary,
    validateStorageConfig,
    generateStoragePlan,
    generateStorageRecommendations,
};
