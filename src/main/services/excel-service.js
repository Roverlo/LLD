/**
 * Excel文件生成服务
 */

const ExcelJS = require('exceljs');
const { dialog } = require('electron');
const { IP_TO_BE_PROVIDED_TEXT } = require('../constants');

/**
 * Excel样式配置
 */
const EXCEL_STYLES = {
    header: {
        font: { bold: true, size: 12 },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } },
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        },
    },
    cell: {
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        },
    },
    ipToBeProvieded: {
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B0F0' } }, // 蓝色背景
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        },
    },
};

/**
 * 设置列宽
 * @param {Object} worksheet - 工作表
 * @param {number} maxColumns - 最大列数
 */
const setColumnWidths = (worksheet, maxColumns) => {
    for (let col = 1; col <= maxColumns; col++) {
        let maxLength = 10; // 默认宽度

        worksheet.getColumn(col).eachCell({ includeEmpty: false }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });

        worksheet.getColumn(col).width = Math.min(maxLength + 2, 50); // 限制最大宽度
    }
};

/**
 * 应用样式到工作表
 * @param {Object} worksheet - 工作表
 * @param {number} headerRow - 标题行号
 * @param {number} maxColumns - 最大列数
 */
const applyWorksheetStyles = (worksheet, headerRow, maxColumns) => {
    // 应用标题行样式
    for (let col = 1; col <= maxColumns; col++) {
        const headerCell = worksheet.getCell(headerRow, col);
        Object.assign(headerCell, EXCEL_STYLES.header);
    }

    // 应用数据行样式
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber > headerRow) {
            row.eachCell({ includeEmpty: true }, (cell) => {
                Object.assign(cell, EXCEL_STYLES.cell);
            });
        }
    });
};

/**
 * 创建IP总体规划工作表
 * @param {Object} workbook - 工作簿
 * @param {Object[]} servers - 服务器列表
 * @param {Object[]} vms - 虚机列表
 * @param {Object[]} desktopVmTypes - 桌面虚机类型配置
 * @param {Object} ipUsage - IP使用情况统计
 */
/**
 * 生成IP状态描述
 * @param {number} required - 需要的IP数量
 * @param {Object} usage - IP使用情况 {total, used, remaining}
 * @returns {string} IP状态描述
 */
const generateIpStatusDescription = (required, usage) => {
    const provided = usage?.total || 0;

    if (provided >= required) {
        // IP充足
        return `共需${required}个IP，已提供${provided}个IP，IP充足`;
    } else {
        // IP不足
        const shortage = required - provided;
        return `共需${required}个IP，已提供${provided}个IP，待提供${shortage}个IP`;
    }
};

/**
 * 格式化IP段显示
 * @param {string} ipRange - 原始IP段字符串
 * @returns {string} 格式化后的IP段
 */
const formatIpRangeDisplay = (ipRange) => {
    if (!ipRange || ipRange.trim() === '') {
        return '待提供';
    }

    // 统一格式：去掉多余空格，标准化分隔符
    return ipRange
        .trim()
        .replace(/\s+/g, ' ') // 多个空格替换为单个空格
        .replace(/，/g, ',') // 中文逗号替换为英文逗号
        .replace(/；/g, ';') // 中文分号替换为英文分号
        .replace(/\s*,\s*/g, ', ') // 逗号前后统一空格
        .replace(/\s*;\s*/g, '; '); // 分号前后统一空格
};

