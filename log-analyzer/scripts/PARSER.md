# 解析器开发指南

## 概述

解析器用于将日志文件转换为统一的数据格式，供图表可视化使用。

## 基类结构

所有解析器必须继承 `BaseParser` 类，并实现以下属性和方法：

```python
from scripts.base_parser import BaseParser

class MyParser(BaseParser):
    name = "my_parser"      # 解析器名称（必填）
    priority = 30           # 优先级，数字越小越优先（必填）

    def can_process(self, file_path: str) -> bool:
        """检查是否能处理该文件"""
        return file_path.endswith('.mylog')

    def process(self, file_path: str) -> list:
        """处理文件，返回数据列表"""
        results = []
        # ... 解析逻辑
        return results
```

## 输出格式要求

`process` 方法必须返回一个列表，列表中每个元素是字典，包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| 实例名称 | str | 数据来源实例名（如文件名、主机名） |
| 计数名称 | str | 计数器名称（如 ERROR_count、request_count） |
| 数值 | int/float | 计数值 |
| 时间 | str | 时间戳，格式 `YYYY-MM-DD HH:MM:SS` |

**示例输出：**

```python
[
    {'实例名称': 'app.log', '计数名称': 'ERROR_count', '数值': 5, '时间': '2026-04-11 10:00:00'},
    {'实例名称': 'app.log', '计数名称': 'INFO_count', '数值': 100, '时间': '2026-04-11 10:00:00'},
]
```

## 优先级说明

解析器按优先级从小到大排序，优先级低的解析器优先尝试处理文件：

- `10` - 最高优先级（如 json_parser）
- `20` - 次高优先级（如 text_parser）
- `30+` - 自定义解析器

## 现有解析器示例

### JSON 解析器 (json_parser.py)

处理 `.json` 文件，每行一个 JSON 对象。

### 文本解析器 (text_parser.py)

处理 `.log`、`.txt` 文件，统计日志级别（DEBUG、INFO、WARN、ERROR）。

## 上传自定义解析器

1. 点击解析器面板底部的"上传解析器"按钮
2. 选择你的 `.py` 解析器脚本
3. 选择一个测试数据文件用于校验
4. 点击"上传并校验"

系统会自动校验：
- 类结构是否正确
- 输出格式是否符合要求

校验成功后，解析器会自动生效。