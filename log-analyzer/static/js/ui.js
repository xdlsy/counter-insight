// static/js/ui.js

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const status = document.getElementById('status');
    const filters = document.getElementById('filters');
    const instanceSelect = document.getElementById('instanceSelect');
    const metricSelect = document.getElementById('metricSelect');
    const updateChartBtn = document.getElementById('updateChartBtn');

    let sessionId = null;
    let dataProcessor = null;
    let chartManager = null;
    let interactions = null;

    uploadBtn.addEventListener('click', async function() {
        const files = fileInput.files;
        if (!files || files.length === 0) {
            status.textContent = '请选择文件';
            return;
        }

        status.textContent = '上传中...';

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i]);
        }

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.error) {
                status.textContent = '错误: ' + result.error;
                return;
            }

            sessionId = result.session_id;
            status.textContent = '处理中...';

            // 调用处理接口
            const processResponse = await fetch('/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: session_id,
                    files: result.files
                })
            });

            const processResult = await processResponse.json();

            if (processResult.error) {
                status.textContent = '错误: ' + processResult.error;
                return;
            }

            // 初始化数据处理器
            dataProcessor = new DataProcessor();
            dataProcessor.setData(processResult.csv_data);

            // 填充筛选器
            const instances = dataProcessor.getInstances();
            const metrics = dataProcessor.getMetrics();

            instanceSelect.innerHTML = '';
            metricsSelect.innerHTML = '';

            instances.forEach(inst => {
                const option = document.createElement('option');
                option.value = inst;
                option.textContent = inst;
                instanceSelect.appendChild(option);
            });

            metrics.forEach(metric => {
                const option = document.createElement('option');
                option.value = metric;
                option.textContent = metric;
                metricSelect.appendChild(option);
            });

            // 显示筛选器
            filters.style.display = 'flex';
            status.textContent = '完成';

            // 初始化图表
            chartManager = new ChartManager('chart');
            interactions = new Interactions(chartManager);

            // 默认显示所有数据
            updateChart();

        } catch (error) {
            status.textContent = '错误: ' + error.message;
        }
    });

    updateChartBtn.addEventListener('click', updateChart);

    function updateChart() {
        const selectedInstances = Array.from(instanceSelect.selectedOptions).map(o => o.value);
        const selectedMetrics = Array.from(metricSelect.selectedOptions).map(o => o.value);

        const filteredData = dataProcessor.filterData(selectedInstances, selectedMetrics);
        const chartData = dataProcessor.groupByTime(filteredData);

        chartManager.update(chartData);
    }
});