/**
 * 项目常量定义
 */

// 通用常量
const NOT_APPLICABLE_TEXT = '不涉及';
const IP_INSUFFICIENT_TEXT = '（IP不足）';
const IP_TO_BE_PROVIDED_TEXT = '待提供IP';

// 网络场景配置
const NETWORK_SCENES = {
    管理网和业务网合一场景: {
        roles: [
            { name: 'daisyseed01', m: 1, b: 1 },
            { name: 'paas-controller-tcf1', m: 1 },
            { name: 'paas-controller-tcf2', m: 1 },
            { name: 'paas-controller-tcf3', m: 1 },
            { name: 'TCF浮动01', m: 1 },
            { name: 'TCF浮动02', m: 1 },
            { name: 'TCF_SLB', m: 1, b: 1 },
            { name: 'UAS01', m: 1, b: 1 },
            { name: 'UAS02', m: 1, b: 1 },
            { name: 'UAS03', m: 1, b: 1 },
            { name: 'UAS浮动01', m: 1, b: 1 },
        ],
    },
    管理网和业务网隔离场景_运维通过管理网访问: {
        roles: [
            { name: 'daisyseed01', m: 1, b: 1 },
            { name: 'paas-controller-tcf1', m: 1 },
            { name: 'paas-controller-tcf2', m: 1 },
            { name: 'paas-controller-tcf3', m: 1 },
            { name: 'TCF浮动01', m: 1 },
            { name: 'TCF浮动02', m: 1 },
            { name: 'TCF_SLB', m: 1, b: 1 },
            { name: 'UAS01', m: 1, b: 1 },
            { name: 'UAS02', m: 1, b: 1 },
            { name: 'UAS03', m: 1, b: 1 },
            { name: 'UAS浮动01', m: 1, b: 1 },
        ],
    },
    管理网和业务网隔离场景_运维通过业务网访问: {
        roles: [
            { name: 'daisyseed01', m: 1, b: 1 },
            { name: 'paas-controller-tcf1', b: 1 },
            { name: 'paas-controller-tcf2', b: 1 },
            { name: 'paas-controller-tcf3', b: 1 },
            { name: 'TCF浮动01', b: 1 },
            { name: 'TCF浮动02', b: 1 },
            { name: 'TCF_SLB', m: 1, b: 1 },
            { name: 'UAS01', m: 1, b: 1 },
            { name: 'UAS02', m: 1, b: 1 },
            { name: 'UAS03', m: 1, b: 1 },
            { name: 'UAS浮动01', m: 1, b: 1 },
        ],
    },
    三网隔离场景: {
        roles: [
            { name: 'daisyseed01', m: 1, b: 1 },
            { name: 'paas-controller-tcf1', b: 1 },
            { name: 'paas-controller-tcf2', b: 1 },
            { name: 'paas-controller-tcf3', b: 1 },
            { name: 'TCF浮动01', b: 1 },
            { name: 'TCF浮动02', b: 1 },
            { name: 'TCF_SLB', m: 1, b: 1 },
            { name: 'UAS01', m: 1, b: 1 },
            { name: 'UAS02', m: 1, b: 1 },
            { name: 'UAS03', m: 1, b: 1 },
            { name: 'UAS浮动01', m: 1, b: 1 },
        ],
    },
};

// 虚机规格配置
const VM_SPECS = {
    daisyseed01: '4C8G100G',
    'paas-controller-tcf': {
        small: '24C48G，600G+100G', // <= 10000 users
        large: '32C64G，600G+100G', // > 10000 users
    },
    UAS: {
        small: '4C6G，100G', // <= 5000 users
        medium: '6C8G，100G', // 5001-10000 users
        large: '8C16G，100G', // > 10000 users
    },
    CAG: '4C16G，150G', // CAG虚机规格
    floating: NOT_APPLICABLE_TEXT,
    SLB: NOT_APPLICABLE_TEXT,
};

// 服务器类型
const SERVER_TYPES = {
    MANAGEMENT: '管理服务器',
    COMPUTE: '计算服务器',
    FUSION: '超融合服务器',
    STORAGE: '存储服务器',
    CAG: 'CAG服务器',
};

// Insight部署类型
const INSIGHT_DEPLOY_TYPES = {
    NONE: '否',
    STANDALONE: '非高可用部署',
    HA: '高可用部署',
};

// 下载服务器类型
const DOWNLOAD_TYPES = {
    NONE: '否',
    SINGLE: '单机',
    CLUSTER: '集群',
};

// 存储安全策略
const STORAGE_SECURITY_TYPES = {
    RAID1: 'raid1',
    RAID5: 'raid5',
    EC: 'ec', // 纠删码
};

// 存储池配置
const STORAGE_POOLS = {
    FUNC_VM: [
        { pool: 'SSDPOOL_FUNCVM01', use: '功能虚机存储', type: 'SSD' },
        { pool: 'SSDPOOL_FUNCVM02', use: '功能虚机存储', type: 'SSD' },
    ],
    DESKTOP_SSD: { pool: 'SSDPOOL_DESKTOP01', use: '用户系统盘存储', type: 'SSD' },
    DESKTOP_HDD: { pool: 'HDDPOOL_DESKTOP01', use: '用户数据盘存储', type: 'HDD' },
};

// 错误代码
const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    IP_INSUFFICIENT: 'IP_INSUFFICIENT',
    INVALID_IP_FORMAT: 'INVALID_IP_FORMAT',
    INVALID_PARAMS: 'INVALID_PARAMS',
    SERVER_COUNT_INVALID: 'SERVER_COUNT_INVALID',
    SCENE_NOT_SUPPORTED: 'SCENE_NOT_SUPPORTED',
};

// 默认配置
const DEFAULT_CONFIG = {
    prefixMng: 'VMC',
    prefixFusion: 'ZXVE',
    prefixStor: 'STG',
    userCount: 100,
    scene: '管理网和业务网合一场景',
    insightDeployType: INSIGHT_DEPLOY_TYPES.NONE,
    downloadType: DOWNLOAD_TYPES.NONE,
    storageSecurity: STORAGE_SECURITY_TYPES.RAID1,
};

// 网络配置
const NETWORK_CONFIG = {
    MANAGEMENT: 'management',
    BUSINESS: 'business',
    STORAGE_PUBLIC: 'storagePublic',
    STORAGE_CLUSTER: 'storageCluster',
};

module.exports = {
    NOT_APPLICABLE_TEXT,
    IP_INSUFFICIENT_TEXT,
    IP_TO_BE_PROVIDED_TEXT,
    NETWORK_SCENES,
    VM_SPECS,
    SERVER_TYPES,
    INSIGHT_DEPLOY_TYPES,
    DOWNLOAD_TYPES,
    STORAGE_SECURITY_TYPES,
    STORAGE_POOLS,
    ERROR_CODES,
    DEFAULT_CONFIG,
    NETWORK_CONFIG,
};
