/**
 * 渲染进程主文件 (重构版)
 */

// --- 应用状态管理 ---
const AppState = {
    isGenerating: false,
    lastParams: null,
    validationErrors: [],
};

// --- DOM元素缓存 ---
const Elements = {
    form: null,
    statusDiv: null,
    submitButton: null,
    canvas: null,

    // 初始化DOM元素引用
    init() {
        this.form = document.getElementById('params-form');
        this.statusDiv = document.getElementById('status');
        this.submitButton = document.querySelector('button[type="submit"]');
        this.canvas = document.querySelector('canvas');
    },
};

// --- 工具函数 ---
const Utils = {
    /**
     * 获取表单元素的值
     * @param {string} id - 元素ID
     * @param {string} type - 值类型 ('string', 'number', 'boolean')
     * @param {*} defaultValue - 默认值
     * @returns {*} 元素值
     */
    getFormValue(id, type = 'string', defaultValue = '') {
        const element = document.getElementById(id);
        if (!element) return defaultValue;

        switch (type) {
            case 'number':
                return parseFloat(element.value) || defaultValue;
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
            const customSelect = wrapper.querySelector('.custom-select');
            const selectedDiv = customSelect?.querySelector('.select-selected');

            if (selectedDiv) {
                // 更新显示的文本
                const selectedOption = selectElement.options[selectElement.selectedIndex];
                selectedDiv.textContent = selectedOption ? selectedOption.text : '';

                // 更新选项的选中状态
                const items = customSelect.querySelectorAll('.select-items div');
                items.forEach((item, index) => {
                    item.classList.remove('same-as-selected');
                    if (index === selectElement.selectedIndex) {
                        item.classList.add('same-as-selected');
                    }
                });
            }
        }
    },

    /**
     * 显示状态消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('info', 'success', 'warning', 'error')
     */
    showStatus(message, type = 'info') {
        if (!Elements.statusDiv) {
            console.error('状态元素未找到');
            return;
        }

        Elements.statusDiv.textContent = message;
        Elements.statusDiv.className = `status ${type}`;

        // 确保元素可见
        Elements.statusDiv.style.display = 'block';

        // 成功消息持续显示，不自动清除
        // 只有信息消息（如"正在生成中..."）才自动清除
        if (type === 'info') {
            setTimeout(() => {
                // 只有当前还是info状态时才清除（避免覆盖后续的成功/错误消息）
                if (Elements.statusDiv.className.includes('info')) {
                    Elements.statusDiv.textContent = '';
                    Elements.statusDiv.className = 'status';
                    Elements.statusDiv.style.display = 'none';
                }
            }, 5000);
        }
        // success、warning、error 消息持续显示，直到下次更新
    },

    /**
     * 设置按钮状态
     * @param {boolean} disabled - 是否禁用
     * @param {string} text - 按钮文本
     */
    setButtonState(disabled, text) {
        if (!Elements.submitButton) return;

        Elements.submitButton.disabled = disabled;
        Elements.submitButton.textContent = text;
    },

    /**
     * 格式化时间
     * @param {number} ms - 毫秒数
     * @returns {string} 格式化后的时间
     */
    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    },
};

