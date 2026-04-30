// static/js/ui.js

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const status = document.getElementById('status');
    const statusIndicator = document.getElementById('statusIndicator');
    const dataSelection = document.getElementById('dataSelection');
    const treeContent = document.getElementById('treeContent');
    const treeSearch = document.getElementById('treeSearch');
    const selectedItems = document.getElementById('selectedItems');
    const selectionInfo = document.getElementById('selectionInfo');
    const dropZone = document.getElementById('dropZone');
    const dataCount = document.getElementById('dataCount');
    const parsersList = document.getElementById('parsersList');
    const historyList = document.getElementById('historyList');

    // History localStorage key
    const HISTORY_KEY = 'logAnalyzerHistory';
    const MAX_HISTORY = 10;

    // Load history on page load
    loadHistory();

    // 编辑器配置
    let editorConfig = { editor: 'code' };

    // Load parsers list
    loadParsersList();
    loadEditorConfig();

    // 设置按钮点击事件
    document.getElementById('parserSettingsBtn').addEventListener('click', showEditorConfigDialog);

    async function loadEditorConfig() {
        try {
            const response = await fetch('/editor-config');
            editorConfig = await response.json();
        } catch (error) {
            console.error('加载编辑器配置失败:', error);
        }
    }

    async function saveEditorConfig(editor) {
        try {
            await fetch('/editor-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ editor })
            });
            editorConfig.editor = editor;
        } catch (error) {
            console.error('保存编辑器配置失败:', error);
        }
    }

    async function openParser(name) {
        try {
            const response = await fetch(`/parser/${encodeURIComponent(name)}/open`, {
                method: 'POST'
            });
            const result = await response.json();
            if (result.error) {
                alert('打开失败: ' + result.error);
            }
        } catch (error) {
            alert('打开失败: ' + error.message);
        }
    }

    // 设置弹窗
    function showEditorConfigDialog() {
        const currentEditor = editorConfig.editor || 'code';
        const newEditor = prompt('设置编辑器命令（如 code, vim, subl 等）:', currentEditor);
        if (newEditor && newEditor.trim()) {
            saveEditorConfig(newEditor.trim());
        }
    }

    async function loadParsersList() {
        try {
            const response = await fetch('/parsers');
            const result = await response.json();

            if (result.parsers && result.parsers.length > 0) {
                parsersList.innerHTML = result.parsers.map((parser, index) => `
                    <div class="parser-item" draggable="true" data-name="${parser.name}" data-priority="${parser.priority}">
                        <div class="parser-info">
                            <span class="parser-name">${parser.name}</span>
                        </div>
                        <button class="parser-open-btn" title="用编辑器打开脚本" data-name="${parser.name}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </button>
                    </div>
                `).join('');

                // 添加打开按钮事件
                parsersList.querySelectorAll('.parser-open-btn').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        const name = this.dataset.name;
                        openParser(name);
                    });
                });

                // 添加拖拽事件
                initDragAndDrop();
            } else {
                parsersList.innerHTML = '<div class="parsers-empty">暂无解析器</div>';
            }
        } catch (error) {
            parsersList.innerHTML = '<div class="parsers-empty">加载失败</div>';
        }
    }

    // 拖拽排序功能
    let draggedElement = null;
    let dragSourceIndex = -1;

    function initDragAndDrop() {
        const container = parsersList;
        const items = container.querySelectorAll('.parser-item');

        items.forEach((item, index) => {
            item.setAttribute('draggable', 'true');
            item.dataset.index = index;

            // dragstart
            item.addEventListener('dragstart', function(e) {
                draggedElement = this;
                dragSourceIndex = index;
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index);
            });

            // dragend
            item.addEventListener('dragend', function(e) {
                this.classList.remove('dragging');
                draggedElement = null;
                dragSourceIndex = -1;
                // 清理所有 drag-over
                parsersList.querySelectorAll('.parser-item').forEach(i => i.classList.remove('drag-over'));
            });

            // dragover
            item.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            // dragenter
            item.addEventListener('dragenter', function(e) {
                e.preventDefault();
                if (this !== draggedElement) {
                    this.classList.add('drag-over');
                }
            });

            // dragleave
            item.addEventListener('dragleave', function(e) {
                this.classList.remove('drag-over');
            });

            // drop
            item.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();

                this.classList.remove('drag-over');

                if (!draggedElement || this === draggedElement) return;

                const targetIndex = parseInt(this.dataset.index);
                const sourceIndex = dragSourceIndex;

                // 移动元素
                if (targetIndex > sourceIndex) {
                    this.parentNode.insertBefore(draggedElement, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(draggedElement, this);
                }

                // 延迟更新优先级，确保DOM更新完成
                setTimeout(() => {
                    // 重新设置索引
                    const allItems = parsersList.querySelectorAll('.parser-item');
                    allItems.forEach((item, i) => {
                        item.dataset.index = i;
                    });

                    // 更新优先级
                    updatePriorities();
                }, 10);
            });
        });

        // 容器也需要处理 drop（当拖到末尾时）
        container.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        container.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedElement) {
                // 移动到末尾
                this.appendChild(draggedElement);
                updatePriorities();
            }
        });
    }

    async function updatePriorities() {
        const items = parsersList.querySelectorAll('.parser-item');
        const priorities = {};

        items.forEach((item, index) => {
            const name = item.dataset.name;
            priorities[name] = (index + 1) * 10;
            item.dataset.priority = priorities[name];
        });

        // 保存到后端
        try {
            await fetch('/parsers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priorities })
            });
        } catch (error) {
            console.error('保存优先级失败:', error);
        }
    }

    let sessionId = null;
    let dataProcessor = null;
    let chartManager = null;
    let interactions = null;
    let uploadedFiles = [];

    // Store all combos and selected state: { "instance__metric": true/false }
    let selectedCombos = {};
    // Store diff state for each combo: { "instance__metric": true/false }
    let diffStates = {};
    // Default to use diff
    let useDiff = true;
    // Store the tree structure
    let treeData = {};

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
            const dataTransfer = new DataTransfer();
            for (let i = 0; i < files.length; i++) {
                dataTransfer.items.add(files[i]);
            }
            fileInput.files = dataTransfer.files;
            updateFileList(files);
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
            uploadBtn.click();
        }
    });

    // 进度面板元素
    const progressPanel = document.getElementById('progressPanel');
    const progressStage = document.getElementById('progressStage');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressMessage = document.getElementById('progressMessage');

    // 显示进度面板
    function showProgressPanel() {
        progressPanel.classList.add('visible');
        progressPanel.classList.remove('error', 'success');
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        progressStage.textContent = '阶段 1/3: 处理输入数据';
        progressMessage.textContent = '准备上传...';
    }

    // 隐藏进度面板
    function hideProgressPanel() {
        progressPanel.classList.remove('visible');
    }

    // 更新进度
    function updateProgress(data) {
        const stageNames = ['处理输入数据', '解析文件列表', '生成可视化数据'];
        progressStage.textContent = `阶段 ${data.stage}/3: ${stageNames[data.stage - 1]}`;
        progressBar.style.width = `${data.progress}%`;
        progressPercent.textContent = `${data.progress}%`;
        progressMessage.textContent = data.message;

        if (data.status === 'error') {
            progressPanel.classList.add('error');
        } else if (data.status === 'success') {
            progressPanel.classList.add('success');
        }
    }

    uploadBtn.addEventListener('click', async function() {
        const files = fileInput.files;

        if (!files || files.length === 0) {
            setStatus('请选择文件', 'error');
            return;
        }

        // 显示进度面板
        showProgressPanel();

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i]);
        }

        try {
            // 使用 SSE 接收进度
            const response = await fetch('/upload-progress', {
                method: 'POST',
                body: formData
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let finalResult = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6);
                        try {
                            const data = JSON.parse(jsonStr);

                            if (data.result) {
                                // 最终结果
                                finalResult = data.result;
                                updateProgress({
                                    stage: 3,
                                    progress: 100,
                                    message: '处理完成',
                                    status: 'success'
                                });
                            } else {
                                updateProgress(data);
                            }
                        } catch (e) {
                            console.error('解析进度数据失败:', e);
                        }
                    }
                }
            }

            if (!finalResult) {
                hideProgressPanel();
                setStatus('处理失败', 'error');
                return;
            }

            // Initialize data processor
            dataProcessor = new DataProcessor();
            dataProcessor.setData(finalResult.csv_data);

            // Build tree structure from data
            treeData = buildTreeData(dataProcessor.data);

            // Initialize selected state (none selected by default)
            Object.keys(treeData).forEach(instance => {
                treeData[instance].metrics.forEach(metric => {
                    const key = `${instance}__${metric}`;
                    selectedCombos[key] = false;
                    diffStates[key] = true;
                });
            });

            // 展开所有实例供用户选择
            Object.keys(treeData).forEach(instance => {
                treeData[instance].expanded = true;
            });

            // Render tree and preview
            renderTree(treeData);
            updatePreview();

            // Show data selection
            dataSelection.classList.add('visible');

            // Update data count
            const totalData = dataProcessor.data.length;
            dataCount.textContent = `${totalData} 条数据`;

            setStatus('完成', 'success');
            setStatusIndicator('success');

            // Initialize chart
            chartManager = new ChartManager('chart');
            interactions = new Interactions(chartManager);

            // Initial chart update
            updateChart();

            // Save to history
            addToHistory({
                name: uploadedFiles.length > 0 ? uploadedFiles.join(', ') : '上传文件',
                csvData: finalResult.csv_data,
                totalRecords: finalResult.total_records,
                time: Date.now()
            });

            // 延迟隐藏进度面板
            setTimeout(hideProgressPanel, 1000);

        } catch (error) {
            updateProgress({
                stage: 1,
                progress: 0,
                message: `错误: ${error.message}`,
                status: 'error'
            });
            setStatus('错误: ' + error.message, 'error');
        }
    });

    function buildTreeData(data) {
        const tree = {};

        data.forEach(d => {
            const instance = d['实例名称'];
            const metric = d['计数名称'];

            if (!tree[instance]) {
                tree[instance] = {
                    metrics: new Set(),
                    metricCounts: {},
                    expanded: true
                };
            }
            tree[instance].metrics.add(metric);
            // 统计每个 metric 的数量
            tree[instance].metricCounts[metric] = (tree[instance].metricCounts[metric] || 0) + 1;
        });

        // Convert Sets to sorted Arrays
        Object.keys(tree).forEach(instance => {
            tree[instance].metrics = Array.from(tree[instance].metrics).sort();
        });

        return tree;
    }

    function renderTree(data, filter = '') {
        const filterLower = filter.toLowerCase();
        const instances = Object.keys(data).sort();

        let html = '';

        instances.forEach(instance => {
            // Filter by instance name
            if (filter && !instance.toLowerCase().includes(filterLower)) {
                // Check if any metrics match
                const matchingMetrics = data[instance].metrics.filter(m => m.toLowerCase().includes(filterLower));
                if (matchingMetrics.length === 0) return;
            }

            const metrics = data[instance].metrics;
            const allSelected = metrics.every(m => selectedCombos[`${instance}__${m}`]);
            const someSelected = metrics.some(m => selectedCombos[`${instance}__${m}`]);

            let checkboxClass = 'tree-checkbox';
            if (allSelected) checkboxClass += ' checked';
            else if (someSelected) checkboxClass += ' indeterminate';

            html += `
            <div class="tree-node">
                <div class="tree-instance ${data[instance].expanded ? 'expanded' : ''}" data-instance="${encodeURIComponent(instance)}">
                    <svg class="tree-expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <span class="${checkboxClass}"></span>
                    <span class="tree-instance-name">${instance}</span>
                </div>
                <div class="tree-metrics">
                    ${metrics.map(metric => {
                        const key = `${instance}__${metric}`;
                        const isSelected = selectedCombos[key];
                        const count = data[instance].metricCounts[metric] || 0;
                        // Filter by metric name
                        if (filter && !metric.toLowerCase().includes(filterLower) && !instance.toLowerCase().includes(filterLower)) {
                            return '';
                        }
                        return `
                        <div class="tree-metric ${isSelected ? 'selected' : ''}" data-combo="${encodeURIComponent(key)}">
                            <span class="tree-checkbox ${isSelected ? 'checked' : ''}" style="width:14px;height:14px;"></span>
                            <span>${metric}</span>
                            <span class="metric-count">(${count}条)</span>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            `;
        });

        treeContent.innerHTML = html || '<div class="preview-empty">无匹配结果</div>';

        // Add event handlers
        treeContent.querySelectorAll('.tree-instance').forEach(el => {
            el.addEventListener('click', function(e) {
                if (e.target.closest('.tree-checkbox')) return;

                const instance = decodeURIComponent(this.dataset.instance);
                this.classList.toggle('expanded');
                data[instance].expanded = this.classList.contains('expanded');
            });

            // Click on checkbox to toggle all metrics
            const checkbox = el.querySelector('.tree-checkbox');
            checkbox.addEventListener('click', function(e) {
                e.stopPropagation();
                const instance = decodeURIComponent(el.dataset.instance);
                const allSelected = metrics => metrics.every(m => selectedCombos[`${instance}__${m}`]);
                const metrics = data[instance].metrics;
                const newState = !allSelected(metrics);

                metrics.forEach(metric => {
                    selectedCombos[`${instance}__${metric}`] = newState;
                });

                renderTree(data, treeSearch.value);
                updatePreview();
                updateChart();
            });
        });

        treeContent.querySelectorAll('.tree-metric').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const key = decodeURIComponent(this.dataset.combo);
                selectedCombos[key] = !selectedCombos[key];

                // Update UI
                this.classList.toggle('selected');
                const checkbox = this.querySelector('.tree-checkbox');
                checkbox.classList.toggle('checked');

                // Update parent instance checkbox state
                const instance = key.split('__')[0];
                const metrics = data[instance].metrics;
                const allSelected = metrics.every(m => selectedCombos[`${instance}__${m}`]);
                const someSelected = metrics.some(m => selectedCombos[`${instance}__${m}`]);

                const instanceEl = treeContent.querySelector(`.tree-instance[data-instance="${encodeURIComponent(instance)}"]`);
                const instanceCheckbox = instanceEl.querySelector(':scope > .tree-checkbox');
                instanceCheckbox.classList.remove('checked', 'indeterminate');
                if (allSelected) instanceCheckbox.classList.add('checked');
                else if (someSelected) instanceCheckbox.classList.add('indeterminate');

                updatePreview();
                updateChart();
            });
        });
    }

    function updatePreview() {
        const selected = Object.entries(selectedCombos)
            .filter(([_, isSelected]) => isSelected)
            .map(([key, _]) => {
                const [instance, metric] = key.split('__');
                return { instance, metric, key };
            });

        // Update info
        selectionInfo.textContent = `${selected.length} 项`;

        if (selected.length === 0) {
            selectedItems.innerHTML = '<div class="preview-empty">请从左侧选择数据</div>';
            return;
        }

        selectedItems.innerHTML = selected.map(item => `
            <div class="preview-item" data-combo="${encodeURIComponent(item.key)}">
                <div class="preview-item-info">
                    <span class="preview-item-instance">${item.instance}</span>
                    <span class="preview-item-metric"> / ${item.metric}</span>
                </div>
                <label class="preview-item-diff" title="显示差值（与前一时间点的差值）">
                    <input type="checkbox" ${diffStates[item.key] !== false ? 'checked' : ''} data-diff="${encodeURIComponent(item.key)}">
                    <span>差值</span>
                </label>
                <span class="preview-item-remove">×</span>
            </div>
        `).join('');

        // Add remove handlers
        selectedItems.querySelectorAll('.preview-item').forEach(el => {
            el.querySelector('.preview-item-remove').addEventListener('click', function() {
                const key = decodeURIComponent(el.dataset.combo);
                selectedCombos[key] = false;

                // Update tree
                renderTree(treeData, treeSearch.value);
                updatePreview();
                updateChart();
            });
        });

        // Add diff checkbox handlers
        selectedItems.querySelectorAll('.preview-item-diff input').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const key = decodeURIComponent(this.dataset.diff);
                diffStates[key] = this.checked;
                updateChart();
            });
        });
    }

    // Tree action buttons
    document.getElementById('expandAll').addEventListener('click', function() {
        // 切换展开/折叠状态
        const isAnyCollapsed = Object.values(treeData).some(instance => !instance.expanded);

        if (isAnyCollapsed) {
            // 展开所有
            Object.keys(treeData).forEach(instance => {
                treeData[instance].expanded = true;
            });
        } else {
            // 折叠所有
            Object.keys(treeData).forEach(instance => {
                treeData[instance].expanded = false;
            });
        }
        renderTree(treeData, treeSearch.value);
    });

    document.getElementById('selectAll').addEventListener('click', function() {
        // 全选所有计数
        Object.keys(treeData).forEach(instance => {
            treeData[instance].metrics.forEach(metric => {
                selectedCombos[`${instance}__${metric}`] = true;
            });
        });
        renderTree(treeData, treeSearch.value);
        updatePreview();
        updateChart();
    });

    document.getElementById('clearAll').addEventListener('click', function() {
        // 清空所有选择
        Object.keys(selectedCombos).forEach(key => {
            selectedCombos[key] = false;
        });
        renderTree(treeData, treeSearch.value);
        updatePreview();
        updateChart();
    });

    // Search handler
    treeSearch.addEventListener('input', function() {
        renderTree(treeData, this.value);
    });

    function updateChart() {
        // Get selected instances and metrics with diff state
        const selectedData = [];
        const selectedInstances = new Set();
        const selectedMetrics = new Set();

        Object.entries(selectedCombos).forEach(([key, isSelected]) => {
            if (isSelected) {
                const [instance, metric] = key.split('__');
                selectedInstances.add(instance);
                selectedMetrics.add(metric);
                selectedData.push({
                    key,
                    instance,
                    metric,
                    useDiff: diffStates[key] !== false // default to true
                });
            }
        });

        const instances = Array.from(selectedInstances);
        const metrics = Array.from(selectedMetrics);

        if (instances.length === 0 || metrics.length === 0) {
            chartManager.update({ timePoints: [], series: {} });
            return;
        }

        // Get data without diff first
        const filteredData = dataProcessor.filterData(instances, metrics);
        const chartData = dataProcessor.groupByTime(filteredData, false);

        // Apply diff selectively based on diffStates
        const { timePoints, series } = chartData;
        const finalSeries = {};

        Object.keys(series).forEach(key => {
            const useDiff = diffStates[key] !== false; // default to true
            if (useDiff) {
                // Compute diff for this series
                const values = series[key];
                finalSeries[key] = [];
                for (let i = 0; i < values.length; i++) {
                    if (i === 0) {
                        finalSeries[key].push(0);
                    } else {
                        finalSeries[key].push(values[i] - values[i - 1]);
                    }
                }
            } else {
                finalSeries[key] = series[key];
            }
        });

        chartManager.update({ timePoints, series: finalSeries });
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

    // ========== 解析器上传弹窗 ==========

    // 弹窗元素
    const parserUploadModal = document.getElementById('parserUploadModal');
    const parserUploadBtn = document.getElementById('parserUploadBtn');
    const parserGuideBtn = document.getElementById('parserGuideBtn');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const uploadValidateBtn = document.getElementById('uploadValidateBtn');
    const parserFileZone = document.getElementById('parserFileZone');
    const testFileZone = document.getElementById('testFileZone');
    const parserFileInput = document.getElementById('parserFileInput');
    const testFileInput = document.getElementById('testFileInput');
    const parserFileName = document.getElementById('parserFileName');
    const testFileName = document.getElementById('testFileName');
    const validationResult = document.getElementById('validationResult');

    // 上传的文件
    let parserFile = null;
    let testFile = null;

    // 显示弹窗
    function showUploadModal() {
        parserUploadModal.classList.add('visible');
        // 重置状态
        parserFile = null;
        testFile = null;
        parserFileName.textContent = '';
        testFileName.textContent = '';
        parserFileZone.classList.remove('has-file');
        testFileZone.classList.remove('has-file');
        validationResult.innerHTML = '';
        validationResult.classList.remove('success', 'error');
        uploadValidateBtn.disabled = true;
    }

    // 隐藏弹窗
    function hideUploadModal() {
        parserUploadModal.classList.remove('visible');
    }

    // 更新上传按钮状态
    function updateUploadButtonState() {
        uploadValidateBtn.disabled = !(parserFile && testFile);
    }

    // 选择解析器文件
    parserFileZone.addEventListener('click', () => parserFileInput.click());
    parserFileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            parserFile = this.files[0];
            parserFileName.textContent = parserFile.name;
            parserFileZone.classList.add('has-file');
            parserFileZone.querySelector('span').textContent = parserFile.name;
            updateUploadButtonState();
        }
    });

    // 选择测试文件
    testFileZone.addEventListener('click', () => testFileInput.click());
    testFileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            testFile = this.files[0];
            testFileName.textContent = testFile.name;
            testFileZone.classList.add('has-file');
            testFileZone.querySelector('span').textContent = testFile.name;
            updateUploadButtonState();
        }
    });

    // 上传按钮点击
    parserUploadBtn.addEventListener('click', showUploadModal);

    // 开发指南按钮点击
    parserGuideBtn.addEventListener('click', async function() {
        try {
            const response = await fetch('/parser-guide/open', { method: 'POST' });
            const result = await response.json();
            if (result.error) {
                alert('打开失败: ' + result.error);
            }
        } catch (error) {
            alert('打开失败: ' + error.message);
        }
    });

    // 打开脚本目录按钮点击
    document.getElementById('parserOpenDirBtn').addEventListener('click', async function() {
        try {
            const response = await fetch('/parser-dir/open', { method: 'POST' });
            const result = await response.json();
            if (result.error) {
                alert('打开失败: ' + result.error);
            }
        } catch (error) {
            alert('打开失败: ' + error.message);
        }
    });

    // 关闭弹窗
    modalClose.addEventListener('click', hideUploadModal);
    modalCancel.addEventListener('click', hideUploadModal);

    // 点击弹窗外部关闭
    parserUploadModal.addEventListener('click', function(e) {
        if (e.target === parserUploadModal) {
            hideUploadModal();
        }
    });

    // 上传并校验
    uploadValidateBtn.addEventListener('click', async function() {
        if (!parserFile || !testFile) return;

        // 禁用按钮防止重复点击
        uploadValidateBtn.disabled = true;
        validationResult.innerHTML = '<div class="validation-loading">校验中...</div>';
        validationResult.classList.remove('success', 'error');

        const formData = new FormData();
        formData.append('parser_file', parserFile);
        formData.append('test_file', testFile);

        try {
            const response = await fetch('/parser/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                validationResult.classList.add('success');
                validationResult.innerHTML = `
                    <div class="validation-success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>${result.message || '校验成功，解析器已添加'}</span>
                    </div>
                `;
                // 刷新解析器列表
                setTimeout(() => {
                    loadParsersList();
                    hideUploadModal();
                }, 1500);
            } else {
                validationResult.classList.add('error');
                validationResult.innerHTML = `
                    <div class="validation-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <div class="error-list">
                            ${result.errors.map(err => `<div class="error-item">${err}</div>`).join('')}
                        </div>
                    </div>
                `;
                // 校验失败，重新启用按钮允许再次尝试
                uploadValidateBtn.disabled = false;
            }
        } catch (error) {
            validationResult.classList.add('error');
            validationResult.innerHTML = `
                <div class="validation-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    <span>上传失败: ${error.message}</span>
                </div>
            `;
            // 错误时重新启用按钮
            uploadValidateBtn.disabled = false;
        }
    });

    // ========== 历史记录功能 ==========

    function getHistory() {
        try {
            const data = localStorage.getItem(HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取历史记录失败:', e);
            return [];
        }
    }

    function saveHistory(history) {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('保存历史记录失败:', e);
        }
    }

    function addToHistory(item) {
        let history = getHistory();
        // Add to front
        history.unshift(item);
        // Limit to MAX_HISTORY
        if (history.length > MAX_HISTORY) {
            history = history.slice(0, MAX_HISTORY);
        }
        saveHistory(history);
        loadHistory();
    }

    function deleteFromHistory(index) {
        let history = getHistory();
        history.splice(index, 1);
        saveHistory(history);
        loadHistory();
    }

    function loadHistory() {
        const history = getHistory();
        if (history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">暂无解析记录</div>';
            return;
        }

        historyList.innerHTML = history.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-item-info">
                    <div class="history-item-name">${item.name}</div>
                    <div class="history-item-time">${formatTime(item.time)}</div>
                </div>
                <span class="history-item-count">${item.totalRecords}条</span>
                <span class="history-item-delete" data-index="${index}">×</span>
            </div>
        `).join('');

        // Click to load cached result
        historyList.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', function(e) {
                if (e.target.classList.contains('history-item-delete')) return;
                const index = parseInt(this.dataset.index);
                loadCachedResult(index);
            });
        });

        // Delete button
        historyList.querySelectorAll('.history-item-delete').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(this.dataset.index);
                deleteFromHistory(index);
            });
        });
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }

    function loadCachedResult(index) {
        const history = getHistory();
        const item = history[index];
        if (!item) return;

        // Initialize data processor with cached data
        dataProcessor = new DataProcessor();
        dataProcessor.setData(item.csvData);

        // Build tree structure
        treeData = buildTreeData(dataProcessor.data);

        // Initialize selected state
        Object.keys(treeData).forEach(instance => {
            treeData[instance].metrics.forEach(metric => {
                const key = `${instance}__${metric}`;
                selectedCombos[key] = false;
                diffStates[key] = true;
            });
        });

        // Expand all instances
        Object.keys(treeData).forEach(instance => {
            treeData[instance].expanded = true;
        });

        // Render tree and preview
        renderTree(treeData);
        updatePreview();

        // Show data selection
        dataSelection.classList.add('visible');

        // Update data count
        dataCount.textContent = `${item.totalRecords} 条数据`;

        setStatus('已加载历史记录', 'success');
        setStatusIndicator('success');

        // Initialize chart
        chartManager = new ChartManager('chart');
        interactions = new Interactions(chartManager);

        // Initial chart update
        updateChart();
    }
});