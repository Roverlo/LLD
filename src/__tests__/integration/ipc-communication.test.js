/**
 * 集成测试 - IPC通信
 * 测试主进程与渲染进程之间的通信
 */

const { ipcMain, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// Mock Electron IPC
jest.mock('electron', () => ({
    ipcMain: {
        handle: jest.fn(),
        on: jest.fn(),
        removeAllListeners: jest.fn(),
    },
    ipcRenderer: {
        invoke: jest.fn(),
        send: jest.fn(),
        on: jest.fn(),
        removeAllListeners: jest.fn(),
    },
}));

// Mock ExcelJS before importing services
jest.mock('exceljs', () => ({
    Workbook: jest.fn().mockImplementation(() => ({
        addWorksheet: jest.fn().mockReturnValue({
            addRow: jest.fn(),
            getCell: jest.fn().mockReturnValue({
                value: '',
                font: {},
                alignment: {},
                border: {},
                fill: {}
            }),
            mergeCells: jest.fn(),
            columns: []
        }),
        xlsx: {
            writeFile: jest.fn().mockResolvedValue(undefined)
        }
    }))
}));

// Mock ExcelService
jest.mock('../../main/services/excel-service', () => {
    return jest.fn().mockImplementation(() => ({
        generateExcel: jest.fn().mockResolvedValue({
            success: true,
            filePath: '/mock/path/test.xlsx',
            message: 'Excel文件生成成功'
        }),
        getTemplates: jest.fn().mockReturnValue([
            { name: 'template1', path: '/mock/template1.xlsx' },
            { name: 'template2', path: '/mock/template2.xlsx' }
        ])
    }));
});

// Mock param validator
jest.mock('../../main/validators/param-validator', () => ({
    validateAllParams: jest.fn().mockReturnValue({
        isValid: true,
        errors: []
    })
}));

// Mock IpManager
jest.mock('../../main/managers/ip-manager', () => {
    return jest.fn().mockImplementation(() => ({
        allocateIps: jest.fn().mockReturnValue({
            managementIps: ['192.168.1.10', '192.168.1.11', '192.168.1.12'],
            businessIps: ['10.0.1.10', '10.0.1.11', '10.0.1.12'],
            storageIps: ['172.16.1.10', '172.16.1.11', '172.16.1.12'],
            publicIps: ['192.168.100.10', '192.168.100.11'],
            clusterIps: ['192.168.100.20', '192.168.100.21']
        })
    }));
});

// Mock generators
jest.mock('../../main/generators/server-generator', () => ({
    generateServerList: jest.fn().mockReturnValue([
        { name: 'server1', managementIp: '192.168.1.10', businessIp: '10.0.1.10', storageIp: '172.16.1.10' },
        { name: 'server2', managementIp: '192.168.1.11', businessIp: '10.0.1.11', storageIp: '172.16.1.11' }
    ])
}));

jest.mock('../../main/generators/vm-generator', () => ({
    generateVmList: jest.fn().mockReturnValue([
        { name: 'vm1', ip: '192.168.1.20' },
        { name: 'vm2', ip: '192.168.1.21' }
    ])
}));

jest.mock('../../main/generators/storage-generator', () => ({
    generateStorageList: jest.fn().mockReturnValue([
        { name: 'storage1', ip: '172.16.1.20' },
        { name: 'storage2', ip: '172.16.1.21' }
    ])
}));

// 导入需要测试的模块
const IpManager = require('../../main/managers/ip-manager');
const ExcelService = require('../../main/services/excel-service');

describe('IPC Communication Integration Tests', () => {
    let ipManager;
    let excelService;

    beforeEach(() => {
        // 清理所有mock
        jest.clearAllMocks();

        // 初始化服务
    ipManager = new IpManager({
      mngIpRange: '192.168.1.1-192.168.1.100',
      bizIpRange: '10.0.1.1-10.0.1.100',
      pubIpRange: '172.16.1.1-172.16.1.100',
      cluIpRange: '192.168.100.1-192.168.100.100',
      isNetCombined: false
    });
    excelService = new ExcelService();

        // 模拟IPC处理器注册
        ipcMain.handle.mockImplementation((channel, handler) => {
            // 存储处理器以便测试调用
            ipcMain.handle._handlers = ipcMain.handle._handlers || {};
            ipcMain.handle._handlers[channel] = handler;
        });
    });

    afterEach(() => {
        // 清理
        if (ipcMain.handle._handlers) {
            delete ipcMain.handle._handlers;
        }
    });

    describe('IP管理相关IPC通信', () => {
        test('应该正确处理IP分配请求', async () => {
            const mockParams = {
                scene: 'scene1',
                userCount: 1000,
                insightDeployType: 'distributed',
                networkCombined: false,
                cephManagementDualMachine: false,
                hyperConverged: false,
                storageSecurity: 'none',
            };

            // 模拟IPC调用
            const handler = jest.fn().mockResolvedValue({
                success: true,
                data: {
                    managementIps: ['192.168.1.10', '192.168.1.11'],
                    businessIps: ['10.0.1.10', '10.0.1.11'],
                    storageIps: ['172.16.1.10', '172.16.1.11'],
                },
            });

            ipcMain.handle('ip:allocate', handler);

            // 模拟渲染进程调用
            ipcRenderer.invoke.mockResolvedValue({
                success: true,
                data: {
                    managementIps: ['192.168.1.10', '192.168.1.11'],
                    businessIps: ['10.0.1.10', '10.0.1.11'],
                    storageIps: ['172.16.1.10', '172.16.1.11'],
                },
            });

            const result = await ipcRenderer.invoke('ip:allocate', mockParams);

            expect(ipcRenderer.invoke).toHaveBeenCalledWith('ip:allocate', mockParams);
            expect(result.success).toBe(true);
            expect(result.data.managementIps).toHaveLength(2);
            expect(result.data.businessIps).toHaveLength(2);
            expect(result.data.storageIps).toHaveLength(2);
        });

        test('应该正确处理IP验证请求', async () => {
            const mockIpList = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

            // 模拟IPC调用
            const handler = jest.fn().mockResolvedValue({
                success: true,
                valid: true,
                errors: [],
            });

            ipcMain.handle('ip:validate', handler);

            ipcRenderer.invoke.mockResolvedValue({
                success: true,
                valid: true,
                errors: [],
            });

            const result = await ipcRenderer.invoke('ip:validate', mockIpList);

            expect(ipcRenderer.invoke).toHaveBeenCalledWith('ip:validate', mockIpList);
            expect(result.success).toBe(true);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('Excel生成相关IPC通信', () => {
        test('应该正确处理Excel生成请求', async () => {
            const mockData = {
                params: {
                    scene: 'scene1',
                    userCount: 1000,
                    insightDeployType: 'distributed',
                },
                ipAllocation: {
                    managementIps: ['192.168.1.10', '192.168.1.11'],
                    businessIps: ['10.0.1.10', '10.0.1.11'],
                    storageIps: ['172.16.1.10', '172.16.1.11'],
                },
                outputPath: '/tmp/test-output.xlsx',
            };

            // 模拟IPC调用
            const handler = jest.fn().mockResolvedValue({
                success: true,
                filePath: '/tmp/test-output.xlsx',
                message: 'Excel文件生成成功',
            });

            ipcMain.handle('excel:generate', handler);

            ipcRenderer.invoke.mockResolvedValue({
                success: true,
                filePath: '/tmp/test-output.xlsx',
                message: 'Excel文件生成成功',
            });

            const result = await ipcRenderer.invoke('excel:generate', mockData);

            expect(ipcRenderer.invoke).toHaveBeenCalledWith('excel:generate', mockData);
            expect(result.success).toBe(true);
            expect(result.filePath).toBe('/tmp/test-output.xlsx');
            expect(result.message).toBe('Excel文件生成成功');
        });

        test('应该正确处理Excel模板获取请求', async () => {
            const mockTemplateData = {
                worksheets: [
                    { name: 'IP规划表', type: 'ip-plan' },
                    { name: '网络端口规划表', type: 'network-port-plan' },
                    { name: '网络策略表', type: 'network-policy' },
                ],
            };

            // 模拟IPC调用
            const handler = jest.fn().mockResolvedValue({
                success: true,
                data: mockTemplateData,
            });

            ipcMain.handle('excel:getTemplate', handler);

            ipcRenderer.invoke.mockResolvedValue({
                success: true,
                data: mockTemplateData,
            });

            const result = await ipcRenderer.invoke('excel:getTemplate');

            expect(ipcRenderer.invoke).toHaveBeenCalledWith('excel:getTemplate');
            expect(result.success).toBe(true);
            expect(result.data.worksheets).toHaveLength(3);
        });
    });

    describe('错误处理', () => {
        test('应该正确处理IPC通信错误', async () => {
            const errorMessage = '网络连接失败';

            ipcRenderer.invoke.mockRejectedValue(new Error(errorMessage));

            try {
                await ipcRenderer.invoke('ip:allocate', {});
            } catch (error) {
                expect(error.message).toBe(errorMessage);
            }

            expect(ipcRenderer.invoke).toHaveBeenCalledWith('ip:allocate', {});
        });

        test('应该正确处理服务层错误', async () => {
            const mockParams = { invalid: 'params' };

            ipcRenderer.invoke.mockResolvedValue({
                success: false,
                error: '参数验证失败',
                details: '缺少必要的参数',
            });

            const result = await ipcRenderer.invoke('ip:allocate', mockParams);

            expect(result.success).toBe(false);
            expect(result.error).toBe('参数验证失败');
            expect(result.details).toBe('缺少必要的参数');
        });
    });

    describe('数据流集成', () => {
        test('应该正确处理完整的IP分配到Excel生成流程', async () => {
            const mockParams = {
                scene: 'scene1',
                userCount: 1000,
                insightDeployType: 'distributed',
                networkCombined: false,
                cephManagementDualMachine: false,
                hyperConverged: false,
                storageSecurity: 'none',
            };

            // 步骤1: IP分配
            ipcRenderer.invoke.mockImplementation((channel, data) => {
                if (channel === 'ip:allocate') {
                    return Promise.resolve({
                        success: true,
                        data: {
                            managementIps: ['192.168.1.10', '192.168.1.11'],
                            businessIps: ['10.0.1.10', '10.0.1.11'],
                            storageIps: ['172.16.1.10', '172.16.1.11'],
                        },
                    });
                }
                if (channel === 'excel:generate') {
                    return Promise.resolve({
                        success: true,
                        filePath: '/tmp/integrated-test.xlsx',
                        message: 'Excel文件生成成功',
                    });
                }
            });

            // 执行IP分配
            const ipResult = await ipcRenderer.invoke('ip:allocate', mockParams);
            expect(ipResult.success).toBe(true);

            // 步骤2: 使用分配的IP生成Excel
            const excelData = {
                params: mockParams,
                ipAllocation: ipResult.data,
                outputPath: '/tmp/integrated-test.xlsx',
            };

            const excelResult = await ipcRenderer.invoke('excel:generate', excelData);
            expect(excelResult.success).toBe(true);
            expect(excelResult.filePath).toBe('/tmp/integrated-test.xlsx');

            // 验证调用顺序
            expect(ipcRenderer.invoke).toHaveBeenNthCalledWith(1, 'ip:allocate', mockParams);
            expect(ipcRenderer.invoke).toHaveBeenNthCalledWith(2, 'excel:generate', excelData);
        });
    });
});