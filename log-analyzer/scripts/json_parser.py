# scripts/json_parser.py
import json
from datetime import datetime
from scripts.base_parser import BaseParser

class JsonParser(BaseParser):
    name = "json"
    priority = 10  # JSON 解析器优先级最高

    def can_process(self, file_path: str) -> bool:
        return file_path.endswith('.json')

    def process(self, file_path: str):
        results = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        data = json.loads(line.strip())
                        # 提取实例名称、计数、数值、时间
                        instance = data.get('instance', data.get('host', 'unknown'))
                        timestamp = data.get('timestamp', data.get('time', datetime.now().isoformat()))

                        # 统计各字段
                        for key, value in data.items():
                            if isinstance(value, (int, float)) and key not in ['instance', 'host', 'timestamp', 'time']:
                                results.append({
                                    '实例名称': instance,
                                    '计数名称': key,
                                    '数值': value,
                                    '时间': timestamp
                                })
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

        return results