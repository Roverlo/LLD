/**
 * 预加载脚本 - 安全的IPC通信桥梁
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 生成Excel文件
    generateExcel: (params) => ipcRenderer.invoke('generate-excel', params),

    // 获取应用信息
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),

    // 打开日志文件
    openLogFile: () => ipcRenderer.invoke('open-log-file'),
});
