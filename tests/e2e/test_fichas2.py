# Duas fichas ao mesmo tempo (principal + usada junto) e aviso de treino esquecido aberto
import asyncio, os, sys, re, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta
def txt(s): return re.sub(r'\s+', ' ', s or '').strip()
async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 's@t.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        # segunda ficha: vira a principal; a primeira passa a ser usada junto
        import copy, uuid
        planos = fake.tables['plans']; p0 = planos[0]; p0['ativa'] = False
        p1 = copy.deepcopy(p0); p1.update({'id': str(uuid.uuid4()), 'nome': 'Ficha do Renan', 'ativa': True, 'created_at': p0.get('created_at')}); planos.append(p1)
        await pg.reload(); await pg.wait_for_selector('.hero', timeout=15000); await pg.click('#nav-treinos'); await pg.wait_for_selector('.wcard'); print('fichas:', [(x.get('nome'), x.get('ativa'), x.get('extra', False)) for x in planos])
        await pg.click('[data-a=fichas]'); await pg.wait_for_selector('[data-a=f-junto]')
        await pg.click('[data-a=f-junto][data-v="1"]'); await pg.wait_for_timeout(600)
        print('depois de usar junto:', [(x.get('nome'), x.get('ativa'), x.get('extra', False)) for x in planos])
        await pg.screenshot(path=SHOTS+'f2-fichas.png')
        await pg.click('#sheet [data-a=close]')
        extra = next(x for x in planos if x.get('extra'))
        print('Treinos mostra a extra:', await pg.query_selector(f'[data-v^="treino:"][data-v$="@{extra["id"]}"]') is not None)
        await pg.screenshot(path=SHOTS+'f2-treinos.png', full_page=True)
        # escolher no dia
        await pg.click('#nav-hoje'); await pg.click('[data-a=trocar-treino]'); await pg.wait_for_selector('.tt-ficha')
        print('outro treino tem seção da extra:', txt(await pg.text_content('.tt-ficha')))
        await pg.click(f'#sheet-card [data-a=start][data-p="{extra["id"]}"] >> nth=0'); await pg.wait_for_selector('#set-0-0')
        print('sessão:', txt(await pg.text_content('.shead .st b')))
        await pg.fill('#w-0-0-0', '30'); await pg.click('#set-0-0 .chk')
        await pg.click('[data-a=rest-skip]') if await pg.query_selector('[data-a=rest-skip]') else None
        # esquecido: a última atividade foi há 1 hora
        await pg.evaluate("""()=>{ const k = Object.keys(localStorage).find(k=>k.startsWith('mt.draft.')); const d = JSON.parse(localStorage.getItem(k)); const h = Date.now()-3600e3; d.start = h-600e3; d.at = h; d.lastSetAt = h; localStorage.setItem(k, JSON.stringify(d)); }""")
        await pg.reload(); await pg.wait_for_selector('[data-a=esq-finalizar]', timeout=15000)
        print('aviso esquecido:', txt(await pg.text_content('#sheet-card'))[:200])
        await pg.locator('#sheet-card').screenshot(path=SHOTS+'f2-esquecido.png')
        await pg.click('[data-a=esq-finalizar]'); await pg.wait_for_selector('[data-a=save]')
        await pg.click('[data-a=save]'); await pg.wait_for_timeout(900)
        s = fake.tables['sessions'][-1]
        print('salvo na ficha extra:', s['plan_id'] == extra['id'], '| duração (min):', round((time.mktime(time.strptime(s['ended_at'][:19], '%Y-%m-%dT%H:%M:%S')) - time.mktime(time.strptime(s['started_at'][:19], '%Y-%m-%dT%H:%M:%S')))/60))
        if await pg.is_visible('#sheet'): await pg.click('#sheet [data-a=close] >> nth=0')
        await pg.click('#nav-treinos'); await pg.wait_for_timeout(300)
        print('execuções na extra:', txt(await pg.text_content(f'[data-v="treino:A@{extra["id"]}"] .exec')))
        # link da notificação sem treino aberto
        await pg.goto(APP+'?acao=finalizar'); await pg.wait_for_timeout(2500)
        print('link sem treino:', txt(await pg.text_content('#toast')))
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
