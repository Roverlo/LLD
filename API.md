# API 文档 (API Documentation)

本文档描述了 ZTE uSmartView LLD Generator 项目的内部API接口。

---

## 1. 核心业务API

### 1.1 generatePlan 函数

**描述**: 根据输入参数生成完整的IP规划方案

**位置**: `src/main/generator.js`

**函数签名**:
```javascript
function generatePlan(params)
```

**参数说明**:
```javascript
{
  // 核心架构参数
  isNetCombined: boolean,      // 管理网和业务网是否合设
  isDualNode: boolean,         // 管理节点是否双机
  isCephDual: boolean,         // Ceph管理是否双机
  isFusionNode: boolean,       // 是否为超融合节点
  isMngAsFusion: boolean,      // 管理节点是否计入超融合
  
  // 服务器数量
  countMng: number,            // 管理服务器数量
  countFusion: number,         // 超融合服务器数量
  countCalc: number,           // 计算服务器数量
  countStor: number,           // 存储服务器数量
  countCAG: number,            // CAG服务器数量
  
  // 服务器命名前缀
  prefixMng: string,           // 管理服务器前缀
  prefixFusion: string,        // 超融合服务器前缀
  prefixStor: string,          // 存储服务器前缀
  
  // 部署配置
  userCount: number,           // 用户数量
  scene: string,               // 网络场景
  isZXOPS: boolean,           // 是否部署ZXOPS
  insightDeployType: string,   // Insight部署类型
  deployTerminalMgmt: boolean, // 是否部署终端网管
  deployCAGPortal: boolean,    // 是否部署CAG门户
  deployDEM: boolean,          // 是否部署DEM
  downloadType: string,        // 下载服务器类型
  storageSecurity: string,     // 存储安全策略
  
  // IP地址范围
  mngIpRange: string,          // 管理网IP范围
  bizIpRange: string,          // 业务网IP范围
  pubIpRange: string,          // 存储公共网IP范围
  cluIpRange: string           // 存储集群网IP范围
}
```

**返回值**:
```javascript
{
  servers: Array<ServerInfo>,     // 服务器列表
  vms: Array<VMInfo>,            // 虚拟机列表
  storagePlan: StoragePlan,      // 存储规划
  summary: PlanSummary           // 规划摘要
}
```

**异常**:
- `Error`: 当输入参数无效或IP地址不足时抛出

**示例**:
```javascript
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
  insightDeployType: 'none',
  deployTerminalMgmt: false,
  deployCAGPortal: false,
  deployDEM: false,
  downloadType: 'none',
  storageSecurity: 'raid1',
  mngIpRange: '192.168.1.1/24',
  bizIpRange: '10.0.0.1/24',
  pubIpRange: '172.16.0.1/24',
  cluIpRange: '172.17.0.1/24'
};

const plan = generatePlan(params);
console.log(plan.summary.totalServers); // 输出服务器总数
```

---

## 2. 数据类型定义

### 2.1 ServerInfo

**描述**: 服务器信息对象

```javascript
{
  hostname: string,           // 服务器主机名
  role: string,              // 服务器角色
  mngIp: string,             // 管理网IP
  bizIp: string,             // 业务网IP (可选)
  pubIp: string,             // 存储公共网IP (可选)
  cluIp: string,             // 存储集群网IP (可选)
  floatIp: string,           // 浮动IP (可选)
  specs: {                   // 硬件规格
    cpu: string,
    memory: string,
    storage: string,
    network: string
  }
}
```

### 2.2 VMInfo

**描述**: 虚拟机信息对象

```javascript
{
  name: string,              // 虚拟机名称
  type: string,              // 虚拟机类型
  purpose: string,           // 用途说明
  mngIp: string,             // 管理网IP
  bizIp: string,             // 业务网IP (可选)
  specs: {                   // 虚拟机规格
    cpu: string,
    memory: string,
    storage: string
  },
  hostServer: string         // 宿主服务器
}
```

### 2.3 StoragePlan

**描述**: 存储规划对象

```javascript
{
  clusters: Array<{          // Ceph集群列表
    name: string,            // 集群名称
    nodes: Array<string>,    // 节点列表
    pools: Array<{           // 存储池列表
      name: string,          // 池名称
      type: string,          // 池类型
      replicas: number,      // 副本数
      usage: string          // 用途
    }>
  }>,
  totalCapacity: string,     // 总容量
  usableCapacity: string,    // 可用容量
  redundancy: string         // 冗余策略
}
```