const createIpPlanWorksheet = (
    workbook,
    servers,
    vms,
    desktopVmTypes = [],
    ipUsage = null,
    ipRanges = null,
    params = {}
) => {
    const worksheet = workbook.addWorksheet('IP整体规划');

    // 从参数中获取绑定模式，处理null/undefined情况
    const { mngBondMode = '待配置', bizBondMode = '待配置', storBondMode = '待配置' } = params || {};

    // 统计各类IP数量
    const ipStats = {
        mngIpCount: 0,
        bizIpCount: 0,
        pubIpCount: 0,
        cluIpCount: 0,
        vmIpCount: 0,
    };

    // 统计服务器IP（排除"不涉及"的IP）
    (servers || []).forEach((server) => {
        if (server.mngIp && server.mngIp !== '待分配' && server.mngIp !== '不涉及') ipStats.mngIpCount++;
        if (server.bizIp && server.bizIp !== '待分配' && server.bizIp !== '不涉及') ipStats.bizIpCount++;
        if (server.pubIp && server.pubIp !== '待分配' && server.pubIp !== '不涉及') ipStats.pubIpCount++;
        if (server.cluIp && server.cluIp !== '待分配' && server.cluIp !== '不涉及') ipStats.cluIpCount++;
    });

    // 统计虚机IP（包含在管理网和业务网计数中，排除"不涉及"的IP）
    (vms || []).forEach((vm) => {
        if (vm.mngIp && vm.mngIp !== '待分配' && vm.mngIp !== '不涉及') {
            ipStats.mngIpCount++; // 虚机管理网IP计入管理网总数
        }
        if (vm.bizIp && vm.bizIp !== '待分配' && vm.bizIp !== '不涉及') {
            ipStats.bizIpCount++; // 虚机业务网IP计入业务网总数
        }
    });

    // 计算桌面虚机IP需求
    const totalDesktopVms = (desktopVmTypes || []).reduce((sum, vmType) => sum + vmType.count, 0);
    const segmentCount = Math.ceil(totalDesktopVms / 230); // 每个网段230个IP
    const desktopIpDescription = `待提供，共需${totalDesktopVms}个，即${segmentCount}个网段（每个段预留前10个及后15个IP，可用IP按230个计算）`;

    // 生成IP状态描述
    const mngIpDescription = generateIpStatusDescription(ipStats.mngIpCount, ipUsage?.management);
    const bizIpDescription = generateIpStatusDescription(ipStats.bizIpCount, ipUsage?.business);
    const pubIpDescription = generateIpStatusDescription(ipStats.pubIpCount, ipUsage?.storagePublic);
    const cluIpDescription = generateIpStatusDescription(ipStats.cluIpCount, ipUsage?.storageCluster);

    // 格式化IP段显示
    const mngIpRange = formatIpRangeDisplay(ipRanges?.mngIpRange);
    const bizIpRange = formatIpRangeDisplay(ipRanges?.bizIpRange);
    const pubIpRange = formatIpRangeDisplay(ipRanges?.pubIpRange);
    const cluIpRange = formatIpRangeDisplay(ipRanges?.cluIpRange);

    // 设置表格结构（在B列和C列之间添加IP段列，保留IP状态描述）
    const data = [
        ['IP整体规划', '网络划分', 'IP段', 'IP需求', 'VLAN', '网络绑定模式', '备注'],
        [
            '',
            '管理网IP',
            mngIpRange,
            mngIpDescription,
            '待客户分配',
            mngBondMode, // 管理网绑定模式
            '管理网：\n1.负责云桌面管理节点与计算节点，CEPH 管理节点与存储节点之间的通信',
        ],
        [
            '',
            '业务网IP',
            bizIpRange,
            bizIpDescription,
            '待客户分配',
            bizBondMode, // 业务网绑定模式
            '业务网：\n1.云桌面虚拟机通信网络；',
        ],
        [
            '',
            '物理机存储公共网IP',
            pubIpRange,
            pubIpDescription,
            '待客户分配',
            storBondMode, // 存储网绑定模式
            '存储公共网：\n1.属于存储网络，负责客户端与CEPH 存储集群、MON 与 MON 间、MON 与 OSD 间的通信；',
        ],
        [
            '',
            '物理机存储集群网IP',
            cluIpRange,
            cluIpDescription,
            '待客户分配',
            storBondMode, // 存储网绑定模式
            '存储集群网：\n1.属于存储网络，负责集群网络 OSD 间通信；',
        ],
    ];

    // 动态添加网段行
    for (let i = 1; i <= Math.max(segmentCount, 1); i++) {
        if (i === 1) {
            // 第一个网段行，在备注列添加桌面虚机描述
            data.push(['', '桌面虚机IP', `待提供网段${i}`, '', '', '', desktopIpDescription]);
        } else {
            data.push(['', '', `待提供网段${i}`, '', '', '', '']);
        }
    }

    // 添加数据行
    data.forEach((row) => {
        worksheet.addRow(row);
    });

    // 计算总行数，用于动态合并A列
    const totalRows = data.length;

    // 合并单元格
    worksheet.mergeCells(`A1:A${totalRows}`); // 动态合并"IP整体规划"列，根据实际行数
    // B1、C1、D1、E1、F1单元格保持独立，分别为"网络划分"、"IP段"、"IP需求"、"VLAN"、"备注"

    // 合并网段行对应的B列和F列单元格
    if (segmentCount > 1) {
        const startRow = 6; // 第一个网段行
        const endRow = startRow + segmentCount - 1; // 最后一个网段行

        // 合并B列（网络划分列）
        worksheet.mergeCells(`B${startRow}:B${endRow}`);

        // 合并G列（备注列），用于显示桌面虚机描述
        worksheet.mergeCells(`G${startRow}:G${endRow}`);
    }

    // 设置行高 - 修复A1行过高的问题
    worksheet.getRow(1).height = 30; // 减少第1行高度，从100改为30
    worksheet.getRow(2).height = 25; // 稍微调整其他行高度
    worksheet.getRow(3).height = 25;
    worksheet.getRow(4).height = 35; // 存储相关行稍高一些
    worksheet.getRow(5).height = 35;
    worksheet.getRow(6).height = 30; // 桌面虚机IP行

    // 设置列宽
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 35;
    worksheet.getColumn(4).width = 10;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 20; // 新增：网络绑定模式
    worksheet.getColumn(7).width = 40; // 备注

    // 应用样式
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
            // 默认样式：左对齐、底端对齐
            cell.alignment = {
                horizontal: 'left',
                vertical: 'bottom',
                wrapText: true,
            };

            // 第一行表头样式 - 美化格式
            if (rowNumber === 1) {
                if (colNumber === 1) {
                    // "IP整体规划"标题：A1合并列，14号加粗字体，居中对齐，深蓝背景
                    cell.alignment = {
                        horizontal: 'center',
                        vertical: 'middle',
                        wrapText: true,
                    };
                    cell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }; // 白色字体
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF1F4E79' }, // 深蓝色背景
                    };
                } else if (colNumber >= 2 && colNumber <= 7) {
                    // 其他表头：统一样式，12号加粗字体，居中对齐，浅蓝背景
                    cell.alignment = {
                        horizontal: 'center',
                        vertical: 'middle',
                        wrapText: true,
                    };
                    cell.font = { bold: true, size: 12, color: { argb: 'FF000000' } }; // 黑色字体
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD9E2F3' }, // 浅蓝色背景
                    };
                }
            }

            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            // 第二列标题加粗（除第一行外）
            if (colNumber === 2 && rowNumber > 1) {
                cell.font = { bold: true };
            }

            // "桌面虚机IP"单元格特殊样式（第6行第2列）
            if (rowNumber === 6 && colNumber === 2) {
                cell.font = { bold: true };
                cell.alignment = {
                    horizontal: 'left',
                    vertical: 'bottom', // 修改为底端对齐
                    wrapText: true,
                };
            }
        });
    });

    return worksheet;
};

