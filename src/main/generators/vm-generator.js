/**
 * 虚拟机生成模块
 */

const { NOT_APPLICABLE_TEXT, NETWORK_SCENES, VM_SPECS } = require('../constants');

/**
 * 创建虚拟机对象
 * @param {string} name - 虚机名称
 * @param {string} type - 虚机类型
 * @param {string} purpose - 用途
 * @param {string} mngIp - 管理网IP
 * @param {string} bizIp - 业务网IP
 * @param {string} cagIp - CAG地址
 * @param {string} spec - 规格
 * @returns {Object} 虚机对象
 */
const createVmObject = (name, type, purpose, mngIp, bizIp, cagIp, spec) => {
    return {
        name,
        type,
        purpose,
        mngIp,
        bizIp,
        cagIp,
        spec,
        hostServer: '待分配',
    };
};

/**
 * 获取虚机规格
 * @param {string} vmName - 虚机名称
 * @param {number} userCount - 用户数量
 * @returns {string} 虚机规格
 */
const getVmSpec = (vmName, userCount) => {
    if (vmName === 'daisyseed01') {
        return VM_SPECS.daisyseed01;
    }

    if (vmName.includes('浮动') || vmName.endsWith('SLB')) {
        return VM_SPECS.floating;
    }

    if (vmName.includes('paas-controller-tcf')) {
        return userCount <= 10000 ? VM_SPECS['paas-controller-tcf'].small : VM_SPECS['paas-controller-tcf'].large;
    }

    if (/^UAS0[1-3]$/.test(vmName)) {
        if (userCount <= 5000) {
            return VM_SPECS.UAS.small;
        } else if (userCount <= 10000) {
            return VM_SPECS.UAS.medium;
        } else {
            return VM_SPECS.UAS.large;
        }
    }

    // 默认规格
    return '4C8G100G';
};

/**
 * 生成基础虚机
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 虚机列表
 */
const generateBaseVms = (params, ipManager) => {
    const { scene, isNetCombined, userCount, countCAG, prefixCAG } = params;
    const vms = [];

    const sceneConfig = NETWORK_SCENES[scene];
    if (!sceneConfig) {
        throw new Error(`不支持的网络场景: ${scene}`);
    }

    // 生成场景配置中的基础虚机
    sceneConfig.roles.forEach((role) => {
        const { name, m, b, cagAddr = false } = role;

        const mngIp = m ? ipManager.getNextIp('management', 'vm') : NOT_APPLICABLE_TEXT;
        const bizIp = isNetCombined
            ? NOT_APPLICABLE_TEXT
            : b
              ? ipManager.getNextIp('business', 'vm')
              : NOT_APPLICABLE_TEXT;
        let cagIp = NOT_APPLICABLE_TEXT;

        // 处理CAG地址
        if (cagAddr) {
            if (isNetCombined) {
                cagIp = ipManager.getNextIp('management', 'vm');
            } else {
                cagIp = ipManager.getNextIp('business', 'vm');
            }
        }

        const spec = getVmSpec(name, userCount);
        const vm = createVmObject(name, '功能虚机', '平台核心服务', mngIp, bizIp, cagIp, spec);
        vms.push(vm);
    });

    // 生成CAG虚机（根据用户输入的数量）
    if (countCAG && countCAG > 0) {
        for (let i = 1; i <= countCAG; i++) {
            const cagName = `${prefixCAG || 'CAG'}${i.toString().padStart(2, '0')}`;
            let mngIp, bizIp, cagIp;

            // 参考js1.txt中的CAG虚机IP生成规则
            if (isNetCombined) {
                // 合一场景：正常分配管理网IP，CAG地址也使用管理网IP
                mngIp = ipManager.getNextIp('management', 'vm');
                bizIp = NOT_APPLICABLE_TEXT;
                cagIp = ipManager.getNextIp('management', 'vm');
            } else {
                // 隔离场景：CAG虚机不分配管理网IP，只分配业务网IP，CAG地址使用业务网IP
                mngIp = NOT_APPLICABLE_TEXT;
                bizIp = ipManager.getNextIp('business', 'vm');
                cagIp = ipManager.getNextIp('business', 'vm');
            }

            const spec = VM_SPECS.CAG; // 使用正确的CAG虚机规格：4C16G，150G

            const cagVm = createVmObject(cagName, 'CAG虚机', 'CAG接入网关', mngIp, bizIp, cagIp, spec);
            // CAG虚机不分配到物理服务器，保持hostServer为'待分配'
            vms.push(cagVm);
        }
    }

    return vms;
};

/**
 * 生成Insight相关虚机
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 虚机列表
 */