// --- 参数收集器 ---
const ParamCollector = {
    /**
     * 收集所有表单参数
     * @returns {Object} 参数对象
     */
    collect() {
        const isFusion = Utils.getFormValue('isFusionNode', 'boolean');
        const fusionOrCalcCount = Utils.getFormValue('countFusion', 'number', 0);

        return {
            // 基础配置
            isNetCombined: Utils.getFormValue('isNetCombined', 'boolean'),
            isDualNode: Utils.getFormValue('isDualNode', 'boolean'),
            isCephDual: Utils.getFormValue('isCephDual', 'boolean'),
            isFusionNode: isFusion,
            isMngAsFusion: Utils.getFormValue('isMngAsFusion', 'boolean'),

            // 服务器数量
            countMng: Utils.getFormValue('countMng', 'number', 0),
            countFusion: isFusion ? fusionOrCalcCount : 0,
            countCalc: isFusion ? 0 : fusionOrCalcCount,
            countStor: Utils.getFormValue('countStor', 'number', 0),
            countCAG: Utils.getFormValue('countCAG', 'number', 0),

            // 服务器前缀
            prefixMng: Utils.getFormValue('prefixMng', 'string', 'VMC'),
            prefixFusion: Utils.getFormValue('prefixFusion', 'string', 'ZXVE'),
            prefixStor: Utils.getFormValue('prefixStor', 'string', 'STG'),
            prefixCAG: Utils.getFormValue('prefixCAG', 'string', 'CAG'),

            // 部署配置
            scene: Utils.getFormValue('scene', 'string'),
            isZXOPS: Utils.getFormValue('isZXOPS', 'boolean'),
            userCount: Utils.getFormValue('userCount', 'number', 0),
            insightDeployType: Utils.getFormValue('insightDeployType', 'string'),
            deployTerminalMgmt: Utils.getFormValue('deployTerminalMgmt', 'boolean'),
            deployCAGPortal: Utils.getFormValue('deployCAGPortal', 'boolean'),
            deployDEM: Utils.getFormValue('deployDEM', 'boolean'),
            downloadType: Utils.getFormValue('downloadType', 'string'),
            storageSecurity: Utils.getFormValue('storageSecurity', 'string'),

            // 服务器配置信息
            ssdCount: Utils.getFormValue('ssdCount', 'number', 2),
            ssdSpec: Utils.getFormValue('ssdSpec', 'string', '1.92TB'),
            osdReservedSize: Utils.getFormValue('osdReservedSize', 'number', 0),
            hddCount: Utils.getFormValue('hddCount', 'number', 4),
            hddSpec: Utils.getFormValue('hddSpec', 'string', '8TB'),
            cpuCores: Utils.getFormValue('cpuCores', 'number', 32),
            memorySize: Utils.getFormValue('memorySize', 'number', 128),

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

// --- 参数验证器 ---
const ParamValidator = {
    /**
     * 验证参数并自动修正
     * @param {Object} params - 参数对象
     * @returns {Object} 验证结果 { isValid: boolean, errors: string[], corrected: boolean }
     */
    validate(params) {
        const errors = [];
        let corrected = false;

        // 验证规则定义
        const validationRules = [
            {
                condition: params.insightDeployType === '否' && params.deployTerminalMgmt,
                fix: () => {
                    Utils.setFormValue('deployTerminalMgmt', 'false');
                    corrected = true;
                },
                message: '只提供终端网管与insight合设的规划，已帮您修改"部署终端网管"选项为"否"，请再次点击生成。',
            },
            {
                condition: params.insightDeployType === '否' && params.deployCAGPortal,
                fix: () => {
                    Utils.setFormValue('deployCAGPortal', 'false');
                    corrected = true;
                },
                message: '只提供CAG门户与insight合设的规划，已帮您修改"部署CAG门户"选项为"否"，请再次点击生成。',
            },
            {
                condition: !params.isNetCombined && params.scene === '管理网和业务网合一场景',
                fix: () => {
                    // 不自动修改，让用户重新选择
                    corrected = false;
                },
                message: '管理业务网不合设时，微服务场景不能选择"管理网和业务网合一场景"，请重新选择',
            },
            {
                condition: params.isNetCombined && params.scene !== '管理网和业务网合一场景',
                fix: () => {
                    Utils.setFormValue('scene', '管理网和业务网合一场景');
                    corrected = true;
                },
                message: '管理业务网合设时，场景只能选择"管理网和业务网合一场景"，已帮您修改，请再次点击生成。',
            },
            {
                condition: params.isCephDual && !params.isDualNode,
                fix: () => {
                    Utils.setFormValue('isCephDual', 'false');
                    corrected = true;
                },
                message: 'Ceph管理双机需先启用管理节点双机，已帮您修改"Ceph管理双机"选项为"否"，请再次点击生成。',
            },
            {
                condition: params.userCount > 5000 && params.insightDeployType === '非高可用部署',
                fix: () => {
                    Utils.setFormValue('insightDeployType', '高可用部署');
                    corrected = true;
                },
                message: '用户量 > 5000 时，Insight 只能选择"高可用部署"，已帮您修改，请再次点击生成。',
            },
            {
                condition: !params.isFusionNode && params.isMngAsFusion,
                fix: () => {
                    Utils.setFormValue('isMngAsFusion', 'false');
                    corrected = true;
                },
                message: '计算与存储节点分离时，管理节点不能作为超融合节点，已帮您修改，请再次点击生成。',
            },
            {
                condition: (() => {
                    // 检查OSD预留大小是否超过SSD盘容量的90%
                    if (params.osdReservedSize > 0) {
                        // 解析SSD规格，提取数字部分
                        const ssdSpecMatch = params.ssdSpec.match(/(\d+\.?\d*)/);
                        if (ssdSpecMatch) {
                            const ssdCapacity = parseFloat(ssdSpecMatch[1]);
                            const maxReserved = ssdCapacity * 0.9;
                            return params.osdReservedSize > maxReserved;
                        }
                    }
                    return false;
                })(),
                fix: () => {
                    // 不自动修改，让用户手动调整
                    corrected = false;
                },
                message: 'OSD预留容量不能超过SSD盘容量的90%，请调整OSD预留大小。',
            },
        ];

        // 执行验证
        for (const rule of validationRules) {
            if (rule.condition) {
                rule.fix();
                errors.push(rule.message);
                break; // 一次只处理一个错误
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            corrected,
        };
    },
};

// --- Excel生成器 ---
const ExcelGenerator = {
    /**
     * 生成Excel文件
     * @param {Object} params - 参数对象
     * @returns {Promise<Object>} 生成结果
     */
    async generate(params) {
        try {
            AppState.isGenerating = true;
            AppState.lastParams = params;

            Utils.setButtonState(true, '生成中...');
            Utils.showStatus('正在生成Excel文件，请稍候...', 'info');

            const result = await window.electronAPI.generateExcel(params);

            if (result.success) {
                Utils.showStatus(`文件生成成功！保存位置：${result.filePath}`, 'success');
            } else {
                Utils.showStatus(`生成失败：${result.error}`, 'error');
            }

            return result;
        } catch (error) {
            Utils.showStatus(`生成失败：${error.message}`, 'error');
            return { success: false, error: error.message };
        } finally {
            AppState.isGenerating = false;
            Utils.setButtonState(false, '生成Excel文件');
        }
    },
};

// --- 背景效果初始化 ---
const BackgroundEffect = {
    ripples: [],
    animationId: null,

    /**
     * 初始化动态背景
     */
    init() {
        if (!Elements.canvas) {
            // eslint-disable-next-line no-console
            console.warn('Canvas element not found for ripple effect.');
            return;
        }

        this.setupCanvas();
        this.bindEvents();
        this.startAnimation();

        // eslint-disable-next-line no-console
        console.log('白圈涟漪特效已初始化');
    },

    /**
     * 设置canvas
     */
    setupCanvas() {
        Elements.canvas.width = window.innerWidth;
        Elements.canvas.height = window.innerHeight;

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            Elements.canvas.width = window.innerWidth;
            Elements.canvas.height = window.innerHeight;
        });
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        let lastRippleTime = 0;
        const rippleInterval = 100; // 涟漪创建间隔

        // 鼠标移动事件
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastRippleTime > rippleInterval) {
                this.createRipple(e.clientX, e.clientY);
                lastRippleTime = now;
            }
        });

        // 点击事件 - 创建更大的涟漪
        document.addEventListener('click', (e) => {
            this.createRipple(e.clientX, e.clientY, true);
        });
    },

    /**
     * 创建涟漪
     */
    createRipple(x, y, isClick = false) {
        // 限制涟漪数量
        if (this.ripples.length > 8) {
            this.ripples.shift();
        }

        this.ripples.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: isClick ? 200 : 120,
            opacity: 1,
            speed: isClick ? 3 : 2,
            createdAt: Date.now(),
        });
    },

    /**
     * 更新涟漪
     */
    updateRipples() {
        const now = Date.now();
        this.ripples = this.ripples.filter((ripple) => {
            ripple.radius += ripple.speed;
            ripple.opacity = Math.max(0, 1 - ripple.radius / ripple.maxRadius);

            // 移除完全透明或过期的涟漪
            return ripple.opacity > 0 && now - ripple.createdAt < 3000;
        });
    },

    /**
     * 绘制涟漪
     */
    drawRipples() {
        const ctx = Elements.canvas.getContext('2d');
        ctx.clearRect(0, 0, Elements.canvas.width, Elements.canvas.height);

        this.ripples.forEach((ripple) => {
            if (ripple.radius > 0 && ripple.opacity > 0) {
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);

                // 创建渐变效果
                const gradient = ctx.createRadialGradient(
                    ripple.x,
                    ripple.y,
                    ripple.radius * 0.8,
                    ripple.x,
                    ripple.y,
                    ripple.radius
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
                gradient.addColorStop(0.7, `rgba(255, 255, 255, ${ripple.opacity * 0.6})`);
                gradient.addColorStop(1, `rgba(255, 255, 255, ${ripple.opacity})`);

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    },

    /**
     * 动画循环
     */
    animate() {
        this.updateRipples();
        this.drawRipples();
        this.animationId = requestAnimationFrame(() => this.animate());
    },

    /**
     * 开始动画
     */
    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animate();
    },

    /**
     * 停止动画
     */
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },
};

