# scripts/__init__.py
import os
import importlib
from pathlib import Path
from scripts.base_parser import BaseParser

def load_parsers():
    """加载所有解析器"""
    parsers = []
    script_dir = Path(__file__).parent

    for file in script_dir.glob('*_parser.py'):
        if file.name == 'base_parser.py':
            continue

        module_name = file.stem
        module = importlib.import_module(f'scripts.{module_name}')

        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if isinstance(attr, type) and attr.__name__ != 'BaseParser':
                try:
                    if issubclass(attr, BaseParser):
                        parsers.append(attr())
                except:
                    pass

    # 按优先级排序（低优先级数字在前）
    parsers.sort(key=lambda p: p.priority)
    return parsers

def get_parsers_info():
    """获取解析器信息列表（按优先级排序）"""
    parsers = load_parsers()
    return [
        {
            'name': p.name,
            'priority': p.priority,
            'can_process': p.can_process.__doc__ or ''
        }
        for p in parsers
    ]