const generateInsightVms = (params, ipManager) => {
    const { insightDeployType, isNetCombined, userCount, deployTerminalMgmt, deployCAGPortal } = params;
    const vms = [];

    if (insightDeployType === '否') {
        return vms;
    }

    const isHA = insightDeployType === '高可用部署';

    // 生成基础虚机（所有部署类型都需要）
    generateInsightBaseVms(vms, ipManager, isNetCombined);

    // 根据部署类型和用户数量生成主要虚机
    if (isHA) {
        generateInsightHAVms(vms, ipManager, isNetCombined, userCount, deployTerminalMgmt);
    } else {
        generateInsightStandaloneVms(vms, ipManager, isNetCombined, userCount);
    }

    // 生成CAG门户虚机（如果需要）
    if (deployCAGPortal) {
        generateInsightCAGPortalVms(vms, ipManager, isNetCombined, isHA);
    }

    return vms;
};

/**
 * 生成Insight基础虚机
 * @param {Object[]} vms - 虚机列表
 * @param {Object} ipManager - IP管理器
 * @param {boolean} isNetCombined - 是否网络合并
 */
const generateInsightBaseVms = (vms, ipManager, isNetCombined) => {
    // insight_SLB (负载均衡器)
    const slbVm = createVmObject(
        'insight_SLB',
        'Insight虚机',
        'Insight负载均衡器',
        ipManager.getNextIp('management'),
        isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
        NOT_APPLICABLE_TEXT,
        NOT_APPLICABLE_TEXT
    );
    vms.push(slbVm);

    // insight_daisyseed02 (基础服务)
    const daisyseedVm = createVmObject(
        'insight_daisyseed02',
        'Insight虚机',
        'Insight基础服务',
        ipManager.getNextIp('management'),
        isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
        NOT_APPLICABLE_TEXT,
        '4C8G100G'
    );
    vms.push(daisyseedVm);

    // insight_浮动01-03 (浮动IP虚机)
    for (let i = 1; i <= 3; i++) {
        const floatVm = createVmObject(
            `insight_浮动${i.toString().padStart(2, '0')}`,
            'Insight虚机',
            'Insight浮动IP',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            NOT_APPLICABLE_TEXT
        );
        vms.push(floatVm);
    }
};

/**
 * 生成Insight非高可用部署虚机
 * @param {Object[]} vms - 虚机列表
 * @param {Object} ipManager - IP管理器
 * @param {boolean} isNetCombined - 是否网络合并
 * @param {number} userCount - 用户数量
 */
const generateInsightStandaloneVms = (vms, ipManager, isNetCombined, userCount) => {
    if (userCount <= 2000) {
        // 小规模部署：单个控制虚机
        const m = Math.ceil(userCount / 1000); // 每1000用户约1T存储
        const ctrlVm = createVmObject(
            'insight虚机A_Ctrl',
            'Insight虚机',
            'Insight控制节点',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            `32C96G,0.5T+${(m + 0.8).toFixed(1)}T`
        );
        vms.push(ctrlVm);
    } else if (userCount <= 5000) {
        // 中等规模部署：控制节点 + 组件节点
        const ctrlVm = createVmObject(
            'insight虚机A_Ctrl',
            'Insight虚机',
            'Insight控制节点',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            '16C48G,0.5T+1T'
        );
        vms.push(ctrlVm);

        const componentVm = createVmObject(
            'insight虚机B_组件',
            'Insight虚机',
            'Insight组件节点',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            '16C48G,0.3T+0.5T'
        );
        vms.push(componentVm);

        const m = Math.ceil(userCount / 1000);
        const esVm = createVmObject(
            'insight虚机C_ES',
            'Insight虚机',
            'Insight搜索引擎',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            `16C48G,0.3T+${m.toFixed(1)}T`
        );
        vms.push(esVm);
    } else {
        throw new Error('用户量>5000时只能选高可用部署');
    }
};

/**
 * 生成Insight高可用部署虚机
 * @param {Object[]} vms - 虚机列表
 * @param {Object} ipManager - IP管理器
 * @param {boolean} isNetCombined - 是否网络合并
 * @param {number} userCount - 用户数量
 * @param {boolean} deployTerminalMgmt - 是否部署终端网管
 */
