// static/js/ui.js

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const fileInputSingle = document.getElementById('fileInputSingle');
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
        // 支持两种文件输入
        const files = fileInput.files.length > 0 ? fileInput.files : fileInputSingle.files;

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
                    session_id: sessionId,
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
            metricSelect.innerHTML = '';

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
        // 如果没有选择，默认选择所有
        let selectedInstances = Array.from(instanceSelect.selectedOptions).map(o => o.value);
        let selectedMetrics = Array.from(metricSelect.selectedOptions).map(o => o.value);

        // 如果没有选中任何选项，选择所有
        if (selectedInstances.length === 0) {
            selectedInstances = Array.from(instanceSelect.options).map(o => o.value);
        }
        if (selectedMetrics.length === 0) {
            selectedMetrics = Array.from(metricSelect.options).map(o => o.value);
        }

        const filteredData = dataProcessor.filterData(selectedInstances, selectedMetrics);
        const chartData = dataProcessor.groupByTime(filteredData);

        chartManager.update(chartData);
    }
});