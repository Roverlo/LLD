import { Utils } from './utils.js';

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
            ssdCount: Utils.getFormValue('ssdCount', 'number', 2) || Utils.getFormValue('mngSsdCount', 'number', 2),
            ssdSpec: Utils.getFormValue('ssdSpec', 'string', '1.92') || Utils.getFormValue('mngSsdSpec', 'string', '1.92'),
            osdReservedSize: Utils.getFormValue('osdReservedSize', 'number', 0) || Utils.getFormValue('mngOsdReservedSize', 'number', 0),
            hddCount: Utils.getFormValue('hddCount', 'number', 4) || Utils.getFormValue('mngHddCount', 'number', 4),
            hddSpec: Utils.getFormValue('hddSpec', 'string', '8') || Utils.getFormValue('mngHddSpec', 'string', '8'),

            // 管理服务器存储配置
            mngSsdCount: Utils.getFormValue('mngSsdCount', 'number', 2),
            mngSsdSpec: Utils.getFormValue('mngSsdSpec', 'string', '1.92'),
            mngOsdReservedSize: Utils.getFormValue('mngOsdReservedSize', 'number', 0),
            mngHddCount: Utils.getFormValue('mngHddCount', 'number', 4),
            mngHddSpec: Utils.getFormValue('mngHddSpec', 'string', '8'),

            // 超融合服务器存储配置
            fusionSsdCount: Utils.getFormValue('fusionSsdCount', 'number', 2),
            fusionSsdSpec: Utils.getFormValue('fusionSsdSpec', 'string', '1.92'),
            fusionOsdReservedSize: Utils.getFormValue('fusionOsdReservedSize', 'number', 0),
            fusionHddCount: Utils.getFormValue('fusionHddCount', 'number', 4),
            fusionHddSpec: Utils.getFormValue('fusionHddSpec', 'string', '8'),

            // 计算服务器存储配置
            calcSsdCount: Utils.getFormValue('calcSsdCount', 'number', 2),
            calcSsdSpec: Utils.getFormValue('calcSsdSpec', 'string', '1.92'),
            calcOsdReservedSize: Utils.getFormValue('calcOsdReservedSize', 'number', 0),
            calcHddCount: Utils.getFormValue('calcHddCount', 'number', 4),
            calcHddSpec: Utils.getFormValue('calcHddSpec', 'string', '8'),

            // 存储服务器存储配置
            storSsdCount: Utils.getFormValue('storSsdCount', 'number', 2),
            storSsdSpec: Utils.getFormValue('storSsdSpec', 'string', '1.92'),
            storOsdReservedSize: Utils.getFormValue('storOsdReservedSize', 'number', 0),
            storHddCount: Utils.getFormValue('storHddCount', 'number', 4),
            storHddSpec: Utils.getFormValue('storHddSpec', 'string', '8'),

            // 服务器硬件配置
            mngCpuCores: Utils.getFormValue('mngCpuCores', 'number', 32),
            mngMemory: Utils.getFormValue('mngMemory', 'number', 128),
            fusionCpuCores: Utils.getFormValue('fusionCpuCores', 'number', 64),
            fusionMemory: Utils.getFormValue('fusionMemory', 'number', 256),
            calcCpuCores: Utils.getFormValue('calcCpuCores', 'number', 64),
            calcMemory: Utils.getFormValue('calcMemory', 'number', 256),
            storCpuCores: Utils.getFormValue('storCpuCores', 'number', 32),
            storMemory: Utils.getFormValue('storMemory', 'number', 128),
            cagCpuCores: Utils.getFormValue('cagCpuCores', 'number', 16),
            cagMemory: Utils.getFormValue('cagMemory', 'number', 64),

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
            cpuCores: Utils.getFormValue('storCpuCores', 'number', 32),
            memorySize: Utils.getFormValue('storMemory', 'number', 128),

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
