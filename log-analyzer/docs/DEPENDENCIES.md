# 依赖说明

## Python 依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| Flask | >=2.0.0 | Web 框架 |

## CDN 依赖

| 资源 | 版本 | 用途 |
|------|------|------|
| ECharts | 5.4.3 | 图表可视化 |
| JetBrains Mono | - | 代码字体 |
| Noto Sans SC | - | 中文字体 |

## 文件依赖

### 后端
- `app.py` - 主应用
- `config.py` - 配置
- `utils.py` - 工具函数

### 脚本模块
- `scripts/base_parser.py` - 解析器基类
- `scripts/json_parser.py` - JSON 解析器
- `scripts/text_parser.py` - 文本解析器

### 前端
- `static/js/chart.js` - 图表管理
- `static/js/dataProcessor.js` - 数据处理
- `static/js/interactions.js` - 交互逻辑
- `static/js/ui.js` - UI 交互
- `static/css/style.css` - 样式