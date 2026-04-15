# scripts/text_parser.py
import re
from datetime import datetime
from collections import defaultdict
from scripts.base_parser import BaseParser

class TextParser(BaseParser):
    name = "text"
    priority = 20  # 文本日志解析器优先级次之

    # 日志级别正则
    LEVEL_PATTERN = re.compile(r'\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\b', re.IGNORECASE)
    # 时间戳正则 (如 2026-04-11 00:00:00)
    TIME_PATTERN = re.compile(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})')

    def can_process(self, file_path: str) -> bool:
        return file_path.endswith(('.log', '.txt')) or '.log.' in file_path

    def process(self, file_path: str):
        results = []
        instance = file_path.split('/')[-1].split('\\')[-1]

        # 按时间+级别聚合计数
        counts = defaultdict(lambda: defaultdict(int))

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    # 提取时间戳
                    time_match = self.TIME_PATTERN.search(line)
                    timestamp = time_match.group(1) if time_match else datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                    # 统计各级别
                    levels = self.LEVEL_PATTERN.findall(line)
                    for level in levels:
                        level_upper = level.upper()
                        if level_upper == 'WARNING':
                            level_upper = 'WARN'
                        counts[timestamp][level_upper] += 1
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

        # 转换为结果列表
        for timestamp, level_counts in sorted(counts.items()):
            for level, count in level_counts.items():
                results.append({
                    '实例名称': instance,
                    '计数名称': f'{level}_count',
                    '数值': count,
                    '时间': timestamp
                })

        return results