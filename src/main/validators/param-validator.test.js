/**
 * 参数验证器测试
 */

const {
    ValidationError,
    validateParams,
    validateServerCounts,
    validateIpRanges,
    validateAllParams,
    isValidUserCount,
    isValidScene,
    isValidInsightDeployType,
    isValidStorageSecurity,
} = require('./param-validator');

describe('Parameter Validator', () => {
    describe('ValidationError', () => {
        test('should create validation error with message and code', () => {
            const error = new ValidationError('Test error', 'TEST_CODE');
            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_CODE');
            expect(error.name).toBe('ValidationError');
        });

        test('should use default error code', () => {
            const error = new ValidationError('Test error');
            expect(error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('validateParams', () => {
        test('should validate Insight and terminal management dependency', () => {
            const params = {
                insightDeployType: '否',
                deployTerminalMgmt: true,
                deployCAGPortal: false,
                isNetCombined: true,
                scene: '管理网和业务网合一场景',
                isDualNode: false,
                isCephDual: false,
                userCount: 100,
                isFusionNode: true,
                isMngAsFusion: true,
            };

            const alerts = validateParams(params);
            expect(alerts).toContain('只提供终端网管与insight合设的规划，请取消勾选"部署终端网管"。');
        });

        test('should validate Insight and CAG portal dependency', () => {
            const params = {
                insightDeployType: '否',
                deployTerminalMgmt: false,
                deployCAGPortal: true,
                isNetCombined: true,
                scene: '管理网和业务网合一场景',
                isDualNode: false,
                isCephDual: false,
                userCount: 100,
                isFusionNode: true,
                isMngAsFusion: true,
            };

            const alerts = validateParams(params);
            expect(alerts).toContain('只提供CAG门户与insight合设的规划，请取消勾选"部署CAG门户"。');
        });

        test('should validate network and scene consistency', () => {
            const params = {
                insightDeployType: '否',
                deployTerminalMgmt: false,
                deployCAGPortal: false,
                isNetCombined: false,
                scene: '管理网和业务网合一场景',
                isDualNode: false,
                isCephDual: false,
                userCount: 100,
                isFusionNode: true,
                isMngAsFusion: true,
            };

            const alerts = validateParams(params);
            expect(alerts).toContain('管理业务网不合设时，场景不能选择"管理网和业务网合一场景"。');
        });

        test('should validate Ceph dual dependency', () => {
            const params = {
                insightDeployType: '否',
                deployTerminalMgmt: false,
                deployCAGPortal: false,
                isNetCombined: true,
                scene: '管理网和业务网合一场景',
                isDualNode: false,
                isCephDual: true,
                userCount: 100,
                isFusionNode: true,
                isMngAsFusion: true,
            };

            const alerts = validateParams(params);
            expect(alerts).toContain('Ceph管理双机需先启用管理节点双机。');
        });

        test('should validate user count and Insight deployment', () => {
            const params = {
                insightDeployType: '非高可用部署',
                deployTerminalMgmt: false,
                deployCAGPortal: false,
                isNetCombined: true,
                scene: '管理网和业务网合一场景',
                isDualNode: false,
                isCephDual: false,
                userCount: 6000,
                isFusionNode: true,
                isMngAsFusion: true,
            };

            const alerts = validateParams(params);
            expect(alerts).toContain('用户量 > 5000 时，Insight 只能选择"高可用部署"。');
        });

        test('should return empty array for valid params', () => {
            const params = {
                insightDeployType: '高可用部署',
                deployTerminalMgmt: true,
                deployCAGPortal: true,
                isNetCombined: true,
                scene: '管理网和业务网合一场景',
                isDualNode: true,
                isCephDual: true,
                userCount: 6000,
                isFusionNode: true,
                isMngAsFusion: true,
            };

            const alerts = validateParams(params);
            expect(alerts).toEqual([]);
        });
    });

    describe('validateServerCounts', () => {
        test('should validate dual node management server count', () => {
            const params = {
                countMng: 1,
                countFusion: 3,
                countCalc: 0,
                countStor: 0,
                countCAG: 0,
                isDualNode: true,
                isFusionNode: true,
            };

            const alerts = validateServerCounts(params);
            expect(alerts).toContain('启用管理节点双机时，管理服务器数量不能少于2台。');
        });

        test('should validate fusion node configuration', () => {
            const params = {
                countMng: 2,
                countFusion: 0,
                countCalc: 0,
                countStor: 0,
                countCAG: 0,
                isDualNode: true,
                isFusionNode: true,
            };

            const alerts = validateServerCounts(params);
            expect(alerts).toContain('超融合模式下，超融合服务器数量不能少于1台。');
        });

        test('should validate separated mode configuration', () => {
            const params = {
                countMng: 2,
                countFusion: 0,
                countCalc: 0,
                countStor: 2,
                countCAG: 0,
                isDualNode: true,
                isFusionNode: false,
            };

            const alerts = validateServerCounts(params);
            expect(alerts).toContain('分离模式下，计算服务器数量不能少于1台。');
            expect(alerts).toContain('分离模式下，存储服务器数量不能少于3台（Ceph最小要求）。');
        });
    });

    describe('validateIpRanges', () => {
        test('should allow empty IP ranges for IP requirement calculation', () => {
            const params = {
                mngIpRange: '',
                bizIpRange: '',
                pubIpRange: '',
                cluIpRange: '',
                isNetCombined: false,
            };

            const alerts = validateIpRanges(params);
            // 新设计：允许用户不填IP段来计算IP需求
            expect(alerts).toEqual([]);
        });

        test('should not require business IP in combined mode', () => {
            const params = {
                mngIpRange: '192.168.1.0/24',
                bizIpRange: '',
                pubIpRange: '172.16.0.0/24',
                cluIpRange: '172.17.0.0/24',
                isNetCombined: true,
            };

            const alerts = validateIpRanges(params);
            expect(alerts).not.toContain('网络隔离模式下，业务网IP段不能为空。');
        });

        test('should allow partial IP configuration for requirement calculation', () => {
            const params = {
                mngIpRange: '192.168.1.0/24',
                bizIpRange: '',
                pubIpRange: '',
                cluIpRange: '',
                isNetCombined: false,
            };

            const alerts = validateIpRanges(params);
            // 新设计：允许部分IP配置，用于逐步规划
            expect(alerts).toEqual([]);
        });

        test('should handle completely empty IP configuration', () => {
            const params = {
                mngIpRange: '',
                bizIpRange: '',
                pubIpRange: '',
                cluIpRange: '',
                isNetCombined: true,
            };

            const alerts = validateIpRanges(params);
            // 新设计：允许完全空的IP配置，用于计算IP需求
            expect(alerts).toEqual([]);
        });
    });

    describe('validateAllParams', () => {
        test('should throw ValidationError for invalid params', () => {
            const params = {
                insightDeployType: '否',
                deployTerminalMgmt: true,
                deployCAGPortal: false,
                isNetCombined: true,
                scene: '管理网和业务网合一场景',
                isDualNode: false,
                isCephDual: false,
                userCount: 100,
                isFusionNode: true,
                isMngAsFusion: true,
                countMng: 1,
                countFusion: 3,
                countCalc: 0,
                countStor: 0,
                countCAG: 0,
                mngIpRange: '192.168.1.0/24',
                bizIpRange: '10.0.0.0/24',
                pubIpRange: '172.16.0.0/24',
                cluIpRange: '172.17.0.0/24',
            };

            expect(() => validateAllParams(params)).toThrow(ValidationError);
        });

        test('should not throw for valid params', () => {
            const params = {
                insightDeployType: '高可用部署',
                deployTerminalMgmt: true,
                deployCAGPortal: true,
                isNetCombined: true,
                scene: '管理网和业务网合一场景',
                isDualNode: true,
                isCephDual: true,
                userCount: 1000,
                isFusionNode: true,
                isMngAsFusion: true,
                countMng: 2,
                countFusion: 3,
                countCalc: 0,
                countStor: 0,
                countCAG: 0,
                mngIpRange: '192.168.1.0/24',
                bizIpRange: '10.0.0.0/24',
                pubIpRange: '172.16.0.0/24',
                cluIpRange: '172.17.0.0/24',
            };

            expect(() => validateAllParams(params)).not.toThrow();
        });
    });

    describe('Utility validators', () => {
        test('isValidUserCount', () => {
            expect(isValidUserCount(100)).toBe(true);
            expect(isValidUserCount(50000)).toBe(true);
            expect(isValidUserCount(0)).toBe(false);
            expect(isValidUserCount(-1)).toBe(false);
            expect(isValidUserCount(50001)).toBe(false);
            expect(isValidUserCount('100')).toBe(false);
        });

        test('isValidScene', () => {
            expect(isValidScene('管理网和业务网合一场景')).toBe(true);
            expect(isValidScene('管理网和业务网隔离场景_运维通过管理网访问')).toBe(true);
            expect(isValidScene('管理网和业务网隔离场景_运维通过业务网访问')).toBe(true);
            expect(isValidScene('三网隔离场景')).toBe(true);
            expect(isValidScene('invalid scene')).toBe(false);
        });

        test('isValidInsightDeployType', () => {
            expect(isValidInsightDeployType('否')).toBe(true);
            expect(isValidInsightDeployType('非高可用部署')).toBe(true);
            expect(isValidInsightDeployType('高可用部署')).toBe(true);
            expect(isValidInsightDeployType('invalid')).toBe(false);
        });

        test('isValidStorageSecurity', () => {
            expect(isValidStorageSecurity('raid1')).toBe(true);
            expect(isValidStorageSecurity('raid5')).toBe(true);
            expect(isValidStorageSecurity('ec')).toBe(true);
            expect(isValidStorageSecurity('invalid')).toBe(false);
        });
    });
});
