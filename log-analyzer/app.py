from flask import Flask, render_template, request, jsonify
from config import UPLOAD_FOLDER
import os
import uuid
from utils import process_directory, is_compressed, extract_all

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    return render_template('index.html')

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
            f.save(os.path.join(upload_dir, f.filename))

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)