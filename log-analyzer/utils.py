# utils.py
import os
import zipfile
import tarfile
import shutil
from pathlib import Path

ALLOWED_EXTENSIONS = {'log', 'txt', 'log.1', 'log.2'}

def is_compressed(file_path):
    """检查文件是否为压缩包"""
    ext = os.path.splitext(file_path)[1].lower()
    return ext in ['.zip', '.tar', '.gz', '.tgz']

def extract_all(file_path, dest_folder):
    """递归解压文件"""
    if not os.path.exists(dest_folder):
        os.makedirs(dest_folder)

    # 如果是压缩包则解压
    if zipfile.is_zipfile(file_path):
        with zipfile.ZipFile(file_path, 'r') as z:
            z.extractall(dest_folder)
        os.remove(file_path)  # 删除原始压缩包
        return True
    elif tarfile.is_tarfile(file_path):
        with tarfile.open(file_path, 'r:*') as t:
            t.extractall(dest_folder)
        os.remove(file_path)  # 删除原始压缩包
        return True
    return False

def process_directory(folder_path):
    """递归处理目录中的所有文件"""
    text_files = []
    files = list(Path(folder_path).rglob('*'))

    for f in files:
        if not f.is_file():
            continue

        if is_compressed(str(f)):
            # 压缩包，解压到同目录
            parent = f.parent
            extract_all(str(f), str(parent))
        else:
            ext = f.suffix.lstrip('.')
            # 纯文本文件
            if ext in ALLOWED_EXTENSIONS or f.name.startswith('.'):
                continue
            text_files.append(str(f))

    # 递归直到没有压缩包
    has_compressed = any(is_compressed(str(f)) for f in Path(folder_path).rglob('*') if f.is_file())
    if has_compressed:
        return process_directory(folder_path)

    # 获取所有纯文本文件
    text_files = []
    for f in Path(folder_path).rglob('*'):
        if f.is_file() and not is_compressed(str(f)):
            text_files.append(str(f))

    return text_files