# 日志分析可视化工具 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个本地 Web 应用，支持上传日志文件/目录，递归解压，调用脚本处理，最后以时间趋势图可视化

**Architecture:** Flask 后端 + ECharts 前端 + 模块化脚本系统

**Tech Stack:** Flask, Python 3.x, ECharts 5.x, 原生 JavaScript

---

## 文件结构

```
log-analyzer/
├── app.py                    # Flask 主应用（路由、逻辑）
├── config.py                 # 配置文件
├── requirements.txt          # 依赖
├── scripts/                  # 脚本目录
│   ├── __init__.py
│   ├── base_parser.py        # 基类，定义统一接口
│   ├── json_parser.py        # 内置：JSON 日志解析
│   └── text_parser.py        # 内置：文本日志解析
├── templates/
│   └── index.html            # 主页面
├── static/
│   ├── js/
│   │   ├── chart.js          # 图表初始化、配置
│   │   ├── interactions.js   # 交互逻辑
│   │   ├── dataProcessor.js  # 数据处理
│   │   └── ui.js             # UI 组件
│   └── css/
│       └── style.css
└── uploads/                  # 上传文件临时目录
```

---

## 实现任务

### Task 1: 项目基础结构搭建

**Files:**
- Create: `log-analyzer/requirements.txt`
- Create: `log-analyzer/config.py`
- Create: `log-analyzer/app.py`（基础 Flask 应用）
- Create: `log-analyzer/uploads/.gitkeep`

- [ ] **Step 1: 创建项目目录和 requirements.txt**

```bash
mkdir -p log-analyzer/{scripts,templates,static/{js,css},uploads}
```

```txt
# requirements.txt
Flask>=2.0.0
```

- [ ] **Step 2: 创建 config.py**

```python
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
SCRIPTS_FOLDER = os.path.join(BASE_DIR, 'scripts')

ALLOWED_EXTENSIONS = {'log', 'txt', 'zip', 'tar', 'gz', 'tgz'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
```

- [ ] **Step 3: 创建基础 Flask 应用**

```python
# app.py
from flask import Flask, render_template, request, jsonify
from config import UPLOAD_FOLDER
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

- [ ] **Step 4: 创建基础 index.html**

```html
<!DOCTYPE html>
<html>
<head>
    <title>日志分析工具</title>
    <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
    <h1>日志分析工具</h1>
    <div id="app">
        <input type="file" id="fileInput" webkitdirectory multiple>
        <button id="uploadBtn">上传</button>
        <div id="result"></div>
    </div>
    <script src="/static/js/ui.js"></script>
</body>
</html>
```

- [ ] **Step 5: 创建基础 CSS**

```css
/* static/css/style.css */
body { font-family: Arial, sans-serif; margin: 20px; }
#app { max-width: 1200px; margin: 0 auto; }
```

- [ ] **Step 6: 测试 Flask 应用**

Run: `cd log-analyzer && pip install -r requirements.txt && python app.py`
Expected: Flask 应用启动，访问 http://127.0.0.1:5000 显示页面

- [ ] **Step 7: Commit**

```bash
git add log-analyzer/
git commit -m "feat: 搭建 Flask 基础项目结构"
```

---

### Task 2: 文件上传和解压模块

**Files:**
- Modify: `log-analyzer/app.py`
- Create: `log-analyzer/utils.py`（解压逻辑）

- [ ] **Step 1: 创建 utils.py 包含解压逻辑**

```python
# utils.py
import os
import zipfile
import tarfile
import shutil
from pathlib import Path

ALLOWED_EXTENSIONS = {'log', 'txt', 'log.1', 'log.2'}

def is_compressed(file_path):
    """检查文件是否为压缩包"""
    ext = os.path.splitext(file_path)[1].lower()
    return ext in ['.zip', '.tar', '.gz', '.tgz']

def extract_all(file_path, dest_folder):
    """递归解压文件"""
    if not os.path.exists(dest_folder):
        os.makedirs(dest_folder)
    
    # 如果是压缩包则解压
    if zipfile.is_zipfile(file_path):
        with zipfile.ZipFile(file_path, 'r') as z:
            z.extractall(dest_folder)
        os.remove(file_path)  # 删除原始压缩包
        return True
    elif tarfile.is_tarfile(file_path):
        with tarfile.open(file_path, 'r:*') as t:
            t.extractall(dest_folder)
        os.remove(file_path)  # 删除原始压缩包
        return True
    return False

