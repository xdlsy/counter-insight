# scripts/text_parser.py
import re
from datetime import datetime
from scripts.base_parser import BaseParser

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