import asyncio, sys, re, datetime as dt
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH
def txt(s): return re.sub(r'\s+', ' ', s or '').strip()
SP = dt.timezone(dt.timedelta(hours=-3))
async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 's@t.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        await pg.click('#nav-hoje'); await pg.wait_for_selector('.qa')
        print('rápidas:', [txt(await x.text_content()) for x in await pg.query_selector_all('.qa-b')])
        print('módulos:', [await x.get_attribute('data-mod') for x in await pg.query_selector_all('.mod')])
        print('sino:', await pg.get_attribute('.sino', 'aria-label'))
        await pg.screenshot(path=SH+'i1-hoje.png', full_page=True)
        # +250
        await pg.click('.qa-b[data-a="agua+"]'); await pg.wait_for_timeout(200)
        print('água compacta:', txt(await pg.text_content('[data-mod=agua]')), '| botão:', txt(await pg.text_content('.qa-b[data-a="agua+"]')))
        # peso rápido
        await pg.click('.qa-b[data-a=peso-rapido]'); await pg.fill('#bkg', '82,4'); await pg.click('[data-a=peso-rapido-ok]'); await pg.wait_for_timeout(600)
        print('peso salvo:', [r.get('kg') for r in fake.tables['body_weights']], 'folha fechada:', await pg.is_hidden('#sheet'))
        # sino
        await pg.click('.sino'); await pg.wait_for_timeout(300)
        print('folha sino:', txt(await pg.text_content('#sheet-card'))[:160])
        await pg.locator('#sheet-card').screenshot(path=SH+'i2-sino.png')
        await pg.click('#sheet-card [data-a=close]'); await pg.wait_for_timeout(200)
        # personalizar
        await pg.click('[data-a=inicio]'); await pg.wait_for_selector('.pi-list')
        await pg.locator('#sheet-card').screenshot(path=SH+'i3-pers.png')
        await pg.click('[data-a=ini-mv][data-m=sono][data-d="-1"]'); await pg.wait_for_timeout(100)
        await pg.click('[data-a=ini-mv][data-m=sono][data-d="-1"]'); await pg.wait_for_timeout(100)
        await pg.click('label.sw:has([data-ini-on=missoes])'); await pg.wait_for_timeout(100)
        await pg.click('[data-a=ini-modo][data-m=agua][data-v="1"]'); await pg.wait_for_timeout(100)
        await pg.click('label.pi-auto'); await pg.wait_for_timeout(900)
        print('perfil inicio:', fake.tables['profiles'][0].get('inicio'))
        await pg.click('#sheet-card [data-a=close]'); await pg.wait_for_timeout(200)
        print('módulos depois:', [await x.get_attribute('data-mod') for x in await pg.query_selector_all('.mod')], '| água completa:', await pg.query_selector('#agua-card .ag-g') is not None)
        await pg.reload(); await pg.wait_for_selector('.qa', timeout=15000)
        print('após recarregar:', [await x.get_attribute('data-mod') for x in await pg.query_selector_all('.mod')])
        await pg.click('[data-a=inicio]'); await pg.click('[data-a=ini-padrao]'); await pg.wait_for_timeout(900)
        print('padrão:', fake.tables['profiles'][0].get('inicio'))
        await pg.set_viewport_size({'width': 390, 'height': 844}); await pg.click('#sheet-card [data-a=close]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=SH+'i4-celular.png')
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