def process_directory(folder_path):
    """递归处理目录中的所有文件"""
    text_files = []
    files = list(Path(folder_path).rglob('*'))
    
    for f in files:
        if not f.is_file():
            continue
            
        if is_compressed(str(f)):
            # 压缩包，解压到同目录
            parent = f.parent
            extract_all(str(f), str(parent))
        else:
            ext = f.suffix.lstrip('.')
            # 纯文本文件
            if ext in ALLOWED_EXTENSIONS or f.name.startswith('.'):
                continue
            text_files.append(str(f))
    
    # 递归直到没有压缩包
    has_compressed = any(is_compressed(str(f)) for f in Path(folder_path).rglob('*') if f.is_file())
    if has_compressed:
        return process_directory(folder_path)
    
    # 获取所有纯文本文件
    text_files = []
    for f in Path(folder_path).rglob('*'):
        if f.is_file() and not is_compressed(str(f)):
            text_files.append(str(f))
    
    return text_files
```

- [ ] **Step 2: 更新 app.py 添加上传路由**

```python
# app.py 新增
import uuid
from utils import process_directory

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('file')
    if not files or files[0].filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # 创建临时目录
    session_id = str(uuid.uuid4())
    upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    os.makedirs(upload_dir, exist_ok=True)
    
    # 保存上传的文件
    for f in files:
        if f.filename:
            f.save(os.path.join(upload_dir, f.filename))
    
    # 如果是单个文件，检查是否需要解压
    if len(files) == 1 and os.path.isfile(os.path.join(upload_dir, files[0].filename)):
        file_path = os.path.join(upload_dir, files[0].filename)
        if is_compressed(file_path):
            extract_all(file_path, upload_dir)
    
    # 处理目录，获取所有纯文本文件
    text_files = process_directory(upload_dir)
    
    return jsonify({
        'session_id': session_id,
        'files': text_files
    })
```

- [ ] **Step 3: 测试上传功能**

使用 curl 或前端测试文件上传

- [ ] **Step 4: Commit**

```bash
git add log-analyzer/app.py log-analyzer/utils.py
git commit -m "feat: 添加文件上传和解压模块"
```

---

### Task 3: 脚本处理模块

**Files:**
- Create: `log-analyzer/scripts/__init__.py`
- Create: `log-analyzer/scripts/base_parser.py`
- Create: `log-analyzer/scripts/json_parser.py`
- Create: `log-analyzer/scripts/text_parser.py`
- Modify: `log-analyzer/app.py`

- [ ] **Step 1: 创建脚本基类**

```python
# scripts/base_parser.py
from abc import ABC, abstractmethod
from typing import List, Dict

class BaseParser(ABC):
    """日志解析器基类"""
    
    name = "base"  # 解析器名称
    
    @abstractmethod
    def process(self, file_path: str) -> List[Dict]:
        """
        处理单个日志文件
        返回格式: [{"实例名称": str, "计数名称": str, "数值": int, "时间": str}, ...]
        """
        pass
    
    def can_process(self, file_path: str) -> bool:
        """检查是否能够处理该文件"""
        return False
```

- [ ] **Step 2: 创建 JSON 日志解析器**

```python
# scripts/json_parser.py
import json
from datetime import datetime
from base_parser import BaseParser

class JsonParser(BaseParser):
    name = "json"
    
    def can_process(self, file_path: str) -> bool:
        return file_path.endswith('.json')
    
    def process(self, file_path: str):
        results = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        data = json.loads(line.strip())
                        # 提取实例名称、计数、数值、时间
                        instance = data.get('instance', data.get('host', 'unknown'))
                        timestamp = data.get('timestamp', data.get('time', datetime.now().isoformat()))
                        
                        # 统计各字段
                        for key, value in data.items():
                            if isinstance(value, (int, float)) and key not in ['instance', 'host', 'timestamp', 'time']:
                                results.append({
                                    '实例名称': instance,
                                    '计数名称': key,
                                    '数值': value,
                                    '时间': timestamp
                                })
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
        
        return results
```

- [ ] **Step 3: 创建文本日志解析器**

```python
# scripts/text_parser.py
import re
from datetime import datetime
from base_parser import BaseParser

class TextParser(BaseParser):
    name = "text"
    
    # 日志级别正则
    LEVEL_PATTERN = re.compile(r'\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\b', re.IGNORECASE)
    
    def can_process(self, file_path: str) -> bool:
        return file_path.endswith(('.log', '.txt')) or '.log.' in file_path
    
    def process(self, file_path: str):
        results = []
        instance = file_path.split('/')[-1].split('\\')[-1]
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    # 统计各级别出现次数
                    levels = self.LEVEL_PATTERN.findall(line)
                    for level in levels:
                        level_upper = level.upper()
                        if level_upper == 'WARNING':
                            level_upper = 'WARN'
                        
                        results.append({
                            '实例名称': instance,
                            '计数名称': f'{level_upper}_count',
                            '数值': 1,
                            '时间': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        })
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
        
        return results