const generateInsightHAVms = (vms, ipManager, isNetCombined, userCount, deployTerminalMgmt) => {
    if (userCount <= 2000) {
        // 小规模高可用部署
        const ctrlVm = createVmObject(
            'insight虚机A_Ctrl',
            'Insight虚机',
            'Insight控制节点',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            '16C48G,0.5T+1T'
        );
        vms.push(ctrlVm);

        const m = Math.ceil(userCount / 1000);
        const esVm = createVmObject(
            'insight虚机C_ES',
            'Insight虚机',
            'Insight搜索引擎',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            `16C48G,0.3T+${m.toFixed(1)}T`
        );
        vms.push(esVm);

        // 生成网管虚机（如果需要）
        if (deployTerminalMgmt) {
            generateInsightNetMgmtVms(vms, ipManager, isNetCombined, 'insight虚机C', 2);
        }
    } else if (userCount <= 5000) {
        // 中等规模高可用部署
        const ctrlVm = createVmObject(
            'insight虚机A_Ctrl',
            'Insight虚机',
            'Insight控制节点',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            '16C48G,0.5T+1T'
        );
        vms.push(ctrlVm);

        const componentVm = createVmObject(
            'insight虚机B_组件',
            'Insight虚机',
            'Insight组件节点',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            '16C48G,0.3T+0.5T'
        );
        vms.push(componentVm);

        const m = Math.ceil(userCount / 1000);
        const esVm = createVmObject(
            'insight虚机C_ES',
            'Insight虚机',
            'Insight搜索引擎',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            `16C48G,0.3T+${m.toFixed(1)}T`
        );
        vms.push(esVm);

        // 生成网管虚机（如果需要）
        if (deployTerminalMgmt) {
            generateInsightNetMgmtVms(vms, ipManager, isNetCombined, 'insight虚机D', 2);
        }
    } else {
        // 大规模高可用部署 (>5000用户)
        // 控制节点集群
        for (let i = 1; i <= 3; i++) {
            const ctrlVm = createVmObject(
                `insight虚机A_Ctrl${i.toString().padStart(2, '0')}`,
                'Insight虚机',
                'Insight控制节点',
                ipManager.getNextIp('management'),
                isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
                NOT_APPLICABLE_TEXT,
                '16C48G,0.5T+1.5T'
            );
            vms.push(ctrlVm);
        }

        // 组件节点集群
        for (let i = 1; i <= 5; i++) {
            const componentVm = createVmObject(
                `insight虚机B_组件${i.toString().padStart(2, '0')}`,
                'Insight虚机',
                'Insight组件节点',
                ipManager.getNextIp('management'),
                isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
                NOT_APPLICABLE_TEXT,
                '16C48G,0.3T+1T'
            );
            vms.push(componentVm);
        }

        // ES集群
        const m = Math.ceil(userCount / 1000);
        const n = Math.ceil(m / 6); // 每个ES节点最多6T存储
        for (let i = 1; i <= n; i++) {
            const cap = Math.min(m, 6);
            const esVm = createVmObject(
                `insight虚机C_ES${i.toString().padStart(2, '0')}`,
                'Insight虚机',
                'Insight搜索引擎',
                ipManager.getNextIp('management'),
                isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
                NOT_APPLICABLE_TEXT,
                `16C48G,0.3T+${cap.toFixed(1)}T`
            );
            vms.push(esVm);
        }

        // 生成网管虚机（如果需要）
        if (deployTerminalMgmt) {
            generateInsightNetMgmtVms(vms, ipManager, isNetCombined, 'insight虚机D', 2);
        }
    }
};

/**
 * 生成Insight网管虚机
 * @param {Object[]} vms - 虚机列表
 * @param {Object} ipManager - IP管理器
 * @param {boolean} isNetCombined - 是否网络合并
 * @param {string} prefix - 虚机名前缀
 * @param {number} count - 虚机数量
 */
const generateInsightNetMgmtVms = (vms, ipManager, isNetCombined, prefix, count) => {
    for (let i = 1; i <= count; i++) {
        const netMgmtVm = createVmObject(
            `${prefix}${i.toString().padStart(2, '0')}（网管）`,
            'Insight虚机',
            'Insight终端网管',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            '8C24G,0.3T+1T'
        );
        vms.push(netMgmtVm);
    }
};

/**
 * 生成Insight CAG门户虚机
 * @param {Object[]} vms - 虚机列表
 * @param {Object} ipManager - IP管理器
 * @param {boolean} isNetCombined - 是否网络合并
 * @param {boolean} isHA - 是否高可用部署
 */
