import asyncio, sys, re, datetime as dt
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH
def txt(s): return re.sub(r'\s+', ' ', s or '').strip()
async def main():
    fake = Fake(); errs = []; fake.inicio = {'completos': ['sono'], 'auto': False}
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Cintia Guedes', 'c@t.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        await pg.set_viewport_size({'width': 390, 'height': 844})
        await pg.click('#nav-hoje'); await pg.click('.sono [data-a=sono-reg] >> nth=0'); await pg.wait_for_selector('#sn-dormiu')
        await pg.fill('#sn-dormiu', '23:00'); await pg.fill('#sn-acordou', '07:00')
        await pg.click('[data-a=sn-vezes][data-v="1"]'); await pg.click('[data-a=sn-min][data-v="60"]'); await pg.wait_for_timeout(100)
        print('total:', txt(await pg.text_content('#sn-tot')), '|', txt(await pg.text_content('#sn-tot-det')))
        await pg.locator('#sheet-card').screenshot(path=SH+'p1-simples.png')
        await pg.click('[data-a=sono-save]'); await pg.wait_for_timeout(700)
        print('banco:', [(r['dormiu'][11:16], r['acordou'][11:16], r['pausas']) for r in fake.tables['sono']])
        await pg.click('.mod-h[data-a=sono]') if await pg.query_selector('.mod-h[data-a=sono]') else None
        await pg.click('#sheet [data-a=close]') if await pg.is_visible('#sheet') else None
        hoje = fake.tables['sono'][0]['dia']
        await pg.evaluate("d=>document.dispatchEvent(new Event('x'))", hoje)
        await pg.wait_for_timeout(300)
        if not await pg.query_selector('#sn-dormiu'):
            await pg.click(f'[data-a=sono-reg][data-d="{hoje}"] >> nth=0'); await pg.wait_for_selector('#sn-dormiu')
        print('reaberto:', [await x.text_content() for x in await pg.query_selector_all('.fchip.on')])
        await pg.click('[data-a=sn-exato]'); await pg.wait_for_timeout(100)
        print('exato:', [await x.input_value() for x in await pg.query_selector_all('#sn-pausas input')], txt(await pg.text_content('#sn-tot')))
        await pg.locator('#sheet-card').screenshot(path=SH+'p2-exato.png')
        await pg.fill('#sn-pausas .sn-pr >> nth=0 >> [data-pz=fim]', '04:00'); await pg.wait_for_timeout(100)
        await pg.click('[data-a=sn-simples]'); await pg.wait_for_timeout(100)
        print('volta simples:', [await x.text_content() for x in await pg.query_selector_all('.fchip.on')], txt(await pg.text_content('#sn-tot')))
        await pg.click('[data-a=sn-vezes][data-v="0"]'); print('sem pausa:', txt(await pg.text_content('#sn-tot')))
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
