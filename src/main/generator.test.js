const { generatePlan } = require('./generator');

describe('LLD Plan Generator', () => {
    // Test case 1: Basic scenario
    test('should generate a plan for a simple setup', () => {
        const params = {
            isNetCombined: true,
            isDualNode: false,
            isCephDual: false,
            isFusionNode: true,
            isMngAsFusion: true,
            countMng: 1,
            countFusion: 3,
            countStor: 0,
            countCAG: 0,
            prefixMng: 'MNG-SRV',
            prefixFusion: 'FSN-SRV',
            prefixStor: 'STO-SRV',
            countCalc: 0,
            userCount: 100,
            scene: '管理网和业务网合一场景',
            isZXOPS: false,
            insightDeployType: '否',
            deployTerminalMgmt: false,
            deployCAGPortal: false,
            deployDEM: false,
            downloadType: '否',
            storageSecurity: 'raid1',
            mngIpRange: '192.168.1.1/24',
            bizIpRange: '10.0.0.1/24',
            pubIpRange: '172.16.0.1/24',
            cluIpRange: '172.17.0.1/24',
        };

        const plan = generatePlan(params);

        // Check for error response
        if (plan.error) {
            // eslint-disable-next-line no-console
            console.error('Plan generation failed:', plan.error);
        }
        expect(plan.error).toBeUndefined();

        // Basic assertions to ensure the plan object is created
        expect(plan).toBeDefined();
        expect(plan.servers).toBeInstanceOf(Array);
        expect(plan.vms).toBeInstanceOf(Array);
        expect(plan.storagePlan).toBeInstanceOf(Array);
        expect(plan.summary).toBeDefined();
        expect(plan.servers.length).toBeGreaterThan(0);
        expect(plan.vms.length).toBeGreaterThan(0);
    });

    // Test case 2: Dual management nodes
    test('should handle dual management nodes correctly', () => {
        const params = {
            isNetCombined: false,
            isDualNode: true,
            isCephDual: true,
            isFusionNode: false,
            isMngAsFusion: false,
            countMng: 2,
            countFusion: 0,
            countStor: 3,
            countCAG: 1,
            countCalc: 3,
            prefixMng: 'MNG-SRV',
            prefixFusion: 'FSN-SRV',
            prefixStor: 'STO-SRV',
            userCount: 1000,
            scene: '管理网和业务网隔离场景_运维通过管理网访问',
            isZXOPS: true,
            insightDeployType: '高可用部署',
            deployTerminalMgmt: true,
            deployCAGPortal: true,
            deployDEM: true,
            downloadType: '集群',
            storageSecurity: 'raid5',
            mngIpRange: '192.168.1.1-192.168.1.100',
            bizIpRange: '10.0.0.1-10.0.0.100',
            pubIpRange: '172.16.0.1-172.16.0.100',
            cluIpRange: '172.17.0.1-172.17.0.100',
        };

        const plan = generatePlan(params);

        // Check for error response
        if (plan.error) {
            // eslint-disable-next-line no-console
            console.error('Plan generation failed:', plan.error);
        }
        expect(plan.error).toBeUndefined();

        expect(plan).toBeDefined();
        expect(plan.servers).toBeInstanceOf(Array);
        expect(plan.vms).toBeInstanceOf(Array);
        expect(plan.servers.length).toBeGreaterThan(0);
        expect(plan.vms.length).toBeGreaterThan(0);

        // Check that dual management nodes are created
        const mngServers = plan.servers.filter((s) => s.hostname && s.hostname.includes('MNG'));
        expect(mngServers).toHaveLength(2);
    });

    // Test case 3: Error handling for invalid inputs
    test('should return error for invalid IP range format', () => {
        const params = {
            isNetCombined: true,
            isDualNode: false,
            isCephDual: false,
            isFusionNode: true,
            isMngAsFusion: true,
            countMng: 1,
            countFusion: 3,
            countStor: 0,
            countCAG: 0,
            countCalc: 0,
            prefixMng: 'MNG-SRV',
            prefixFusion: 'FSN-SRV',
            prefixStor: 'STO-SRV',
            userCount: 100,
            scene: '管理网和业务网合一场景',
            isZXOPS: false,
            insightDeployType: '否',
            deployTerminalMgmt: false,
            deployCAGPortal: false,
            deployDEM: false,
            downloadType: '否',
            storageSecurity: 'raid1',
            mngIpRange: 'invalid-ip-range',
            bizIpRange: '10.0.0.1/24',
            pubIpRange: '172.16.0.1/24',
            cluIpRange: '172.17.0.1/24',
        };

        const plan = generatePlan(params);

        // Should return error object instead of throwing
        expect(plan).toBeDefined();
        expect(plan.error).toBeDefined();
        expect(typeof plan.error).toBe('string');
    });

    // Test case 4: Large scale deployment
    test('should handle large scale deployment', () => {
        const params = {
            isNetCombined: false,
            isDualNode: true,
            isCephDual: true,
            isFusionNode: true,
            isMngAsFusion: false,
            countMng: 2,
            countFusion: 10,
            countStor: 0,
            countCAG: 2,
            countCalc: 0,
            prefixMng: 'MNG-SRV',
            prefixFusion: 'FSN-SRV',
            prefixStor: 'STO-SRV',
            userCount: 5000,
            scene: '管理网和业务网隔离场景_运维通过管理网访问',
            isZXOPS: true,
            insightDeployType: '高可用部署',
            deployTerminalMgmt: true,
            deployCAGPortal: true,
            deployDEM: true,
            downloadType: '集群',
            storageSecurity: 'ec',
            mngIpRange: '192.168.1.0/24',
            bizIpRange: '10.0.0.0/24',
            pubIpRange: '172.16.0.0/24',
            cluIpRange: '172.17.0.0/24',
        };

        const plan = generatePlan(params);

        // Check for error response
        if (plan.error) {
            // eslint-disable-next-line no-console
            console.error('Plan generation failed:', plan.error);
        }
        expect(plan.error).toBeUndefined();

        expect(plan).toBeDefined();
        expect(plan.servers).toBeInstanceOf(Array);
        expect(plan.vms).toBeInstanceOf(Array);
        expect(plan.servers.length).toBeGreaterThan(10);
        expect(plan.vms.length).toBeGreaterThan(15);
        expect(plan.summary.totalServers).toBeGreaterThan(10);
    });

    // Test case 5: IP utilities
    test('should handle different IP range formats', () => {
        const params = {
            isNetCombined: true,
            isDualNode: false,
            isCephDual: false,
            isFusionNode: true,
            isMngAsFusion: true,
            countMng: 1,
            countFusion: 2,
            countStor: 0,
            countCAG: 0,
            countCalc: 0,
            prefixMng: 'MNG',
            prefixFusion: 'FSN',
            prefixStor: 'STO',
            userCount: 100,
            scene: '管理网和业务网合一场景',
            isZXOPS: false,
            insightDeployType: '否',
            deployTerminalMgmt: false,
            deployCAGPortal: false,
            deployDEM: false,
            downloadType: '否',
            storageSecurity: 'raid1',
            mngIpRange: '192.168.1.10-192.168.1.20', // Range format
            bizIpRange: '10.0.0.1/28', // CIDR format
            pubIpRange: '172.16.0.1,172.16.0.2,172.16.0.3', // List format
            cluIpRange: '172.17.0.1/30', // CIDR format
        };

        const plan = generatePlan(params);

        if (plan.error) {
            // eslint-disable-next-line no-console
            console.error('Plan generation failed:', plan.error);
        }
        expect(plan.error).toBeUndefined();

        expect(plan).toBeDefined();
        expect(plan.servers.length).toBeGreaterThan(0);
        expect(plan.vms.length).toBeGreaterThan(0);
    });

    // Test case 6: Edge cases
    test('should handle minimum configuration', () => {
        const params = {
            isNetCombined: true,
            isDualNode: false,
            isCephDual: false,
            isFusionNode: true,
            isMngAsFusion: true,
            countMng: 1,
            countFusion: 1,
            countStor: 0,
            countCAG: 0,
            countCalc: 0,
            prefixMng: 'M',
            prefixFusion: 'F',
            prefixStor: 'S',
            userCount: 1,
            scene: '管理网和业务网合一场景',
            isZXOPS: false,
            insightDeployType: '否',
            deployTerminalMgmt: false,
            deployCAGPortal: false,
            deployDEM: false,
            downloadType: '否',
            storageSecurity: 'raid1',
            mngIpRange: '192.168.1.1/24',
            bizIpRange: '10.0.0.1/24',
            pubIpRange: '172.16.0.1/24',
            cluIpRange: '172.17.0.1/24',
        };

        const plan = generatePlan(params);

        if (plan.error) {
            // eslint-disable-next-line no-console
            console.error('Plan generation failed:', plan.error);
        }
        expect(plan.error).toBeUndefined();

        expect(plan).toBeDefined();
        expect(plan.servers).toHaveLength(2); // 1 management + 1 fusion
        expect(plan.vms.length).toBeGreaterThan(0);
        expect(plan.summary.totalServers).toBe(2);
    });
});
