# 日志解析脚本开发指南

本文档说明如何为日志分析工具开发新的解析器脚本。

## 一、接口规范

每个解析器必须继承 `BaseParser` 基类，实现以下两个方法：

```python
from scripts.base_parser import BaseParser

class MyParser(BaseParser):
    name = "my_parser"  # 解析器名称，用于自动识别

    def can_process(self, file_path: str) -> bool:
        """检查是否能够处理该文件"""
        # 返回 True 表示该解析器可以处理此文件
        return file_path.endswith('.my_extension')

    def process(self, file_path: str) -> List[Dict]:
        """处理日志文件，返回标准化数据列表"""
        # 解析逻辑...
        return results
```

### 自动加载机制

解析器文件命名必须以 `_parser.py` 结尾（如 `json_parser.py`、`text_parser.py`），放置在 `scripts/` 目录下。系统会自动扫描并加载所有解析器。

---

## 二、输出格式规范

解析器 `process()` 方法必须返回以下格式的列表：

```python
results = [
    {
        "实例名称": "api-gateway",      # str: 日志来源标识
        "计数名称": "requests_total",   # str: 计数类型
        "数值": 150,                     # int/float: 计数数值
        "时间": "2026-04-11 10:00:00"   # str: 时间戳
    },
    # ... 更多记录
]
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 实例名称 | string | 是 | 日志来源标识，如 hostname、service name、文件名等 |
| 计数名称 | string | 是 | 计数类型，如 `requests_total`、`error_count` |
| 数值 | int/float | 是 | 计数数值，必须是可加减的数字 |
| 时间 | string | 是 | 时间戳，格式建议：`YYYY-MM-DD HH:MM:SS` |

---

## 三、输入数据格式

### JSON Lines 格式（推荐）

每行一个 JSON 对象：

```json
{"instance": "api-gateway", "requests_total": 120, "timestamp": "2026-04-11 00:00:00"}
{"instance": "api-gateway", "requests_success": 115, "timestamp": "2026-04-11 00:00:00"}
{"instance": "db-primary", "connections": 25, "timestamp": "2026-04-11 00:00:00"}
```

### 实例名称字段优先级

解析器应按以下优先级识别实例名称：

1. `instance` - 最常用
2. `host`
3. `service`
4. `service_name`
5. 文件名（降级方案）

### 时间字段优先级

1. `timestamp`
2. `time`
3. `datetime`
4. `created_at`
5. 当前时间（降级方案）

---

## 四、输出数据流转

```
解析器 process() 返回
        ↓
app.py 收集所有结果
        ↓
转换为 CSV 格式
        ↓
返回给前端 { csv_data, results }
        ↓
前端解析 CSV，存储到 dataProcessor
        ↓
构建树形结构（实例 → 计数）
        ↓
用户选择后过滤数据 → 图表展示
```

---

## 五、示例代码

### 示例 1：简单的 JSON 解析器

```python
# scripts/json_parser.py
import json
from datetime import datetime
from typing import List, Dict
from scripts.base_parser import BaseParser

class JsonParser(BaseParser):
    name = "json"

    def can_process(self, file_path: str) -> bool:
        return file_path.endswith('.json')

    def process(self, file_path: str) -> List[Dict]:
        results = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    # 提取实例名称
                    instance = data.get('instance', data.get('host', 'unknown'))

                    # 提取时间
                    timestamp = data.get('timestamp', data.get('time', datetime.now().isoformat()))

                    # 提取数值字段
                    for key, value in data.items():
                        if isinstance(value, (int, float)) and key not in ['instance', 'host', 'timestamp', 'time']:
                            results.append({
                                '实例名称': instance,
                                '计数名称': key,
                                '数值': value,
                                '时间': timestamp
                            })

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

        return results
```

### 示例 2：文本日志解析器

```python
# scripts/text_parser.py
import re
from typing import List, Dict
from scripts.base_parser.py import BaseParser

class TextParser(BaseParser):
    name = "text"

    def can_process(self, file_path: str) -> bool:
        return file_path.endswith(('.log', '.txt'))

    def process(self, file_path: str) -> List[Dict]:
        results = []
        # 从文件路径提取实例名称（去掉扩展名）
        instance = file_path.split('/')[-1].rsplit('.', 1)[0]

        # 日志级别正则
        level_pattern = re.compile(r'\b(INFO|DEBUG|WARN|WARNING|ERROR|CRITICAL|FATAL)\b')

        # 临时存储每种级别的计数
        level_counts = {}

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    match = level_pattern.search(line)
                    if match:
                        level = match.group(1)
                        # 统一 WARN/WARNING
                        if level == 'WARNING':
                            level = 'WARN'
                        # 统一 CRITICAL/FATAL
                        if level == 'FATAL':
                            level = 'CRITICAL'
                        level_counts[level] = level_counts.get(level, 0) + 1

            # 从文件名中提取时间（简化处理：使用文件修改时间）
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            # 转换为结果格式
            for level, count in level_counts.items():
                results.append({
                    '实例名称': instance,
                    '计数名称': f'{level}_count',
                    '数值': count,
                    '时间': timestamp
                })

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

        return results
```

---

## 六、注意事项

1. **数值类型**：数值必须是 `int` 或 `float`，不能是字符串
2. **时间格式**：建议使用 `YYYY-MM-DD HH:MM:SS` 格式，确保前端能正确解析
3. **异常处理**：使用 try-except 包裹文件读取和解析逻辑，避免单个文件错误导致整个解析失败
4. **编码问题**：使用 `encoding='utf-8'`，并对无法解码的字符使用 `errors='ignore'`
5. **性能考虑**：大文件建议逐行处理，不要一次性加载整个文件到内存

---

## 七、测试建议

创建测试数据文件并验证输出：

```python
# 测试命令
curl -X POST -F "file=@your_test_file.json" http://localhost:5000/upload
# 然后调用 process 接口
curl -X POST -H "Content-Type: application/json" \
  -d '{"session_id": "xxx", "files": ["path/to/file.json"]}' \
  http://localhost:5000/process
```