/**
 * 创建服务器及桌面规格工作表
 * @param {Object} workbook - 工作簿
 * @param {Object[]} servers - 服务器列表
 * @param {Object} params - 参数配置
 */
const createServerPerformanceWorksheet = (workbook, servers, params) => {
    console.log('=== createServerPerformanceWorksheet DEBUG ===');
    console.log('Received params:', JSON.stringify(params, null, 2));
    console.log('mngCpuCores:', params?.mngCpuCores);
    console.log('mngMemory:', params?.mngMemory);
    console.log('mngSsdCount:', params?.mngSsdCount);
    console.log('mngHddCount:', params?.mngHddCount);
    console.log('============================================');
    
    const worksheet = workbook.addWorksheet('服务器及桌面规格');

    // 设置标题行
    const headers = [
        '类型',
        '数量',
        'CPU核数/台',
        '内存(GB)/台',
        '总CPU核数',
        '总内存(GB)',
        '存储配置',
        '网络配置',
        '性能评估',
        '备注',
    ];
    worksheet.addRow(headers);

    // 应用标题行样式
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.style = EXCEL_STYLES.header;
    });

    // 统计不同类型服务器的数量和配置
    const serverStats = {};
    (servers || []).forEach((server) => {
        // 角色名称映射：英文到中文
        const roleMapping = {
            management: '管理服务器',
            compute: '计算（超融合）服务器',
            storage: '存储服务器',
            管理服务器: '管理服务器',
            '计算（超融合）服务器': '计算（超融合）服务器',
            存储服务器: '存储服务器',
        };

        const type = roleMapping[server.role] || server.role;
        if (!serverStats[type]) {
            serverStats[type] = {
                count: 0,
                cpuCores: 0,
                memory: 0,
                storage: '',
                network: '',
            };
        }
        serverStats[type].count++;
    });

    // 从参数中获取服务器配置信息
    const safeParams = params || {};
    const mgmtConfig = {
        cpuCores: safeParams.mngCpuCores || 32,
        memory: safeParams.mngMemory || 128,
        ssd: safeParams.mngSsdCount || 2,
        ssdSpec: safeParams.mgmtSsdSpec || '1.92',
        hdd: safeParams.mngHddCount || 4,
        hddSpec: safeParams.mgmtHddSpec || '8',
    };
    const compConfig = {
        cpuCores: safeParams.fusionCpuCores || 64,
        memory: safeParams.fusionMemory || 256,
        ssd: safeParams.fusionSsdCount || 2,
        ssdSpec: safeParams.fusionSsdSpec || '1.92',
        hdd: safeParams.fusionHddCount || 4,
        hddSpec: safeParams.fusionHddSpec || '8',
    };
    const storConfig = {
        cpuCores: safeParams.storCpuCores || 32,
        memory: safeParams.storMemory || 128,
        ssd: safeParams.storSsdCount || 2,
        ssdSpec: safeParams.storSsdSpec || '1.92',
        hdd: safeParams.storHddCount || 4,
        hddSpec: safeParams.storHddSpec || '8',
    };

    // 添加数据行 - 服务器部分
    const serverTypes = [];
    
    // 管理服务器
    const mgmtCount = safeParams.countMng || 0;
    if (mgmtCount > 0) {
        serverTypes.push({
            type: '管理服务器',
            count: mgmtCount,
            config: mgmtConfig,
            performance: '负责集群管理、监控等功能',
        });
    }
    
    // 计算（超融合）服务器
    const compCount = safeParams.isFusionNode ? (safeParams.countFusion || 0) : (safeParams.countCalc || 0);
    if (compCount > 0) {
        const compType = safeParams.isFusionNode ? '超融合服务器' : '计算服务器';
        const compPerformance = safeParams.isFusionNode ? '提供计算资源和存储服务' : '提供计算资源';
        serverTypes.push({
            type: compType,
            count: compCount,
            config: compConfig,
            performance: compPerformance,
        });
    }
    
    // 存储服务器
    const storCount = safeParams.countStor || 0;
    if (storCount > 0) {
        serverTypes.push({
            type: '存储服务器',
            count: storCount,
            config: storConfig,
            performance: '提供分布式存储服务',
        });
    }

    serverTypes.forEach((serverType) => {
        if (serverType.count > 0) {
            const config = serverType.config;
            const totalCpu = serverType.count * config.cpuCores;
            const totalMemory = serverType.count * config.memory;

            let storageConfig = '';
            if (config.ssd > 0) {
                storageConfig += `SSD: ${config.ssd}块×${config.ssdSpec}TB`;
            }
            if (config.hdd > 0) {
                if (storageConfig) storageConfig += ', ';
                storageConfig += `HDD: ${config.hdd}块×${config.hddSpec}TB`;
            }
            if (!storageConfig) {
                storageConfig = '无';
            }

            const networkConfig = '千兆/万兆以太网';

            worksheet.addRow([
                serverType.type,
                serverType.count,
                config.cpuCores,
                config.memory,
                totalCpu,
                totalMemory,
                storageConfig,
                networkConfig,
                serverType.performance,
                '',
            ]);
        }
    });

    // 添加桌面虚机规格部分
    const desktopVmTypes = safeParams.desktopVmTypes || [];
    if (desktopVmTypes.length > 0) {
        // 添加空行分隔
        worksheet.addRow([]);
        
        // 添加桌面虚机标题行
        const vmHeaderRow = worksheet.addRow(['桌面虚机规格', '', '', '', '', '', '', '', '', '']);
        vmHeaderRow.getCell(1).style = {
            ...EXCEL_STYLES.header,
            font: { ...EXCEL_STYLES.header.font, bold: true, size: 12 }
        };
        
        // 合并桌面虚机标题行
        worksheet.mergeCells(vmHeaderRow.number, 1, vmHeaderRow.number, 10);
        
        // 添加桌面虚机数据
        desktopVmTypes.forEach((vmType) => {
            const totalCpu = vmType.count * vmType.cpu;
            const totalMemory = vmType.count * vmType.memory;
            const totalStorage = vmType.count * vmType.storage;
            
            worksheet.addRow([
                `桌面虚机类型${vmType.type}`,
                vmType.count,
                vmType.cpu,
                vmType.memory,
                totalCpu,
                totalMemory,
                `系统盘: ${vmType.storage}GB`,
                '千兆以太网',
                '提供桌面虚拟化服务',
                `总存储需求: ${totalStorage}GB`,
            ]);
        });
    }

    // 设置列宽
    worksheet.columns = [
        { width: 20 }, // 服务器类型
        { width: 8 }, // 数量
        { width: 12 }, // CPU核数/台
        { width: 12 }, // 内存(GB)/台
        { width: 12 }, // 总CPU核数
        { width: 12 }, // 总内存(GB)
        { width: 25 }, // 存储配置
        { width: 15 }, // 网络配置
        { width: 25 }, // 性能评估
        { width: 15 }, // 备注
    ];

    // 应用数据行样式
    for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        row.eachCell((cell) => {
            cell.style = EXCEL_STYLES.cell;
        });
    }

    return worksheet;
};

