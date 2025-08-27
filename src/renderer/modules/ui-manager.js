// 默认服务器数量常量
const DEFAULT_SERVER_COUNT = 3;

/**
 * UI管理器
 */
export const UIManager = {
    /**
     * 初始化UI交互
     */
    init() {
        this.bindEvents();
        this.updateArchitectureMode();
        this.updateNetworkMode();
        this.updateExampleNames();
    },

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 架构模式变化
        const fusionSelect = document.getElementById('isFusionNode');
        if (fusionSelect) {
            fusionSelect.addEventListener('change', () => {
                this.updateArchitectureMode();
            });
        }

        // 网络模式变化
        const netSelect = document.getElementById('isNetCombined');
        if (netSelect) {
            netSelect.addEventListener('change', () => {
                this.updateNetworkMode();
            });
        }

        // 绑定前缀输入框事件
        const prefixInputs = ['prefixMng', 'prefixFusion', 'prefixCalc', 'prefixStor', 'prefixCAG'];
        prefixInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    this.updateExampleNames();
                });
            }
        });

        // 绑定标签页点击事件
        const tabLinks = document.querySelectorAll('.tab-link');
        tabLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                this.openTab(event, event.currentTarget.dataset.tab);
            });
        });

        // 绑定网卡绑定模式变化事件
        const bondModeSelects = ['mngBondMode', 'bizBondMode', 'storBondMode'];
        bondModeSelects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.addEventListener('change', () => {
                    this.updateBondingMode();
                });
            }
        });
    },

    /**
     * 更新网卡绑定模式相关的UI
     */
    updateBondingMode() {
        // 在这里可以添加基于绑定模式更新UI的逻辑
        // 例如，如果某种模式需要额外的输入字段，可以在这里控制它们的显示和隐藏
        // 绑定模式已更新
    },

    /**
     * 更新架构模式显示
     */
    updateArchitectureMode() {
        const isFusion = document.getElementById('isFusionNode')?.value === 'true';
        const architectureMode = document.getElementById('architectureMode');

        const setSectionState = (sectionId, statusId, countId, enabled, count) => {
            const section = document.getElementById(sectionId);
            const status = document.getElementById(statusId);
            const countInput = document.getElementById(countId);

            if (section) {
                section.classList.toggle('disabled-section', !enabled);
            }
            if (status) {
                status.value = enabled ? '启用' : '禁用';
                status.style.color = enabled ? '#28a745' : '#dc3545';
            }
            if (countInput) {
                countInput.value = count;
            }
        };

        if (architectureMode) {
            architectureMode.value = isFusion ? '超融合模式' : '分离模式';
            architectureMode.style.color = isFusion ? '#28a745' : '#dc3545';
        }

        setSectionState('fusionServerSection', 'fusionStatus', 'countFusion', isFusion, isFusion ? DEFAULT_SERVER_COUNT : 0);
        setSectionState('computeServerSection', 'calcStatus', 'countCalc', !isFusion, isFusion ? 0 : DEFAULT_SERVER_COUNT);
        setSectionState('storageServerSection', 'storStatus', 'countStor', !isFusion, isFusion ? 0 : DEFAULT_SERVER_COUNT);
    },

    /**
     * 更新网络模式显示
     */
    updateNetworkMode() {
        const isNetCombined = document.getElementById('isNetCombined')?.value === 'true';
        const bizNetworkSection = document.getElementById('bizNetworkSection');
        const networkMode = document.getElementById('networkMode');
        const networkDescription = document.getElementById('networkDescription');

        if (isNetCombined) {
            // 管理业务网合设
            if (bizNetworkSection) {
                bizNetworkSection.style.opacity = '0.5';
                bizNetworkSection.style.pointerEvents = 'none';
            }

            // 清空业务网IP段
            const bizIpRange = document.getElementById('bizIpRange');
            if (bizIpRange) bizIpRange.value = '';

            // 更新显示
            if (networkMode) {
                networkMode.value = '合设模式';
                networkMode.style.color = '#28a745';
            }
            if (networkDescription) {
                networkDescription.value = '管理网和业务网合并部署，共用同一网络';
                networkDescription.style.color = '#28a745';
            }
        } else {
            // 管理业务网分离
            if (bizNetworkSection) {
                bizNetworkSection.style.opacity = '1';
                bizNetworkSection.style.pointerEvents = 'auto';
            }

            // 恢复业务网IP段
            const bizIpRange = document.getElementById('bizIpRange');
            if (bizIpRange && !bizIpRange.value) {
                bizIpRange.value = '192.168.2.10-192.168.2.100';
            }

            // 更新显示
            if (networkMode) {
                networkMode.value = '分离模式';
                networkMode.style.color = '#dc3545';
            }
            if (networkDescription) {
                networkDescription.value = '管理网和业务网分离部署，使用不同网络';
                networkDescription.style.color = '#dc3545';
            }
        }
    },

    /**
     * 更新示例名称显示
     */
    updateExampleNames() {
        const prefixes = {
            mng: document.getElementById('prefixMng')?.value || 'VMC',
            fusion: document.getElementById('prefixFusion')?.value || 'ZXVE',
            calc: document.getElementById('prefixCalc')?.value || 'ZXVE',
            stor: document.getElementById('prefixStor')?.value || 'STOR',
            cag: document.getElementById('prefixCAG')?.value || 'CAG'
        };

        // 更新示例名称
        const examples = {
            mngExampleName: prefixes.mng + '-01',
            fusionExampleName: prefixes.fusion + '-01',
            calcExampleName: prefixes.calc + '-01',
            storExampleName: prefixes.stor + '-01',
            cagExampleName: prefixes.cag + '-01'
        };

        Object.entries(examples).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
    },

    openTab(evt, tabName) {
        const tabcontent = document.getElementsByClassName("tab-content");
        for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        const tablinks = document.getElementsByClassName("tab-link");
        for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.className += " active";
    }
};
