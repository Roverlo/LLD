import { Utils } from './utils.js';

// 默认存储配置常量
const DEFAULT_SSD_COUNT = 2;
const DEFAULT_SSD_SPEC = '1.92';
const DEFAULT_OSD_RESERVED_SIZE = 0;
const DEFAULT_HDD_COUNT = 4;
const DEFAULT_HDD_SPEC = '8';

// 默认硬件配置常量
const DEFAULT_MNG_CPU_CORES = 32;
const DEFAULT_MNG_MEMORY = 128;
const DEFAULT_FUSION_CPU_CORES = 64;
const DEFAULT_FUSION_MEMORY = 256;
const DEFAULT_CALC_CPU_CORES = 64;
const DEFAULT_CALC_MEMORY = 256;
const DEFAULT_STOR_CPU_CORES = 32;
const DEFAULT_STOR_MEMORY = 128;
const DEFAULT_CAG_CPU_CORES = 16;
const DEFAULT_CAG_MEMORY = 64;

/**
 * 参数收集器
 */
export const ParamCollector = {
    /**
     * 收集所有表单参数
     * @returns {Object} 参数对象
     */
    collect() {
        const isFusion = Utils.getFormValue('isFusionNode', 'boolean');

        return {
            // 基础配置
            isNetCombined: Utils.getFormValue('isNetCombined', 'boolean'),
            isDualNode: Utils.getFormValue('isDualNode', 'boolean'),
            isCephDual: Utils.getFormValue('isCephDual', 'boolean'),
            isFusionNode: isFusion,
            isMngAsFusion: Utils.getFormValue('isMngAsFusion', 'boolean'),

            // 服务器数量
            countMng: Utils.getFormValue('countMng', 'number', 0),
            countFusion: Utils.getFormValue('countFusion', 'number', 0),
            countCalc: Utils.getFormValue('countCalc', 'number', 0),
            countStor: Utils.getFormValue('countStor', 'number', 0),
            countCAG: Utils.getFormValue('countCAG', 'number', 0),

            // 服务器前缀
            prefixMng: Utils.getFormValue('prefixMng', 'string', 'VMC'),
            prefixFusion: Utils.getFormValue('prefixFusion', 'string', 'ZXVE'),
            prefixCalc: Utils.getFormValue('prefixCalc', 'string', 'ZXVE'),
            prefixStor: Utils.getFormValue('prefixStor', 'string', 'STOR'),
            prefixCAG: Utils.getFormValue('prefixCAG', 'string', 'CAG'),

            // 部署配置
            scene: Utils.getFormValue('scene', 'string'),
            isZXOPS: Utils.getFormValue('isZXOPS', 'boolean'),
            userCount: Utils.getFormValue('userCount', 'number', 0),
            insightDeployType: Utils.getFormValue('insightDeployType', 'string'),
            deployTerminalMgmt: Utils.getFormValue('deployTerminalMgmt', 'boolean'),
            deployCAGPortal: Utils.getFormValue('deployCAGPortal', 'string'),
            deployDEM: Utils.getFormValue('deployDEM', 'boolean'),
            downloadType: Utils.getFormValue('downloadType', 'string'),
            storageSecurity: Utils.getFormValue('storageSecurity', 'string'),

            // 存储配置信息（保留原有全局配置用于兼容性）
            ssdCount: Utils.getFormValue('ssdCount', 'number', DEFAULT_SSD_COUNT) || Utils.getFormValue('mngSsdCount', 'number', DEFAULT_SSD_COUNT),
            ssdSpec: Utils.getFormValue('ssdSpec', 'string', DEFAULT_SSD_SPEC) || Utils.getFormValue('mngSsdSpec', 'string', DEFAULT_SSD_SPEC),
            osdReservedSize: Utils.getFormValue('osdReservedSize', 'number', DEFAULT_OSD_RESERVED_SIZE) || Utils.getFormValue('mngOsdReservedSize', 'number', DEFAULT_OSD_RESERVED_SIZE),
            hddCount: Utils.getFormValue('hddCount', 'number', DEFAULT_HDD_COUNT) || Utils.getFormValue('mngHddCount', 'number', DEFAULT_HDD_COUNT),
            hddSpec: Utils.getFormValue('hddSpec', 'string', DEFAULT_HDD_SPEC) || Utils.getFormValue('mngHddSpec', 'string', DEFAULT_HDD_SPEC),

            // 管理服务器存储配置
            mngSsdCount: Utils.getFormValue('mngSsdCount', 'number', 2),
            mngSsdSpec: Utils.getFormValue('mgmtSsdSpec', 'text', '1.92'),
            mngOsdReservedSize: Utils.getFormValue('mgmtOsdReservedSize', 'number', 0),
            mngHddCount: Utils.getFormValue('mngHddCount', 'number', 4),
            mngHddSpec: Utils.getFormValue('mgmtHddSpec', 'text', '8'),

            // 超融合服务器存储配置
            fusionSsdCount: Utils.getFormValue('fusionSsdCount', 'number', DEFAULT_SSD_COUNT),
            fusionSsdSpec: Utils.getFormValue('fusionSsdSpec', 'string', DEFAULT_SSD_SPEC),
            fusionOsdReservedSize: Utils.getFormValue('fusionOsdReservedSize', 'number', DEFAULT_OSD_RESERVED_SIZE),
            fusionHddCount: Utils.getFormValue('fusionHddCount', 'number', DEFAULT_HDD_COUNT),
            fusionHddSpec: Utils.getFormValue('fusionHddSpec', 'string', DEFAULT_HDD_SPEC),

            // 计算服务器存储配置
            calcSsdCount: Utils.getFormValue('calcSsdCount', 'number', DEFAULT_SSD_COUNT),
            calcSsdSpec: Utils.getFormValue('calcSsdSpec', 'string', DEFAULT_SSD_SPEC),
            calcOsdReservedSize: Utils.getFormValue('calcOsdReservedSize', 'number', DEFAULT_OSD_RESERVED_SIZE),
            calcHddCount: Utils.getFormValue('calcHddCount', 'number', DEFAULT_HDD_COUNT),
            calcHddSpec: Utils.getFormValue('calcHddSpec', 'string', DEFAULT_HDD_SPEC),

            // 存储服务器存储配置
            storSsdCount: Utils.getFormValue('storSsdCount', 'number', DEFAULT_SSD_COUNT),
            storSsdSpec: Utils.getFormValue('storSsdSpec', 'string', DEFAULT_SSD_SPEC),
            storOsdReservedSize: Utils.getFormValue('storOsdReservedSize', 'number', DEFAULT_OSD_RESERVED_SIZE),
            storHddCount: Utils.getFormValue('storHddCount', 'number', DEFAULT_HDD_COUNT),
            storHddSpec: Utils.getFormValue('storHddSpec', 'string', DEFAULT_HDD_SPEC),

            // 服务器硬件配置
            mngCpuCores: Utils.getFormValue('mngCpuCores', 'number', 32),
            mngMemory: Utils.getFormValue('mngMemory', 'number', 128),
            fusionCpuCores: Utils.getFormValue('fusionCpuCores', 'number', DEFAULT_FUSION_CPU_CORES),
            fusionMemory: Utils.getFormValue('fusionMemory', 'number', DEFAULT_FUSION_MEMORY),
            calcCpuCores: Utils.getFormValue('calcCpuCores', 'number', DEFAULT_CALC_CPU_CORES),
            calcMemory: Utils.getFormValue('calcMemory', 'number', DEFAULT_CALC_MEMORY),
            storCpuCores: Utils.getFormValue('storCpuCores', 'number', DEFAULT_STOR_CPU_CORES),
            storMemory: Utils.getFormValue('storMemory', 'number', DEFAULT_STOR_MEMORY),
            cagCpuCores: Utils.getFormValue('cagCpuCores', 'number', DEFAULT_CAG_CPU_CORES),
            cagMemory: Utils.getFormValue('cagMemory', 'number', DEFAULT_CAG_MEMORY),

            // 管理服务器网络配置
            mngMgmtPortName: Utils.getFormValue('mngMgmtPortName', 'string', 'brcomm_bond'),
            mngMgmtNics: Utils.getFormValue('mngMgmtNics', 'string', 'enp133s0f0;enp134s0f0'),
            mngBondMode: Utils.getFormValue('mngBondMode', 'string', 'active-backup'),
            mngBizPortName: Utils.getFormValue('mngBizPortName', 'string', 'br0'),
            mngBizNics: Utils.getFormValue('mngBizNics', 'string', 'enp133s0f1;enp134s0f1'),
            mngBizBondMode: Utils.getFormValue('bizBondMode', 'string', 'active-backup'),
            mngStorPortName: Utils.getFormValue('mngStorPortName', 'string', 'CephPublic'),
            mngStorNics: Utils.getFormValue('mngStorNics', 'string', 'enp3s0;enp4s0'),
            mngStorBondMode: Utils.getFormValue('storBondMode', 'string', 'active-backup'),

            // 网络绑定模式（用于Excel生成）
            bizBondMode: Utils.getFormValue('bizBondMode', 'string', 'active-backup'),
            storBondMode: Utils.getFormValue('storBondMode', 'string', 'active-backup'),

            // 超融合服务器网络配置
            fusionMgmtPortName: Utils.getFormValue('fusionMgmtPortName', 'string', 'brcomm_bond'),
            fusionMgmtNics: Utils.getFormValue('fusionMgmtNics', 'string', 'enp133s0f0;enp134s0f0'),
            fusionBizPortName: Utils.getFormValue('fusionBizPortName', 'string', 'br0'),
            fusionBizNics: Utils.getFormValue('fusionBizNics', 'string', 'enp133s0f1;enp134s0f1'),
            fusionStorPortName: Utils.getFormValue('fusionStorPortName', 'string', 'CephPublic'),
            fusionStorNics: Utils.getFormValue('fusionStorNics', 'string', 'enp3s0;enp4s0'),

            // 计算服务器网络配置
            calcMgmtPortName: Utils.getFormValue('calcMgmtPortName', 'string', 'brcomm_bond'),
            calcMgmtNics: Utils.getFormValue('calcMgmtNics', 'string', 'enp133s0f0;enp134s0f0'),
            calcBizPortName: Utils.getFormValue('calcBizPortName', 'string', 'br0'),
            calcBizNics: Utils.getFormValue('calcBizNics', 'string', 'enp133s0f1;enp134s0f1'),
            calcStorPortName: Utils.getFormValue('calcStorPortName', 'string', 'CephPublic'),
            calcStorNics: Utils.getFormValue('calcStorNics', 'string', 'enp3s0;enp4s0'),

            // 存储服务器网络配置
            storMgmtPortName: Utils.getFormValue('storMgmtPortName', 'string', 'brcomm_bond'),
            storMgmtNics: Utils.getFormValue('storMgmtNics', 'string', 'enp133s0f0;enp134s0f0'),
            storBizPortName: Utils.getFormValue('storBizPortName', 'string', 'br0'),
            storBizNics: Utils.getFormValue('storBizNics', 'string', 'enp133s0f1;enp134s0f1'),
            storStorPortName: Utils.getFormValue('storStorPortName', 'string', 'CephPublic'),
            storStorNics: Utils.getFormValue('storStorNics', 'string', 'enp3s0;enp4s0'),

            // 兼容性：保留原有的全局CPU和内存配置
            cpuCores: Utils.getFormValue('storCpuCores', 'number', DEFAULT_STOR_CPU_CORES),
            memorySize: Utils.getFormValue('storMemory', 'number', DEFAULT_STOR_MEMORY),

            // IP地址范围
            mngIpRange: Utils.getFormValue('mngIpRange', 'string'),
            bizIpRange: Utils.getFormValue('bizIpRange', 'string'),
            pubIpRange: Utils.getFormValue('pubIpRange', 'string'),
            cluIpRange: Utils.getFormValue('cluIpRange', 'string'),

            // 其他选项
            alignFloatIp: document.querySelector('input[name="alignFloatIp"]:checked')?.value === 'true',

            // 桌面虚机类型配置
            desktopVmTypes: this.collectDesktopVmTypes(),
        };

        // 添加调试日志 - 输出关键参数
        console.log('=== 参数收集调试信息 ===');
        console.log('管理服务器CPU核数:', params.mngCpuCores);
        console.log('管理服务器内存:', params.mngMemory);
        console.log('管理服务器SSD规格:', params.mngSsdSpec);
        console.log('管理服务器OSD预留:', params.mngOsdReservedSize);
        console.log('管理服务器HDD规格:', params.mngHddSpec);
        console.log('完整参数对象:', JSON.stringify(params, null, 2));
        console.log('=== 参数收集调试信息结束 ===');

        return params;
    },

    /**
     * 收集桌面虚机类型配置
     * @returns {Array} 桌面虚机类型数组
     */
    collectDesktopVmTypes() {
        const vmTypes = [];
        const vmTypeElements = document.querySelectorAll('.desktop-vm-type');

        vmTypeElements.forEach((element) => {
            const type = element.dataset.type;
            const cpu = parseInt(element.querySelector('.vm-cpu').value, 10) || 0;
            const memory = parseInt(element.querySelector('.vm-memory').value, 10) || 0;
            const storage = parseInt(element.querySelector('.vm-storage').value, 10) || 0;
            const count = parseInt(element.querySelector('.vm-count').value, 10) || 0;

            if (cpu > 0 && memory > 0 && storage > 0 && count > 0) {
                vmTypes.push({
                    type: type,
                    cpu: cpu,
                    memory: memory,
                    storage: storage,
                    count: count,
                    spec: `${cpu}C${memory}G${storage}G`, // 为了兼容性保留spec字段
                });
            }
        });

        return vmTypes;
    },
};
