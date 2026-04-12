// static/js/ui.js

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const status = document.getElementById('status');
    const statusIndicator = document.getElementById('statusIndicator');
    const filters = document.getElementById('filters');
    const instanceSelect = document.getElementById('instanceSelect');
    const metricSelect = document.getElementById('metricSelect');
    const updateChartBtn = document.getElementById('updateChartBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const dropZone = document.getElementById('dropZone');
    const dataCount = document.getElementById('dataCount');

    let sessionId = null;
    let dataProcessor = null;
    let chartManager = null;
    let interactions = null;
    let uploadedFiles = [];

    // Drag and drop handling
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        }, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            // 创建一个新的 DataTransfer 来设置 files
            const dataTransfer = new DataTransfer();
            for (let i = 0; i < files.length; i++) {
                dataTransfer.items.add(files[i]);
            }
            fileInput.files = dataTransfer.files;
            updateFileList(files);
            // 拖拽文件后自动开始上传
            uploadBtn.click();
        }
    }

    function updateFileList(files) {
        const fileList = document.getElementById('fileList');
        uploadedFiles = Array.from(files).map(f => f.name);

        if (uploadedFiles.length > 0) {
            fileList.classList.add('visible');
            fileList.innerHTML = uploadedFiles.map(file => `
                <div class="file-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    ${file}
                </div>
            `).join('');
        } else {
            fileList.classList.remove('visible');
        }
    }

    // File input change handler
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            updateFileList(this.files);
            // 选择文件后自动开始上传
            uploadBtn.click();
        }
    });

    uploadBtn.addEventListener('click', async function() {
        const files = fileInput.files;

        if (!files || files.length === 0) {
            setStatus('请选择文件', 'error');
            return;
        }

        setStatus('上传中...', 'processing');
        setStatusIndicator('processing');

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
                setStatus('错误: ' + result.error, 'error');
                return;
            }

            sessionId = result.session_id;
            setStatus('处理中...', 'processing');

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
                setStatus('错误: ' + processResult.error, 'error');
                return;
            }

            // Initialize data processor
            dataProcessor = new DataProcessor();
            dataProcessor.setData(processResult.csv_data);

            // Populate filters
            const instances = dataProcessor.getInstances();
            const metrics = dataProcessor.getMetrics();

            instanceSelect.innerHTML = '';
            metricSelect.innerHTML = '';

            instances.forEach(inst => {
                const option = document.createElement('option');
                option.value = inst;
                option.textContent = inst;
                option.selected = true;
                instanceSelect.appendChild(option);
            });

            metrics.forEach(metric => {
                const option = document.createElement('option');
                option.value = metric;
                option.textContent = metric;
                option.selected = true;
                metricSelect.appendChild(option);
            });

            // Show filters
            filters.classList.add('visible');

            // Update data count
            const totalData = dataProcessor.data.length;
            dataCount.textContent = `${totalData} 条数据`;

            setStatus('完成', 'success');

            // Initialize chart
            chartManager = new ChartManager('chart');
            interactions = new Interactions(chartManager);

            // Initial chart update
            updateChart();

        } catch (error) {
            setStatus('错误: ' + error.message, 'error');
        }
    });

    updateChartBtn.addEventListener('click', updateChart);

    selectAllBtn.addEventListener('click', function() {
        Array.from(instanceSelect.options).forEach(o => o.selected = true);
        Array.from(metricSelect.options).forEach(o => o.selected = true);
        updateChart();
    });

    clearAllBtn.addEventListener('click', function() {
        Array.from(instanceSelect.options).forEach(o => o.selected = false);
        Array.from(metricSelect.options).forEach(o => o.selected = false);
        updateChart();
    });

    function updateChart() {
        let selectedInstances = Array.from(instanceSelect.selectedOptions).map(o => o.value);
        let selectedMetrics = Array.from(metricSelect.selectedOptions).map(o => o.value);

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

    function setStatus(message, type) {
        status.textContent = message;
        setStatusIndicator(type);
    }

    function setStatusIndicator(type) {
        statusIndicator.className = 'status-indicator';
        if (type) {
            statusIndicator.classList.add(type);
        }
    }
});