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

    // Load parsers list
    loadParsersList();

    async function loadParsersList() {
        try {
            const response = await fetch('/parsers');
            const result = await response.json();

            if (result.parsers && result.parsers.length > 0) {
                parsersList.innerHTML = result.parsers.map((parser, index) => `
                    <div class="parser-item" draggable="true" data-name="${parser.name}" data-priority="${parser.priority}">
                        <div class="parser-info">
                            <span class="parser-name">${parser.name}</span>
                            <span class="parser-priority">优先级: ${parser.priority}</span>
                        </div>
                        ${index === 0 ? '<span class="parser-priority-label">最高优先</span>' : ''}
                    </div>
                `).join('');

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
    let draggedItem = null;

    function initDragAndDrop() {
        const items = parsersList.querySelectorAll('.parser-item');

        items.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragenter', handleDragEnter);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
        });
    }

    function handleDragStart(e) {
        draggedItem = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        // 移除所有 drag-over 状态
        document.querySelectorAll('.parser-item').forEach(item => {
            item.classList.remove('drag-over');
        });
        draggedItem = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(e) {
        e.preventDefault();
        if (this !== draggedItem) {
            this.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');

        console.log('Drop fired', { draggedItem, this, isSame: this === draggedItem });
        if (!draggedItem || this === draggedItem) return;

        // 交换位置
        const allItems = Array.from(parsersList.querySelectorAll('.parser-item'));
        const draggedIndex = allItems.indexOf(draggedItem);
        const dropIndex = allItems.indexOf(this);

        console.log('Swapping', draggedIndex, dropIndex);
        if (draggedIndex < dropIndex) {
            this.parentNode.insertBefore(draggedItem, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedItem, this);
        }

        // 更新优先级
        updatePriorities();

        // 重新初始化拖拽事件
        initDragAndDrop();
    }

    async function updatePriorities() {
        const items = parsersList.querySelectorAll('.parser-item');
        const priorities = {};

        items.forEach((item, index) => {
            const name = item.dataset.name;
            priorities[name] = (index + 1) * 10; // 优先级为 10, 20, 30...
            item.dataset.priority = priorities[name];
            item.querySelector('.parser-priority').textContent = `优先级: ${priorities[name]}`;
        });

        // 重新排列后更新最高优先标签
        items.forEach((item, index) => {
            const label = item.querySelector('.parser-priority-label');
            if (index === 0) {
                if (!label) {
                    const span = document.createElement('span');
                    span.className = 'parser-priority-label';
                    span.textContent = '最高优先';
                    item.appendChild(span);
                }
            } else {
                if (label) {
                    label.remove();
                }
            }
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

            // Build tree structure from data
            treeData = buildTreeData(dataProcessor.data);

            // Initialize selected state (none selected by default)
            Object.keys(treeData).forEach(instance => {
                treeData[instance].metrics.forEach(metric => {
                    const key = `${instance}__${metric}`;
                    selectedCombos[key] = false;
                    // Initialize diff state to true (use diff by default)
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

            // Initialize chart
            chartManager = new ChartManager('chart');
            interactions = new Interactions(chartManager);

            // Initial chart update
            updateChart();

        } catch (error) {
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
});