const generateInsightCAGPortalVms = (vms, ipManager, isNetCombined, isHA) => {
    // 主CAG门户
    const cagPortal01 = createVmObject(
        'insight_CAG门户01',
        'Insight虚机',
        'Insight CAG门户',
        ipManager.getNextIp('management'),
        isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
        NOT_APPLICABLE_TEXT,
        '8C16G,200GB+300GB'
    );
    vms.push(cagPortal01);

    // 高可用模式下添加备用CAG门户
    if (isHA) {
        const cagPortal02 = createVmObject(
            'insight_CAG门户02',
            'Insight虚机',
            'Insight CAG门户备用',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            '4C8G,200GB+200GB'
        );
        vms.push(cagPortal02);

        const cagPortal03 = createVmObject(
            'insight_CAG门户03',
            'Insight虚机',
            'Insight CAG门户备用',
            ipManager.getNextIp('management'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business'),
            NOT_APPLICABLE_TEXT,
            '4C8G,200GB+200GB'
        );
        vms.push(cagPortal03);
    }
};

/**
 * 生成ZXOPS相关虚机
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 虚机列表
 */
const generateZXOPSVms = (params, ipManager) => {
    const { isZXOPS, isNetCombined } = params;
    const vms = [];

    if (!isZXOPS) {
        return vms;
    }

    const zxopsVm = createVmObject(
        'ZXOPS01',
        'ZXOPS虚机',
        '运维管理平台',
        ipManager.getNextIp('management', 'vm'),
        isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business', 'vm'),
        NOT_APPLICABLE_TEXT,
        '8C16G200G'
    );
    vms.push(zxopsVm);

    return vms;
};

/**
 * 生成终端网管虚机
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 虚机列表
 */
const generateTerminalMgmtVms = (params, ipManager) => {
    const { deployTerminalMgmt, isNetCombined } = params;
    const vms = [];

    if (!deployTerminalMgmt) {
        return vms;
    }

    const terminalVm = createVmObject(
        '终端网管01',
        '终端网管虚机',
        '终端设备管理',
        ipManager.getNextIp('management', 'vm'),
        isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business', 'vm'),
        NOT_APPLICABLE_TEXT,
        '4C8G100G'
    );
    vms.push(terminalVm);

    return vms;
};

/**
 * 生成CAG门户虚机
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 虚机列表
 */
const generateCAGPortalVms = (params, ipManager) => {
    const { deployCAGPortal, isNetCombined } = params;
    const vms = [];

    if (!deployCAGPortal) {
        return vms;
    }

    const cagPortalVm = createVmObject(
        'CAG门户01',
        'CAG门户虚机',
        'CAG管理门户',
        ipManager.getNextIp('management', 'vm'),
        isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business', 'vm'),
        NOT_APPLICABLE_TEXT,
        '4C8G100G'
    );
    vms.push(cagPortalVm);

    return vms;
};

/**
 * 生成DEM虚机
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 虚机列表
 */
const generateDEMVms = (params, ipManager) => {
    const { deployDEM, isNetCombined } = params;
    const vms = [];

    if (!deployDEM) {
        return vms;
    }

    const demVm = createVmObject(
        'DEM01',
        'DEM虚机',
        '桌面体验监控',
        ipManager.getNextIp('management', 'vm'),
        isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business', 'vm'),
        NOT_APPLICABLE_TEXT,
        '4C8G100G'
    );
    vms.push(demVm);

    return vms;
};

/**
 * 生成下载服务器虚机
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 虚机列表
 */
const generateDownloadVms = (params, ipManager) => {
    const { downloadType, isNetCombined } = params;
    const vms = [];

    if (downloadType === '否') {
        return vms;
    }

    const isCluster = downloadType === '集群';
    const vmCount = isCluster ? 2 : 1;

    for (let i = 1; i <= vmCount; i++) {
        const name = `下载服务器${i.toString().padStart(2, '0')}`;
        const downloadVm = createVmObject(
            name,
            '下载服务器虚机',
            '软件下载服务',
            ipManager.getNextIp('management', 'vm'),
            isNetCombined ? NOT_APPLICABLE_TEXT : ipManager.getNextIp('business', 'vm'),
            NOT_APPLICABLE_TEXT,
            '4C8G500G'
        );
        vms.push(downloadVm);
    }

    return vms;
};

/**
 * 生成所有虚机
 * @param {Object} params - 参数
 * @param {Object} ipManager - IP管理器
 * @returns {Object[]} 虚机列表
 */
const generateAllVms = (params, ipManager) => {
    const vms = [];

    // 生成基础虚机
    vms.push(...generateBaseVms(params, ipManager));

    // 生成可选组件虚机
    vms.push(...generateInsightVms(params, ipManager));
    vms.push(...generateZXOPSVms(params, ipManager));
    vms.push(...generateTerminalMgmtVms(params, ipManager));
    vms.push(...generateCAGPortalVms(params, ipManager));
    vms.push(...generateDEMVms(params, ipManager));
    vms.push(...generateDownloadVms(params, ipManager));

    return vms;
};

module.exports = {
    createVmObject,
    getVmSpec,
    generateBaseVms,
    generateInsightVms,
    generateZXOPSVms,
    generateTerminalMgmtVms,
    generateCAGPortalVms,
    generateDEMVms,
    generateDownloadVms,
    generateAllVms,
};
