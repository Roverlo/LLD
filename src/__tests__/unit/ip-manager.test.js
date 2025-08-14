/**
 * IP管理器单元测试
 */

const IpManager = require('../../main/managers/ip-manager');
const { IP_TO_BE_PROVIDED_TEXT } = require('../../main/constants');
const { generateRandomIp, generateIpPool, mockUserParams } = require('../helpers/test-utils');
const { validIpPools, invalidIpPools, mockParams } = require('../fixtures/test-data');

describe('IpManager', () => {
    let ipManager;
    let validParams;

    beforeEach(() => {
        validParams = {
            mngIpRange: '192.168.1.1-192.168.1.10',
            bizIpRange: '10.0.1.1-10.0.1.10',
            pubIpRange: '172.16.1.1-172.16.1.10',
            cluIpRange: '192.168.100.1-192.168.100.10',
            isNetCombined: false,
        };
        ipManager = new IpManager(validParams);
    });

    describe('构造函数和初始化', () => {
        test('应该正确初始化IP管理器', () => {
            expect(ipManager.params).toEqual(validParams);
            expect(ipManager.ipPools).toBeDefined();
            expect(ipManager.ipCounters).toBeDefined();
        });

        test('应该正确解析有效的IP范围', () => {
            expect(ipManager.ipPools.management).toHaveLength(10);
            expect(ipManager.ipPools.business).toHaveLength(10);
            expect(ipManager.ipPools.storagePublic).toHaveLength(10);
            expect(ipManager.ipPools.storageCluster).toHaveLength(10);
        });

        test('应该正确初始化计数器', () => {
            expect(ipManager.ipCounters.management).toBe(0);
            expect(ipManager.ipCounters.business).toBe(0);
            expect(ipManager.ipCounters.storagePublic).toBe(0);
            expect(ipManager.ipCounters.storageCluster).toBe(0);
        });

        test('网络合并模式下应该清空业务网IP池', () => {
            const combinedParams = { ...validParams, isNetCombined: true };
            const combinedManager = new IpManager(combinedParams);

            expect(combinedManager.ipPools.business).toHaveLength(0);
            expect(combinedManager.ipPools.management).toHaveLength(10);
        });
    });

    describe('IP验证错误处理', () => {
        test('应该收集无效IP范围的错误', () => {
            const invalidParams = {
                mngIpRange: 'invalid-range',
                bizIpRange: '10.0.1.1-10.0.1.10',
                pubIpRange: '172.16.1.1-172.16.1.10',
                cluIpRange: '192.168.100.1-192.168.100.10',
                isNetCombined: false,
            };

            const invalidManager = new IpManager(invalidParams);
            expect(invalidManager.hasIpValidationErrors()).toBe(true);
            expect(invalidManager.getIpValidationErrors()).toContainEqual(expect.stringContaining('管理网IP段错误'));
        });

        test('应该处理多个无效IP范围', () => {
            const invalidParams = {
                mngIpRange: 'invalid-range-1',
                bizIpRange: 'invalid-range-2',
                pubIpRange: '172.16.1.1-172.16.1.10',
                cluIpRange: '192.168.100.1-192.168.100.10',
                isNetCombined: false,
            };

            const invalidManager = new IpManager(invalidParams);
            const errors = invalidManager.getIpValidationErrors();
            expect(errors).toHaveLength(2);
            expect(errors[0]).toContain('管理网IP段错误');
            expect(errors[1]).toContain('业务网IP段错误');
        });

        test('没有错误时应该返回空数组', () => {
            expect(ipManager.hasIpValidationErrors()).toBe(false);
            expect(ipManager.getIpValidationErrors()).toHaveLength(0);
        });
    });

    describe('getNextIp方法', () => {
        test('应该按顺序返回IP地址', () => {
            const ip1 = ipManager.getNextIp('management');
            const ip2 = ipManager.getNextIp('management');

            expect(ip1).toBe('192.168.1.1');
            expect(ip2).toBe('192.168.1.2');
        });

        test('应该正确增加计数器', () => {
            ipManager.getNextIp('management');
            ipManager.getNextIp('management');

            expect(ipManager.ipCounters.management).toBe(2);
        });

        test('IP池耗尽时应该返回待提供IP文本', () => {
            // 耗尽所有IP
            for (let i = 0; i < 10; i++) {
                ipManager.getNextIp('management');
            }

            const nextIp = ipManager.getNextIp('management');
            expect(nextIp).toBe(IP_TO_BE_PROVIDED_TEXT);
            expect(ipManager.ipCounters.management).toBe(11);
        });

        test('空IP池应该返回待提供IP文本', () => {
            const emptyParams = {
                mngIpRange: '',
                bizIpRange: '',
                pubIpRange: '',
                cluIpRange: '',
                isNetCombined: false,
            };

            const emptyManager = new IpManager(emptyParams);
            const ip = emptyManager.getNextIp('management');

            expect(ip).toBe(IP_TO_BE_PROVIDED_TEXT);
            expect(emptyManager.ipCounters.management).toBe(1);
        });

        test('无效网络类型应该返回待提供IP文本', () => {
            const ip = ipManager.getNextIp('invalid-network');
            expect(ip).toBe(IP_TO_BE_PROVIDED_TEXT);
        });
    });

    describe('IP使用情况统计', () => {
        test('getIpUsage应该返回正确的使用情况', () => {
            ipManager.getNextIp('management');
            ipManager.getNextIp('management');

            const usage = ipManager.getIpUsage('management');
            expect(usage).toEqual({
                total: 10,
                used: 2,
                remaining: 8,
            });
        });

        test('getAllIpUsage应该返回所有网络的使用情况', () => {
            ipManager.getNextIp('management');
            ipManager.getNextIp('business');

            const allUsage = ipManager.getAllIpUsage();
            expect(allUsage.management.used).toBe(1);
            expect(allUsage.business.used).toBe(1);
            expect(allUsage.storagePublic.used).toBe(0);
            expect(allUsage.storageCluster.used).toBe(0);
        });

        test('无效网络类型应该返回零使用情况', () => {
            const usage = ipManager.getIpUsage('invalid-network');
            expect(usage).toEqual({
                total: 0,
                used: 0,
                remaining: 0,
            });
        });
    });

    describe('IP充足性检查', () => {
        test('应该检测IP不足的情况', () => {
            const requirements = {
                management: 15, // 需要15个，但只有10个
                business: 5,
            };

            const warnings = ipManager.checkIpSufficiency(requirements);
            expect(warnings).toHaveLength(1);
            expect(warnings[0]).toContain('management网络IP地址不足');
        });

        test('应该处理对象格式的需求', () => {
            const requirements = {
                management: { server: 8, vm: 5 }, // 总共13个，超过10个
                business: { server: 3, vm: 2 },
            };

            const warnings = ipManager.checkIpSufficiency(requirements);
            expect(warnings).toHaveLength(1);
            expect(warnings[0]).toContain('management网络IP地址不足');
        });

        test('IP充足时应该返回空警告', () => {
            const requirements = {
                management: 5,
                business: 3,
            };

            const warnings = ipManager.checkIpSufficiency(requirements);
            expect(warnings).toHaveLength(0);
        });
    });

    describe('计数器管理', () => {
        test('resetCounter应该重置指定网络的计数器', () => {
            ipManager.getNextIp('management');
            ipManager.getNextIp('management');
            expect(ipManager.ipCounters.management).toBe(2);

            ipManager.resetCounter('management');
            expect(ipManager.ipCounters.management).toBe(0);
        });

        test('resetAllCounters应该重置所有计数器', () => {
            ipManager.getNextIp('management');
            ipManager.getNextIp('business');
            ipManager.getNextIp('storagePublic');

            ipManager.resetAllCounters();

            expect(ipManager.ipCounters.management).toBe(0);
            expect(ipManager.ipCounters.business).toBe(0);
            expect(ipManager.ipCounters.storagePublic).toBe(0);
            expect(ipManager.ipCounters.storageCluster).toBe(0);
        });

        test('重置无效网络类型的计数器应该安全处理', () => {
            expect(() => {
                ipManager.resetCounter('invalid-network');
            }).not.toThrow();
        });
    });

    describe('IP范围获取', () => {
        test('getIpRange应该返回指定范围的IP', () => {
            const range = ipManager.getIpRange('management', 2, 3);
            expect(range).toHaveLength(3);
            expect(range[0]).toBe('192.168.1.3');
            expect(range[2]).toBe('192.168.1.5');
        });

        test('超出范围时应该返回可用的IP', () => {
            const range = ipManager.getIpRange('management', 8, 5);
            expect(range).toHaveLength(2); // 只有2个可用
        });

        test('无效参数应该返回空数组', () => {
            expect(ipManager.getIpRange('management', -1, 5)).toHaveLength(0);
            expect(ipManager.getIpRange('management', 20, 5)).toHaveLength(0);
            expect(ipManager.getIpRange('invalid-network', 0, 5)).toHaveLength(0);
        });
    });

    describe('IP分配', () => {
        test('allocateIps应该分配指定数量的IP', () => {
            const ips = ipManager.allocateIps('management', 3);
            expect(ips).toHaveLength(3);
            expect(ips[0]).toBe('192.168.1.1');
            expect(ips[1]).toBe('192.168.1.2');
            expect(ips[2]).toBe('192.168.1.3');
        });

        test('分配后计数器应该正确更新', () => {
            ipManager.allocateIps('management', 5);
            expect(ipManager.ipCounters.management).toBe(5);
        });

        test('超出池大小时应该返回待提供IP', () => {
            const ips = ipManager.allocateIps('management', 15);
            expect(ips).toHaveLength(15);
            expect(ips.slice(0, 10)).not.toContain(IP_TO_BE_PROVIDED_TEXT);
            expect(ips.slice(10)).toEqual(Array(5).fill(IP_TO_BE_PROVIDED_TEXT));
        });
    });

    describe('网络显示名称', () => {
        test('应该返回正确的中文显示名称', () => {
            expect(ipManager.getNetworkDisplayName('management')).toBe('管理网');
            expect(ipManager.getNetworkDisplayName('business')).toBe('业务网');
            expect(ipManager.getNetworkDisplayName('storagePublic')).toBe('存储公共网');
            expect(ipManager.getNetworkDisplayName('storageCluster')).toBe('存储集群网');
        });

        test('未知网络类型应该返回原始名称', () => {
            expect(ipManager.getNetworkDisplayName('unknown')).toBe('unknown');
        });
    });

    describe('使用报告生成', () => {
        test('应该生成完整的使用报告', () => {
            ipManager.getNextIp('management');
            ipManager.getNextIp('management');
            ipManager.getNextIp('business');

            const report = ipManager.generateUsageReport();

            expect(report.summary).toBeDefined();
            expect(report.details).toBeDefined();
            expect(report.warnings).toBeDefined();

            expect(report.details.management.name).toBe('管理网');
            expect(report.details.management.usage.used).toBe(2);
            expect(report.details.management.utilization).toBe('20.0');
        });

        test('应该生成高使用率警告', () => {
            // 使用100%的IP (10/10 = 100%，超过90%阈值)
            for (let i = 0; i < 10; i++) {
                ipManager.getNextIp('management');
            }

            const report = ipManager.generateUsageReport();
            expect(report.warnings).toContainEqual(expect.stringContaining('管理网IP使用率过高'));
        });

        test('应该生成剩余IP不足警告', () => {
            // 使用到只剩4个IP
            for (let i = 0; i < 6; i++) {
                ipManager.getNextIp('management');
            }

            const report = ipManager.generateUsageReport();
            expect(report.warnings).toContainEqual(expect.stringContaining('管理网剩余IP地址不足'));
        });

        test('空IP池应该正确处理', () => {
            const emptyParams = {
                mngIpRange: '',
                bizIpRange: '',
                pubIpRange: '',
                cluIpRange: '',
                isNetCombined: false,
            };

            const emptyManager = new IpManager(emptyParams);
            const report = emptyManager.generateUsageReport();

            expect(report.details.management.utilization).toBe(0);
            expect(report.warnings).toHaveLength(0);
        });
    });

    describe('边界条件测试', () => {
        test('应该处理单个IP的范围', () => {
            const singleIpParams = {
                mngIpRange: '192.168.1.1',
                bizIpRange: '10.0.1.1',
                pubIpRange: '172.16.1.1',
                cluIpRange: '192.168.100.1',
                isNetCombined: false,
            };

            const singleIpManager = new IpManager(singleIpParams);
            expect(singleIpManager.ipPools.management).toHaveLength(1);

            const ip1 = singleIpManager.getNextIp('management');
            const ip2 = singleIpManager.getNextIp('management');

            expect(ip1).toBe('192.168.1.1');
            expect(ip2).toBe(IP_TO_BE_PROVIDED_TEXT);
        });

        test('应该处理大范围IP', () => {
            const largeRangeParams = {
                mngIpRange: '192.168.1.1-192.168.1.254',
                bizIpRange: '10.0.1.1-10.0.1.254',
                pubIpRange: '172.16.1.1-172.16.1.254',
                cluIpRange: '192.168.100.1-192.168.100.254',
                isNetCombined: false,
            };

            const largeRangeManager = new IpManager(largeRangeParams);
            expect(largeRangeManager.ipPools.management).toHaveLength(254);
        });

        test('应该处理null和undefined参数', () => {
            const nullParams = {
                mngIpRange: null,
                bizIpRange: undefined,
                pubIpRange: '',
                cluIpRange: '192.168.100.1-192.168.100.10',
                isNetCombined: false,
            };

            expect(() => {
                new IpManager(nullParams);
            }).not.toThrow();
        });
    });
});