/**
 * 创建服务器规划工作表
 * @param {Object} workbook - 工作簿
 * @param {Object[]} servers - 服务器列表
 */
const createServerWorksheet = (workbook, servers, params) => {
    const worksheet = workbook.addWorksheet('物理服务器IP');

    // 设置标题行
    const headers = [
        '主机名',
        '角色',
        '管理网级联端口名',
        '管理网级联网卡',
        '管理网IP',
        '业务网级联端口名',
        '业务网级联网卡',
        '业务网IP',
        '存储网级联端口名',
        '存储网级联网卡',
        '存储公共网IP',
        '存储集群网IP',
    ];
    worksheet.addRow(headers);

    // 动态获取列索引
    const columnIndexes = {};
    worksheet.getRow(1).eachCell((cell, colNumber) => {
        columnIndexes[cell.value] = colNumber;
    });

    // 添加数据行
    (servers || []).forEach((server, index) => {
        const rowIndex = index + 2; // 数据行从第2行开始
        const isFloatingIp = server.isFloatingIp || server.role.includes('浮动IP') || server.role.includes('浮动');

        worksheet.addRow([
            server.hostname,
            server.role,
            isFloatingIp ? '不涉及' : params?.mngBondName || '待配置',
            isFloatingIp ? '不涉及' : params?.mngBondNics || '待配置',
            server.mngIp,
            isFloatingIp ? '不涉及' : params?.bizBondName || '待配置',
            isFloatingIp ? '不涉及' : params?.bizBondNics || '待配置',
            server.bizIp,
            isFloatingIp ? '不涉及' : params?.storBondName || '待配置',
            isFloatingIp ? '不涉及' : params?.storBondNics || '待配置',
            server.pubIp,
            server.cluIp,
        ]);

        // 为浮动IP服务器的存储网单元格添加特殊格式
        if (server.role.includes('浮动IP') || server.role.includes('浮动')) {
            const pubIpCol = columnIndexes['存储公共网IP'];
            const cluIpCol = columnIndexes['存储集群网IP'];

            // 存储公共网IP列
            const pubCell = worksheet.getCell(rowIndex, pubIpCol);
            if (server.pubIp !== '不涉及') {
                pubCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF565656' }, // #565656
                };
                pubCell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                    diagonal: { up: true, down: false, style: 'thin' },
                };
            }

            // 存储集群网IP列
            const cluCell = worksheet.getCell(rowIndex, cluIpCol);
            if (server.cluIp !== '不涉及') {
                cluCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF565656' }, // #565656
                };
                cluCell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                    diagonal: { up: true, down: false, style: 'thin' },
                };
            }

            // 在右侧合并单元格并添加注释
            const commentStartCol = headers.length + 1; // 从最后一列的下一列开始
            const commentEndCol = commentStartCol + 6; // 合并7列

            worksheet.mergeCells(rowIndex, commentStartCol, rowIndex, commentEndCol);
            const commentCell = worksheet.getCell(rowIndex, commentStartCol);
            commentCell.value = '浮动地址不涉及存储网，如此分配仅为保持计算节点的管理网业务网存储网IP对齐';
            commentCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
            commentCell.font = { size: 10, color: { argb: 'FF666666' } };
            commentCell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        }

        // 为"待提供IP"单元格添加蓝色背景
        const isFloatingIpForIpCheck =
            server.isFloatingIp || server.role.includes('浮动IP') || server.role.includes('浮动');
        const ipColumns = {
            管理网IP: server.mngIp,
            业务网IP: server.bizIp,
            存储公共网IP: isFloatingIpForIpCheck ? null : server.pubIp,
            存储集群网IP: isFloatingIpForIpCheck ? null : server.cluIp,
        };

        for (const [colName, ipValue] of Object.entries(ipColumns)) {
            if (ipValue === IP_TO_BE_PROVIDED_TEXT) {
                const colIndex = columnIndexes[colName];
                if (colIndex) {
                    const cell = worksheet.getCell(rowIndex, colIndex);
                    Object.assign(cell, EXCEL_STYLES.ipToBeProvieded);
                }
            }
        }
    });

    // 应用样式
    applyWorksheetStyles(worksheet, 1, headers.length);

    return worksheet;
};

