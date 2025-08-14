/**
 * 测试数据夹具
 * 提供各种测试场景的模拟数据
 */

// 有效的IP池配置
const validIpPools = [
    {
        network: '192.168.1.0/24',
        type: 'management',
        description: '管理网络',
    },
    {
        network: '10.0.0.0/16',
        type: 'business',
        description: '业务网络',
    },
    {
        network: '172.16.0.0/12',
        type: 'storage',
        description: '存储网络',
    },
];

// 无效的IP池配置
const invalidIpPools = [
    {
        network: '256.256.256.0/24', // 无效IP
        type: 'management',
    },
    {
        network: '192.168.1.0/33', // 无效子网掩码
        type: 'business',
    },
    {
        network: 'invalid-network', // 完全无效的网络格式
        type: 'storage',
    },
];

// 服务器配置数据
const serverConfigs = {
    management: {
        cpu: '16C',
        memory: '32G',
        storage: '500G SSD',
        role: 'management',
    },
    compute: {
        cpu: '32C',
        memory: '128G',
        storage: '1T SSD',
        role: 'compute',
    },
    storage: {
        cpu: '8C',
        memory: '16G',
        storage: '2T HDD',
        role: 'storage',
    },
};

// 虚拟机配置数据
const vmConfigs = [
    {
        name: 'vm-web-01',
        cpu: '4C',
        memory: '8G',
        storage: '100G',
        role: 'web-server',
    },
    {
        name: 'vm-db-01',
        cpu: '8C',
        memory: '16G',
        storage: '200G',
        role: 'database',
    },
    {
        name: 'vm-app-01',
        cpu: '6C',
        memory: '12G',
        storage: '150G',
        role: 'application',
    },
];

// 用户输入参数模拟
const mockUserParams = {
    valid: {
        userCount: 1000,
        mngNetwork: '192.168.1.0/24',
        bizNetwork: '10.0.0.0/16',
        storageNetwork: '172.16.0.0/12',
        serverPrefix: 'SRV',
        vmPrefix: 'VM',
        deploymentType: 'production',
        redundancy: true,
    },
    minimal: {
        userCount: 100,
        mngNetwork: '192.168.1.0/24',
        bizNetwork: '10.0.0.0/24',
        serverPrefix: 'TEST',
        vmPrefix: 'VM',
        deploymentType: 'test',
        redundancy: false,
    },
    invalid: {
        userCount: -1,
        mngNetwork: 'invalid-network',
        bizNetwork: '',
        serverPrefix: '',
        vmPrefix: '',
    },
};

// Excel生成测试数据
const excelTestData = {
    servers: [
        {
            name: 'SRV-MNG-01',
            ip: '192.168.1.10',
            role: 'management',
            specs: serverConfigs.management,
        },
        {
            name: 'SRV-COMP-01',
            ip: '10.0.0.10',
            role: 'compute',
            specs: serverConfigs.compute,
        },
    ],
    vms: [
        {
            name: 'VM-WEB-01',
            ip: '10.0.1.10',
            host: 'SRV-COMP-01',
            specs: vmConfigs[0],
        },
        {
            name: 'VM-DB-01',
            ip: '10.0.1.11',
            host: 'SRV-COMP-01',
            specs: vmConfigs[1],
        },
    ],
    summary: {
        totalServers: 2,
        totalVMs: 2,
        totalIPs: 4,
        networks: validIpPools,
    },
};

// 性能测试数据
const performanceTestData = {
    largeUserCount: 10000,
    largeIpPool: {
        network: '10.0.0.0/8',
        type: 'performance-test',
        description: '性能测试大网段',
    },
    bulkOperations: {
        ipAllocations: 1000,
        serverGenerations: 100,
        vmGenerations: 500,
    },
};

// 边界条件测试数据
const boundaryTestData = {
    emptyInputs: {
        userCount: 0,
        networks: [],
        prefixes: ['', null, undefined],
    },
    maxValues: {
        userCount: 999999,
        maxNetworkSize: '10.0.0.0/8',
        longPrefix: 'A'.repeat(50),
    },
    specialCharacters: {
        prefixes: ['SRV-测试', 'SRV@#$', 'SRV 空格'],
        networks: ['192.168.1.0/24 ', ' 10.0.0.0/16'],
    },
};

// 错误场景测试数据
const errorTestData = {
    networkConflicts: [
        { network: '192.168.1.0/24', type: 'management' },
        { network: '192.168.1.0/25', type: 'business' }, // 重叠网段
    ],
    insufficientIPs: {
        network: '192.168.1.0/30', // 只有2个可用IP
        requiredIPs: 10,
    },
    invalidFormats: {
        networks: ['not-a-network', '192.168.1', '192.168.1.0/'],
        userCounts: ['abc', null, undefined, -1, 0.5],
    },
};

// 完整的mockParams用于Excel服务测试
const mockParams = {
    userCount: 1000,
    mngNetwork: '192.168.1.0/24',
    bizNetwork: '10.0.0.0/16',
    storageNetwork: '172.16.0.0/12',
    serverPrefix: 'SRV',
    vmPrefix: 'VM',
    deploymentType: 'production',
    redundancy: true,
    mngBondName: 'bond0',
    mngBondNics: 'eth0,eth1',
    bizBondName: 'bond1',
    bizBondNics: 'eth2,eth3',
    storBondName: 'bond2',
    storBondNics: 'eth4,eth5',
    isNetCombined: false,
    isFusionNode: false,
    isMngAsFusion: false,
    countMng: 2,
    countFusion: 0,
    countStor: 2,
    isCephDual: true,
    storageSecurity: 'replica',
    ssdCount: 2,
    ssdSpec: '1TB',
    hddCount: 4,
    hddSpec: '2TB',
    cpuCores: 32,
    memorySize: 128,
    osdReservedSize: 0.1,
};

// Excel测试数据，包含ipUsage
const mockExcelData = {
    servers: excelTestData.servers,
    vms: excelTestData.vms,
    desktopVmTypes: [{ type: 'desktop', count: 100 }],
    summary: excelTestData.summary,
    ipUsage: {
        management: {
            total: 254,
            used: 10,
            remaining: 244,
        },
        business: {
            total: 65534,
            used: 20,
            remaining: 65514,
        },
        storage: {
            total: 1048574,
            used: 5,
            remaining: 1048569,
        },
    },
    ipRanges: {
        management: '192.168.1.10-192.168.1.50',
        business: '10.0.0.10-10.0.0.100',
        storage: '172.16.0.10-172.16.0.50',
    },
};

module.exports = {
    validIpPools,
    invalidIpPools,
    serverConfigs,
    vmConfigs,
    mockUserParams,
    mockParams,
    excelTestData,
    mockExcelData,
    performanceTestData,
    boundaryTestData,
    errorTestData,
};
