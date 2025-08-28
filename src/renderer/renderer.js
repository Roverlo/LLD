/**
 * 渲染进程主文件 (重构版)
 */

// --- 模块导入 ---
import { Utils } from './modules/utils.js';

// --- 全局常量 ---
const AppState = {
    isGenerating: false,
    lastParams: null,
};

// ESLint 魔法数字常量
const CONSTANTS = {
    // 时间相关
    STATUS_CLEAR_DELAY: 5000,
    ANIMATION_DELAY: 1000,
    RIPPLE_INTERVAL: 100,
    RIPPLE_LIFETIME: 3000,
    CUSTOM_SELECT_DELAY: 200,
    
    // 用户量阈值
    USER_COUNT_THRESHOLD: 5000,
    
    // OSD预留容量比例
    OSD_RESERVED_RATIO: 0.9,
    
    // 涟漪效果
    MAX_RIPPLES: 8,
    CLICK_RIPPLE_SIZE: 200,
    NORMAL_RIPPLE_SIZE: 120,
    CLICK_RIPPLE_SPEED: 3,
    NORMAL_RIPPLE_SPEED: 2,
    RIPPLE_GRADIENT_STOP: 0.7,
    RIPPLE_OPACITY_FACTOR: 0.6,
    RIPPLE_LINE_WIDTH: 2,
    RIPPLE_INNER_RADIUS_FACTOR: 0.8,
    
    // 虚机默认配置
    DEFAULT_VM_CPU: 4,
    DEFAULT_VM_MEMORY: 8,
    DEFAULT_VM_STORAGE: 200,
    DEFAULT_VM_COUNT: 0,
    
    // ASCII码
    ASCII_A: 65,
    
    // 进制
    DECIMAL_RADIX: 10,
    
    // 存储相关
    DEFAULT_SSD_COUNT: 2,
    DEFAULT_HDD_COUNT: 4,
    
    // 硬件配置
    DEFAULT_CPU_CORES: 32,
    DEFAULT_MEMORY_SIZE: 128,
    DEFAULT_MNG_CPU_CORES: 32,
    DEFAULT_MNG_MEMORY_GB: 128,
    DEFAULT_MON_CPU_CORES: 64,
    DEFAULT_MON_MEMORY_GB: 256,
    DEFAULT_OSD_CPU_CORES: 64,
    DEFAULT_OSD_MEMORY_GB: 256,
    DEFAULT_RGW_CPU_CORES: 32,
    DEFAULT_RGW_MEMORY_GB: 64,
    DEFAULT_MDS_CPU_CORES: 16,
    DEFAULT_MDS_MEMORY_GB: 64,
    
    // 数学常量
    FULL_CIRCLE_RADIANS: 2
};

// --- 应用状态管理 ---
// const AppStateExtended = {
//     validationErrors: []
// };

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