/**
 * 创建虚机规划工作表
 * @param {Object} workbook - 工作簿
 * @param {Object[]} vms - 虚机列表
 */
const createVmWorksheet = (workbook, vms) => {
    const worksheet = workbook.addWorksheet('功能虚机IP');

    // 设置标题行 - 去掉"类型"列
    const headers = ['虚机名称', '管理网IP', '业务网IP', 'CAG管理地址', '规格'];
    worksheet.addRow(headers);

    // 对虚机进行排序：insight系列虚机排在最下面
    const sortedVms = [...(vms || [])].sort((a, b) => {
        const aIsInsight = a.name.toLowerCase().includes('insight');
        const bIsInsight = b.name.toLowerCase().includes('insight');

        // 如果一个是insight，一个不是，非insight排在前面
        if (aIsInsight && !bIsInsight) return 1;
        if (!aIsInsight && bIsInsight) return -1;

        // 如果都是insight或都不是insight，按名称排序
        return a.name.localeCompare(b.name);
    });

    // 添加数据行 - 去掉vm.type
    sortedVms.forEach((vm, index) => {
        const rowIndex = index + 2; // 数据行从第2行开始
        worksheet.addRow([vm.name, vm.mngIp, vm.bizIp, vm.cagIp, vm.spec]);

        // 为"待提供IP"单元格添加蓝色背景
        // 管理网IP列（第2列）
        if (vm.mngIp === IP_TO_BE_PROVIDED_TEXT) {
            const cell = worksheet.getCell(rowIndex, 2);
            Object.assign(cell, EXCEL_STYLES.ipToBeProvieded);
        }

        // 业务网IP列（第3列）
        if (vm.bizIp === IP_TO_BE_PROVIDED_TEXT) {
            const cell = worksheet.getCell(rowIndex, 3);
            Object.assign(cell, EXCEL_STYLES.ipToBeProvieded);
        }

        // CAG管理地址列（第4列）
        if (vm.cagIp === IP_TO_BE_PROVIDED_TEXT) {
            const cell = worksheet.getCell(rowIndex, 4);
            Object.assign(cell, EXCEL_STYLES.ipToBeProvieded);
        }
    });

    // 应用样式
    applyWorksheetStyles(worksheet, 1, headers.length);

    return worksheet;
};

/**
 * 创建存储规划工作表 - 按照WPS JS版本重新实现
 * @param {Object} workbook - 工作簿
 * @param {Object} params - 参数对象
 */
