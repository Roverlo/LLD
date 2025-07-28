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

    // 设置列宽
    setColumnWidths(worksheet, maxColumns);
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
    return ipRange.trim()
        .replace(/\s+/g, ' ')  // 多个空格替换为单个空格
        .replace(/，/g, ',')   // 中文逗号替换为英文逗号
        .replace(/；/g, ';')   // 中文分号替换为英文分号
        .replace(/\s*,\s*/g, ', ')  // 逗号前后统一空格
        .replace(/\s*;\s*/g, '; '); // 分号前后统一空格
};

const createIpPlanWorksheet = (workbook, servers, vms, desktopVmTypes = [], ipUsage = null, ipRanges = null) => {
    const worksheet = workbook.addWorksheet('IP总体规划');

    // 统计各类IP数量
    const ipStats = {
        mngIpCount: 0,
        bizIpCount: 0,
        pubIpCount: 0,
        cluIpCount: 0,
        vmIpCount: 0,
    };

    // 统计服务器IP（排除"不涉及"的IP）
    servers.forEach((server) => {
        if (server.mngIp && server.mngIp !== '待分配' && server.mngIp !== '不涉及') ipStats.mngIpCount++;
        if (server.bizIp && server.bizIp !== '待分配' && server.bizIp !== '不涉及') ipStats.bizIpCount++;
        if (server.pubIp && server.pubIp !== '待分配' && server.pubIp !== '不涉及') ipStats.pubIpCount++;
        if (server.cluIp && server.cluIp !== '待分配' && server.cluIp !== '不涉及') ipStats.cluIpCount++;
    });

    // 统计虚机IP（包含在管理网和业务网计数中，排除"不涉及"的IP）
    vms.forEach((vm) => {
        if (vm.mngIp && vm.mngIp !== '待分配' && vm.mngIp !== '不涉及') {
            ipStats.mngIpCount++; // 虚机管理网IP计入管理网总数
        }
        if (vm.bizIp && vm.bizIp !== '待分配' && vm.bizIp !== '不涉及') {
            ipStats.bizIpCount++; // 虚机业务网IP计入业务网总数
        }
    });

    // 计算桌面虚机IP需求
    const totalDesktopVms = desktopVmTypes.reduce((sum, vmType) => sum + vmType.count, 0);
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
        ['IP整体规划', 'IP需求', 'IP段', 'IP状态', 'VLAN', '备注'],
        [
            '',
            '管理网IP',
            mngIpRange,  // 用户填写的IP段，如：192.168.1.10-192.168.1.100
            mngIpDescription,  // IP状态描述，如：共需29个IP，已提供91个IP，IP充足
            'VLAN',
            '管理网：\n1.负责云桌面管理节点与计算节点，CEPH 管理节点与存储节点之间的通信',
        ],
        [
            '',
            '业务网IP',
            bizIpRange,  // 用户填写的IP段，如：192.168.2.10-192.168.2.100
            bizIpDescription,  // IP状态描述
            'VLAN',
            '业务网：\n1.云桌面虚拟机通信网络；'
        ],
        [
            '',
            '物理机存储公共网IP',
            pubIpRange,  // 用户填写的IP段，如：192.168.3.10-192.168.3.100
            pubIpDescription,  // IP状态描述
            'VLAN',
            '存储公共网：\n1.属于存储网络，负责客户端与CEPH 存储集群、MON 与 MON 间、MON 与 OSD 间的通信；',
        ],
        [
            '',
            '物理机存储集群网IP',
            cluIpRange,  // 用户填写的IP段，如：192.168.4.10-192.168.4.100
            cluIpDescription,  // IP状态描述
            'VLAN',
            '存储集群网：\n1.属于存储网络，负责集群网络 OSD 间通信；',
        ],
        ['', '桌面虚机IP', '待提供', desktopIpDescription, '', ''],  // 恢复桌面虚机IP状态描述
    ];

    // 动态添加网段行
    for (let i = 1; i <= Math.max(segmentCount, 1); i++) {
        data.push(['', '', `待提供网段${i}`, '', '', '']);
    }

    // 添加数据行
    data.forEach((row) => {
        worksheet.addRow(row);
    });

    // 计算总行数，用于动态合并A列
    const totalRows = data.length;

    // 合并单元格
    worksheet.mergeCells(`A1:A${totalRows}`); // 动态合并"IP整体规划"列，根据实际行数
    // B1、C1、D1、E1、F1单元格保持独立，分别为"IP需求"、"IP段"、"IP状态"、"VLAN"、"备注"
    worksheet.mergeCells('D6:F6'); // 合并"IP总体规划"sheet页的D6到F6单元格

    // 合并B6和下面的网段行对应的B列单元格
    if (segmentCount > 0) {
        const startRow = 6; // B6是桌面虚机IP行
        const endRow = startRow + segmentCount; // B6 + 网段行数
        worksheet.mergeCells(`B${startRow}:B${endRow}`);
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
    worksheet.getColumn(6).width = 40;

    // 应用样式
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
            // 默认样式：左对齐、底端对齐
            cell.alignment = {
                horizontal: 'left',
                vertical: 'bottom',
                wrapText: true,
            };

            // 第一行表头样式
            if (rowNumber === 1) {
                if (colNumber === 1) {
                    // "IP整体规划"标题：A1到A10合并，14号加粗字体，垂直居中
                    cell.alignment = {
                        horizontal: 'center', // 保持水平居中
                        vertical: 'middle', // 垂直居中
                        wrapText: true,
                    };
                    cell.font = { bold: true, size: 14 };
                } else if (colNumber === 2) {
                    // "IP需求"标题：B1到C1合并，12号加粗字体，水平居中
                    cell.alignment = {
                        horizontal: 'center', // 水平居中
                        vertical: 'middle',
                        wrapText: true,
                    };
                    cell.font = { bold: true, size: 12 };
                } else if (colNumber === 4) {
                    // "VLAN"标题：D1到E1合并，12号加粗字体，水平居中
                    cell.alignment = {
                        horizontal: 'center', // 水平居中
                        vertical: 'middle',
                        wrapText: true,
                    };
                    cell.font = { bold: true, size: 12 };
                } else if (colNumber === 6) {
                    // "备注"标题：F1单元格，12号加粗字体，左对齐、底端对齐
                    cell.alignment = {
                        horizontal: 'left',
                        vertical: 'bottom',
                        wrapText: true,
                    };
                    cell.font = { bold: true, size: 12 };
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
 * 创建服务器规划工作表
 * @param {Object} workbook - 工作簿
 * @param {Object[]} servers - 服务器列表
 */
const createServerWorksheet = (workbook, servers) => {
    const worksheet = workbook.addWorksheet('物理服务器规划');

    // 设置标题行
    const headers = ['主机名', '角色', '管理网IP', '业务网IP', '存储公共网IP', '存储集群网IP'];
    worksheet.addRow(headers);

    // 添加数据行
    servers.forEach((server, index) => {
        const rowIndex = index + 2; // 数据行从第2行开始
        worksheet.addRow([server.hostname, server.role, server.mngIp, server.bizIp, server.pubIp, server.cluIp]);

        // 为浮动IP服务器的存储网单元格添加特殊格式
        if (server.role.includes('浮动IP') || server.role.includes('浮动')) {
            // 存储公共网IP列（第5列）
            const pubCell = worksheet.getCell(rowIndex, 5);
            if (server.pubIp !== '不涉及') {
                pubCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF565656' }, // #565656
                };
                // 添加斜对角线边框
                pubCell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                    diagonal: { up: true, down: false, style: 'thin' },
                };
            }

            // 存储集群网IP列（第6列）
            const cluCell = worksheet.getCell(rowIndex, 6);
            if (server.cluIp !== '不涉及') {
                cluCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF565656' }, // #565656
                };
                // 添加斜对角线边框
                cluCell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                    diagonal: { up: true, down: false, style: 'thin' },
                };
            }

            // 在右侧G到M列合并单元格并添加注释
            const commentStartCol = 7; // G列
            const commentEndCol = 13; // M列

            // 合并G到M列的单元格
            worksheet.mergeCells(rowIndex, commentStartCol, rowIndex, commentEndCol);

            // 在合并的单元格中添加注释
            const commentCell = worksheet.getCell(rowIndex, commentStartCol);
            commentCell.value = '浮动地址不涉及存储网，如此分配仅为保持计算节点的管理网业务网存储网IP对齐';
            commentCell.alignment = {
                horizontal: 'left', // 水平左对齐
                vertical: 'middle', // 垂直居中
                wrapText: true,
                indent: 1, // 添加一点缩进确保左对齐效果
            };
            commentCell.font = {
                size: 10,
                color: { argb: 'FF666666' }, // 灰色字体
            };
            commentCell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        }

        // 为"待提供IP"单元格添加蓝色背景（排除浮动IP的存储网单元格）
        const isFloatingIp = server.role.includes('浮动IP') || server.role.includes('浮动');

        // 管理网IP列（第3列）
        if (server.mngIp === IP_TO_BE_PROVIDED_TEXT) {
            const cell = worksheet.getCell(rowIndex, 3);
            Object.assign(cell, EXCEL_STYLES.ipToBeProvieded);
        }

        // 业务网IP列（第4列）
        if (server.bizIp === IP_TO_BE_PROVIDED_TEXT) {
            const cell = worksheet.getCell(rowIndex, 4);
            Object.assign(cell, EXCEL_STYLES.ipToBeProvieded);
        }

        // 存储公共网IP列（第5列）- 排除浮动IP的存储网
        if (server.pubIp === IP_TO_BE_PROVIDED_TEXT && !isFloatingIp) {
            const cell = worksheet.getCell(rowIndex, 5);
            Object.assign(cell, EXCEL_STYLES.ipToBeProvieded);
        }

        // 存储集群网IP列（第6列）- 排除浮动IP的存储网
        if (server.cluIp === IP_TO_BE_PROVIDED_TEXT && !isFloatingIp) {
            const cell = worksheet.getCell(rowIndex, 6);
            Object.assign(cell, EXCEL_STYLES.ipToBeProvieded);
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
    const worksheet = workbook.addWorksheet('功能虚机规划');

    // 设置标题行 - 去掉"类型"列
    const headers = ['虚机名称', '管理网IP', '业务网IP', 'CAG管理地址', '规格'];
    worksheet.addRow(headers);

    // 添加数据行 - 去掉vm.type
    vms.forEach((vm, index) => {
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
    const worksheet = workbook.addWorksheet('存储规划');

    const {
        isFusionNode,
        isMngAsFusion,
        countMng,
        countFusion,
        countStor,
        isCephDual,
        storageSecurity,
        ssdCount,
        ssdSpec,
        hddCount,
        hddSpec,
        cpuCores,
        memorySize,
        osdReservedSize = 0,
    } = params;

    let currentRow = 1;

    // 写入存储表格的函数
    const writeStorageTable = (title, serverCount, includeFuncVm, includeDesktop) => {
        const startRow = currentRow;

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
        writeStorageTable('CEPH集群01', serverCount, true, true);
    } else if (isFusionNode && isMngAsFusion) {
        // 分离模式：管理集群 + 计算集群
        currentRow = writeStorageTable('CEPH_MNG', countMng, true, false);
        writeStorageTable('CEPH集群01', countFusion, false, true);
    }

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
        // 创建工作簿
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'ZTE uSmartView LLD Generator';
        workbook.created = new Date();

        // 创建工作表（IP总体规划放在最前面）
        const ipRanges = {
            mngIpRange: plan.metadata?.parameters?.mngIpRange,
            bizIpRange: plan.metadata?.parameters?.bizIpRange,
            pubIpRange: plan.metadata?.parameters?.pubIpRange,
            cluIpRange: plan.metadata?.parameters?.cluIpRange,
        };
        createIpPlanWorksheet(workbook, plan.servers, plan.vms, plan.desktopVmTypes, plan.summary?.ipUsage, ipRanges);
        createServerWorksheet(workbook, plan.servers);
        createVmWorksheet(workbook, plan.vms);
        createStorageWorksheet(workbook, plan.metadata.parameters); // 传递参数而不是storagePlan

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
    createServerWorksheet,
    createVmWorksheet,
    createStorageWorksheet,
    generateIpStatusDescription, // 导出用于测试
    formatIpRangeDisplay, // 导出用于测试
    EXCEL_STYLES,
};
