# API 参考文档

## 后端 API

### 上传接口

**POST** `/upload`

上传文件或目录，返回文件列表。

**请求**
- Content-Type: `multipart/form-data`
- Body: `file` - 文件或目录

**响应**
```json
{
  "session_id": "uuid-string",
  "files": ["/path/to/file1", "/path/to/file2"]
}
```

### 处理接口

**POST** `/process`

处理文件列表，返回 CSV 格式的计数数据。

**请求**
- Content-Type: `application/json`
```json
{
  "session_id": "uuid-string",
  "files": ["/path/to/file1", "/path/to/file2"]
}
```

**响应**
```json
{
  "csv_data": "实例名称,计数名称,数值,时间\n...",
  "results": [{"实例名称": "...", "计数名称": "...", "数值": 1, "时间": "..."}]
}
```

## 前端模块

### ChartManager

图表管理类，负责 ECharts 初始化和更新。

```javascript
class ChartManager {
  constructor(domId)  // 初始化图表
  update(data)        // 更新图表数据
  resize()            // 响应窗口大小变化
}
```

### DataProcessor

数据处理类，负责解析和过滤数据。

```javascript
class DataProcessor {
  setData(csvData)          // 设置 CSV 数据
  getInstances()            // 获取实例列表
  getMetrics()              // 获取计数列表
  filterData(instances, metrics)  // 筛选数据
  groupByTime(data)         // 按时间分组
}
```

### Interactions

交互管理类，处理图表交互事件。

```javascript
class Interactions {
  constructor(chartManager)
  setupEvents()  // 设置事件监听
}
```

## 脚本接口

所有解析器需要继承 `BaseParser` 并实现以下方法：

```python
class BaseParser(ABC):
    @abstractmethod
    def process(self, file_path: str) -> List[Dict]:
        """处理单个日志文件，返回计数列表"""
        pass

    def can_process(self, file_path: str) -> bool:
        """检查是否能够处理该文件"""
        pass
```

返回数据格式：
```python
[
    {"实例名称": "xxx", "计数名称": "xxx", "数值": 1, "时间": "2024-01-01 10:00:00"},
    ...
]
```