const createStorageWorksheet = (workbook, params) => {
    const worksheet = workbook.addWorksheet('存储');

    const {
        isFusionNode = false,
        isMngAsFusion = false,
        countMng = 0,
        countFusion = 0,
        countStor = 0,
        isCephDual = false,
        storageSecurity = 'replica',
        // 管理服务器配置
        mngSsdCount = 0,
        mgmtSsdSpec = '1TB',
        mngHddCount = 0,
        mgmtHddSpec = '2TB',
        mngCpuCores = 32,
        mngMemory = 128,
        mgmtOsdReservedSize = 0,
        // 超融合/计算服务器配置
        fusionSsdCount = 0,
        fusionSsdSpec = '1TB',
        fusionHddCount = 0,
        fusionHddSpec = '2TB',
        fusionCpuCores = 64,
        fusionMemory = 256,
        fusionOsdReservedSize = 0,
        // 存储服务器配置
        storSsdCount = 0,
        storSsdSpec = '1TB',
        storHddCount = 0,
        storHddSpec = '2TB',
        storCpuCores = 32,
        storMemory = 128,
        storOsdReservedSize = 0,
    } = params || {};

    console.log('=== createStorageWorksheet DEBUG ===');
    console.log('管理服务器配置:', { mngSsdCount, mgmtSsdSpec, mngHddCount, mgmtHddSpec, mngCpuCores, mngMemory, mgmtOsdReservedSize });
    console.log('超融合服务器配置:', { fusionSsdCount, fusionSsdSpec, fusionHddCount, fusionHddSpec, fusionCpuCores, fusionMemory, fusionOsdReservedSize });
    console.log('存储服务器配置:', { storSsdCount, storSsdSpec, storHddCount, storHddSpec, storCpuCores, storMemory, storOsdReservedSize });
    console.log('======================================');

    let currentRow = 1;

    // 写入存储表格的函数
    const writeStorageTable = (title, serverCount, includeFuncVm, includeDesktop, serverType = 'storage') => {
        const startRow = currentRow;

        // 根据服务器类型选择配置参数
        let ssdCount, ssdSpec, hddCount, hddSpec, cpuCores, memorySize, osdReservedSize;
        
        if (title.includes('MNG') || serverType === 'management') {
            // 管理服务器配置
            ssdCount = mngSsdCount;
            ssdSpec = mgmtSsdSpec;
            hddCount = mngHddCount;
            hddSpec = mgmtHddSpec;
            cpuCores = mngCpuCores;
            memorySize = mngMemory;
            osdReservedSize = mgmtOsdReservedSize;
        } else if (serverType === 'fusion') {
            // 超融合服务器配置
            ssdCount = fusionSsdCount;
            ssdSpec = fusionSsdSpec;
            hddCount = fusionHddCount;
            hddSpec = fusionHddSpec;
            cpuCores = fusionCpuCores;
            memorySize = fusionMemory;
            osdReservedSize = fusionOsdReservedSize;
        } else if (serverType === 'storage') {
            // 存储服务器配置
            ssdCount = storSsdCount;
            ssdSpec = storSsdSpec;
            hddCount = storHddCount;
            hddSpec = storHddSpec;
            cpuCores = storCpuCores;
            memorySize = storMemory;
            osdReservedSize = storOsdReservedSize;
        } else {
            // 默认使用存储服务器配置（向后兼容）
            ssdCount = storSsdCount;
            ssdSpec = storSsdSpec;
            hddCount = storHddCount;
            hddSpec = storHddSpec;
            cpuCores = storCpuCores;
            memorySize = storMemory;
            osdReservedSize = storOsdReservedSize;
        }

        console.log(`=== writeStorageTable ${title} ===`);
        console.log('使用的配置:', { ssdCount, ssdSpec, hddCount, hddSpec, cpuCores, memorySize, osdReservedSize });
        console.log('===============================');

        // 计算缓存比
        // 解析SSD和HDD规格（去掉TB后缀）
        const ssdSizePerDisk = parseFloat(ssdSpec.replace(/TB/i, ''));
        const hddSizePerDisk = parseFloat(hddSpec.replace(/TB/i, ''));

        // 计算缓存比：(ssd个数 * ssd磁盘大小 - 单盘OSD预留大小 * ssd个数) / (hdd个数 * hdd磁盘大小)
        const totalSsdSize = ssdCount * ssdSizePerDisk;
        const totalReservedSize = ssdCount * osdReservedSize;
        const availableCacheSize = totalSsdSize - totalReservedSize;
        const totalHddSize = hddCount * hddSizePerDisk;

        const cacheRatio = totalHddSize > 0 ? availableCacheSize / totalHddSize : 0;
        const cacheRatioText = `${cacheRatio.toFixed(3)} (${(cacheRatio * 100).toFixed(1)}%)`;

        // 格式化OSD预留大小显示
        const osdReservedText = osdReservedSize && osdReservedSize > 0 ? `${osdReservedSize}TB` : '0TB';

        // 定义信息行 - 使用用户配置的服务器信息
        const infoRows = [
            { cells: [title], mergeTo: 7, note: '备注', height: 30 },
            {
                cells: ['集群服务器数', serverCount],
                mergeTo: 7,
                note: '每一个集群纳管服务器数不要超过100，如超过则新建CEPH集群',
                height: 24,
            },
            {
                cells: ['服务器配置', `CPU: ${cpuCores}核, 内存: ${memorySize}GB`],
                mergeTo: 7,
                note: '服务器基础配置信息',
                height: 24,
            },
            {
                cells: ['SSD盘信息', `${ssdCount}块`, `${ssdSpec}`, '单盘OSD预留大小', osdReservedText],
                mergeTo: 7,
                note: 'OSD预留容量具体指将SSD盘分成两部分，一部分用作缓存，一部分用作SSD存储。当现场SSD资源比较紧张时，可能会用到OSD预留容量的功能，预留的容量用来创建OSD，不用做缓存盘。OSD预留容量不能超过90%',
                height: 28,
            },
            {
                cells: ['HDD盘信息', `${hddCount}块`, `${hddSpec}`, '计算所得缓存比大小为', cacheRatioText],
                mergeTo: 7,
                note: '缓存比（ssd个数*ssd磁盘减去预留后的大小/hdd个数*磁盘大小）要大于0.07',
                height: 28,
            },
            {
                cells: ['存储池名称', '存储池用途', '副本方式', '存储池类型', '总容量', '服务器数', 'OSD数量'],
                note: '',
                height: 28,
                isHeader: true,
            },
        ];

        // 写入信息行
        infoRows.forEach((rowData) => {
            const row = worksheet.addRow(rowData.cells);

            // 设置行高
            row.height = rowData.height;

            // 合并单元格 - 修复API调用
            if (rowData.mergeTo) {
                worksheet.mergeCells(
                    `${String.fromCharCode(64 + rowData.cells.length)}${currentRow}:${String.fromCharCode(64 + rowData.mergeTo)}${currentRow}`
                );
            }

            // 添加备注
            worksheet.getCell(currentRow, 8).value = rowData.note;

            // 设置标题行样式
            if (rowData.isHeader) {
                for (let col = 1; col <= 7; col++) {
                    worksheet.getCell(currentRow, col).font = { bold: true };
                }
            }

            currentRow++;
        });

        // 功能虚机存储数据
        if (includeFuncVm) {
            const funcVmData = [
                ['POOL_MNG01', '功能虚机存储', storageSecurity, 'SSD', '', '', ''],
                ['', 'zxve_data:≧200G', storageSecurity, 'SSD', '', '', ''],
                ['', 'nfs_share:≧300G', storageSecurity, 'SSD', '', '', ''],
            ];

            if (isCephDual) {
                funcVmData.push(['', 'ceph_ha:≧100G', storageSecurity, 'SSD', '', '', '']);
            }

            const funcVmStartRow = currentRow;
            funcVmData.forEach((rowData) => {
                worksheet.addRow(rowData);
                currentRow++;
            });

            // 特殊合并 - POOL_MNG01行 - 修复API调用
            worksheet.mergeCells(`A${funcVmStartRow}:A${currentRow - 1}`);
            for (let col = 3; col <= 7; col++) {
                const colLetter = String.fromCharCode(64 + col);
                worksheet.mergeCells(`${colLetter}${funcVmStartRow}:${colLetter}${currentRow - 1}`);
            }
        }

        // 桌面虚机存储数据
        if (includeDesktop) {
            const desktopData = [
                ['SSDPOOL_DESKTOP01', '用户系统盘存储', storageSecurity, 'SSD', '', '', ''],
                ['超过20台服务器请自行新增一个POOL池，命名成POOL_DESKTOP02之类即可', '', '', '', '', '', ''],
            ];

            // 检查是否有HDD配置 - 根据用户输入的HDD数量判断
            const hasHdd = hddCount > 0;
            if (hasHdd) {
                desktopData.push(['HDDPOOL_DESKTOP01', '用户数据盘存储', storageSecurity, 'HDD', '', '', '']);
                desktopData.push([
                    '超过20台服务器请自行新增一个POOL池，命名成HDDPOOL_DESKTOP02之类即可',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                ]);
            }

            desktopData.forEach((rowData) => {
                worksheet.addRow(rowData);
                currentRow++;
            });
        }

        // 添加边框 - 修复ExcelJS API调用
        for (let row = startRow; row < currentRow; row++) {
            for (let col = 1; col <= 8; col++) {
                const cell = worksheet.getCell(row, col);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            }
        }

        return currentRow + 1; // 返回下一个表格的起始行
    };

    // 根据配置生成存储表格
    if (!isFusionNode || (isFusionNode && !isMngAsFusion)) {
        // 单一集群模式
        const serverCount = isFusionNode ? countFusion : countStor;
        const serverType = isFusionNode ? 'fusion' : 'storage';
        writeStorageTable('CEPH集群01', serverCount, true, true, serverType);
    } else if (isFusionNode && isMngAsFusion) {
        // 分离模式：管理集群 + 计算集群
        currentRow = writeStorageTable('CEPH_MNG', countMng, true, false, 'management');
        writeStorageTable('CEPH集群01', countFusion, false, true, 'fusion');
    }

    return worksheet;
};

