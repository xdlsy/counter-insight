from flask import Flask, render_template, request, jsonify, Response
from config import UPLOAD_FOLDER
import os
import uuid
import csv
import io
import subprocess
import json
import importlib
import tempfile
import time
from utils import process_directory, is_compressed, extract_all
from scripts import load_parsers, get_parser_file_path
from scripts.base_parser import BaseParser

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 编辑器配置文件路径
EDITOR_CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'config', 'editor_config.json')

def load_editor_config():
    """加载编辑器配置"""
    if os.path.exists(EDITOR_CONFIG_FILE):
        with open(EDITOR_CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {'editor': 'code'}  # 默认使用 VS Code

def save_editor_config(config):
    """保存编辑器配置"""
    config_dir = os.path.dirname(EDITOR_CONFIG_FILE)
    os.makedirs(config_dir, exist_ok=True)
    with open(EDITOR_CONFIG_FILE, 'w') as f:
        json.dump(config, f)

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/parsers', methods=['GET'])
def get_parsers():
    """获取解析器列表（按优先级排序）"""
    from scripts import get_parsers_info
    return jsonify({'parsers': get_parsers_info()})

@app.route('/parsers', methods=['POST'])
def update_parsers():
    """更新解析器优先级"""
    data = request.json
    priorities = data.get('priorities', {})

    # 保存优先级到配置文件
    from scripts import save_parser_priorities
    save_parser_priorities(priorities)

    return jsonify({'success': True})

@app.route('/editor-config', methods=['GET'])
def get_editor_config():
    """获取编辑器配置"""
    return jsonify(load_editor_config())

@app.route('/editor-config', methods=['POST'])
def update_editor_config():
    """更新编辑器配置"""
    data = request.json
    editor = data.get('editor', 'code')
    config = {'editor': editor}
    save_editor_config(config)
    return jsonify({'success': True})

@app.route('/parser/<name>/open', methods=['POST'])
def open_parser(name):
    """用编辑器打开解析器脚本"""
    file_path = get_parser_file_path(name)
    if not file_path:
        return jsonify({'error': 'Parser not found'}), 404

    config = load_editor_config()
    editor = config.get('editor', 'code')

    try:
        # 处理不同编辑器命令
        import platform
        system = platform.system()

        if editor == 'open' and system == 'Darwin':
            # macOS: 使用 open -e 用默认文本编辑器打开
            subprocess.Popen(['open', '-e', file_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif editor == 'open' and system == 'Windows':
            # Windows: 直接用 start 打开
            subprocess.Popen(['start', file_path], shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            # 其他编辑器（code, vim, subl 等）
            subprocess.Popen([editor, file_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        return jsonify({'success': True, 'file_path': file_path})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 解析器校验函数
def validate_parser_structure(module):
    """校验解析器类结构"""
    errors = []
    parser_class = None

    # 查找继承 BaseParser 的类
    for name in dir(module):
        obj = getattr(module, name)
        try:
            if isinstance(obj, type) and issubclass(obj, BaseParser) and obj != BaseParser:
                parser_class = obj
                break
        except TypeError:
            continue

    if not parser_class:
        errors.append("未找到继承 BaseParser 的类")
        return errors, None

    # 检查必要属性
    if not hasattr(parser_class, 'name'):
        errors.append("缺少必要属性: name")
    if not hasattr(parser_class, 'priority'):
        errors.append("缺少必要属性: priority")

    # 检查必要方法
    if not hasattr(parser_class, 'can_process'):
        errors.append("缺少必要方法: can_process")
    elif not callable(getattr(parser_class, 'can_process')):
        errors.append("can_process 必须是可调用方法")

    if not hasattr(parser_class, 'process'):
        errors.append("缺少必要方法: process")
    elif not callable(getattr(parser_class, 'process')):
        errors.append("process 必须是可调用方法")

    return errors, parser_class

def validate_parser_output(parser, test_file_path):
    """校验解析器输出格式"""
    errors = []
    required_fields = ['实例名称', '计数名称', '数值', '时间']

    try:
        # 创建解析器实例
        parser_instance = parser()

        if not parser_instance.can_process(test_file_path):
            errors.append("can_process 返回 False，无法处理测试文件")
            return errors

        results = parser_instance.process(test_file_path)

        if not isinstance(results, list):
            errors.append(f"process 返回类型错误: 期望 list, 实际 {type(results).__name__}")
            return errors

        if len(results) == 0:
            errors.append("process 返回空列表，无数据")
            return errors

        for i, item in enumerate(results):
            if not isinstance(item, dict):
                errors.append(f"第 {i+1} 个结果类型错误: 期望 dict, 实际 {type(item).__name__}")
                continue

            missing = [f for f in required_fields if f not in item]
            if missing:
                errors.append(f"第 {i+1} 个结果缺少字段: {', '.join(missing)}")

    except Exception as e:
        errors.append(f"执行 process 时出错: {str(e)}")

    return errors

@app.route('/parser/upload', methods=['POST'])
def upload_parser():
    """上传并校验解析器"""
    # 检查文件
    if 'parser_file' not in request.files:
        return jsonify({'errors': ['未提供解析器脚本文件']}), 400
    if 'test_file' not in request.files:
        return jsonify({'errors': ['未提供测试数据文件']}), 400

    parser_file = request.files['parser_file']
    test_file = request.files['test_file']

    if not parser_file.filename.endswith('.py'):
        return jsonify({'errors': ['解析器脚本必须是 .py 文件']}), 400

    errors = []

    try:
        # 保存上传文件到临时目录
        temp_dir = tempfile.mkdtemp()
        parser_path = os.path.join(temp_dir, parser_file.filename)
        test_path = os.path.join(temp_dir, test_file.filename)

        parser_file.save(parser_path)
        test_file.save(test_path)

        # 动态导入模块
        module_name = parser_file.filename[:-3]  # 去掉 .py
        spec = importlib.util.spec_from_file_location(module_name, parser_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # 类结构校验
        structure_errors, parser_class = validate_parser_structure(module)
        errors.extend(structure_errors)

        # 如果结构校验通过，进行输出格式校验
        if parser_class and not structure_errors:
            output_errors = validate_parser_output(parser_class, test_path)
            errors.extend(output_errors)

        # 校验成功，保存到 scripts 目录
        if not errors:
            scripts_dir = os.path.join(os.path.dirname(__file__), 'scripts')
            final_path = os.path.join(scripts_dir, parser_file.filename)

            # 检查是否已存在同名文件
            if os.path.exists(final_path):
                errors.append(f"解析器 '{parser_file.filename}' 已存在")

        if not errors:
            # 复制文件到 scripts 目录
            import shutil
            shutil.copy(parser_path, final_path)

            # 清理临时目录
            shutil.rmtree(temp_dir)

            return jsonify({'success': True, 'message': f'解析器 {parser_class.name} 已成功添加'})

        # 清理临时目录
        import shutil
        shutil.rmtree(temp_dir)

        return jsonify({'errors': errors}), 400

    except Exception as e:
        return jsonify({'errors': [f'处理上传文件时出错: {str(e)}']}), 500

@app.route('/parser-guide/open', methods=['POST'])
def open_parser_guide():
    """打开开发指南文件"""
    scripts_dir = os.path.join(os.path.dirname(__file__), 'scripts')
    guide_path = os.path.join(scripts_dir, 'PARSER.md')

    if not os.path.exists(guide_path):
        return jsonify({'error': '开发指南文件不存在'}), 404

    config = load_editor_config()
    editor = config.get('editor', 'code')

    try:
        import platform
        system = platform.system()

        if editor == 'open' and system == 'Darwin':
            subprocess.Popen(['open', '-e', guide_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif editor == 'open' and system == 'Windows':
            subprocess.Popen(['start', guide_path], shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            subprocess.Popen([editor, guide_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        return jsonify({'success': True, 'file_path': guide_path})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/parser-dir/open', methods=['POST'])
def open_parser_dir():
    """打开脚本目录"""
    scripts_dir = os.path.join(os.path.dirname(__file__), 'scripts')

    if not os.path.exists(scripts_dir):
        return jsonify({'error': '脚本目录不存在'}), 404

    try:
        import platform
        system = platform.system()

        if system == 'Darwin':
            # macOS: 使用 open 打开目录
            subprocess.Popen(['open', scripts_dir], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif system == 'Windows':
            # Windows: 使用 explorer 打开目录
            subprocess.Popen(['explorer', scripts_dir], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            # Linux: 使用 xdg-open 打开目录
            subprocess.Popen(['xdg-open', scripts_dir], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        return jsonify({'success': True, 'dir_path': scripts_dir})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_progress_event(stage, step, total_steps, message, status='processing'):
    """生成 SSE 进度事件"""
    progress = int((step / total_steps) * 100) if total_steps > 0 else 0
    data = json.dumps({
        'stage': stage,
        'step': step,
        'total_steps': total_steps,
        'progress': progress,
        'message': message,
        'status': status
    })
    return f"data: {data}\n\n"

@app.route('/upload-progress', methods=['POST'])
def upload_with_progress():
    """带进度推送的上传处理接口（SSE）"""
    # 在请求上下文内先保存文件
    if 'file' not in request.files:
        return Response(generate_progress_event(1, 0, 1, '未提供文件', 'error'), mimetype='text/event-stream')

    files = request.files.getlist('file')
    if not files or files[0].filename == '':
        return Response(generate_progress_event(1, 0, 1, '未选择文件', 'error'), mimetype='text/event-stream')

    # 创建临时目录并保存文件
    session_id = str(uuid.uuid4())
    upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    os.makedirs(upload_dir, exist_ok=True)

    saved_files = []
    for f in files:
        if f.filename:
            file_path = os.path.join(upload_dir, f.filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            f.save(file_path)
            saved_files.append({'path': file_path, 'name': f.filename})

    def generate(saved_files, upload_dir, session_id):
        try:
            # ===== 阶段1: 处理输入数据 =====
            total_files = len(saved_files)

            yield generate_progress_event(1, 1, total_files + 2, f'已保存 {total_files} 个文件')

            # 检查是否需要解压
            compressed_file = None
            for sf in saved_files:
                if is_compressed(sf['path']):
                    compressed_file = sf
                    break

            if compressed_file:
                yield generate_progress_event(1, 2, total_files + 2, f'解压: {compressed_file["name"]}')
                try:
                    extract_all(compressed_file['path'], upload_dir)
                    yield generate_progress_event(1, total_files + 2, total_files + 2, '解压完成')
                except Exception as e:
                    yield generate_progress_event(1, 0, 1, f'解压失败: {str(e)}', 'error')
                    return

            # 获取文件列表
            yield generate_progress_event(1, total_files + 2, total_files + 2, '扫描文件列表')
            text_files = process_directory(upload_dir)
            yield generate_progress_event(1, total_files + 2, total_files + 2, f'找到 {len(text_files)} 个文件', 'success')

            # ===== 阶段2: 解析文件列表 =====
            if not text_files:
                yield generate_progress_event(2, 0, 1, '没有可处理的文件', 'error')
                return

            parsers = load_parsers()
            all_results = []
            total_to_process = len(text_files)

            for i, file_path in enumerate(text_files):
                yield generate_progress_event(2, i + 1, total_to_process, f'解析: {os.path.basename(file_path)}')
                try:
                    for parser in parsers:
                        if parser.can_process(file_path):
                            results = parser.process(file_path)
                            all_results.extend(results)
                            break
                except Exception as e:
                    yield generate_progress_event(2, i + 1, total_to_process, f'解析失败: {str(e)}', 'error')
                    return

            yield generate_progress_event(2, total_to_process, total_to_process, f'解析完成，共 {len(all_results)} 条数据', 'success')

            # ===== 阶段3: 生成可视化数据 =====
            yield generate_progress_event(3, 1, 3, '生成数据格式')

            output = io.StringIO()
            if all_results:
                fieldnames = ['实例名称', '计数名称', '数值', '时间']
                writer = csv.DictWriter(output, fieldnames=fieldnames, lineterminator='\n')
                writer.writeheader()
                for row in all_results:
                    clean_row = {k: v.strip() if isinstance(v, str) else v for k, v in row.items()}
                    writer.writerow(clean_row)

            csv_data = output.getvalue()
            yield generate_progress_event(3, 2, 3, '数据处理完成')

            # 返回最终结果
            final_data = json.dumps({
                'stage': 3,
                'progress': 100,
                'message': '处理完成',
                'status': 'success',
                'result': {
                    'session_id': session_id,
                    'csv_data': csv_data,
                    'total_records': len(all_results)
                }
            })
            yield f"data: {final_data}\n\n"

        except Exception as e:
            yield generate_progress_event(1, 0, 1, f'处理失败: {str(e)}', 'error')

    return Response(generate(saved_files, upload_dir, session_id), mimetype='text/event-stream')

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    files = request.files.getlist('file')
    if not files or files[0].filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # 创建临时目录
    session_id = str(uuid.uuid4())
    upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    os.makedirs(upload_dir, exist_ok=True)

    # 保存上传的文件
    for f in files:
        if f.filename:
            # 创建子目录（如果有）
            file_path = os.path.join(upload_dir, f.filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            f.save(file_path)

    # 如果是单个文件，检查是否需要解压
    if len(files) == 1 and os.path.isfile(os.path.join(upload_dir, files[0].filename)):
        file_path = os.path.join(upload_dir, files[0].filename)
        if is_compressed(file_path):
            extract_all(file_path, upload_dir)

    # 处理目录，获取所有纯文本文件
    text_files = process_directory(upload_dir)

    return jsonify({
        'session_id': session_id,
        'files': text_files
    })

@app.route('/process', methods=['POST'])
def process_files():
    data = request.json
    session_id = data.get('session_id')
    files = data.get('files', [])

    if not files:
        return jsonify({'error': 'No files to process'}), 400

    # 加载所有解析器
    parsers = load_parsers()

    # 处理所有文件
    all_results = []
    for file_path in files:
        for parser in parsers:
            if parser.can_process(file_path):
                results = parser.process(file_path)
                all_results.extend(results)
                break  # 一个文件只用一个解析器处理

    # 转换为 CSV 格式
    output = io.StringIO()
    if all_results:
        # 清理字段名中的\r字符
        fieldnames = ['实例名称', '计数名称', '数值', '时间']
        writer = csv.DictWriter(output, fieldnames=fieldnames, lineterminator='\n')
        writer.writeheader()
        for row in all_results:
            # 清理每行数据
            clean_row = {k: v.strip() if isinstance(v, str) else v for k, v in row.items()}
            writer.writerow(clean_row)

    csv_data = output.getvalue()

    return jsonify({
        'csv_data': csv_data,
        'results': all_results
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)