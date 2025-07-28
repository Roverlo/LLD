/**
 * IP地址管理器
 */

const { parseIpList, validateIpList } = require('../utils/ip-utils');
const { IP_TO_BE_PROVIDED_TEXT } = require('../constants');

/**
 * IP管理器类
 */
class IpManager {
    constructor(params) {
        this.params = params;
        this.ipPools = {};
        this.ipCounters = {};
        this.initializeIpPools();
    }

    /**
     * 初始化IP地址池
     */
    initializeIpPools() {
        const { mngIpRange, bizIpRange, pubIpRange, cluIpRange, isNetCombined } = this.params;

        // 验证并解析IP地址范围，收集错误信息
        this.ipValidationErrors = [];

        const mngResult = validateIpList(mngIpRange);
        this.ipPools.management = mngResult.ips;
        if (mngResult.errors.length > 0) {
            this.ipValidationErrors.push(`管理网IP段错误：${mngResult.errors.join('；')}`);
        }

        if (!isNetCombined) {
            const bizResult = validateIpList(bizIpRange);
            this.ipPools.business = bizResult.ips;
            if (bizResult.errors.length > 0) {
                this.ipValidationErrors.push(`业务网IP段错误：${bizResult.errors.join('；')}`);
            }
        } else {
            this.ipPools.business = [];
        }

        const pubResult = validateIpList(pubIpRange);
        this.ipPools.storagePublic = pubResult.ips;
        if (pubResult.errors.length > 0) {
            this.ipValidationErrors.push(`存储公共网IP段错误：${pubResult.errors.join('；')}`);
        }

        const cluResult = validateIpList(cluIpRange);
        this.ipPools.storageCluster = cluResult.ips;
        if (cluResult.errors.length > 0) {
            this.ipValidationErrors.push(`存储集群网IP段错误：${cluResult.errors.join('；')}`);
        }

        // 初始化计数器 - 修复：使用共享计数器，与WPS JS版本保持一致
        this.ipCounters = {
            management: 0, // 管理网共享计数器
            business: 0, // 业务网共享计数器
            storagePublic: 0, // 存储公共网共享计数器
            storageCluster: 0, // 存储集群网共享计数器
        };

        // 验证IP地址池
        this.validateIpPools();
    }

    /**
     * 验证IP地址池
     * 修改：允许IP地址池为空，用于计算IP需求
     */
    validateIpPools() {
        // 移除IP地址池必须存在的验证
        // 当IP地址池为空时，getNextIp会返回"待提供IP"
        // 这样用户可以在没有IP段的情况下生成Excel来计算IP需求
    }

    /**
     * 获取IP验证错误信息
     * @returns {string[]} 错误信息数组
     */
    getIpValidationErrors() {
        return this.ipValidationErrors || [];
    }

    /**
     * 检查是否有IP验证错误
     * @returns {boolean} 是否有错误
     */
    hasIpValidationErrors() {
        return this.ipValidationErrors && this.ipValidationErrors.length > 0;
    }

    /**
     * 获取下一个IP地址
     * @param {string} networkType - 网络类型
     * @param {string} usage - 使用类型 ('server' 或 'vm') - 现在仅用于兼容性，实际使用共享计数器
     * @returns {string} IP地址
     */
    getNextIp(networkType) {
        const pool = this.ipPools[networkType];
        const counter = this.ipCounters[networkType];

        // 如果没有IP池（用户没有填写IP段），返回"待提供IP"
        if (!pool || pool.length === 0) {
            // 仍然需要增加计数器来统计IP需求
            if (counter !== undefined) {
                this.ipCounters[networkType]++;
            }
            return IP_TO_BE_PROVIDED_TEXT;
        }

        if (counter === undefined) {
            return IP_TO_BE_PROVIDED_TEXT;
        }

        const currentIndex = counter;
        if (currentIndex >= pool.length) {
            // IP池耗尽，也返回"待提供IP"
            this.ipCounters[networkType]++;
            return IP_TO_BE_PROVIDED_TEXT;
        }

        const ip = pool[currentIndex];
        this.ipCounters[networkType]++;
        return ip;
    }

