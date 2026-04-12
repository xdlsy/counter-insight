import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
SCRIPTS_FOLDER = os.path.join(BASE_DIR, 'scripts')

ALLOWED_EXTENSIONS = {'log', 'txt', 'zip', 'tar', 'gz', 'tgz'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)