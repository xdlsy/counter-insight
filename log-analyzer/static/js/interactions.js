// static/js/interactions.js

class Interactions {
    constructor(chartManager) {
        this.chartManager = chartManager;
        this.setupEvents();
    }

    setupEvents() {
        // 框选放大
        this.chartManager.chart.on('brushSelected', function(params) {
            const brushComponent = params.batch[0];
            if (brushComponent && brushComponent.areas.length > 0) {
                // 触发 dataZoom
                const area = brushComponent.areas[0];
                // ECharts 会自动处理框选后的缩放
            }
        });

        // 右键回退 - 修复 this 绑定问题
        const chart = this.chartManager.chart;
        chart.getZr().on('contextmenu', function(params) {
            if (params.target) return;

            // 右键时恢复原始视图
            chart.setOption({
                dataZoom: [
                    { start: 0, end: 100 },
                    { start: 0, end: 100 }
                ]
            });
        });

        // 窗口大小变化时自适应
        window.addEventListener('resize', () => {
            this.chartManager.resize();
        });
    }
}