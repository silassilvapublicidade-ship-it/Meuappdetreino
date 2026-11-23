# Caminhos e navegador dos testes, iguais na sua máquina e no GitHub Actions.
import os
DIR = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.join(DIR, 'fixtures')
SHOTS = os.environ.get('SHOTS', os.path.join(DIR, 'shots')) + '/'
os.makedirs(SHOTS, exist_ok=True)
APP = os.environ.get('APP_URL', 'http://127.0.0.1:4173/')
_chrome = os.environ.get('CHROME')  # vazio: usa o Chromium do Playwright
LANCAR = dict(args=['--no-sandbox'], **({'executable_path': _chrome} if _chrome else {}))
