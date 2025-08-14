/**
 * 紫色动态水波荡漾背景特效
 * 模拟湖面被风吹动的柔和波纹效果
 */

function fluid(canvas, options = {}) {
    const ctx = canvas.getContext('2d');

    // 配置参数
    const config = {
        waveSpeed: 0.02, // 波浪速度
        waveAmplitude: 15, // 波浪振幅
        waveFrequency: 0.01, // 波浪频率
        layers: 4, // 波浪层数
        baseColor: [138, 43, 226], // 紫色基调 RGB
        mouseInfluence: 50, // 鼠标影响范围
        mouseStrength: 0.3, // 鼠标影响强度
        ...options,
    };

    let animationId;
    let time = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let ripples = [];

    // 设置canvas尺寸
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // 创建渐变背景
    function createGradient() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, `rgba(${config.baseColor[0]}, ${config.baseColor[1]}, ${config.baseColor[2]}, 0.3)`);
        gradient.addColorStop(
            0.5,
            `rgba(${config.baseColor[0] + 30}, ${config.baseColor[1] + 30}, ${config.baseColor[2] + 40}, 0.4)`
        );
        gradient.addColorStop(
            1,
            `rgba(${config.baseColor[0] - 10}, ${config.baseColor[1] + 10}, ${config.baseColor[2] - 20}, 0.5)`
        );
        return gradient;
    }

    // 计算波浪高度
    function getWaveHeight(x, y, layerIndex) {
        const mouseDistance = Math.sqrt((x - mouseX) ** 2 + (y - mouseY) ** 2);
        const mouseEffect = Math.max(0, 1 - mouseDistance / config.mouseInfluence) * config.mouseStrength;

        const wave1 = Math.sin(x * config.waveFrequency + time + layerIndex) * config.waveAmplitude;
        const wave2 =
            Math.sin(y * config.waveFrequency * 0.7 + time * 1.3 + layerIndex * 0.5) * config.waveAmplitude * 0.6;
        const wave3 =
            Math.sin((x + y) * config.waveFrequency * 0.5 + time * 0.8 + layerIndex * 0.3) * config.waveAmplitude * 0.4;

        return (wave1 + wave2 + wave3) * (1 + mouseEffect);
    }

    // 绘制波浪层
    function drawWaveLayer(layerIndex) {
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;

        for (let x = 0; x < canvas.width; x += 2) {
            for (let y = 0; y < canvas.height; y += 2) {
                const waveHeight = getWaveHeight(x, y, layerIndex);
                const intensity = Math.sin(waveHeight * 0.1 + layerIndex) * 0.5 + 0.5;

                const alpha = (0.6 - layerIndex * 0.08) * intensity;
                const colorShift = layerIndex * 15;

                const r = Math.min(255, config.baseColor[0] + colorShift + waveHeight * 0.8);
                const g = Math.min(255, config.baseColor[1] + colorShift * 0.7 + waveHeight * 0.5);
                const b = Math.min(255, config.baseColor[2] + colorShift * 1.2 + waveHeight * 1.0);

                const index = (y * canvas.width + x) * 4;
                if (index < data.length) {
                    data[index] = r; // Red
                    data[index + 1] = g; // Green
                    data[index + 2] = b; // Blue
                    data[index + 3] = alpha * 255; // Alpha
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // 动画循环
    function animate() {
        // 平滑鼠标移动
        mouseX += (targetMouseX - mouseX) * 0.1;
        mouseY += (targetMouseY - mouseY) * 0.1;

        // 清除画布并设置基础渐变
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = createGradient();
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制多层波浪
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < config.layers; i++) {
            drawWaveLayer(i);
        }
        ctx.globalCompositeOperation = 'source-over';

        time += config.waveSpeed;
        animationId = requestAnimationFrame(animate);
    }

    // 鼠标移动事件
    function handleMouseMove(event) {
        const rect = canvas.getBoundingClientRect();
        targetMouseX = event.clientX - rect.left;
        targetMouseY = event.clientY - rect.top;
    }

    // 触摸事件支持
    function handleTouchMove(event) {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        targetMouseX = touch.clientX - rect.left;
        targetMouseY = touch.clientY - rect.top;
    }

    // 初始化
    function init() {
        resizeCanvas();

        // 设置canvas样式
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';

        // 绑定事件
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('resize', resizeCanvas);

        // 开始动画
        animate();
    }

    // 创建涟漪效果
    function createRipple(x, y) {
        ripples.push({
            x: x || mouseX,
            y: y || mouseY,
            radius: 0,
            maxRadius: config.mouseInfluence,
            alpha: 1,
        });
    }

    // 清理函数
    function destroy() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('resize', resizeCanvas);
        ripples = [];
    }

    // 启动
    init();

    // 返回控制对象
    return {
        destroy,
        createRipple,
    };
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = fluid;
} else {
    window.fluid = fluid;
}