```

- [ ] **Step 4: 创建 __init__.py 加载所有解析器**

```python
# scripts/__init__.py
import os
import importlib
from pathlib import Path

def load_parsers():
    """加载所有解析器"""
    parsers = []
    script_dir = Path(__file__).parent
    
    for file in script_dir.glob('*_parser.py'):
        if file.name == 'base_parser.py':
            continue
        
        module_name = file.stem
        module = importlib.import_module(f'scripts.{module_name}')
        
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if isinstance(attr, type) and issubclass(attr, type.__bases__[0]) and attr.__name__ != 'BaseParser':
                try:
                    parsers.append(attr())
                except:
                    pass
    
    return parsers
```

- [ ] **Step 5: 更新 app.py 添加处理路由**

```python
# app.py 新增
from scripts import load_parsers

@app.route('/process', methods=['POST'])
def process_files():
    data = request.json
    session_id = data.get('session_id')
    files = data.get('files', [])
    
    if not files:
        return jsonify({'error': 'No files to process'}), 400
    
    # 加载所有解析器
    parsers = load_parsers()
    
    # 处理所有文件
    all_results = []
    for file_path in files:
        for parser in parsers:
            if parser.can_process(file_path):
                results = parser.process(file_path)
                all_results.extend(results)
                break  # 一个文件只用一个解析器处理
    
    # 转换为 CSV 格式
    import csv
    import io
    
    output = io.StringIO()
    if all_results:
        writer = csv.DictWriter(output, fieldnames=['实例名称', '计数名称', '数值', '时间'])
        writer.writeheader()
        writer.writerows(all_results)
    
    csv_data = output.getvalue()
    
    return jsonify({
        'csv_data': csv_data,
        'results': all_results
    })
```

- [ ] **Step 6: 测试解析功能**

- [ ] **Step 7: Commit**

```bash
git add log-analyzer/scripts/
git commit -m "feat: 添加脚本处理模块"
```

---

### Task 4: 可视化前端实现

**Files:**
- Modify: `log-analyzer/templates/index.html`
- Create: `log-analyzer/static/js/chart.js`
- Create: `log-analyzer/static/js/dataProcessor.js`
- Create: `log-analyzer/static/js/interactions.js`
- Modify: `log-analyzer/static/css/style.css`

- [ ] **Step 1: 更新 index.html 添加图表容器**

```html
<!DOCTYPE html>
<html>
<head>
    <title>日志分析工具</title>
    <link rel="stylesheet" href="/static/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
</head>
<body>
    <h1>日志分析工具</h1>
    <div id="app">
        <div class="upload-section">
            <input type="file" id="fileInput" webkitdirectory multiple>
            <button id="uploadBtn">上传</button>
            <span id="status"></span>
        </div>
        
        <div class="filters" id="filters" style="display:none;">
            <div class="filter-group">
                <label>实例名称：</label>
                <select id="instanceSelect" multiple></select>
            </div>
            <div class="filter-group">
                <label>计数名称：</label>
                <select id="metricSelect" multiple></select>
            </div>
            <button id="updateChartBtn">更新图表</button>
        </div>
        
        <div id="chart" style="width: 100%; height: 500px;"></div>
    </div>
    
    <script src="/static/js/dataProcessor.js"></script>
    <script src="/static/js/chart.js"></script>
    <script src="/static/js/interactions.js"></script>
    <script src="/static/js/ui.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 dataProcessor.js**