/**
 * 创建端口规划（服务器）工作表
 * @param {Object} workbook - 工作簿
 */
const createServerPortPlanWorksheet = (workbook) => {
    const worksheet = workbook.addWorksheet('端口规划（服务器）');

    // 设置标题行
    const headers = [
        '序号',
        '机柜位置',
        '设备U位',
        '型号',
        '接口类型',
        '物理接口名称',
        '逻辑端口名',
        '交换机机柜',
        '交换机U位',
        '交换机端',
        '设备名称',
    ];
    worksheet.addRow(headers);

    // 应用样式
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.style = EXCEL_STYLES.header;
    });

    // 设置列宽
    worksheet.columns = [
        { width: 8 }, // 序号
        { width: 12 }, // 机柜位置
        { width: 10 }, // 设备U位
        { width: 15 }, // 型号
        { width: 12 }, // 接口类型
        { width: 18 }, // 物理接口名称
        { width: 15 }, // 逻辑端口名
        { width: 12 }, // 交换机机柜
        { width: 12 }, // 交换机U位
        { width: 12 }, // 交换机端
        { width: 15 }, // 设备名称
    ];

    return worksheet;
};

/**
 * 创建端口规划（网络设备）工作表
 * @param {Object} workbook - 工作簿
 */
const createNetworkPortPlanWorksheet = (workbook) => {
    const worksheet = workbook.addWorksheet('端口规划（网络设备）');

    // 设置标题行
    const headers = ['本端设备名称', '本端设备端口', '对端设备端口', '本端设备名称', '本端设备端口', '对端设备端口'];
    worksheet.addRow(headers);

    // 应用样式
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.style = EXCEL_STYLES.header;
    });

    // 设置列宽
    worksheet.columns = [
        { width: 18 }, // 本端设备名称
        { width: 18 }, // 本端设备端口
        { width: 18 }, // 对端设备端口
        { width: 18 }, // 本端设备名称
        { width: 18 }, // 本端设备端口
        { width: 18 }, // 对端设备端口
    ];

    return worksheet;
};

