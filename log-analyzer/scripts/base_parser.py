# scripts/base_parser.py
from abc import ABC, abstractmethod
from typing import List, Dict

class BaseParser(ABC):
    """日志解析器基类"""

    name = "base"  # 解析器名称

    @abstractmethod
    def process(self, file_path: str) -> List[Dict]:
        """
        处理单个日志文件
        返回格式: [{"实例名称": str, "计数名称": str, "数值": int, "时间": str}, ...]
        """
        pass

    def can_process(self, file_path: str) -> bool:
        """检查是否能够处理该文件"""
        return False