```javascript
// static/js/dataProcessor.js

class DataProcessor {
    constructor() {
        this.data = [];
    }
    
    setData(csvData) {
        // 解析 CSV
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',');
        
        this.data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((h, idx) => {
                    row[h] = values[idx];
                });
                row['数值'] = parseInt(row['数值'], 10);
                this.data.push(row);
            }
        }
        
        // 获取所有实例和计数
        this.instances = [...new Set(this.data.map(d => d['实例名称']))];
        this.metrics = [...new Set(this.data.map(d => d['计数名称']))];
    }
    
    getInstances() {
        return this.instances;
    }
    
    getMetrics() {
        return this.metrics;
    }
    
    filterData(instances, metrics) {
        return this.data.filter(d => {
            const instanceMatch = instances.length === 0 || instances.includes(d['实例名称']);
            const metricMatch = metrics.length === 0 || metrics.includes(d['计数名称']);
            return instanceMatch && metricMatch;
        });
    }
    
    groupByTime(data) {
        // 按时间分组
        const grouped = {};
        data.forEach(d => {
            const time = d['时间'];
            if (!grouped[time]) {
                grouped[time] = [];
            }
            grouped[time].push(d);
        });
        
        // 转换为图表数据格式
        const timePoints = Object.keys(grouped).sort();
        const series = {};
        
        data.forEach(d => {
            const key = `${d['实例名称']}-${d['计数名称']}`;
            if (!series[key]) {
                series[key] = [];
            }
        });
        
        timePoints.forEach(time => {
            const timeData = grouped[time];
            Object.keys(series).forEach(key => {
                const [instance, metric] = key.split('-');
                const match = timeData.find(d => d['实例名称'] === instance && d['计数名称'] === metric);
                series[key].push(match ? match['数值'] : 0);
            });
        });
        
        return { timePoints, series };
    }
}
```

- [ ] **Step 3: 创建 chart.js**

```javascript
// static/js/chart.js

class ChartManager {
    constructor(domId) {
        this.chart = echarts.init(document.getElementById(domId));
        this.option = {};
    }
    
    update(data) {
        const { timePoints, series } = data;
        
        const seriesData = Object.keys(series).map(key => ({
            name: key,
            type: 'line',
            data: series[key],
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
        }));
        
        this.option = {
            title: {
                text: '日志计数趋势图',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    let result = params[0].axisValue + '<br/>';
                    params.forEach(p => {
                        result += `${p.seriesName}: ${p.value}<br/>`;
                    });
                    return result;
                }
            },
            legend: {
                type: 'scroll',
                bottom: 10,
                data: Object.keys(series)
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none'
                    },
                    restore: {},
                    saveAsImage: {}
                }
            },
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    start: 0,
                    end: 100
                }
            ],
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: timePoints,
                axisLabel: {
                    rotate: 45
                }
            },
            yAxis: {
                type: 'value'
            },
            series: seriesData
        };
        
        this.chart.setOption(this.option);
    }
    
    resize() {
        this.chart.resize();
    }
}
```

- [ ] **Step 4: 创建 interactions.js**

```javascript
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
            if (brushComponent.areas.length > 0) {
                // 触发 dataZoom
                const area = brushComponent.areas[0];
                // ECharts 会自动处理框选后的缩放
            }
        });
        
        // 右键回退
        this.chartManager.chart.getZr().on('contextmenu', function(params) {
            const chart = this;
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
```

- [ ] **Step 5: 更新 ui.js**

```javascript
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
```

- [ ] **Step 6: 更新 CSS 样式**

```css
/* static/css/style.css */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 20px;
    background: #f5f5f5;
}

#app {
    max-width: 1400px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h1 {
    text-align: center;
    color: #333;
    margin-bottom: 20px;
}

.upload-section {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding: 15px;
    background: #f9f9f9;
    border-radius: 4px;
}

.filters {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    padding: 15px;
    background: #f9f9f9;
    border-radius: 4px;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.filter-group label {
    font-weight: bold;
    color: #555;
}

.filter-group select {
    min-width: 200px;
    height: 100px;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

button {
    padding: 8px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

button:hover {
    background: #0056b3;
}

#chart {
    min-height: 500px;
    margin-top: 20px;
}
```

- [ ] **Step 7: 测试完整流程**

- [ ] **Step 8: Commit**

```bash
git add log-analyzer/templates/ log-analyzer/static/
git commit -m "feat: 添加可视化前端实现"
```

---

### Task 5: 集成测试和优化

**Files:**
- Modify: `log-analyzer/app.py`（错误处理增强）
- 测试整体流程

- [ ] **Step 1: 增强错误处理**

```python
# app.py 添加错误处理
@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404
```

- [ ] **Step 2: 测试完整流程**

1. 运行 Flask 应用
2. 上传包含压缩包的目录
3. 验证解压、解析、可视化完整流程

- [ ] **Step 3: Commit**

```bash
git add log-analyzer/app.py
git commit -m "feat: 增强错误处理，完成集成"
```

---

## 总结

**任务总数：5 个**

执行方式选择：
1. **Subagent-Driven (推荐)** - 每个任务由独立子 agent 执行，适合快速迭代
2. **Inline Execution** - 在当前会话中分批执行，带审查检查点

**Which approach?**