// --- 工具函数 (现在从utils.js模块导入) ---

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
            prefixStor: Utils.getFormValue('prefixStor', 'string', 'STOR'),
            prefixCAG: Utils.getFormValue('prefixCAG', 'string', 'CAG'),

            // 部署配置
            scene: Utils.getFormValue('scene', 'string'),
            isZXOPS: Utils.getFormValue('isZXOPS', 'boolean'),
            userCount: Utils.getFormValue('userCount', 'number', 0),
            insightDeployType: Utils.getFormValue('insightDeployType', 'string'),
            deployTerminalMgmt: Utils.getFormValue('deployTerminalMgmt', 'boolean'),
            deployCAGPortal: Utils.getFormValue('deployCAGPortal', 'string'),
            deployDEM: Utils.getFormValue('deployDEM', 'boolean'),
            downloadType: Utils.getFormValue('downloadType', 'string'),
            storageSecurity: Utils.getFormValue('storageSecurity', 'string'),

            // 管理服务器配置信息
            mngCpuCores: Utils.getFormValue('mngCpuCores', 'number', 32),
            mngMemory: Utils.getFormValue('mngMemory', 'number', 128),
            mngSsdCount: Utils.getFormValue('mngSsdCount', 'number', 2),
            mgmtSsdSpec: Utils.getFormValue('mgmtSsdSpec', 'string', '1.92TB'),
            mgmtOsdReservedSize: Utils.getFormValue('mgmtOsdReservedSize', 'number', 0),
            mngHddCount: Utils.getFormValue('mngHddCount', 'number', 4),
            mgmtHddSpec: Utils.getFormValue('mgmtHddSpec', 'string', '8TB'),

            // 超融合/计算服务器配置信息
            fusionCpuCores: Utils.getFormValue('fusionCpuCores', 'number', 64),
            fusionMemory: Utils.getFormValue('fusionMemory', 'number', 256),
            fusionSsdCount: Utils.getFormValue('fusionSsdCount', 'number', 2),
            fusionSsdSpec: Utils.getFormValue('fusionSsdSpec', 'string', '1.92TB'),
            fusionOsdReservedSize: Utils.getFormValue('fusionOsdReservedSize', 'number', 0),
            fusionHddCount: Utils.getFormValue('fusionHddCount', 'number', 4),
            fusionHddSpec: Utils.getFormValue('fusionHddSpec', 'string', '8TB'),

            // 存储服务器配置信息
            storCpuCores: Utils.getFormValue('storCpuCores', 'number', 32),
            storMemory: Utils.getFormValue('storMemory', 'number', 128),
            storSsdCount: Utils.getFormValue('storSsdCount', 'number', 2),
            storSsdSpec: Utils.getFormValue('storSsdSpec', 'string', '1.92TB'),
            storOsdReservedSize: Utils.getFormValue('storOsdReservedSize', 'number', 0),
            storHddCount: Utils.getFormValue('storHddCount', 'number', 4),
            storHddSpec: Utils.getFormValue('storHddSpec', 'string', '8TB'),

            // IP地址范围
            mngIpRange: Utils.getFormValue('mngIpRange', 'string'),
            bizIpRange: Utils.getFormValue('bizIpRange', 'string'),
            pubIpRange: Utils.getFormValue('pubIpRange', 'string'),
            cluIpRange: Utils.getFormValue('cluIpRange', 'string'),

            // 其他选项
            alignFloatIp: document.querySelector('input[name="alignFloatIp"]:checked')?.value === 'true',

            // 桌面虚机类型配置
            desktopVmTypes: this.collectDesktopVmTypes(),

            // 网卡绑定配置
            mngBondName: Utils.getFormValue('mngBondName', 'string', 'brcomm_bond'),
            mngBondNics: Utils.getFormValue('mngBondNics', 'string', 'enp133s0f0;enp134s0f0'),
            mngBondMode: Utils.getFormValue('mngBondMode', 'string', 'active-backup'),
            bizBondName: Utils.getFormValue('bizBondName', 'string', 'br0'),
            bizBondNics: Utils.getFormValue('bizBondNics', 'string', 'enp133s0f1;enp134s0f1'),
            bizBondMode: Utils.getFormValue('bizBondMode', 'string', 'active-backup'),
            storBondName: Utils.getFormValue('storBondName', 'string', 'CephPublic'),
            storBondNics: Utils.getFormValue('storBondNics', 'string', 'enp3s0;enp4s0'),
            storBondMode: Utils.getFormValue('storBondMode', 'string', 'active-backup'),
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
            const cpu = parseInt(element.querySelector('.vm-cpu').value, CONSTANTS.DECIMAL_RADIX) || 0;
            const memory = parseInt(element.querySelector('.vm-memory').value, CONSTANTS.DECIMAL_RADIX) || 0;
            const storage = parseInt(element.querySelector('.vm-storage').value, CONSTANTS.DECIMAL_RADIX) || 0;
            const count = parseInt(element.querySelector('.vm-count').value, CONSTANTS.DECIMAL_RADIX) || 0;

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
            // 删除了CAG门户与Insight的依赖关系验证，CAG门户现在可以独立部署
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
                condition: params.userCount > CONSTANTS.USER_COUNT_THRESHOLD && params.insightDeployType === '非高可用部署',
                fix: () => {
                    Utils.setFormValue('insightDeployType', '高可用部署');
                    corrected = true;
                },
                message: `用户量 > ${CONSTANTS.USER_COUNT_THRESHOLD} 时，Insight 只能选择"高可用部署"，已帮您修改，请再次点击生成。`,
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
                            const maxReserved = ssdCapacity * CONSTANTS.OSD_RESERVED_RATIO;
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
            return;
        }

        this.setupCanvas();
        this.bindEvents();
        this.startAnimation();
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
        const rippleInterval = CONSTANTS.RIPPLE_INTERVAL; // 涟漪创建间隔

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
        if (this.ripples.length > CONSTANTS.MAX_RIPPLES) {
            this.ripples.shift();
        }

        this.ripples.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: isClick ? CONSTANTS.CLICK_RIPPLE_SIZE : CONSTANTS.NORMAL_RIPPLE_SIZE,
            opacity: 1,
            speed: isClick ? CONSTANTS.CLICK_RIPPLE_SPEED : CONSTANTS.NORMAL_RIPPLE_SPEED,
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
            return ripple.opacity > 0 && now - ripple.createdAt < CONSTANTS.RIPPLE_LIFETIME;
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
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * CONSTANTS.FULL_CIRCLE_RADIANS);

                // 创建渐变效果
                const gradient = ctx.createRadialGradient(
                    ripple.x,
                    ripple.y,
                    ripple.radius * CONSTANTS.RIPPLE_INNER_RADIUS_FACTOR,
                    ripple.x,
                    ripple.y,
                    ripple.radius
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
                gradient.addColorStop(CONSTANTS.RIPPLE_GRADIENT_STOP, `rgba(255, 255, 255, ${ripple.opacity * CONSTANTS.RIPPLE_OPACITY_FACTOR})`);
                gradient.addColorStop(1, `rgba(255, 255, 255, ${ripple.opacity})`);

                ctx.strokeStyle = gradient;
                ctx.lineWidth = CONSTANTS.RIPPLE_LINE_WIDTH;
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
        console.log('App.init() 开始执行');
        
        // 初始化DOM元素
        Elements.init();

        // 初始化自定义下拉框
        this.initCustomSelects();

        // 延迟再次初始化，确保所有元素都被处理
        setTimeout(() => {
            console.log('App.init() setTimeout 回调执行');
            this.initCustomSelects();
            // 在自定义下拉框完全初始化后再执行条件禁用逻辑
            this.initConditionalDisabling();
        }, CONSTANTS.CUSTOM_SELECT_DELAY);

        // 初始化背景效果
        BackgroundEffect.init();

        // 初始化标签页
        this.initTabs();

        // 绑定事件监听器
        this.bindEvents();

        console.log('App.init() 执行完成');
        // 渲染进程应用初始化完成
    },

    /**
     * 初始化标签页
     */
    initTabs() {
        const tabLinks = document.querySelectorAll('.tab-link');
        const tabContents = document.querySelectorAll('.tab-content');

        tabLinks.forEach((link) => {
            link.addEventListener('click', () => {
                const tabId = link.getAttribute('data-tab');

                // 移除所有 active 类
                tabLinks.forEach((l) => l.classList.remove('active'));
                tabContents.forEach((c) => c.classList.remove('active'));

                // 为当前点击的标签和对应内容添加 active 类
                link.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
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

        selectWrappers.forEach((wrapper) => {
            const originalSelect = wrapper.querySelector('select');
            if (!originalSelect) {
                return;
            }

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
            Array.from(originalSelect.options).forEach((option, optionIndex) => {
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
                    originalSelect.selectedIndex = optionIndex;
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

        items.forEach((item, itemIndex) => {
            if (elmnt !== selected[itemIndex]) {
                item.classList.add('select-hide');
                selected[itemIndex].classList.remove('select-arrow-active');
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

    /**
     * 初始化条件禁用逻辑
     */
    initConditionalDisabling() {
        console.log('[DEBUG] initConditionalDisabling called');
        // 监听管理/业务网合设选择变化
        const mngBizMergedSelect = document.getElementById('isNetCombined');
        if (mngBizMergedSelect) {
            mngBizMergedSelect.addEventListener('change', this.handleMngBizMergedChange.bind(this));
            // 初始化时也要检查一次
            this.handleMngBizMergedChange();
        }

        // 监听计算/存储合设选择变化
        const computeStorageMergedSelect = document.getElementById('isFusionNode');
        if (computeStorageMergedSelect) {
            computeStorageMergedSelect.addEventListener('change', this.handleComputeStorageMergedChange.bind(this));
            // 初始化时也要检查一次
            this.handleComputeStorageMergedChange();
        }
    },

    /**
     * 处理管理/业务网合设选择变化
     */
    handleMngBizMergedChange() {
        const mngBizMergedSelect = document.getElementById('isNetCombined');
        const bizNetworkFieldset = document.getElementById('bizNetworkFieldset');
        const bizIpRangeTextarea = document.getElementById('bizIpRange');
        
        if (mngBizMergedSelect) {
            const isMerged = mngBizMergedSelect.value === 'true';
            
            // 禁用或启用业务网绑定区域
            if (bizNetworkFieldset) {
                this.toggleFieldsetDisabled(bizNetworkFieldset, isMerged);
            }
            
            // 禁用或启用业务网IP段输入框
            if (bizIpRangeTextarea) {
                this.applyDisabledStyle(bizIpRangeTextarea, isMerged);
            }
        }
    },

    /**
     * 处理计算/存储合设选择变化
     */
    handleComputeStorageMergedChange() {
        console.log('[DEBUG] handleComputeStorageMergedChange called');
        const computeStorageMergedSelect = document.getElementById('isFusionNode');
        const mngAsFusionSelect = document.getElementById('isMngAsFusion');
        
        console.log('[DEBUG] computeStorageMergedSelect:', computeStorageMergedSelect);
        console.log('[DEBUG] mngAsFusionSelect:', mngAsFusionSelect);
        
        if (computeStorageMergedSelect && mngAsFusionSelect) {
            const isFusionNode = computeStorageMergedSelect.value === 'true';
            const isMngAsFusion = mngAsFusionSelect.value === 'true';
            
            // 当计算/存储合设为"否"时，管理节点也计入超融合默认为"否"且不可修改
            if (!isFusionNode) {
                // 设置为"否"
                mngAsFusionSelect.value = 'false';
                // 更新自定义下拉框显示
                Utils.updateCustomSelectDisplay(mngAsFusionSelect);
                // 禁用选择
                this.applyDisabledStyle(mngAsFusionSelect, true);
            } else {
                // 启用选择
                this.applyDisabledStyle(mngAsFusionSelect, false);
            }
            
            // 禁用或启用存储服务器数量和命名前缀
            const storageServerCountInput = document.getElementById('countStor');
            const storageServerPrefixInput = document.getElementById('prefixStor');
            
            // 管理服务器配置信息中的字段
            const mgmtSsdCountInput = document.getElementById('mngSsdCount');
            const mgmtSsdSpecInput = document.getElementById('mgmtSsdSpec');
            const mgmtOsdInput = document.getElementById('mgmtOsdReservedSize');
            const mgmtHddCountInput = document.getElementById('mngHddCount');
            const mgmtHddSpecInput = document.getElementById('mgmtHddSpec');
            
            // 计算（超融合）服务器配置信息中的字段
            const computeSsdCountInput = document.getElementById('computeSsdCount');
            const computeSsdSpecInput = document.getElementById('computeSsdSpec');
            const computeOsdInput = document.getElementById('computeOsdReservedSize');
            const computeHddCountInput = document.getElementById('computeHddCount');
            const computeHddSpecInput = document.getElementById('computeHddSpec');
            
            // 存储服务器数量和命名前缀的禁用逻辑（当计算/存储合设为"是"时禁用）
            [storageServerCountInput, storageServerPrefixInput].forEach(input => {
                if (input) {
                    this.applyDisabledStyle(input, isFusionNode);
                }
            });
            
            // 管理服务器配置信息字段的禁用逻辑（当两个都为"是"时启用，否则禁用）
            const enableMgmtFields = isFusionNode && isMngAsFusion;
            [mgmtSsdCountInput, mgmtSsdSpecInput, mgmtOsdInput, mgmtHddCountInput, mgmtHddSpecInput].forEach(input => {
                if (input) {
                    this.applyDisabledStyle(input, !enableMgmtFields);
                }
            });
            
            // 计算（超融合）服务器配置信息字段的禁用逻辑（当两个都为"否"时禁用）
            const disableComputeFields = !isFusionNode && !isMngAsFusion;
            [computeSsdCountInput, computeSsdSpecInput, computeOsdInput, computeHddCountInput, computeHddSpecInput].forEach(input => {
                if (input) {
                    this.applyDisabledStyle(input, disableComputeFields);
                }
            });
            
            // 处理存储服务器配置信息fieldset的禁用
            const allFieldsets = document.querySelectorAll('fieldset');
            let storageFieldset = null;
            
            for (const fieldset of allFieldsets) {
                const legend = fieldset.querySelector('legend');
                if (legend && legend.textContent.includes('存储服务器配置信息')) {
                    storageFieldset = fieldset;
                    break;
                }
            }
            
            if (storageFieldset) {
                this.toggleFieldsetDisabled(storageFieldset, isFusionNode);
            }
            
            // 更新调试信息
            const debugDiv = document.getElementById('debug-info');
            if (debugDiv) {
                const now = new Date();
                const timeStr = now.toTimeString().split(' ')[0];
                debugDiv.innerHTML = `
                    <strong>DEBUG: handleComputeStorageMergedChange called at ${timeStr}</strong><br>
                    isFusionNode: ${isFusionNode}<br>
                    isMngAsFusion: ${isMngAsFusion}<br>
                    enableMgmtFields: ${enableMgmtFields}<br>
                    disableComputeFields: ${disableComputeFields}<br>
                    存储服务器配置信息fieldset found: ${storageFieldset ? 'Yes' : 'No'}<br>
                    管理服务器字段状态: mngSsdCount(${mgmtSsdCountInput ? 'found' : 'not found'}), mgmtSsdSpec(${mgmtSsdSpecInput ? 'found' : 'not found'}), mgmtOsd(${mgmtOsdInput ? 'found' : 'not found'}), mngHddCount(${mgmtHddCountInput ? 'found' : 'not found'}), mgmtHddSpec(${mgmtHddSpecInput ? 'found' : 'not found'})<br>
                    计算服务器字段状态: computeSsdCount(${computeSsdCountInput ? 'found' : 'not found'}), computeSsdSpec(${computeSsdSpecInput ? 'found' : 'not found'}), computeOsd(${computeOsdInput ? 'found' : 'not found'}), computeHddCount(${computeHddCountInput ? 'found' : 'not found'}), computeHddSpec(${computeHddSpecInput ? 'found' : 'not found'})
                `;
            }
        }
    },
    
    /**
     * 应用统一的禁用样式
     * @param {HTMLElement} input - 输入元素
     * @param {boolean} disabled - 是否禁用
     */
    applyDisabledStyle(input, disabled) {
        if (!input) return;
        
        input.disabled = disabled;
        
        // 特殊处理select元素的自定义下拉框
        if (input.tagName === 'SELECT') {
            const wrapper = input.closest('.custom-select-wrapper');
            if (wrapper) {
                const customSelect = wrapper.querySelector('.custom-select');
                const selectedDiv = wrapper.querySelector('.select-selected');
                
                if (disabled) {
                    // 禁用自定义下拉框
                    if (customSelect) {
                        customSelect.style.opacity = '0.6';
                        customSelect.style.pointerEvents = 'none';
                        customSelect.style.cursor = 'not-allowed';
                    }
                    if (selectedDiv) {
                        selectedDiv.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(155, 89, 182, 0.2))';
                        selectedDiv.style.borderColor = 'rgba(155, 89, 182, 0.4)';
                        selectedDiv.style.color = 'rgba(224, 224, 224, 0.4)';
                        selectedDiv.style.cursor = 'not-allowed';
                    }
                } else {
                    // 启用自定义下拉框
                    if (customSelect) {
                        customSelect.style.opacity = '';
                        customSelect.style.pointerEvents = '';
                        customSelect.style.cursor = '';
                    }
                    if (selectedDiv) {
                        selectedDiv.style.background = '';
                        selectedDiv.style.borderColor = '';
                        selectedDiv.style.color = '';
                        selectedDiv.style.cursor = '';
                    }
                }
            }
            return;
        }
        
        // 处理其他类型的输入元素
        if (disabled) {
            // 保存原始值和占位符
            if (!input.dataset.originalValue) {
                input.dataset.originalValue = input.value || '';
                input.dataset.originalPlaceholder = input.placeholder || '';
            }
            
            // 设置统一的禁用样式 - 使用渐变紫色背景但更暗，与整体风格协调
            input.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(155, 89, 182, 0.2))';
            input.style.borderColor = 'rgba(155, 89, 182, 0.4)';
            input.style.color = 'rgba(224, 224, 224, 0.4)';
            input.style.cursor = 'not-allowed';
            input.value = '';
            input.placeholder = '已禁填';
        } else {
            // 恢复原始样式
            input.style.background = '';
            input.style.borderColor = '';
            input.style.color = '';
            input.style.cursor = '';
            if (input.dataset.originalValue !== undefined) {
                input.value = input.dataset.originalValue;
                input.placeholder = input.dataset.originalPlaceholder;
                delete input.dataset.originalValue;
                delete input.dataset.originalPlaceholder;
            }
        }
    },

    /**
     * 切换fieldset的禁用状态
     * @param {HTMLElement} fieldset - 要切换的fieldset元素
     * @param {boolean} disabled - 是否禁用
     */
    toggleFieldsetDisabled(fieldset, disabled) {
        if (!fieldset) return;
        
        // 获取fieldset内的所有输入元素
        const inputs = fieldset.querySelectorAll('input, select, textarea');
        
        // 使用统一的禁用样式方法
        inputs.forEach(input => {
            this.applyDisabledStyle(input, disabled);
        });
        
        // 更新fieldset的视觉样式
        if (disabled) {
            fieldset.style.opacity = '0.6';
            fieldset.style.pointerEvents = 'none';
        } else {
            fieldset.style.opacity = '';
            fieldset.style.pointerEvents = '';
        }
    },
};

// --- 桌面虚机类型管理 ---
const DesktopVmManager = {
    nextTypeIndex: 2, // 下一个类型索引 (C, D, E...)

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
        const typeChar = String.fromCharCode(CONSTANTS.ASCII_A + this.nextTypeIndex); // A=65, D=68, E=69...

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
                    <input type="number" class="vm-cpu" min="1" value="${CONSTANTS.DEFAULT_VM_CPU}" />
                </div>
                <div class="vm-spec-row">
                    <label>内存(GB):</label>
                    <input type="number" class="vm-memory" min="1" value="${CONSTANTS.DEFAULT_VM_MEMORY}" />
                </div>
                <div class="vm-spec-row">
                    <label>存储(GB):</label>
                    <input type="number" class="vm-storage" min="1" value="${CONSTANTS.DEFAULT_VM_STORAGE}" />
                </div>
                <div class="vm-spec-row">
                    <label>数量:</label>
                    <input type="number" class="vm-count" min="0" value="${CONSTANTS.DEFAULT_VM_COUNT}" />
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
            const newType = String.fromCharCode(CONSTANTS.ASCII_A + currentIndex); // A=65, B=66, C=67...

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

        // 同步更新用户量输入框
        const userCountInput = document.getElementById('userCount');
        if (userCountInput) {
            userCountInput.value = total;
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
console.log('renderer.js文件开始加载...');
// 通过electronAPI向主进程发送日志
if (window.electronAPI) {
    console.log('electronAPI可用，向主进程发送日志');
} else {
    console.log('electronAPI不可用');
}
console.log('renderer.js 文件已加载');

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded 事件触发');
    App.init();
    DesktopVmManager.init();
});
