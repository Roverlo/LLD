/**
 * 虚机生成器测试
 */

const { createVmObject, getVmSpec, generateBaseVms, generateCAGPortalVms, generateTerminalMgmtVms, generateAllVms } = require('./vm-generator');

const { NOT_APPLICABLE_TEXT } = require('../constants');

describe('VM Generator', () => {
    let mockIpManager;

    beforeEach(() => {
        let ipCounter = 0;
        mockIpManager = {
            getNextIp: jest.fn((networkType) => {
                ipCounter++;
                if (networkType === 'management') {
                    return `192.168.1.${ipCounter}`;
                } else if (networkType === 'business') {
                    return `192.168.2.${ipCounter}`;
                }
                return `10.0.0.${ipCounter}`;
            }),
        };
    });

    describe('createVmObject', () => {
        test('should create VM object with all properties', () => {
            const vm = createVmObject(
                'TestVM01',
                'Test虚机',
                '测试用途',
                '192.168.1.1',
                '192.168.2.1',
                '192.168.2.1',
                '4C8G100G'
            );

            expect(vm).toEqual({
                name: 'TestVM01',
                type: 'Test虚机',
                purpose: '测试用途',
                mngIp: '192.168.1.1',
                bizIp: '192.168.2.1',
                cagIp: '192.168.2.1',
                spec: '4C8G100G',
                hostServer: '待分配',
            });
        });
    });

    describe('getVmSpec', () => {
        test('should return correct spec for daisyseed01', () => {
            const spec = getVmSpec('daisyseed01', 1000);
            expect(spec).toBe('4C8G100G');
        });

        test('should return correct spec for UAS VMs based on user count', () => {
            expect(getVmSpec('UAS01', 3000)).toBe('4C6G，100G'); // <= 5000 users
            expect(getVmSpec('UAS02', 8000)).toBe('6C8G，100G'); // 5001-10000 users
            expect(getVmSpec('UAS03', 15000)).toBe('8C16G，100G'); // > 10000 users
        });

        test('should return default spec for unknown VM', () => {
            const spec = getVmSpec('UnknownVM', 1000);
            expect(spec).toBe('4C8G100G');
        });
    });

    describe('generateBaseVms', () => {
        test('should generate base VMs for combined network scenario', () => {
            const params = {
                scene: '管理网和业务网合一场景',
                isNetCombined: true,
                userCount: 1000,
                countCAG: 0,
            };

            const vms = generateBaseVms(params, mockIpManager);

            expect(vms.length).toBeGreaterThan(0);
            expect(vms[0].name).toBe('daisyseed01');
            expect(vms[0].type).toBe('功能虚机');
            expect(vms[0].mngIp).toBe('192.168.1.1');
            expect(vms[0].bizIp).toBe(NOT_APPLICABLE_TEXT);
        });

        test('should generate CAG VMs when countCAG is specified', () => {
            const params = {
                scene: '管理网和业务网合一场景',
                isNetCombined: true,
                userCount: 1000,
                countCAG: 2,
                prefixCAG: 'CAG',
            };

            const vms = generateBaseVms(params, mockIpManager);

            // 查找CAG虚机
            const cagVms = vms.filter((vm) => vm.name.startsWith('CAG'));
            expect(cagVms).toHaveLength(2);
            expect(cagVms[0].name).toBe('CAG01');
            expect(cagVms[1].name).toBe('CAG02');
            expect(cagVms[0].type).toBe('CAG虚机');
            expect(cagVms[0].purpose).toBe('CAG接入网关');
            expect(cagVms[0].spec).toBe('4C16G，150G');
            // 合一场景下：管理网IP正常分配，CAG地址也分配管理网IP
            expect(cagVms[0].mngIp).toMatch(/^192\.168\.1\.\d+$/);
            expect(cagVms[0].bizIp).toBe('不涉及');
            expect(cagVms[0].cagIp).toMatch(/^192\.168\.1\.\d+$/);
        });

        test('should generate CAG VMs with custom prefix', () => {
            const params = {
                scene: '管理网和业务网合一场景',
                isNetCombined: true,
                userCount: 1000,
                countCAG: 2,
                prefixCAG: 'MYCAG',
            };

            const vms = generateBaseVms(params, mockIpManager);

            // 查找CAG虚机
            const cagVms = vms.filter((vm) => vm.name.startsWith('MYCAG'));
            expect(cagVms).toHaveLength(2);
            expect(cagVms[0].name).toBe('MYCAG01');
            expect(cagVms[1].name).toBe('MYCAG02');
            expect(cagVms[0].spec).toBe('4C16G，150G');
        });

        test('should generate CAG VMs with separate networks', () => {
            const params = {
                scene: '管理网和业务网隔离场景_运维通过管理网访问',
                isNetCombined: false,
                userCount: 1000,
                countCAG: 1,
                prefixCAG: 'CAG',
            };

            const vms = generateBaseVms(params, mockIpManager);

            const cagVms = vms.filter((vm) => vm.name.startsWith('CAG'));
            expect(cagVms).toHaveLength(1);
            expect(cagVms[0].name).toBe('CAG01');
            // 隔离场景下：CAG虚机不分配管理网IP，只分配业务网IP，CAG地址使用业务网IP
            expect(cagVms[0].mngIp).toBe('不涉及');
            expect(cagVms[0].bizIp).toMatch(/^192\.168\.2\.\d+$/); // 业务网IP格式
            expect(cagVms[0].cagIp).toMatch(/^192\.168\.2\.\d+$/); // CAG地址使用业务网IP
        });

        test('should not generate CAG VMs when countCAG is 0', () => {
            const params = {
                scene: '管理网和业务网合一场景',
                isNetCombined: true,
                userCount: 1000,
                countCAG: 0,
                prefixCAG: 'CAG',
            };

            const vms = generateBaseVms(params, mockIpManager);

            const cagVms = vms.filter((vm) => vm.name.startsWith('CAG'));
            expect(cagVms).toHaveLength(0);
        });
    });

    describe('generateCAGPortalVms', () => {
        test('should generate CAG portal VM in non-HA mode', () => {
            const params = {
                deployCAGPortal: '非高可用部署',
                isNetCombined: false,
            };

            const vms = generateCAGPortalVms(params, mockIpManager);

            expect(vms).toHaveLength(1);
            expect(vms[0].name).toBe('insight_CAG门户01');
            expect(vms[0].type).toBe('Insight虚机');
            expect(vms[0].purpose).toBe('Insight CAG门户');
            expect(vms[0].spec).toBe('8C16G,200GB+300GB');
        });

        test('should generate CAG portal VMs in HA mode', () => {
            const params = {
                deployCAGPortal: '高可用部署',
                isNetCombined: false,
            };

            const vms = generateCAGPortalVms(params, mockIpManager);

            expect(vms).toHaveLength(3);
            expect(vms[0].name).toBe('insight_CAG门户01');
            expect(vms[0].spec).toBe('8C16G,200GB+300GB');
            expect(vms[1].name).toBe('insight_CAG门户02');
            expect(vms[1].spec).toBe('4C8G,200GB+200GB');
            expect(vms[2].name).toBe('insight_CAG门户03');
            expect(vms[2].spec).toBe('4C8G,200GB+200GB');
        });

        test('should not generate CAG portal VM when deployCAGPortal is 否', () => {
            const params = {
                deployCAGPortal: '否',
                isNetCombined: false,
            };

            const vms = generateCAGPortalVms(params, mockIpManager);

            expect(vms).toHaveLength(0);
        });
    });

    describe('generateTerminalMgmtVms', () => {
        test('should not generate independent terminal management VM', () => {
            // 终端网管现在只通过Insight集成方式生成，不再生成独立的终端网管虚机
            const params = {
                deployTerminalMgmt: true,
                isNetCombined: false,
            };

            const vms = generateTerminalMgmtVms(params, mockIpManager);

            expect(vms).toHaveLength(0); // 应该返回空数组
        });
    });

    describe('generateAllVms', () => {
        test('should generate all VMs including CAG VMs', () => {
            const params = {
                scene: '管理网和业务网合一场景',
                isNetCombined: true,
                userCount: 1000,
                countCAG: 1,
                prefixCAG: 'CAG',
                deployCAGPortal: true,
                insightDeployType: '否',
                isZXOPS: false,
                deployTerminalMgmt: false,
                deployDEM: false,
                downloadType: '否',
            };

            const vms = generateAllVms(params, mockIpManager);

            // 应该包含基础虚机和CAG虚机
            const cagVms = vms.filter((vm) => vm.name.startsWith('CAG') && !vm.name.includes('门户'));
            const cagPortalVms = vms.filter((vm) => vm.name.includes('CAG门户'));

            expect(cagVms).toHaveLength(1); // CAG虚机
            expect(cagPortalVms).toHaveLength(1); // CAG门户虚机
            expect(vms.length).toBeGreaterThan(10); // 总虚机数量
        });

        test('should generate insight VMs with correct configuration', () => {
            const params = {
                scene: '管理网和业务网隔离场景_运维通过管理网访问',
                isNetCombined: false,
                userCount: 3000,
                insightDeployType: '高可用部署',
                deployTerminalMgmt: true,
                deployCAGPortal: '高可用部署',
                countCAG: 0,
                isZXOPS: false,
                deployDEM: false,
                downloadType: '否',
            };

            const vms = generateAllVms(params, mockIpManager);

            // 验证insight基础虚机
            expect(vms.some((vm) => vm.name === 'insight_SLB')).toBe(true);
            expect(vms.some((vm) => vm.name === 'insight_daisyseed02')).toBe(true);
            expect(vms.some((vm) => vm.name === 'insight_浮动01')).toBe(true);
            expect(vms.some((vm) => vm.name === 'insight_浮动02')).toBe(true);
            expect(vms.some((vm) => vm.name === 'insight_浮动03')).toBe(true);

            // 验证insight主要虚机（3000用户，高可用部署）
            expect(vms.some((vm) => vm.name === 'insight虚机A_Ctrl')).toBe(true);
            expect(vms.some((vm) => vm.name === 'insight虚机B_组件')).toBe(true);
            expect(vms.some((vm) => vm.name === 'insight虚机C_ES')).toBe(true);

            // 验证insight网管虚机
            expect(vms.some((vm) => vm.name === 'insight虚机D01（网管）')).toBe(true);
            expect(vms.some((vm) => vm.name === 'insight虚机D02（网管）')).toBe(true);

            // 验证insight CAG门户虚机
            expect(vms.some((vm) => vm.name === 'insight_CAG门户01')).toBe(true);
            expect(vms.some((vm) => vm.name === 'insight_CAG门户02')).toBe(true);
            expect(vms.some((vm) => vm.name === 'insight_CAG门户03')).toBe(true);

            // 验证虚机规格
            const ctrlVm = vms.find((vm) => vm.name === 'insight虚机A_Ctrl');
            expect(ctrlVm.spec).toBe('16C48G,0.5T+1T');

            const esVm = vms.find((vm) => vm.name === 'insight虚机C_ES');
            expect(esVm.spec).toBe('16C48G,0.3T+3.0T'); // 3000用户约3T存储
        });
    });
});
