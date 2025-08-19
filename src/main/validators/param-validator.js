/**
 * 参数验证模块
 */

/**
 * 自定义错误类
 */
class ValidationError extends Error {
    constructor(message, code = 'VALIDATION_ERROR') {
        super(message);
        this.name = 'ValidationError';
        this.code = code;
    }
}

/**
 * 验证输入参数
 * @param {Object} params - 输入参数
 * @returns {string[]} 错误信息数组
 */
const validateParams = (params) => {
    const {
        isNetCombined,
        isDualNode,
        isCephDual,
        isFusionNode,
        isMngAsFusion,
        scene,
        insightDeployType,
        deployTerminalMgmt,
        userCount,
    } = params;

    const alerts = [];

    // 验证Insight和终端网管的依赖关系
    if (insightDeployType === '否' && deployTerminalMgmt) {
        alerts.push('只提供终端网管与insight合设的规划，请取消勾选"部署终端网管"。');
    }

    // CAG门户现在独立部署，不再依赖Insight
    // 删除了原有的Insight和CAG门户依赖关系验证

    // 验证网络合设和场景的一致性
    if (!isNetCombined && scene === '管理网和业务网合一场景') {
        alerts.push('管理业务网不合设时，场景不能选择"管理网和业务网合一场景"。');
    }

    if (isNetCombined && scene !== '管理网和业务网合一场景') {
        alerts.push('管理业务网合设时，场景只能选择"管理网和业务网合一场景"。');
    }

    // 验证Ceph管理双机的前提条件
    if (isCephDual && !isDualNode) {
        alerts.push('Ceph管理双机需先启用管理节点双机。');
    }

    // 验证用户量和Insight部署类型的匹配
    if (userCount > 5000 && insightDeployType === '非高可用部署') {
        alerts.push('用户量 > 5000 时，Insight 只能选择"高可用部署"。');
    }

    // 验证超融合和管理节点的配置
    if (!isFusionNode && isMngAsFusion) {
        alerts.push('计算与存储节点分离时，管理节点不能作为超融合节点。');
    }

    return alerts;
};

/**
 * 验证服务器数量配置
 * @param {Object} params - 输入参数
 * @returns {string[]} 错误信息数组
 */
const validateServerCounts = (params) => {
    const { countMng, countFusion, countCalc, countStor, countCAG, isDualNode, isFusionNode, isMngAsFusion } = params;

    const alerts = [];

    // 验证管理服务器数量
    if (isDualNode && countMng < 2) {
        alerts.push('启用管理节点双机时，管理服务器数量不能少于2台。');
    }

    if (!isDualNode && countMng < 1) {
        alerts.push('管理服务器数量不能少于1台。');
    }

    // 验证计算/超融合服务器数量
    if (isFusionNode) {
        if (countCalc > 0) {
            alerts.push('超融合模式下，不应配置独立的计算服务器。');
        }
        
        // 新增：验证超融合模式下的Ceph存储最小节点要求
        if (!isMngAsFusion) {
            // 管理节点不计入超融合时，超融合服务器数量必须大于等于3
            if (countFusion < 3) {
                alerts.push('超融合模式下，且管理节点不计入超融合时，超融合服务器数量不能少于3台（Ceph最小要求）。');
            }
        } else {
            // 管理节点计入超融合时，超融合服务器数量+管理服务器数量的总和必须大于等于3
            if ((countFusion + countMng) < 3) {
                alerts.push('计算/存储合设且管理节点计入超融合时，超融合服务器数量和管理服务器数量之和不能少于3台（Ceph最小要求）。');
            }
        }
    } else {
        // 分离模式下，允许计算服务器数量为0（用于IP需求计算）
        if (countCalc < 0) {
            alerts.push('计算服务器数量不能为负数。');
        }
        if (countStor < 3) {
            alerts.push('分离模式下，存储服务器数量不能少于3台（Ceph最小要求）。');
        }
        if (countFusion > 0) {
            alerts.push('分离模式下，不应配置超融合服务器。');
        }
    }

    // 验证CAG服务器数量
    if (countCAG < 0) {
        alerts.push('CAG服务器数量不能为负数。');
    }

    return alerts;
};

/**
 * 验证IP地址范围
 * @param {Object} params - 输入参数
 * @returns {string[]} 错误信息数组
 */
const validateIpRanges = () => {
    // 移除IP段必填验证，允许用户不填IP段来计算IP需求
    // 当没有IP段时，系统会自动分配"待提供IP"
    return [];
};

/**
 * 验证所有参数
 * @param {Object} params - 输入参数
 * @throws {ValidationError} 验证失败时抛出错误
 */
const validateAllParams = (params) => {
    const paramErrors = validateParams(params);
    const serverErrors = validateServerCounts(params);
    const ipErrors = validateIpRanges(params);

    const allErrors = [...paramErrors, ...serverErrors, ...ipErrors];

    if (allErrors.length > 0) {
        throw new ValidationError(allErrors.join('\n'), 'INVALID_PARAMS');
    }
};

/**
 * 验证用户量范围
 * @param {number} userCount - 用户数量
 * @returns {boolean} 是否有效
 */
const isValidUserCount = (userCount) => {
    return typeof userCount === 'number' && userCount > 0 && userCount <= 50000;
};

/**
 * 验证场景选择
 * @param {string} scene - 网络场景
 * @returns {boolean} 是否有效
 */
const isValidScene = (scene) => {
    const validScenes = [
        '管理网和业务网合一场景',
        '管理网和业务网隔离场景_运维通过管理网访问',
        '管理网和业务网隔离场景_运维通过业务网访问',
        '三网隔离场景',
    ];
    return validScenes.includes(scene);
};

/**
 * 验证Insight部署类型
 * @param {string} deployType - 部署类型
 * @returns {boolean} 是否有效
 */
const isValidInsightDeployType = (deployType) => {
    const validTypes = ['否', '非高可用部署', '高可用部署'];
    return validTypes.includes(deployType);
};

/**
 * 验证存储安全策略
 * @param {string} security - 安全策略
 * @returns {boolean} 是否有效
 */
const isValidStorageSecurity = (security) => {
    const validSecurities = ['raid1', 'raid5', 'ec'];
    return validSecurities.includes(security);
};

module.exports = {
    ValidationError,
    validateParams,
    validateServerCounts,
    validateIpRanges,
    validateAllParams,
    isValidUserCount,
    isValidScene,
    isValidInsightDeployType,
    isValidStorageSecurity,
};