// --- 主应用初始化 ---
const App = {
    /**
     * 初始化应用
     */
    init() {
        // 初始化DOM元素
        Elements.init();

        // 初始化自定义下拉框
        this.initCustomSelects();

        // 延迟再次初始化，确保所有元素都被处理
        setTimeout(() => {
            this.initCustomSelects();
        }, 200);

        // 初始化背景效果
        BackgroundEffect.init();

        // 绑定事件监听器
        this.bindEvents();

        // eslint-disable-next-line no-console
        console.log('渲染进程应用初始化完成');
    },

    /**
     * 初始化自定义下拉框
     */
    initCustomSelects() {
        // 强制清理所有现有的自定义下拉框
        document.querySelectorAll('.custom-select').forEach((el) => el.remove());
        document.querySelectorAll('.custom-select-wrapper').forEach((wrapper) => {
            wrapper.classList.remove('has-custom');
        });

        const selectWrappers = document.querySelectorAll('.custom-select-wrapper');
        console.log('初始化下拉框数量:', selectWrappers.length);

        selectWrappers.forEach((wrapper, index) => {
            const originalSelect = wrapper.querySelector('select');
            if (!originalSelect) {
                console.log('下拉框', index + 1, '没有找到select元素');
                return;
            }

            console.log('处理下拉框', index + 1, ':', originalSelect.id);

            // 创建自定义下拉框容器
            const customSelect = document.createElement('div');
            customSelect.className = 'custom-select';

            // 创建显示选中项的元素
            const selectedDiv = document.createElement('div');
            selectedDiv.className = 'select-selected';
            selectedDiv.textContent = originalSelect.options[originalSelect.selectedIndex].text;
            selectedDiv.tabIndex = 0; // 使元素可以接收焦点
            selectedDiv.setAttribute('role', 'combobox'); // 无障碍支持
            selectedDiv.setAttribute('aria-expanded', 'false');

            // 创建选项列表容器
            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'select-items select-hide';

            // 为每个选项创建div
            Array.from(originalSelect.options).forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.textContent = option.text;
                optionDiv.dataset.value = option.value;

                if (option.selected) {
                    optionDiv.className = 'same-as-selected';
                }

                // 点击选项时的处理
                optionDiv.addEventListener('click', (e) => {
                    e.stopPropagation();

                    // 更新原始select的值
                    originalSelect.selectedIndex = index;
                    originalSelect.dispatchEvent(new Event('change'));

                    // 更新显示文本
                    selectedDiv.textContent = option.text;

                    // 更新选中状态
                    itemsDiv.querySelectorAll('div').forEach((div) => {
                        div.classList.remove('same-as-selected');
                    });
                    optionDiv.classList.add('same-as-selected');

                    // 关闭下拉列表
                    itemsDiv.classList.add('select-hide');
                    selectedDiv.classList.remove('select-arrow-active');
                });

                itemsDiv.appendChild(optionDiv);
            });

            // 点击选中项时切换下拉列表
            selectedDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeAllSelect(selectedDiv);
                itemsDiv.classList.toggle('select-hide');
                selectedDiv.classList.toggle('select-arrow-active');
                selectedDiv.setAttribute('aria-expanded', selectedDiv.classList.contains('select-arrow-active'));
            });

            // 键盘事件支持 - 让select也能发光
            selectedDiv.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectedDiv.click();
                } else if (e.key === 'Escape') {
                    this.closeAllSelect();
                }
            });

            customSelect.appendChild(selectedDiv);
            customSelect.appendChild(itemsDiv);
            wrapper.appendChild(customSelect);

            // 标记为已有自定义下拉框
            wrapper.classList.add('has-custom');
        });

        // 点击其他地方时关闭所有下拉列表
        document.addEventListener('click', () => {
            this.closeAllSelect();
        });

        // 窗口大小变化时重新调整下拉框
        window.addEventListener('resize', () => {
            this.adjustSelectPositions();
        });
    },

    /**
     * 关闭所有下拉列表
     */
    closeAllSelect(elmnt) {
        const items = document.querySelectorAll('.select-items');
        const selected = document.querySelectorAll('.select-selected');

        items.forEach((item, index) => {
            if (elmnt !== selected[index]) {
                item.classList.add('select-hide');
                selected[index].classList.remove('select-arrow-active');
            }
        });
    },

    /**
     * 调整下拉框位置（响应窗口大小变化）
     */
    adjustSelectPositions() {
        const selectItems = document.querySelectorAll('.select-items');
        selectItems.forEach((item) => {
            if (!item.classList.contains('select-hide')) {
                // 如果下拉框是打开的，重新计算位置
                const parent = item.parentElement;
                const selected = parent.querySelector('.select-selected');
                if (selected) {
                    const rect = selected.getBoundingClientRect();
                    const viewportHeight = window.innerHeight;

                    // 检查是否有足够空间在下方显示
                    if (rect.bottom + item.offsetHeight > viewportHeight) {
                        // 空间不够，显示在上方
                        item.style.top = 'auto';
                        item.style.bottom = '100%';
                        item.style.borderTop = '1px solid var(--border-color)';
                        item.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)';
                        item.style.borderRadius = '4px 4px 0 0';
                    } else {
                        // 显示在下方（默认）
                        item.style.top = '100%';
                        item.style.bottom = 'auto';
                        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.3)';
                        item.style.borderBottom = 'none';
                        item.style.borderRadius = '0 0 4px 4px';
                    }
                }
            }
        });
    },

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 表单提交事件
        if (Elements.form) {
            Elements.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // 键盘快捷键
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                if (!AppState.isGenerating) {
                    Elements.form?.requestSubmit();
                }
            }
        });
    },

    /**
     * 处理表单提交
     * @param {Event} event - 提交事件
     */
    async handleFormSubmit(event) {
        event.preventDefault();

        if (AppState.isGenerating) {
            Utils.showStatus('正在生成中，请稍候...', 'warning');
            return;
        }

        // 收集参数
        const params = ParamCollector.collect();

        // 验证参数
        const validation = ParamValidator.validate(params);

        if (!validation.isValid) {
            // 显示第一个错误
            Utils.showStatus(validation.errors[0], 'warning');
            return;
        }

        // 生成Excel文件
        await ExcelGenerator.generate(params);
    },
};

