/**
 * IP管理器测试
 */

const IpManager = require('./ip-manager');

describe('IpManager', () => {
    let ipManager;
    let testParams;

    beforeEach(() => {
        testParams = {
            isNetCombined: false,
            mngIpRange: '192.168.1.1-192.168.1.10',
            bizIpRange: '10.0.0.1-10.0.0.10',
            pubIpRange: '172.16.0.1/28',
            cluIpRange: '172.17.0.1/28',
        };
        ipManager = new IpManager(testParams);
    });

    describe('constructor', () => {
        test('should initialize IP pools correctly', () => {
            expect(ipManager.ipPools.management.length).toBe(10);
            expect(ipManager.ipPools.business.length).toBe(10);
            expect(ipManager.ipPools.storagePublic.length).toBeGreaterThan(0);
            expect(ipManager.ipPools.storageCluster.length).toBeGreaterThan(0);
        });

        test('should handle combined network mode', () => {
            const combinedParams = { ...testParams, isNetCombined: true };
            const combinedManager = new IpManager(combinedParams);
            expect(combinedManager.ipPools.business.length).toBe(0);
        });

        test('should throw error for invalid IP ranges', () => {
            const invalidParams = { ...testParams, mngIpRange: '' };
            expect(() => new IpManager(invalidParams)).toThrow();
        });
    });

    describe('getNextIp', () => {
        test('should return next available IP for server usage', () => {
            const ip1 = ipManager.getNextIp('management', 'server');
            const ip2 = ipManager.getNextIp('management', 'server');

            expect(ip1).toBe('192.168.1.1');
            expect(ip2).toBe('192.168.1.2');
        });

        test('should return next available IP for VM usage', () => {
            const ip1 = ipManager.getNextIp('management', 'vm');
            const ip2 = ipManager.getNextIp('management', 'vm');

            expect(ip1).toBe('192.168.1.1');
            expect(ip2).toBe('192.168.1.2');
        });

        test('should use shared counter for server and VM usage', () => {
            const serverIp = ipManager.getNextIp('management', 'server');
            const vmIp = ipManager.getNextIp('management', 'vm');

            expect(serverIp).toBe('192.168.1.1');
            expect(vmIp).toBe('192.168.1.2'); // 共享计数器，所以是下一个IP
        });

        test('should return IP_INSUFFICIENT_TEXT when pool exhausted', () => {
            // Exhaust the pool
            for (let i = 0; i < 15; i++) {
                ipManager.getNextIp('management', 'server');
            }

            const result = ipManager.getNextIp('management', 'server');
            expect(result).toBe('（IP不足）');
        });

        test('should return IP_INSUFFICIENT_TEXT for invalid network type', () => {
            const result = ipManager.getNextIp('invalid', 'server');
            expect(result).toBe('（IP不足）');
        });
    });

    describe('getIpUsage', () => {
        test('should return correct usage statistics', () => {
            ipManager.getNextIp('management', 'server');
            ipManager.getNextIp('management', 'server');
            ipManager.getNextIp('management', 'vm');

            const usage = ipManager.getIpUsage('management');
            expect(usage.total).toBe(10);
            expect(usage.used).toBe(3);
            expect(usage.remaining).toBe(7);
        });

        test('should return zero usage for invalid network type', () => {
            const usage = ipManager.getIpUsage('invalid');
            expect(usage.total).toBe(0);
            expect(usage.used).toBe(0);
            expect(usage.remaining).toBe(0);
        });
    });

    describe('getAllIpUsage', () => {
        test('should return usage for all network types', () => {
            const allUsage = ipManager.getAllIpUsage();

            expect(allUsage).toHaveProperty('management');
            expect(allUsage).toHaveProperty('business');
            expect(allUsage).toHaveProperty('storagePublic');
            expect(allUsage).toHaveProperty('storageCluster');

            expect(allUsage.management.total).toBe(10);
            expect(allUsage.business.total).toBe(10);
        });
    });

    describe('checkIpSufficiency', () => {
        test('should return warnings for insufficient IPs', () => {
            const requirements = {
                management: { server: 5, vm: 8 }, // Total 13, but only 10 available
                business: { server: 5, vm: 5 }, // Total 10, exactly available
            };

            const warnings = ipManager.checkIpSufficiency(requirements);
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0]).toContain('management');
        });

        test('should return empty array when IPs are sufficient', () => {
            const requirements = {
                management: { server: 3, vm: 3 }, // Total 6, less than 10 available
                business: { server: 3, vm: 3 }, // Total 6, less than 10 available
            };

            const warnings = ipManager.checkIpSufficiency(requirements);
            expect(warnings).toEqual([]);
        });
    });

    describe('resetCounter', () => {
        test('should reset specific counter', () => {
            ipManager.getNextIp('management', 'server');
            ipManager.getNextIp('management', 'server');

            ipManager.resetCounter('management', 'server');

            const nextIp = ipManager.getNextIp('management', 'server');
            expect(nextIp).toBe('192.168.1.1');
        });
    });

    describe('resetAllCounters', () => {
        test('should reset all counters', () => {
            ipManager.getNextIp('management', 'server');
            ipManager.getNextIp('business', 'vm');

            ipManager.resetAllCounters();

            expect(ipManager.getNextIp('management', 'server')).toBe('192.168.1.1');
            expect(ipManager.getNextIp('business', 'vm')).toBe('10.0.0.1');
        });
    });

    describe('getIpRange', () => {
        test('should return IP range from specific start position', () => {
            const range = ipManager.getIpRange('management', 2, 3);
            expect(range).toEqual(['192.168.1.3', '192.168.1.4', '192.168.1.5']);
        });

        test('should handle out of bounds requests', () => {
            const range = ipManager.getIpRange('management', 15, 3);
            expect(range).toEqual([]);
        });

        test('should handle partial ranges at end of pool', () => {
            const range = ipManager.getIpRange('management', 8, 5);
            expect(range.length).toBe(2); // Only 2 IPs left from position 8
        });
    });

    describe('allocateIps', () => {
        test('should allocate multiple IPs at once', () => {
            const ips = ipManager.allocateIps('management', 3, 'server');
            expect(ips).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should handle allocation beyond pool size', () => {
            const ips = ipManager.allocateIps('management', 15, 'server');
            expect(ips.length).toBe(15);
            expect(ips.slice(-5)).toEqual(['（IP不足）', '（IP不足）', '（IP不足）', '（IP不足）', '（IP不足）']);
        });
    });

    describe('getNetworkDisplayName', () => {
        test('should return correct display names', () => {
            expect(ipManager.getNetworkDisplayName('management')).toBe('管理网');
            expect(ipManager.getNetworkDisplayName('business')).toBe('业务网');
            expect(ipManager.getNetworkDisplayName('storagePublic')).toBe('存储公共网');
            expect(ipManager.getNetworkDisplayName('storageCluster')).toBe('存储集群网');
            expect(ipManager.getNetworkDisplayName('unknown')).toBe('unknown');
        });
    });

    describe('generateUsageReport', () => {
        test('should generate comprehensive usage report', () => {
            // Use some IPs
            ipManager.getNextIp('management', 'server');
            ipManager.getNextIp('management', 'server');
            ipManager.getNextIp('business', 'vm');

            const report = ipManager.generateUsageReport();

            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('details');
            expect(report).toHaveProperty('warnings');

            expect(report.summary.management.used).toBe(2);
            expect(report.summary.business.used).toBe(1);

            expect(report.details.management.utilization).toBe('20.0');
        });

        test('should include warnings for high utilization', () => {
            // Use 9 out of 10 IPs (90% utilization)
            for (let i = 0; i < 9; i++) {
                ipManager.getNextIp('management', 'server');
            }

            const report = ipManager.generateUsageReport();
            expect(report.warnings.length).toBeGreaterThan(0);
            expect(report.warnings[0]).toContain('管理网');
        });
    });

    describe('Edge cases', () => {
        test('should handle empty IP ranges gracefully', () => {
            const emptyParams = {
                isNetCombined: true,
                mngIpRange: '192.168.1.1-192.168.1.2', // At least 2 IPs
                bizIpRange: '',
                pubIpRange: '172.16.0.1-172.16.0.2',
                cluIpRange: '172.17.0.1-172.17.0.2',
            };

            expect(() => new IpManager(emptyParams)).not.toThrow();
        });

        test('should handle malformed IP ranges', () => {
            const malformedParams = {
                isNetCombined: true,
                mngIpRange: 'invalid-range',
                bizIpRange: '',
                pubIpRange: '172.16.0.1/24',
                cluIpRange: '172.17.0.1/24',
            };

            expect(() => new IpManager(malformedParams)).toThrow();
        });
    });
});
