/**
 * IP and Server Plan Generation Logic (Refactored)
 * Main entry point for generating LLD plans
 */

// Import modules
const { validateAllParams } = require('./validators/param-validator');
const IpManager = require('./managers/ip-manager');
const { generateAllServers } = require('./generators/server-generator');
const { generateAllVms } = require('./generators/vm-generator');
const { generateStoragePlan } = require('./generators/storage-generator');
const { DEFAULT_CONFIG } = require('./constants');

/**
 * 合并默认配置和用户参数
 * @param {Object} params - 用户输入参数
 * @returns {Object} 合并后的参数
 */
const mergeWithDefaults = (params) => {
    return {
        ...DEFAULT_CONFIG,
        ...params,
    };
};

/**
 * 计算IP需求
 * @param {Object} params - 参数
 * @returns {Object} IP需求统计
 */
const calculateIpRequirements = (params) => {
    const {
        countMng,
        countFusion,
        countCalc,
        countStor,
        countCAG,
        isDualNode,
        isNetCombined,
        insightDeployType,
        isZXOPS,
        deployTerminalMgmt,
        deployCAGPortal,
        deployDEM,
        downloadType,
    } = params;

    // 服务器IP需求
    const serverRequirements = {
        management: countMng + (isDualNode ? 2 : 0), // 双机模式需要额外的浮动IP
        business: isNetCombined ? 0 : countMng + countFusion + countCalc + countCAG,
        storagePublic: countMng + countFusion + countStor,
        storageCluster: countFusion + countStor,
    };

    // 虚机IP需求估算
    let vmCount = 11; // 基础虚机数量

    if (insightDeployType === '高可用部署') vmCount += 3;
    else if (insightDeployType === '非高可用部署') vmCount += 1;

    if (isZXOPS) vmCount += 1;
    if (deployTerminalMgmt) vmCount += 1;
    if (deployCAGPortal) vmCount += 1;
    if (deployDEM) vmCount += 1;
    if (downloadType === '集群') vmCount += 2;
    else if (downloadType === '单机') vmCount += 1;

    const vmRequirements = {
        management: vmCount,
        business: isNetCombined ? 0 : vmCount,
        storagePublic: 0,
        storageCluster: 0,
    };

    return {
        server: serverRequirements,
        vm: vmRequirements,
        total: {
            management: serverRequirements.management + vmRequirements.management,
            business: serverRequirements.business + vmRequirements.business,
            storagePublic: serverRequirements.storagePublic + vmRequirements.storagePublic,
            storageCluster: serverRequirements.storageCluster + vmRequirements.storageCluster,
        },
    };
};

/**
 * 生成规划摘要
 * @param {Object[]} servers - 服务器列表
 * @param {Object[]} vms - 虚机列表
 * @param {Object} storagePlan - 存储规划
 * @param {Object} ipManager - IP管理器
 * @returns {Object} 规划摘要
 */
const generatePlanSummary = (servers, vms, storagePlan, ipManager) => {
    const ipUsage = ipManager.getAllIpUsage();
    const ipReport = ipManager.generateUsageReport();

    return {
        totalServers: servers.length,
        totalVMs: vms.length,
        totalStorageClusters: storagePlan.clusters.length,
        ipUsage,
        warnings: [...ipReport.warnings, ...storagePlan.warnings],
        recommendations: storagePlan.recommendations || [],
        generatedAt: new Date().toISOString(),
    };
};

/**
 * 主要的规划生成函数
 * @param {Object} inputParams - 输入参数
 * @returns {Object} 生成的规划
 */
function generatePlan(inputParams) {
    try {
        // 1. 合并默认配置
        const params = mergeWithDefaults(inputParams);

        // 2. 验证参数
        validateAllParams(params);

        // 3. 计算IP需求
        const ipRequirements = calculateIpRequirements(params);

        // 4. 初始化IP管理器
        const ipManager = new IpManager(params);

        // 4.1. 检查IP验证错误（如反向范围等）
        if (ipManager.hasIpValidationErrors()) {
            const errors = ipManager.getIpValidationErrors();
            return {
                error: `IP地址配置错误：\n${errors.join('\n')}`,
                code: 'IP_VALIDATION_ERROR',
            };
        }

        // 5. 检查IP地址是否足够
        const ipWarnings = ipManager.checkIpSufficiency(ipRequirements.total);
        if (ipWarnings.length > 0) {
            // 如果IP不足，仍然继续生成，但会在结果中标记
            // eslint-disable-next-line no-console
            console.warn('IP地址可能不足:', ipWarnings.join('; '));
        }

        // 6. 生成服务器规划
        const servers = generateAllServers(params, ipManager);

        // 7. 生成虚机规划
        const vms = generateAllVms(params, ipManager);

        // 8. 生成存储规划
        const storagePlan = generateStoragePlan(params);

        // 9. 生成规划摘要
        const summary = generatePlanSummary(servers, vms, storagePlan, ipManager);

        // 10. 返回完整规划
        return {
            servers,
            vms,
            storagePlan: storagePlan.clusters,
            desktopVmTypes: params.desktopVmTypes || [], // 添加桌面虚机类型配置
            summary: {
                ...summary,
                ipRequirements,
                storageInfo: storagePlan.summary,
            },
            metadata: {
                version: '2.0.0',
                generatedBy: 'ZTE uSmartView LLD Generator (Refactored)',
                parameters: params,
            },
        };
    } catch (error) {
        // 统一错误处理
        return {
            error: error.message,
            code: error.code || 'GENERATION_ERROR',
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * 验证生成的规划
 * @param {Object} plan - 生成的规划
 * @returns {Object} 验证结果
 */
const validatePlan = (plan) => {
    const issues = [];

    if (!plan.servers || plan.servers.length === 0) {
        issues.push('服务器列表为空');
    }

    if (!plan.vms || plan.vms.length === 0) {
        issues.push('虚机列表为空');
    }

    if (!plan.storagePlan || plan.storagePlan.length === 0) {
        issues.push('存储规划为空');
    }

    // 检查IP地址冲突
    const allIps = new Set();
    const duplicates = [];

    [...plan.servers, ...plan.vms].forEach((item) => {
        [item.mngIp, item.bizIp, item.pubIp, item.cluIp, item.floatIp].forEach((ip) => {
            if (ip && ip !== '不涉及' && ip !== '待提供IP') {
                if (allIps.has(ip)) {
                    duplicates.push(ip);
                } else {
                    allIps.add(ip);
                }
            }
        });
    });

    if (duplicates.length > 0) {
        issues.push(`发现重复的IP地址: ${duplicates.join(', ')}`);
    }

    return {
        isValid: issues.length === 0,
        issues,
        totalIpsUsed: allIps.size,
    };
};

/**
 * 导出函数
 */
module.exports = {
    generatePlan,
    validatePlan,
    mergeWithDefaults,
    calculateIpRequirements,
    generatePlanSummary,
};
