import asyncio, sys, re, datetime as dt, json, random
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH
def txt(s): return re.sub(r'\s+', ' ', s or '').strip()
SP = dt.timezone(dt.timedelta(hours=-3))
async def main():
    fake = Fake(); errs = []; fake.inicio = {'completos': ['agua','sono','missoes','grupo'], 'auto': False}
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 's@t.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        uid = fake.tables['profiles'][0]['id']
        hoje = dt.datetime.now(SP).date(); random.seed(5)
        for i in range(1, 15):
            d = hoje - dt.timedelta(days=i)
            if i == 4: continue
            dorm = dt.datetime(d.year, d.month, d.day, 0, 0, tzinfo=SP) - dt.timedelta(minutes=random.choice([20, 45, 95]))
            acor = dt.datetime(d.year, d.month, d.day, 6, 30, tzinfo=SP) + dt.timedelta(minutes=random.choice([0, 20, 90]))
            pz = [{'ini': (dorm+dt.timedelta(hours=3)).isoformat(), 'fim': (dorm+dt.timedelta(hours=4)).isoformat()}] if i % 3 == 0 else []
            fake.tables['sono'].append({'user_id': uid, 'dia': d.isoformat(), 'dormiu': dorm.isoformat(), 'acordou': acor.isoformat(), 'qualidade': 4, 'obs': None, 'pausas': pz})
        d1 = hoje - dt.timedelta(days=2)
        fake.tables['sono_cochilos'].append({'id': 'c1', 'user_id': uid, 'dia': d1.isoformat(), 'ini': dt.datetime(d1.year, d1.month, d1.day, 14, 0, tzinfo=SP).isoformat(), 'fim': dt.datetime(d1.year, d1.month, d1.day, 14, 40, tzinfo=SP).isoformat()})
        # noite curta hoje -> aviso
        dorm = dt.datetime(hoje.year, hoje.month, hoje.day, 1, 0, tzinfo=SP); acor = dt.datetime(hoje.year, hoje.month, hoje.day, 6, 0, tzinfo=SP)
        fake.tables['sono'].append({'user_id': uid, 'dia': hoje.isoformat(), 'dormiu': dorm.isoformat(), 'acordou': acor.isoformat(), 'qualidade': None, 'obs': None, 'pausas': []})
        await pg.reload(); await pg.wait_for_selector('.sono', timeout=15000)
        print('aviso hero:', txt(await pg.text_content('.sn-tr')) if await pg.query_selector('.sn-tr') else None)
        await pg.screenshot(path=SH+'s2-hero.png')
        # registro ao vivo
        fake.tables['sono'] = [r for r in fake.tables['sono'] if r['dia'] != hoje.isoformat()]
        await pg.evaluate("""([u]) => { const n = Date.now(); localStorage.removeItem('mt.cache.'+u); localStorage.setItem('mt.sono.aberta.'+u, JSON.stringify({dormiu: n-8*3600e3, pausas:[{ini:n-5*3600e3, fim:n-4*3600e3}], pausa:null})); }""", [uid])
        await pg.reload(); await pg.wait_for_selector('.sn-live', timeout=15000)
        print('ao vivo:', txt(await pg.text_content('.sn-live')))
        await pg.locator('.sono').screenshot(path=SH+'s2-live.png')
        await pg.click('[data-a=sono-madrugada]'); await pg.wait_for_timeout(200)
        print('madrugada:', txt(await pg.text_content('.sn-live')))
        await pg.click('[data-a=sono-voltei]'); await pg.wait_for_timeout(200)
        await pg.click('.sn-live [data-a=sono-acordei]'); await pg.wait_for_selector('.bd-top'); await pg.wait_for_timeout(400)
        print('bom dia:', txt(await pg.text_content('.bd-top')))
        await pg.locator('#sheet-card').screenshot(path=SH+'s2-bomdia.png')
        await pg.click('[data-a=sono-q][data-v="5"]'); await pg.click('[data-a=sono-bd-ok]'); await pg.wait_for_timeout(700)
        r = [x for x in fake.tables['sono'] if x['dia'] == hoje.isoformat()]
        print('banco:', [(x['dormiu'][11:16], x['acordou'][11:16], x.get('qualidade'), len(x.get('pausas') or [])) for x in r])
        print('card:', txt(await pg.text_content('.sono')))
        print('sem aviso agora:', await pg.query_selector('.sn-tr') is None)
        # cochilo
        await pg.click('.sono [data-a=cochilo]'); await pg.wait_for_selector('[data-a=cochilo-rapido]')
        await pg.click('[data-a=cochilo-rapido][data-m="20"]'); await pg.wait_for_timeout(600)
        print('cochilos banco:', len(fake.tables['sono_cochilos']), '| card:', txt(await pg.text_content('.sono .sn-pz')) if await pg.query_selector('.sono p.sn-pz') else None)
        # painel
        await pg.click('.sono [data-a=sono]'); await pg.wait_for_selector('.tl'); await pg.wait_for_timeout(400)
        await pg.fill('#sn-acordar', '06:30'); await pg.click('[data-a=sono-acordar]'); await pg.wait_for_timeout(500)
        print('acordar:', fake.tables['profiles'][0].get('sono_acordar'), '|', txt(await pg.text_content('#toast')))
        await pg.screenshot(path=SH+'s2-painel.png', full_page=False)
        tl = await pg.query_selector('.tl'); await tl.scroll_into_view_if_needed(); await pg.wait_for_timeout(200)
        await pg.locator('.tl').screenshot(path=SH+'s2-tl.png')
        cs = await pg.query_selector('[data-a=cochilo-del]')
        print('cochilos lista:', len(await pg.query_selector_all('[data-a=cochilo-del]')))
        await cs.click(); await cs.click(); await pg.wait_for_timeout(500)
        print('cochilos após apagar:', len(fake.tables['sono_cochilos']))
        await pg.locator('#sheet-card').screenshot(path=SH+'s2-sheet.png')
        # link da notificação
        await pg.goto(APP+'?sono=registrar'); await pg.wait_for_timeout(2500)
        print('link abre registro:', await pg.query_selector('#sn-dormiu') is not None)
        # notificações
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
