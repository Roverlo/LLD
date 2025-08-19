const { workerData, parentPort } = require('worker_threads');
const { generatePlan } = require('./generator.js');

try {
    const plan = generatePlan(workerData);
    
    // 检查plan是否包含错误信息
    if (plan.error) {
        parentPort.postMessage({ success: false, error: plan.error, code: plan.code });
    } else {
        parentPort.postMessage({ success: true, plan });
    }
} catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
}
