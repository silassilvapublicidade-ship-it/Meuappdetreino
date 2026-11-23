import asyncio, sys, re, time
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH

def txt(s): return re.sub(r'\s+', ' ', s or '').strip()
def iso(ts): return time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(ts))

async def main():
    fake = Fake(); errs = []; fake.inicio = {'completos': ['agua','sono','missoes','grupo'], 'auto': False}
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@teste.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        uid = fake.tables['profiles'][0]['id']
        plan = fake.tables['plans'][0]
        ordem = plan['treinos'].get('order') or sorted(plan['treinos']['w'].keys())
        A = plan['treinos']['w'][ordem[0]]['ex'][0]
        ultima = ordem[-1]
        print('1º exercício A:', A['n'])
        # histórico: treinos nos últimos dias (para sequência e para ter recorde a bater)
        from modelo_keys import chave
        k = chave(A['n'])
        agora = time.time()
        for dias in (6, 4, 2, 1):
            t = agora - dias*86400
            fake.tables['sessions'].append({'id': f's{dias}', 'user_id': uid, 'plan_id': plan['id'], 'letter': ultima, 'workout_name': ultima,
              'started_at': iso(t), 'ended_at': iso(t+3000), 'dur_s': 3000, 'notes': '', 'vol': 4800, 'sets_done': 4, 'sets_total': 4,
              'ex': [{'key': k, 'keys': [k], 'n': A['n'], 'parts': [A['n']], 'sets': [{'p': [{'kg': 40, 'r': 10}]}]*4}]})
        fake.tables['body_weights'].append({'user_id': uid, 'd': time.strftime('%Y-%m-%d', time.gmtime(agora-86400*3)), 'kg': 82})
        await pg.reload(); await pg.wait_for_selector('.hero', timeout=15000)
        await pg.wait_for_timeout(500)
        print('chama:', txt(await pg.text_content('.seqchip')))
        print('missões:', txt(await pg.text_content('.ms-list'))[:200])
        print('água:', txt(await pg.text_content('#agua-card'))[:120])
        await pg.screenshot(path=SH+'e1-hoje.png', full_page=True)
        # água
        await pg.click('[data-a="agua+"][data-ml="500"]'); await pg.click('[data-a="agua+"][data-ml="250"]'); await pg.wait_for_timeout(1500)
        print('água depois:', txt(await pg.text_content('.ag-v')), '| banco:', fake.tables['agua'])
        await pg.click('[data-a=agua-undo]'); await pg.wait_for_timeout(1200)
        print('desfazer:', txt(await pg.text_content('.ag-v')), fake.tables['agua'][0]['ml'] if fake.tables['agua'] else None)
        await pg.click('.ag-g'); await pg.wait_for_selector('#ag-sheet'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=SH+'e2-agua.png')
        await pg.fill('#ag-meta', '3'); await pg.click('[data-a=agua-meta]'); await pg.wait_for_timeout(500)
        print('meta manual:', txt(await pg.text_content('.ag-big')), fake.tables['profiles'][0].get('agua_meta'))
        await pg.click('#sheet [data-a=close]')
        # sequência
        await pg.click('.seqchip'); await pg.wait_for_selector('.sq-grid'); await pg.wait_for_timeout(300)
        print('seq sheet:', txt(await pg.text_content('#sheet'))[:160])
        await pg.screenshot(path=SH+'e3-seq.png'); await pg.click('#sheet [data-a=close]')
        # treino com recorde
        await pg.click('[data-a=trocar-treino]'); await pg.click('.tt-b [data-a=start][data-l="A"]'); await pg.wait_for_selector('#set-0-0')
        await pg.fill('#w-0-0-0', '45'); await pg.fill('#r-0-0-0', '10'); await pg.click('#set-0-0 .chk')
        await pg.wait_for_selector('.festa.on', timeout=3000)
        print('festa:', txt(await pg.text_content('.festa')))
        await pg.wait_for_timeout(250); await pg.screenshot(path=SH+'e4-recorde.png')
        print('timer anel:', await pg.locator('#rest-arc').count(), await pg.get_attribute('#rest-arc', 'style'))
        await pg.screenshot(path=SH+'e5-timer.png')
        n = await pg.locator('#sets-0 .set').count()
        for si in range(1, n):
            await pg.fill(f'#w-0-{si}-0', '40'); await pg.fill(f'#r-0-{si}-0', '12'); await pg.click(f'#set-0-{si} .chk')
        await pg.click('[data-a=rest-skip]')
        await pg.click('[data-a=finish]'); await pg.click('[data-a=save]')
        await pg.wait_for_selector('.rs-top', timeout=8000); await pg.wait_for_timeout(600)
        print('resumo:', txt(await pg.text_content('#sheet'))[:400])
        await pg.screenshot(path=SH+'e6-resumo.png')
        await pg.click('[data-a=rs-share]'); await pg.wait_for_selector('#cardprev img', timeout=10000)
        await pg.click('#sheet [data-a=close]')
        print('missões salvas:', fake.tables['profiles'][0].get('missoes'))
        # temas
        await pg.click('.avatar'); await pg.click('#sheet [data-a=temas]'); await pg.wait_for_selector('.temas')
        print('temas:', txt(await pg.text_content('.temas')))
        await pg.screenshot(path=SH+'e7-temas.png')
        await pg.click('[data-a=tema][data-t=fogo]', force=True); await pg.wait_for_timeout(300)
        print('tema livre sem nível:', await pg.evaluate("document.documentElement.dataset.tema"))
        # forçar nível para testar tema
        fake.tables['profiles'][0]['missoes'] = [f'x{i}' for i in range(30)]
        await pg.click('#sheet [data-a=close]'); await pg.reload(); await pg.wait_for_selector('.hero', timeout=15000)
        await pg.click('.avatar'); await pg.click('#sheet [data-a=temas]'); await pg.wait_for_selector('.temas')
        await pg.click('[data-a=tema][data-t=fogo]'); await pg.wait_for_timeout(400)
        print('tema aplicado:', await pg.evaluate("document.documentElement.dataset.tema"), fake.tables['profiles'][0].get('tema'))
        await pg.click('#sheet [data-a=close]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=SH+'e8-fogo.png', full_page=True)
        # link do resumo de domingo
        await pg.goto(APP+'?card=semana'); await pg.wait_for_selector('#cardprev img', timeout=15000)
        print('?card=semana abriu card; url:', pg.url)
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
