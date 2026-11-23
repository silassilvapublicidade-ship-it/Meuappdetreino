"""Roda todos os testes de ponta a ponta contra o app em APP_URL (padrão http://127.0.0.1:4173/).
Uso: npm run build && npx vite preview --port 4173 &  python3 tests/e2e/run_all.py [nome ...]"""
import glob, os, subprocess, sys, time
DIR = os.path.dirname(os.path.abspath(__file__))
# avisos do navegador que não são erro do app
IGNORAR = ('Failed to load', 'Push API in incognito', 'navigator.vibrate', 'net::ERR')
def avaliar(saida):
    if 'Traceback' in saida: return 'quebrou'
    for linha in saida.splitlines():
        if 'PAGEERROR' in linha: return 'erro na página'
        if linha.startswith(('ERROS:', 'ERRORS')):
            resto = linha.split(':', 1)[-1].strip() if ':' in linha else linha[6:].strip()
            if resto not in ('[]', '') and not all(any(i in x for i in IGNORAR) for x in resto.strip('[]').split("', '")):
                return 'erros no console'
    return None
testes = sorted(glob.glob(os.path.join(DIR, 'test_*.py')))
if len(sys.argv) > 1: testes = [t for t in testes if any(a in t for a in sys.argv[1:])]
falhas = []
for t in testes:
    nome = os.path.basename(t)[:-3]; ini = time.time()
    try:
        r = subprocess.run([sys.executable, t], capture_output=True, text=True, timeout=300, cwd=DIR)
        saida = r.stdout + r.stderr
        motivo = avaliar(saida) or (None if r.returncode == 0 else f'saiu com {r.returncode}')
    except subprocess.TimeoutExpired:
        saida, motivo = '', 'passou de 5 minutos'
    print(f"{'✗' if motivo else '✓'} {nome} ({time.time()-ini:.0f}s){' — '+motivo if motivo else ''}", flush=True)
    if motivo:
        falhas.append(nome); print('\n'.join(saida.splitlines()[-25:]), flush=True)
print(f"\n{len(testes)-len(falhas)} de {len(testes)} passaram.")
sys.exit(1 if falhas else 0)
