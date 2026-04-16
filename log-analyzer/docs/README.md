# Log Analyzer 项目结构

## 项目概述

Log Analyzer 是一个本地 Web 应用，用于分析日志文件的计数并可视化展示。

## 目录结构

```
log-analyzer/
├── app.py                  # Flask 主应用
├── config.py               # 配置文件
├── utils.py                # 工具函数（解压模块）
├── requirements.txt         # Python 依赖
├── scripts/                # 脚本处理模块
│   ├── __init__.py         # 脚本加载器
│   ├── base_parser.py      # 解析器基类
│   ├── json_parser.py      # JSON 日志解析器
│   └── text_parser.py      # 文本日志解析器
├── templates/
│   └── index.html          # 主页面模板
├── static/
│   ├── css/
│   │   └── style.css       # 样式文件
│   └── js/
│       ├── chart.js        # ECharts 图表管理
│       ├── dataProcessor.js # 数据处理器
│       ├── interactions.js # 交互逻辑
│       └── ui.js           # UI 交互
├── test-data/              # 测试数据
│   └── complex-test/      # 复杂测试用例
└── uploads/                # 上传文件临时目录
```

## 技术栈

- **后端**: Flask 2.0+
- **前端**: 原生 JavaScript + ECharts 5.x
- **字体**: JetBrains Mono + Noto Sans SC

## 快速开始

```bash
# 安装依赖
pip install -r requirements.txt

# 启动应用
python app.py

# 访问 http://127.0.0.1:5000
```

## 功能特性

1. **文件上传**: 支持拖拽或点击选择目录
2. **递归解压**: 自动解压 zip、tar.gz 等压缩包
3. **脚本处理**: 内置 JSON 和文本日志解析器
4. **可视化**: ECharts 时间趋势图
5. **筛选功能**: 支持多实例、多计数筛选
6. **交互**: 缩放、框选放大、右键回退