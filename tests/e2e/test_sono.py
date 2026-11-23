import asyncio, sys, re, time, datetime as dt
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
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 's@t.com', errs, )
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        uid = fake.tables['profiles'][0]['id']
        hoje = dt.datetime.now(SP).date()
        import random; random.seed(3)
        for i in range(1, 26):
            d = hoje - dt.timedelta(days=i)
            if i % 7 == 3: continue
            dorm = dt.datetime(d.year, d.month, d.day, 0, 0, tzinfo=SP) - dt.timedelta(minutes=random.choice([20, 45, 70, 95, 140]))
            acor = dt.datetime(d.year, d.month, d.day, 6, 30, tzinfo=SP) + dt.timedelta(minutes=random.choice([0, 15, 60, 150]) if d.weekday()>=5 else random.choice([0, 10, 20]))
            fake.tables['sono'].append({'user_id': uid, 'dia': d.isoformat(), 'dormiu': acor.isoformat() if False else dorm.isoformat(), 'acordou': acor.isoformat(), 'qualidade': random.choice([None, 3, 4, 2]), 'obs': None})
        await pg.reload(); await pg.wait_for_selector('.sono', timeout=15000)
        print('card:', txt(await pg.text_content('.sono')))
        await pg.locator('.sono').screenshot(path=SH+'s1-card.png')
        await pg.click('[data-a=sono-reg]'); await pg.wait_for_selector('#sn-dormiu')
        await pg.fill('#sn-dormiu', '23:10'); await pg.fill('#sn-acordou', '06:40'); await pg.wait_for_timeout(100)
        print('total:', await pg.text_content('#sn-tot'))
        await pg.click('[data-a=sn-vezes][data-v="1"]'); await pg.click('[data-a=sn-exato]')
        await pg.click('[data-a=sono-pz-add]'); await pg.fill('#sn-pausas .sn-pr >> nth=0 >> [data-pz=ini]', '02:30'); await pg.fill('#sn-pausas .sn-pr >> nth=0 >> [data-pz=fim]', '04:30')
        await pg.click('[data-a=sono-pz-add]'); await pg.fill('#sn-pausas .sn-pr >> nth=1 >> [data-pz=ini]', '05:30'); await pg.fill('#sn-pausas .sn-pr >> nth=1 >> [data-pz=fim]', '05:50'); await pg.wait_for_timeout(100)
        await pg.screenshot(path=SH+'s6-pausas.png')
        print('com pausas:', await pg.text_content('#sn-tot'), '|', await pg.text_content('#sn-tot-det'))
        await pg.click('[data-a=sono-q][data-v="4"]')
        await pg.screenshot(path=SH+'s2-reg.png')
        await pg.click('[data-a=sono-save]'); await pg.wait_for_timeout(800)
        print('banco hoje:', [(r['dormiu'], r['acordou'], r.get('pausas')) for r in fake.tables['sono'] if r['dia']==hoje.isoformat()])
        print('card depois:', txt(await pg.text_content('.sono')))
        await pg.click('.sono [data-a=sono]'); await pg.wait_for_selector('#sn-sheet'); await pg.wait_for_timeout(500)
        print('painel semana:', txt(await pg.text_content('#sn-sheet'))[:700])
        await pg.screenshot(path=SH+'s3-semana.png', full_page=True)
        await pg.click('[data-a=sono-aba][data-t=mes]'); await pg.wait_for_timeout(400)
        print('painel mês:', txt(await pg.text_content('#sn-sheet .sum'))[:200])
        await pg.screenshot(path=SH+'s4-mes.png')
        await pg.fill('#sn-meta', '7,5'); await pg.click('[data-a=sono-meta]'); await pg.wait_for_timeout(400)
        print('meta:', fake.tables['profiles'][0].get('sono_meta'))
        # editar e apagar
        await pg.click('.sn-h >> nth=0'); await pg.wait_for_selector('#sn-dormiu')
        await pg.click('[data-a=sono-del]'); await pg.click('[data-a=sono-del]'); await pg.wait_for_timeout(600)
        print('apagou hoje:', not any(r['dia']==hoje.isoformat() for r in fake.tables['sono']))
        await pg.click('[data-a=sono-igual]'); await pg.wait_for_timeout(600)
        print('igual última:', [ (r['dormiu'][11:16], r['acordou'][11:16]) for r in fake.tables['sono'] if r['dia']==hoje.isoformat()], txt(await pg.text_content('#toast')))
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
