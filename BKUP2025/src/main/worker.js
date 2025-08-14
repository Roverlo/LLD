const { workerData, parentPort } = require('worker_threads');
const { generatePlan } = require('./generator.js');

try {
    const plan = generatePlan(workerData);
    parentPort.postMessage({ success: true, plan });
} catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
}