    /**
     * 预览IP使用情况
     * @param {string} networkType - 网络类型
     * @returns {Object} IP使用情况
     */
    getIpUsage(networkType) {
        const pool = this.ipPools[networkType];
        const counter = this.ipCounters[networkType];

        if (!pool || counter === undefined) {
            return { total: 0, used: 0, remaining: 0 };
        }

        const totalUsed = counter;
        return {
            total: pool.length,
            used: totalUsed,
            remaining: pool.length - totalUsed,
        };
    }

    /**
     * 获取所有网络的IP使用情况
     * @returns {Object} 所有网络的IP使用情况
     */
    getAllIpUsage() {
        return {
            management: this.getIpUsage('management'),
            business: this.getIpUsage('business'),
            storagePublic: this.getIpUsage('storagePublic'),
            storageCluster: this.getIpUsage('storageCluster'),
        };
    }

    /**
     * 检查IP地址是否足够
     * @param {Object} requirements - IP需求
     * @returns {string[]} 警告信息
     */
    checkIpSufficiency(requirements) {
        const warnings = [];

        Object.entries(requirements).forEach(([networkType, requirement]) => {
            const pool = this.ipPools[networkType];
            if (!pool) return;

            // 修复：需求现在是总数，不再分server和vm
            const needed = typeof requirement === 'object' ? requirement.server + requirement.vm : requirement;
            if (needed > pool.length) {
                warnings.push(`${networkType}网络IP地址不足，需要${needed}个，可用${pool.length}个`);
            }
        });

        return warnings;
    }

    /**
     * 重置计数器
     * @param {string} networkType - 网络类型
     * @param {string} usage - 使用类型（保留参数以兼容，但现在不使用）
     */
    resetCounter(networkType) {
        if (this.ipCounters[networkType] !== undefined) {
            this.ipCounters[networkType] = 0;
        }
    }

    /**
     * 重置所有计数器
     */
    resetAllCounters() {
        Object.keys(this.ipCounters).forEach((networkType) => {
            this.ipCounters[networkType] = 0;
        });
    }

    /**
     * 获取指定范围的IP地址
     * @param {string} networkType - 网络类型
     * @param {number} start - 起始索引
     * @param {number} count - 数量
     * @returns {string[]} IP地址数组
     */
    getIpRange(networkType, start, count) {
        const pool = this.ipPools[networkType];
        if (!pool || start < 0 || start >= pool.length) {
            return [];
        }

        const end = Math.min(start + count, pool.length);
        return pool.slice(start, end);
    }

    /**
     * 预分配IP地址
     * @param {string} networkType - 网络类型
     * @param {number} count - 数量
     * @param {string} usage - 使用类型
     * @returns {string[]} IP地址数组
     */
    allocateIps(networkType, count, usage = 'server') {
        const ips = [];
        for (let i = 0; i < count; i++) {
            ips.push(this.getNextIp(networkType, usage));
        }
        return ips;
    }

    /**
     * 获取网络类型的显示名称
     * @param {string} networkType - 网络类型
     * @returns {string} 显示名称
     */
    getNetworkDisplayName(networkType) {
        const names = {
            management: '管理网',
            business: '业务网',
            storagePublic: '存储公共网',
            storageCluster: '存储集群网',
        };
        return names[networkType] || networkType;
    }

    /**
     * 生成IP使用报告
     * @returns {Object} IP使用报告
     */
    generateUsageReport() {
        const report = {
            summary: {},
            details: {},
            warnings: [],
        };

        Object.keys(this.ipPools).forEach((networkType) => {
            const usage = this.getIpUsage(networkType);
            const displayName = this.getNetworkDisplayName(networkType);

            report.summary[networkType] = usage;
            report.details[networkType] = {
                name: displayName,
                pool: this.ipPools[networkType],
                usage: usage,
                utilization: usage.total > 0 ? ((usage.used / usage.total) * 100).toFixed(1) : 0,
            };

            // 检查使用率警告
            if (usage.total > 0) {
                const utilization = usage.used / usage.total;
                if (utilization > 0.9) {
                    report.warnings.push(`${displayName}IP使用率过高: ${(utilization * 100).toFixed(1)}%`);
                } else if (usage.remaining < 5) {
                    report.warnings.push(`${displayName}剩余IP地址不足: ${usage.remaining}个`);
                }
            }
        });

        return report;
    }
}

module.exports = IpManager;