/**
 * 创建网络策略工作表
 * @param {Object} workbook - 工作簿
 */
const createNetworkPolicyWorksheet = (workbook) => {
    const worksheet = workbook.addWorksheet('网络策略');

    // 设置标题行（可以根据需要调整）
    const headers = ['策略名称', '源地址', '目标地址', '协议', '端口', '动作', '备注'];
    worksheet.addRow(headers);

    // 应用样式
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.style = EXCEL_STYLES.header;
    });

    // 设置列宽
    worksheet.columns = [
        { width: 15 }, // 策略名称
        { width: 18 }, // 源地址
        { width: 18 }, // 目标地址
        { width: 10 }, // 协议
        { width: 12 }, // 端口
        { width: 10 }, // 动作
        { width: 20 }, // 备注
    ];

    return worksheet;
};

/**
 * 生成Excel文件
 * @param {Object} plan - 规划数据
 * @param {Object} mainWindow - 主窗口对象
 * @returns {Promise<Object>} 生成结果
 */
const generateExcelFile = async (plan, mainWindow) => {
    try {
        console.log('generateExcelFile started');
        // 创建工作簿
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'ZTE uSmartView LLD Generator';
        workbook.created = new Date();
        console.log('workbook created');

        // 创建工作表（IP总体规划放在最前面）
        const parameters = plan.metadata?.parameters || {};
        console.log('=== generateExcelFile DEBUG ===');
        console.log('plan.metadata:', JSON.stringify(plan.metadata, null, 2));
        console.log('parameters:', JSON.stringify(parameters, null, 2));
        console.log('parameters.mngCpuCores:', parameters.mngCpuCores);
        console.log('parameters.mngMemory:', parameters.mngMemory);
        console.log('================================');
        const ipRanges = {
            mngIpRange: parameters.mngIpRange,
            bizIpRange: parameters.bizIpRange,
            pubIpRange: parameters.pubIpRange,
            cluIpRange: parameters.cluIpRange,
        };

        console.log('creating worksheets');
        createIpPlanWorksheet(
            workbook,
            plan.servers,
            plan.vms,
            plan.desktopVmTypes,
            plan.summary?.ipUsage,
            ipRanges,
            parameters
        );
        console.log('createIpPlanWorksheet done');
        createServerPerformanceWorksheet(workbook, plan.servers, parameters);
        console.log('createServerPerformanceWorksheet done');
        createServerWorksheet(workbook, plan.servers, parameters);
        console.log('createServerWorksheet done');
        createVmWorksheet(workbook, plan.vms);
        console.log('createVmWorksheet done');
        createStorageWorksheet(workbook, parameters); // 传递参数而不是storagePlan
        console.log('createStorageWorksheet done');

        // 创建新增的3个sheet页
        createServerPortPlanWorksheet(workbook);
        createNetworkPortPlanWorksheet(workbook);
        createNetworkPolicyWorksheet(workbook);
        console.log('all worksheets created');

        // 生成详细的时间戳（使用上海时区）
        const now = new Date();
        // 获取上海时区的时间字符串
        const shanghaiTimeString = now.toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
        // 格式化为：2025-07-27_13-40-17
        const timestamp = shanghaiTimeString
            .replace(/\//g, '-') // 替换日期分隔符
            .replace(' ', '_') // 日期和时间之间用下划线
            .replace(/:/g, '-'); // 时间分隔符用短横线

        // 显示保存对话框
        const result = await dialog.showSaveDialog(mainWindow, {
            title: '保存Excel文件',
            defaultPath: `云桌面LLD-${timestamp}.xlsx`,
            filters: [{ name: 'Excel文件', extensions: ['xlsx'] }],
        });

        if (result.canceled) {
            return { success: false, message: '用户取消保存' };
        }

        // 保存文件
        await workbook.xlsx.writeFile(result.filePath);

        return {
            success: true,
            filePath: result.filePath,
            message: '文件保存成功',
        };
    } catch (error) {
        console.error('generateExcelFile catch block:', error);
        return {
            success: false,
            error: error.message,
            message: '文件生成失败',
        };
    }
};

module.exports = {
    generateExcelFile,
    createIpPlanWorksheet,
    createServerPerformanceWorksheet,
    createServerWorksheet,
    createVmWorksheet,
    createStorageWorksheet,
    createServerPortPlanWorksheet,
    createNetworkPortPlanWorksheet,
    createNetworkPolicyWorksheet,
    generateIpStatusDescription, // 导出用于测试
    formatIpRangeDisplay, // 导出用于测试
    EXCEL_STYLES,
};
