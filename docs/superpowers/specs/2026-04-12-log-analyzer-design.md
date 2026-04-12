---
name: log-analyzer-design
description: 日志分析可视化工具设计方案
type: project
---

# 日志分析可视化工具 - 设计文档

## 1. 项目概述

- **项目名称**：Log Analyzer
- **项目类型**：Web 本地应用
- **核心功能**：分析日志文件计数并进行可视化展示
- **目标用户**：运维工程师、开发人员、日志分析需求者

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Web 应用 (Flask)                             │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│   输入层     │   处理层    │   可视化层  │      存储层              │
│  - 文件/目录  │ - 递归解压  │ - ECharts   │  - uploads/ (临时文件)  │
│  - 选择器     │ - 脚本执行  │ - 数据聚合  │  - scripts/ (脚本目录)   │
│             │ - CSV解析   │ - 多选筛选  │                         │
└─────────────┴─────────────┴─────────────┴─────────────────────────┘
```

## 3. 功能模块设计

### 3.1 输入层

**文件/目录选择器**
- 支持单文件上传
- 支持目录选择
- 拖拽上传支持

### 3.2 解压模块

**递归解压逻辑**
1. 检查文件是否为压缩包（.zip, .tar.gz, .tar, .tgz）
2. 解压到临时目录
3. 递归处理解压后的文件
4. 删除原始压缩包
5. 重复直到只剩纯文本文件（.log, .txt, .log.1 等）

### 3.3 脚本处理层

**脚本目录结构**
```
scripts/
├── __init__.py
├── base_parser.py      # 基类，定义统一接口
├── json_parser.py      # 内置：JSON 日志解析
├── text_parser.py      # 内置：文本日志解析
└── ...
```

**脚本接口规范**
```python
class BaseParser:
    def process(self, file_path: str) -> List[Dict]:
        """
        处理单个日志文件
        返回: [{"实例名称": str, "计数名称": str, "数值": int, "时间": str}, ...]
        """
        raise NotImplementedError
```

**脚本发现机制**
- 启动时自动扫描 `scripts/` 目录
- 加载所有继承 `BaseParser` 的类
- 依次调用处理文件，聚合结果

### 3.4 数据格式

**统一 CSV 输出格式**
```
实例名称,计数名称,数值,时间
instance_1,error_count,5,2024-01-01 10:00:00
instance_1,warn_count,10,2024-01-01 10:00:00
```

### 3.5 可视化层

**图表类型**：ECharts 时间趋势图（折线图）

**交互功能**：
| 功能 | 实现方式 |
|-----|---------|
| 时间筛选 | dataZoom 滑动条组件 |
| 框选放大 | brush 组件 + dataZoom |
| 右键回退 | contextmenu 事件监听 |
| 多图表联动 | ECharts connect API |
| 悬停提示 | tooltip 组件 |
| 导出图片 | getDataURL API |

**筛选功能**：
- 单实例单计数
- 多实例单计数
- 单实例多计数
- 多实例多计数

## 4. 技术栈

- **后端**：Flask + Python 3.x
- **前端**：原生 JavaScript + ECharts 5.x
- **文件处理**：Python zipfile, tarfile, shutil

## 5. 目录结构

```
log-analyzer/
├── app.py                    # Flask 主应用
├── config.py                 # 配置文件
├── requirements.txt          # 依赖
├── scripts/                  # 脚本目录（内置 + 用户自定义）
│   ├── __init__.py
│   ├── base_parser.py
│   ├── json_parser.py
│   └── text_parser.py
├── templates/
│   └── index.html            # 主页面
├── static/
│   ├── js/
│   │   ├── chart.js          # 图表初始化、配置
│   │   ├── interactions.js   # 交互逻辑（缩放、框选）
│   │   ├── dataProcessor.js # 数据处理、筛选
│   │   └── ui.js             # UI 组件
│   └── css/
│       └── style.css
└── uploads/                  # 上传文件临时目录
```

## 6. 扩展性设计

### 6.1 脚本扩展
- 用户可在 `scripts/` 目录添加自定义脚本
- 只需继承 `BaseParser` 并实现 `process` 方法

### 6.2 可视化扩展
- ECharts 支持 30+ 图表类型，可轻松添加新图表
- 模块化 JS 设计，便于添加新交互功能

### 6.3 数据源扩展
- 当前支持本地文件/目录
- 后续可扩展为 API、数据库等数据源

## 7. 后续扩展功能

- [ ] 时间范围筛选（起始时间 - 结束时间）
- [ ] 框选放大功能
- [ ] 右键回退放大
- [ ] 导出数据为 CSV
- [ ] 导出图表为图片
- [ ] 多图表联动
- [ ] 动态数据定时刷新
- [ ] 历史记录保存