### 2.4 PlanSummary

**描述**: 规划摘要对象

```javascript
{
  totalServers: number,      // 服务器总数
  totalVMs: number,          // 虚拟机总数
  ipUsage: {                 // IP使用情况
    management: {
      total: number,
      used: number,
      remaining: number
    },
    business: {
      total: number,
      used: number,
      remaining: number
    },
    storagePublic: {
      total: number,
      used: number,
      remaining: number
    },
    storageCluster: {
      total: number,
      used: number,
      remaining: number
    }
  },
  warnings: Array<string>    // 警告信息
}
```

---

## 3. IPC通信API

### 3.1 generate-excel 事件

**描述**: 生成Excel文件的IPC事件

**发送方**: 渲染进程 (renderer.js)
**接收方**: 主进程 (main.js)

**调用方式**:
```javascript
// 渲染进程
const result = await window.electronAPI.generateExcel(params);
```

**参数**: 与 `generatePlan` 函数相同的参数对象

**返回值**:
```javascript
{
  success: boolean,          // 是否成功
  filePath: string,          // 文件保存路径 (成功时)
  summary: PlanSummary,      // 规划摘要 (成功时)
  error: string              // 错误信息 (失败时)
}
```

---

## 4. 工具函数API

### 4.1 IP地址处理函数

**位置**: `src/main/generator.js`

#### ipToInt(ip)
**描述**: 将IP地址转换为整数
```javascript
const intValue = ipToInt('192.168.1.1'); // 返回: 3232235777
```

#### intToIp(n)
**描述**: 将整数转换为IP地址
```javascript
const ipAddress = intToIp(3232235777); // 返回: '192.168.1.1'
```

#### expandRange(startIp, endIp)
**描述**: 展开IP地址范围
```javascript
const ips = expandRange('192.168.1.1', '192.168.1.3');
// 返回: ['192.168.1.1', '192.168.1.2', '192.168.1.3']
```

#### parseCidr(cidr)
**描述**: 解析CIDR格式的IP范围
```javascript
const ips = parseCidr('192.168.1.0/30');
// 返回: ['192.168.1.1', '192.168.1.2']
```

#### parseIpSegment(segment)
**描述**: 解析IP段（支持CIDR、范围、列表格式）
```javascript
const ips1 = parseIpSegment('192.168.1.0/24');
const ips2 = parseIpSegment('192.168.1.1-192.168.1.10');
const ips3 = parseIpSegment('192.168.1.1,192.168.1.2,192.168.1.3');
```

---

## 5. 配置常量

### 5.1 网络场景选项

```javascript
const NETWORK_SCENES = [
  '管理网和业务网合一场景',
  '管理网和业务网隔离场景',
  '三网隔离场景'
];
```

### 5.2 部署类型选项

```javascript
const INSIGHT_DEPLOY_TYPES = [
  'none',        // 不部署
  'standalone',  // 单机部署
  'ha'          // 高可用部署
];

const DOWNLOAD_TYPES = [
  'none',        // 不部署
  'single',      // 单机
  'cluster'      // 集群
];

const STORAGE_SECURITY_TYPES = [
  'raid1',       // RAID1
  'raid5',       // RAID5
  'ec'          // 纠删码
];
```

---

## 6. 错误代码

### 6.1 常见错误

| 错误代码 | 错误信息 | 解决方案 |
|----------|----------|----------|
| IP_INSUFFICIENT | IP地址不足 | 扩大IP地址范围 |
| INVALID_IP_FORMAT | IP格式无效 | 检查IP地址格式 |
| INVALID_PARAMS | 参数无效 | 检查输入参数 |
| SERVER_COUNT_INVALID | 服务器数量无效 | 检查服务器数量设置 |
| SCENE_NOT_SUPPORTED | 不支持的场景 | 选择支持的网络场景 |

---

## 7. 版本兼容性

### 7.1 API版本

- **当前版本**: 1.0.0
- **最低兼容版本**: 1.0.0

### 7.2 变更历史

| 版本 | 变更内容 | 兼容性 |
|------|----------|--------|
| 1.0.0 | 初始版本 | - |

---

*最后更新: 2025-01-26*
