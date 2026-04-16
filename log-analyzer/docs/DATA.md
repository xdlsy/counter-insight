# 数据说明

## CSV 输出格式

解析后的数据统一输出为 CSV 格式：

```
实例名称,计数名称,数值,时间
server1.log,INFO_count,1,2024-01-01 10:00:00
server1.log,ERROR_count,2,2024-01-01 10:00:00
api-gateway,requests_total,150,2024-01-01 10:00:00
```

## 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| 实例名称 | string | 日志来源标识（文件名） |
| 计数名称 | string | 计数类型（如 INFO_count） |
| 数值 | int | 计数数值 |
| 时间 | string | 时间戳 |

## 支持的日志类型

### 文本日志 (.log, .txt)
- 按行统计日志级别：INFO, DEBUG, WARN, ERROR
- 计数名称格式：`{LEVEL}_count`

### JSON 日志 (.json)
- 提取数值类型字段作为计数
- 字段名作为计数名称
- 支持 instance/host 作为实例名称

## 数据筛选

支持多选筛选：
- 实例名称筛选
- 计数名称筛选

筛选后数据按时间分组，用于图表展示。