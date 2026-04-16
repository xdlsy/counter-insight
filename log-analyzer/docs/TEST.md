# 测试说明

## 测试数据

项目包含测试数据位于 `test-data/complex-test/`：

```
test-data/complex-test/
├── outer.zip          # 主压缩包（包含嵌套）
│   ├── server-app.log    # 文本日志
│   ├── api-metrics.json  # JSON 指标
│   ├── inner.zip         # 嵌套压缩包
│   └── nested.zip        # 嵌套压缩包
├── inner.zip          # 独立压缩包
├── api-metrics.json   # 独立 JSON
├── server-app.log     # 独立文本日志
└── nested/
    ├── nested.zip
    └── worker.log
```

## 测试项

### 1. 文件上传
- [x] 单文件上传
- [x] 目录上传
- [x] 拖拽上传

### 2. 解压功能
- [x] ZIP 压缩包解压
- [x] 嵌套压缩包递归解压
- [x] 压缩包自动删除

### 3. 脚本解析
- [x] 文本日志解析 (INFO/DEBUG/WARN/ERROR)
- [x] JSON 日志解析 (数值字段提取)

### 4. 可视化
- [x] 时间趋势图显示
- [x] 实例筛选
- [x] 计数筛选
- [x] 图表缩放

## 手动测试

1. 启动应用：`python app.py`
2. 访问 http://127.0.0.1:5000
3. 上传 `test-data/complex-test/` 目录
4. 查看图表和筛选功能