// --- 桌面虚机类型管理 ---
const DesktopVmManager = {
    nextTypeIndex: 3, // 下一个类型索引 (D, E, F...)

    /**
     * 初始化桌面虚机类型管理
     */
    init() {
        this.bindEvents();
        this.updateTotalCount();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 添加虚机类型按钮
        const addBtn = document.getElementById('addVmType');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addVmType());
        }

        // 监听数量变化
        document.addEventListener('input', (event) => {
            if (event.target.classList.contains('vm-count')) {
                this.updateTotalCount();
            }
        });

        // 初始化删除按钮（为现有的类型添加删除功能，除了A、B、C）
        this.addRemoveButtons();
    },

    /**
     * 添加新的虚机类型
     */
    addVmType() {
        const container = document.getElementById('desktopVmTypes');
        const typeChar = String.fromCharCode(65 + this.nextTypeIndex); // A=65, D=68, E=69...

        const vmTypeDiv = document.createElement('div');
        vmTypeDiv.className = 'desktop-vm-type';
        vmTypeDiv.dataset.type = typeChar;

        vmTypeDiv.innerHTML = `
            <div class="vm-type-title">
                <label>桌面虚机类型${typeChar}:</label>
            </div>
            <div class="vm-spec-grid">
                <div class="vm-spec-row">
                    <label>CPU核数:</label>
                    <input type="number" class="vm-cpu" min="1" value="4" />
                </div>
                <div class="vm-spec-row">
                    <label>内存(GB):</label>
                    <input type="number" class="vm-memory" min="1" value="8" />
                </div>
                <div class="vm-spec-row">
                    <label>存储(GB):</label>
                    <input type="number" class="vm-storage" min="1" value="200" />
                </div>
                <div class="vm-spec-row">
                    <label>数量:</label>
                    <input type="number" class="vm-count" min="0" value="0" />
                </div>
            </div>
            <small class="form-hint">CPU核数、内存大小、存储大小和虚机数量 <button type="button" class="remove-vm-type-btn" onclick="DesktopVmManager.removeVmType('${typeChar}')">删除</button></small>
        `;

        container.appendChild(vmTypeDiv);
        this.nextTypeIndex++;

        // 绑定新添加元素的事件
        const countInput = vmTypeDiv.querySelector('.vm-count');
        countInput.addEventListener('input', () => this.updateTotalCount());

        // 绑定删除按钮事件
        const removeBtn = vmTypeDiv.querySelector('.remove-vm-type-btn');
        if (removeBtn) {
            removeBtn.onclick = (e) => {
                e.preventDefault();
                this.removeVmType(typeChar);
            };
        }

        this.updateTotalCount();
    },

    /**
     * 删除虚机类型
     * @param {string} type - 虚机类型
     */
    removeVmType(type) {
        // 只保留A类型不能删除，B、C类型现在可以删除
        if (type === 'A') {
            alert('虚机类型A不能删除');
            return;
        }

        const vmTypeElement = document.querySelector(`[data-type="${type}"]`);
        if (vmTypeElement) {
            vmTypeElement.remove();
            this.updateTotalCount();

            // 删除后重新命名所有虚机类型
            this.renameVmTypes();
        }
    },

    /**
     * 重新命名虚机类型，确保连续性（A, B, C, D...）
     */
    renameVmTypes() {
        const vmTypes = document.querySelectorAll('.desktop-vm-type');
        let currentIndex = 0;

        vmTypes.forEach((vmType) => {
            const currentType = vmType.dataset.type;
            const newType = String.fromCharCode(65 + currentIndex); // A=65, B=66, C=67...

            if (currentType !== newType) {
                // 更新data-type属性
                vmType.dataset.type = newType;

                // 更新标题
                const titleLabel = vmType.querySelector('.vm-type-title label');
                if (titleLabel) {
                    titleLabel.textContent = `桌面虚机类型${newType}:`;
                }

                // 更新删除按钮的onclick事件
                const removeBtn = vmType.querySelector('.remove-vm-type-btn');
                if (removeBtn) {
                    removeBtn.onclick = (e) => {
                        e.preventDefault();
                        this.removeVmType(newType);
                    };
                }
            }

            currentIndex++;
        });

        // 更新下一个类型索引
        this.nextTypeIndex = currentIndex;
    },

    /**
     * 为现有类型添加删除按钮（除了A）
     */
    addRemoveButtons() {
        // 这个函数现在主要用于确保删除按钮的事件绑定正确
        // HTML中已经有删除按钮，我们只需要确保事件处理正确
        const removeButtons = document.querySelectorAll('.remove-vm-type-btn');
        removeButtons.forEach((btn) => {
            // 重新绑定事件，确保使用正确的this上下文
            const vmType = btn.closest('.desktop-vm-type');
            if (vmType) {
                const type = vmType.dataset.type;
                btn.onclick = (e) => {
                    e.preventDefault();
                    this.removeVmType(type);
                };
            }
        });
    },

    /**
     * 更新总数量显示
     */
    updateTotalCount() {
        const countInputs = document.querySelectorAll('.vm-count');
        let total = 0;

        countInputs.forEach((input) => {
            const count = parseInt(input.value, 10) || 0;
            total += count;
        });

        const totalElement = document.getElementById('totalVmCount');
        if (totalElement) {
            totalElement.textContent = total;
        }

        return total;
    },

    /**
     * 获取总虚机数量
     * @returns {number} 总数量
     */
    getTotalCount() {
        return this.updateTotalCount();
    },
};

// 将DesktopVmManager暴露为全局对象，供HTML onclick使用
window.DesktopVmManager = DesktopVmManager;

// --- 应用启动 ---
window.addEventListener('DOMContentLoaded', () => {
    App.init();
    DesktopVmManager.init();
});
