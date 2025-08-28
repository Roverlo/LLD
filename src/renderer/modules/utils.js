/**
 * 工具函数模块
 */
export const Utils = {
    /**
     * 获取表单元素的值
     * @param {string} id - 元素ID
     * @param {string} type - 值类型 ('string', 'number', 'boolean')
     * @param {*} defaultValue - 默认值
     * @returns {*} 元素值
     */
    getFormValue(id, type = 'string', defaultValue = '') {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id '${id}' not found, returning default value:`, defaultValue);
            return defaultValue;
        }

        console.log(`Getting value for element '${id}': '${element.value}' (type: ${type})`);

        switch (type) {
            case 'number':
                const numValue = parseFloat(element.value);
                return isNaN(numValue) ? defaultValue : numValue;
            case 'boolean':
                return element.value === 'true';
            case 'string':
            default:
                return element.value || defaultValue;
        }
    },

    /**
     * 设置表单元素的值
     * @param {string} id - 元素ID
     * @param {*} value - 值
     */
    setFormValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;

            // 如果是select元素，同时更新自定义下拉框的显示
            if (element.tagName === 'SELECT') {
                this.updateCustomSelectDisplay(element);
            }
        }
    },

    /**
     * 更新自定义下拉框的显示
     * @param {HTMLSelectElement} selectElement - 原始select元素
     */
    updateCustomSelectDisplay(selectElement) {
        const wrapper = selectElement.closest('.custom-select-wrapper');
        if (wrapper && wrapper.classList.contains('has-custom')) {
            const selectedDiv = wrapper.querySelector('.select-selected');
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            if (selectedDiv && selectedOption) {
                selectedDiv.textContent = selectedOption.textContent;
                
                // 更新选项列表中的选中状态
                const itemsDiv = wrapper.querySelector('.select-items');
                if (itemsDiv) {
                    itemsDiv.querySelectorAll('div').forEach((div, index) => {
                        div.classList.remove('same-as-selected');
                        if (index === selectElement.selectedIndex) {
                            div.classList.add('same-as-selected');
                        }
                    });
                }
            }
        }
    },

    /**
     * 显示状态消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('success', 'error', 'warning', 'info')
     */
    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
            statusElement.style.display = 'block';

            // 根据消息类型设置不同的显示时间
            const displayTime = type === 'success' ? 10000 : 5000; // 成功消息显示10秒，其他消息显示5秒
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, displayTime);
        }
    },

    /**
     * 格式化持续时间
     * @param {number} ms - 毫秒数
     * @returns {string} 格式化的时间字符串
     */
    formatDuration(ms) {
        if (ms < 1000) {
            return `${ms}ms`;
        } else if (ms < 60000) {
            return `${(ms / 1000).toFixed(1)}s`;
        } else {
            const minutes = Math.floor(ms / 60000);
            const seconds = Math.floor((ms % 60000) / 1000);
            return `${minutes}m ${seconds}s`;
        }
    },

    /**
     * 设置按钮状态
     * @param {boolean} disabled - 是否禁用
     * @param {string} text - 按钮文本
     */
    setButtonState(disabled, text) {
        const submitButton = document.querySelector('button[type="submit"]');
        if (!submitButton) return;

        submitButton.disabled = disabled;
        submitButton.textContent = text;
    },
};