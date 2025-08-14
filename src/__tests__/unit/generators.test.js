/**
 * 生成器模块单元测试
 */

const {
    generateServerName,
    createServerObject,
    getServerSpecs,
    generateManagementServers,
    generateComputeServers,
    generateFusionServers,
    generateStorageServers,
    generateCAGServers,
    generateAllServers,
} = require('../../main/generators/server-generator');

const {
    createVmObject,
    getVmSpec,
    generateBaseVms,
    generateInsightVms,
} = require('../../main/generators/vm-generator');

const {
    createStoragePool,
    createStorageCluster,
    getFuncVmPools,
    getDesktopPools,
    generateCephClusters,
    calculateStorageCapacity,
    generateStorageSummary,
    validateStorageConfig,
} = require('../../main/generators/storage-generator');

const { NOT_APPLICABLE_TEXT, SERVER_TYPES, NETWORK_SCENES } = require('../../main/constants');
const IpManager = require('../../main/managers/ip-manager');
const { mockParams, mockServerConfigs, mockVmConfigs } = require('../fixtures/test-data');
const { generateRandomIp, mockUserParams } = require('../helpers/test-utils');

describe('生成器模块', () => {
    let ipManager;
    let validParams;

    beforeEach(() => {
        validParams = {
            mngIpRange: '192.168.1.1-192.168.1.50',
            bizIpRange: '10.0.1.1-10.0.1.50',
            pubIpRange: '172.16.1.1-172.16.1.50',
            cluIpRange: '192.168.100.1-192.168.100.50',
            isNetCombined: false,
            countMng: 2,
            countCalc: 3,
            countFusion: 5,
            countStor: 3,
            countCAG: 2,
            prefixMng: 'MNG',
            prefixFusion: 'FUSION',
            prefixStor: 'STOR',
            prefixCAG: 'CAG',
            isDualNode: true,
            isCephDual: true,
            alignFloatIp: true,
            isFusionNode: false,
            scene: 'scene1',
            userCount: 5000,
            storageSecurity: 'raid1',
        };
        ipManager = new IpManager(validParams);
    });

    describe('服务器生成器', () => {
        describe('generateServerName函数', () => {
            test('应该生成正确的管理服务器名称', () => {
                const name = generateServerName(SERVER_TYPES.MANAGEMENT, 1, { mng: 'MNG' });
                expect(name).toBe('MNG01');
            });

            test('应该生成正确的计算服务器名称', () => {
                const name = generateServerName(SERVER_TYPES.COMPUTE, 3, { fusion: 'COMPUTE' });
                expect(name).toBe('COMPUTE03');
            });

            test('应该生成正确的超融合服务器名称', () => {
                const name = generateServerName(SERVER_TYPES.FUSION, 2, { fusion: 'FUSION' });
                expect(name).toBe('FUSION02');
            });

            test('应该生成正确的存储服务器名称', () => {
                const name = generateServerName(SERVER_TYPES.STORAGE, 1, { stor: 'STOR' });
                expect(name).toBe('STOR01');
            });

            test('应该生成正确的CAG服务器名称', () => {
                const name = generateServerName(SERVER_TYPES.CAG, 1, { cag: 'CAG' });
                expect(name).toBe('CAG01');
            });

            test('未知类型应该返回不适用文本', () => {
                const name = generateServerName('unknown', 1, { mng: 'MNG' });
                expect(name).toBe(NOT_APPLICABLE_TEXT);
            });

            test('索引为0应该返回前缀', () => {
                const name = generateServerName(SERVER_TYPES.MANAGEMENT, 0, { mng: 'MNG' });
                expect(name).toBe('MNG');
            });

            test('前缀为不适用文本时应该返回不适用文本', () => {
                const name = generateServerName(SERVER_TYPES.MANAGEMENT, 1, { mng: NOT_APPLICABLE_TEXT });
                expect(name).toBe(NOT_APPLICABLE_TEXT);
            });
        });

        describe('createServerObject函数', () => {
            test('应该创建正确的服务器对象', () => {
                const server = createServerObject(
                    'MNG01',
                    SERVER_TYPES.MANAGEMENT,
                    '192.168.1.1',
                    '10.0.1.1',
                    '172.16.1.1',
                    '192.168.100.1',
                    NOT_APPLICABLE_TEXT
                );

                expect(server).toEqual({
                    hostname: 'MNG01',
                    role: SERVER_TYPES.MANAGEMENT,
                    mngIp: '192.168.1.1',
                    bizIp: '10.0.1.1',
                    pubIp: '172.16.1.1',
                    cluIp: '192.168.100.1',
                    floatIp: NOT_APPLICABLE_TEXT,
                    isFloatingIp: false,
                    specs: expect.any(Object),
                });
            });

            test('应该正确识别浮动IP服务器', () => {
                const server = createServerObject(
                    '管理节点浮动IP',
                    '管理节点浮动IP',
                    '192.168.1.1',
                    '10.0.1.1',
                    '172.16.1.1',
                    '192.168.100.1',
                    NOT_APPLICABLE_TEXT
                );

                expect(server.isFloatingIp).toBe(true);
            });
        });

        describe('getServerSpecs函数', () => {
            test('应该返回管理服务器的正确规格', () => {
                const specs = getServerSpecs(SERVER_TYPES.MANAGEMENT);
                expect(specs).toEqual({
                    cpu: '16C',
                    memory: '32G',
                    storage: '500G SSD',
                    network: '4*10GE',
                });
            });

            test('应该返回计算服务器的正确规格', () => {
                const specs = getServerSpecs(SERVER_TYPES.COMPUTE);
                expect(specs).toEqual({
                    cpu: '32C',
                    memory: '128G',
                    storage: '500G SSD',
                    network: '4*10GE',
                });
            });

            test('应该返回超融合服务器的正确规格', () => {
                const specs = getServerSpecs(SERVER_TYPES.FUSION);
                expect(specs).toEqual({
                    cpu: '32C',
                    memory: '128G',
                    storage: '500G SSD + 4*2T HDD',
                    network: '4*10GE',
                });
            });

            test('应该返回存储服务器的正确规格', () => {
                const specs = getServerSpecs(SERVER_TYPES.STORAGE);
                expect(specs).toEqual({
                    cpu: '16C',
                    memory: '64G',
                    storage: '500G SSD + 8*2T HDD',
                    network: '4*10GE',
                });
            });

            test('应该返回CAG服务器的正确规格', () => {
                const specs = getServerSpecs(SERVER_TYPES.CAG);
                expect(specs).toEqual({
                    cpu: '8C',
                    memory: '16G',
                    storage: '500G SSD',
                    network: '4*10GE',
                });
            });

            test('未知角色应该返回待定规格', () => {
                const specs = getServerSpecs('unknown');
                expect(specs).toEqual({
                    cpu: '待定',
                    memory: '待定',
                    storage: '待定',
                    network: '待定',
                });
            });
        });

        describe('generateManagementServers函数', () => {
            test('应该生成正确数量的管理服务器', () => {
                const servers = generateManagementServers(validParams, ipManager);
                expect(servers.length).toBeGreaterThanOrEqual(validParams.countMng);
            });

            test('应该为双节点模式生成浮动IP', () => {
                const params = { ...validParams, isDualNode: true, isCephDual: false };
                const servers = generateManagementServers(params, ipManager);

                const floatingIpServers = servers.filter((s) => s.isFloatingIp);
                expect(floatingIpServers).toHaveLength(1);
                expect(floatingIpServers[0].hostname).toBe('管理节点浮动IP');
            });

            test('应该为Ceph双机模式生成额外的浮动IP', () => {
                const params = { ...validParams, isDualNode: true, isCephDual: true };
                const servers = generateManagementServers(params, ipManager);

                const floatingIpServers = servers.filter((s) => s.isFloatingIp);
                expect(floatingIpServers).toHaveLength(2);
                expect(floatingIpServers.some((s) => s.hostname === 'ceph管理浮动IP')).toBe(true);
            });

            test('网络合并模式下业务网IP应该为不适用', () => {
                const params = { ...validParams, isNetCombined: true };
                const servers = generateManagementServers(params, ipManager);

                servers.forEach((server) => {
                    if (!server.isFloatingIp) {
                        expect(server.bizIp).toBe(NOT_APPLICABLE_TEXT);
                    }
                });
            });

            test('alignFloatIp为false时浮动IP不应分配存储地址', () => {
                const params = { ...validParams, isDualNode: true, alignFloatIp: false };
                const servers = generateManagementServers(params, ipManager);

                const floatingIpServers = servers.filter((s) => s.isFloatingIp);
                floatingIpServers.forEach((server) => {
                    if (server.hostname !== 'ceph管理浮动IP') {
                        expect(server.pubIp).toBe(NOT_APPLICABLE_TEXT);
                        expect(server.cluIp).toBe(NOT_APPLICABLE_TEXT);
                    }
                });
            });
        });

        describe('generateComputeServers函数', () => {
            test('应该生成正确数量的计算服务器', () => {
                const servers = generateComputeServers(validParams, ipManager);
                expect(servers).toHaveLength(validParams.countCalc);
            });

            test('计算服务器不应该有集群网IP', () => {
                const servers = generateComputeServers(validParams, ipManager);
                servers.forEach((server) => {
                    expect(server.cluIp).toBe(NOT_APPLICABLE_TEXT);
                });
            });

            test('应该使用正确的前缀', () => {
                const servers = generateComputeServers(validParams, ipManager);
                servers.forEach((server, index) => {
                    expect(server.hostname).toBe(
                        `${validParams.prefixFusion}${(index + 1).toString().padStart(2, '0')}`
                    );
                });
            });
        });

        describe('generateFusionServers函数', () => {
            test('应该生成正确数量的超融合服务器', () => {
                const servers = generateFusionServers(validParams, ipManager);
                expect(servers).toHaveLength(validParams.countFusion);
            });

            test('超融合服务器应该有所有网络IP', () => {
                const servers = generateFusionServers(validParams, ipManager);
                servers.forEach((server) => {
                    expect(server.mngIp).not.toBe(NOT_APPLICABLE_TEXT);
                    expect(server.pubIp).not.toBe(NOT_APPLICABLE_TEXT);
                    expect(server.cluIp).not.toBe(NOT_APPLICABLE_TEXT);
                    if (!validParams.isNetCombined) {
                        expect(server.bizIp).not.toBe(NOT_APPLICABLE_TEXT);
                    }
                });
            });
        });

        describe('generateStorageServers函数', () => {
            test('应该生成正确数量的存储服务器', () => {
                const servers = generateStorageServers(validParams, ipManager);
                expect(servers).toHaveLength(validParams.countStor);
            });

            test('存储服务器不应该有业务网IP', () => {
                const servers = generateStorageServers(validParams, ipManager);
                servers.forEach((server) => {
                    expect(server.bizIp).toBe(NOT_APPLICABLE_TEXT);
                });
            });
        });

        describe('generateCAGServers函数', () => {
            test('应该生成正确数量的CAG服务器', () => {
                const servers = generateCAGServers(validParams, ipManager);
                expect(servers).toHaveLength(validParams.countCAG);
            });

            test('CAG服务器不应该有存储网IP', () => {
                const servers = generateCAGServers(validParams, ipManager);
                servers.forEach((server) => {
                    expect(server.pubIp).toBe(NOT_APPLICABLE_TEXT);
                    expect(server.cluIp).toBe(NOT_APPLICABLE_TEXT);
                });
            });
        });

        describe('generateAllServers函数', () => {
            test('分离模式应该生成管理、计算和存储服务器', () => {
                const params = { ...validParams, isFusionNode: false };
                const servers = generateAllServers(params, ipManager);

                const managementServers = servers.filter((s) => s.role === SERVER_TYPES.MANAGEMENT && !s.isFloatingIp);
                const computeServers = servers.filter((s) => s.role === SERVER_TYPES.COMPUTE);
                const storageServers = servers.filter((s) => s.role === SERVER_TYPES.STORAGE);

                expect(managementServers).toHaveLength(params.countMng);
                expect(computeServers).toHaveLength(params.countCalc);
                expect(storageServers).toHaveLength(params.countStor);
            });

            test('超融合模式应该生成管理和超融合服务器', () => {
                const params = { ...validParams, isFusionNode: true };
                const servers = generateAllServers(params, ipManager);

                const managementServers = servers.filter((s) => s.role === SERVER_TYPES.MANAGEMENT && !s.isFloatingIp);
                const fusionServers = servers.filter((s) => s.role === SERVER_TYPES.FUSION);

                expect(managementServers).toHaveLength(params.countMng);
                expect(fusionServers).toHaveLength(params.countFusion);
            });
        });
    });

    describe('虚机生成器', () => {
        describe('createVmObject函数', () => {
            test('应该创建正确的虚机对象', () => {
                const vm = createVmObject(
                    'test-vm',
                    '功能虚机',
                    '测试用途',
                    '192.168.1.100',
                    '10.0.1.100',
                    NOT_APPLICABLE_TEXT,
                    '4C8G100G'
                );

                expect(vm).toEqual({
                    name: 'test-vm',
                    type: '功能虚机',
                    purpose: '测试用途',
                    mngIp: '192.168.1.100',
                    bizIp: '10.0.1.100',
                    cagIp: NOT_APPLICABLE_TEXT,
                    spec: '4C8G100G',
                    hostServer: '待分配',
                });
            });
        });

        describe('getVmSpec函数', () => {
            test('应该返回daisyseed01的正确规格', () => {
                const spec = getVmSpec('daisyseed01', 5000);
                expect(spec).toBeDefined();
            });

            test('应该根据用户数量返回UAS的正确规格', () => {
                const smallSpec = getVmSpec('UAS01', 3000);
                const mediumSpec = getVmSpec('UAS02', 7000);
                const largeSpec = getVmSpec('UAS03', 15000);

                expect(smallSpec).toBeDefined();
                expect(mediumSpec).toBeDefined();
                expect(largeSpec).toBeDefined();
                expect(smallSpec).not.toBe(largeSpec);
            });

            test('应该为浮动IP虚机返回正确规格', () => {
                const spec = getVmSpec('test浮动01', 5000);
                expect(spec).toBeDefined();
            });

            test('应该为SLB虚机返回正确规格', () => {
                const spec = getVmSpec('testSLB', 5000);
                expect(spec).toBeDefined();
            });

            test('应该根据用户数量返回paas-controller-tcf的正确规格', () => {
                const smallSpec = getVmSpec('paas-controller-tcf01', 5000);
                const largeSpec = getVmSpec('paas-controller-tcf01', 15000);

                expect(smallSpec).toBeDefined();
                expect(largeSpec).toBeDefined();
            });

            test('未知虚机应该返回默认规格', () => {
                const spec = getVmSpec('unknown-vm', 5000);
                expect(spec).toBe('4C8G100G');
            });
        });

        describe('generateBaseVms函数', () => {
            test('应该根据场景生成基础虚机', () => {
                const params = { ...validParams, scene: '管理网和业务网合一场景', countCAG: 2 };
                const vms = generateBaseVms(params, ipManager);

                expect(vms.length).toBeGreaterThan(0);

                // 检查CAG虚机
                const cagVms = vms.filter((vm) => vm.type === 'CAG虚机');
                expect(cagVms).toHaveLength(params.countCAG);
            });

            test('网络合并模式下CAG虚机应该正确分配IP', () => {
                const params = { ...validParams, scene: '管理网和业务网合一场景', isNetCombined: true, countCAG: 1 };
                const vms = generateBaseVms(params, ipManager);

                const cagVm = vms.find((vm) => vm.type === 'CAG虚机');
                expect(cagVm.mngIp).not.toBe(NOT_APPLICABLE_TEXT);
                expect(cagVm.bizIp).toBe(NOT_APPLICABLE_TEXT);
                expect(cagVm.cagIp).not.toBe(NOT_APPLICABLE_TEXT);
            });

            test('网络隔离模式下CAG虚机应该正确分配IP', () => {
                const params = {
                    ...validParams,
                    scene: '管理网和业务网隔离场景_运维通过管理网访问',
                    isNetCombined: false,
                    countCAG: 1,
                };
                const vms = generateBaseVms(params, ipManager);

                const cagVm = vms.find((vm) => vm.type === 'CAG虚机');
                expect(cagVm.mngIp).toBe(NOT_APPLICABLE_TEXT);
                expect(cagVm.bizIp).not.toBe(NOT_APPLICABLE_TEXT);
                expect(cagVm.cagIp).not.toBe(NOT_APPLICABLE_TEXT);
            });

            test('不支持的场景应该抛出错误', () => {
                const params = { ...validParams, scene: 'invalid-scene' };
                expect(() => {
                    generateBaseVms(params, ipManager);
                }).toThrow('不支持的网络场景');
            });
        });
    });

    describe('存储生成器', () => {
        describe('createStoragePool函数', () => {
            test('应该创建正确的存储池对象', () => {
                const pool = createStoragePool('POOL_MNG01', '功能虚机存储', 'raid1', 'SSD');

                expect(pool).toEqual({
                    pool: 'POOL_MNG01',
                    use: '功能虚机存储',
                    replica: 'raid1',
                    type: 'SSD',
                });
            });
        });

        describe('createStorageCluster函数', () => {
            test('应该创建正确的存储集群对象', () => {
                const pools = [createStoragePool('POOL_MNG01', '功能虚机存储', 'raid1', 'SSD')];
                const cluster = createStorageCluster('CEPH集群01', 3, pools);

                expect(cluster).toEqual({
                    name: 'CEPH集群01',
                    nodeCount: 3,
                    nodes: ['节点1', '节点2', '节点3'],
                    pools,
                    totalCapacity: '待计算',
                    usableCapacity: '待计算',
                });
            });
        });

        describe('getFuncVmPools函数', () => {
            test('应该返回功能虚机存储池配置', () => {
                const pools = getFuncVmPools('raid1');

                expect(pools.length).toBeGreaterThan(0);
                pools.forEach((pool) => {
                    expect(pool.replica).toBe('raid1');
                    expect(pool.use).toContain('功能虚机');
                });
            });
        });

        describe('getDesktopPools函数', () => {
            test('应该返回包含SSD和HDD的桌面存储池', () => {
                const pools = getDesktopPools('raid1', true);

                expect(pools).toHaveLength(2);
                expect(pools.some((p) => p.type === 'SSD')).toBe(true);
                expect(pools.some((p) => p.type === 'HDD')).toBe(true);
            });

            test('应该返回仅包含SSD的桌面存储池', () => {
                const pools = getDesktopPools('raid1', false);

                expect(pools).toHaveLength(1);
                expect(pools[0].type).toBe('SSD');
            });
        });

        describe('generateCephClusters函数', () => {
            test('分离模式应该生成单个集群', () => {
                const params = {
                    isFusionNode: false,
                    countStor: 3,
                    storageSecurity: 'raid1',
                    hasHdd: true,
                };

                const clusters = generateCephClusters(params);

                expect(clusters).toHaveLength(1);
                expect(clusters[0].name).toBe('CEPH集群01');
                expect(clusters[0].nodeCount).toBe(3);
            });

            test('超融合模式（管理节点不参与）应该生成单个集群', () => {
                const params = {
                    isFusionNode: true,
                    isMngAsFusion: false,
                    countFusion: 5,
                    storageSecurity: 'raid1',
                    hasHdd: true,
                };

                const clusters = generateCephClusters(params);

                expect(clusters).toHaveLength(1);
                expect(clusters[0].name).toBe('CEPH集群01');
                expect(clusters[0].nodeCount).toBe(5);
            });

            test('超融合模式（管理节点参与）应该生成两个集群', () => {
                const params = {
                    isFusionNode: true,
                    isMngAsFusion: true,
                    countMng: 2,
                    countFusion: 5,
                    storageSecurity: 'raid1',
                    hasHdd: true,
                };

                const clusters = generateCephClusters(params);

                expect(clusters).toHaveLength(2);
                expect(clusters[0].name).toBe('CEPH_MNG');
                expect(clusters[0].nodeCount).toBe(2);
                expect(clusters[1].name).toBe('CEPH集群01');
                expect(clusters[1].nodeCount).toBe(5);
            });
        });

        describe('calculateStorageCapacity函数', () => {
            test('应该正确计算RAID1容量', () => {
                const cluster = { nodeCount: 4 };
                const capacity = calculateStorageCapacity(cluster, 'raid1');

                expect(capacity.totalCapacity).toBe('32TB');
                expect(capacity.usableCapacity).toBe('16.0TB');
                expect(capacity.redundancy).toBe('2副本');
            });

            test('应该正确计算RAID5容量', () => {
                const cluster = { nodeCount: 4 };
                const capacity = calculateStorageCapacity(cluster, 'raid5');

                expect(capacity.totalCapacity).toBe('32TB');
                expect(capacity.usableCapacity).toBe('24.0TB');
                expect(capacity.redundancy).toBe('3副本');
            });

            test('应该正确计算纠删码容量', () => {
                const cluster = { nodeCount: 6 };
                const capacity = calculateStorageCapacity(cluster, 'ec');

                expect(capacity.totalCapacity).toBe('48TB');
                expect(capacity.usableCapacity).toBe('32.2TB');
                expect(capacity.redundancy).toBe('4+2纠删码');
            });
        });

        describe('generateStorageSummary函数', () => {
            test('应该生成正确的存储摘要', () => {
                const clusters = [createStorageCluster('CEPH集群01', 3, []), createStorageCluster('CEPH集群02', 2, [])];

                const summary = generateStorageSummary(clusters, 'raid1');

                expect(summary.totalClusters).toBe(2);
                expect(summary.totalNodes).toBe(5);
                expect(summary.redundancyStrategy).toBe('raid1');
                expect(summary.clusters).toHaveLength(2);
            });
        });
    });

    describe('边界条件测试', () => {
        test('应该处理零数量的服务器', () => {
            const params = { ...validParams, countMng: 0, countCalc: 0, countFusion: 0, countStor: 0 };

            expect(() => {
                generateManagementServers(params, ipManager);
                generateComputeServers(params, ipManager);
                generateFusionServers(params, ipManager);
                generateStorageServers(params, ipManager);
            }).not.toThrow();
        });

        test('应该处理大量服务器', () => {
            const params = { ...validParams, countMng: 100, countFusion: 200 };

            expect(() => {
                generateManagementServers(params, ipManager);
                generateFusionServers(params, ipManager);
            }).not.toThrow();
        });

        test('应该处理空前缀', () => {
            const params = {
                ...validParams,
                prefixMng: '',
                prefixFusion: '',
                prefixStor: '',
            };

            expect(() => {
                generateManagementServers(params, ipManager);
                generateFusionServers(params, ipManager);
                generateStorageServers(params, ipManager);
            }).not.toThrow();
        });

        test('应该处理null和undefined参数', () => {
            expect(() => {
                generateServerName(null, 1, {});
                getServerSpecs(null);
            }).not.toThrow();

            // createServerObject with null role should throw
            expect(() => {
                createServerObject(null, null, null, null, null, null, null);
            }).toThrow();
        });

        test('应该处理无效的存储安全策略', () => {
            const cluster = { nodeCount: 3 };
            const capacity = calculateStorageCapacity(cluster, 'invalid');

            expect(capacity.redundancy).toBe('2副本');
        });
    });

    describe('性能测试', () => {
        test('生成大量服务器应该在合理时间内完成', () => {
            const startTime = Date.now();

            const params = {
                ...validParams,
                countMng: 50,
                countFusion: 100,
                countStor: 50,
            };

            generateAllServers(params, ipManager);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 应该在1秒内完成
            expect(duration).toBeLessThan(1000);
        });

        test('生成大量虚机应该在合理时间内完成', () => {
            const startTime = Date.now();

            const params = {
                ...validParams,
                scene: '管理网和业务网合一场景',
                countCAG: 50,
            };

            generateBaseVms(params, ipManager);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 应该在1秒内完成
            expect(duration).toBeLessThan(1000);
        });
    });
});
