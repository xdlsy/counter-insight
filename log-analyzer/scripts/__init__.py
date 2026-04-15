# scripts/__init__.py
import os
import json
import importlib
from pathlib import Path
from scripts.base_parser import BaseParser

def get_config_dir():
    """获取配置目录"""
    return os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config')

def load_parser_priorities():
    """加载解析器优先级配置"""
    config_file = os.path.join(get_config_dir(), 'parser_priorities.json')
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            return json.load(f)
    return {}

def save_parser_priorities(priorities):
    """保存解析器优先级配置"""
    config_dir = get_config_dir()
    os.makedirs(config_dir, exist_ok=True)
    config_file = os.path.join(config_dir, 'parser_priorities.json')
    with open(config_file, 'w') as f:
        json.dump(priorities, f)

def load_parsers():
    """加载所有解析器"""
    parsers = []
    script_dir = Path(__file__).parent

    # 加载保存的优先级配置
    saved_priorities = load_parser_priorities()

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
                        parser = attr()
                        # 应用保存的优先级
                        if parser.name in saved_priorities:
                            parser.priority = saved_priorities[parser.name]
                        parsers.append(parser)
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