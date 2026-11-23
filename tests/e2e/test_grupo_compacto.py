import asyncio, sys, re
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH

async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@teste.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        await pg.click('#nav-hoje')
        await pg.click('.avatar'); await pg.click('#sheet [data-a=grupo]'); await pg.wait_for_selector('#g-nome')
        await pg.fill('#g-nome', 'Família'); await pg.click('[data-a=g-criar]'); await pg.wait_for_selector('.gcode')
        codigo = (await pg.text_content('.gcode')).strip(); await pg.click('[data-a=close]')

        ctx2, pg2 = await nova_conta(b, fake, 'Ana Souza', 'ana@teste.com', errs)
        await pg2.click('[data-a=f-save]'); await pg2.wait_for_selector('.wcard', timeout=10000)
        await pg2.click('#nav-hoje'); await pg2.click('.gcta'); await pg2.wait_for_selector('#g-cod')
        await pg2.fill('#g-cod', codigo); await pg2.click('[data-a=g-entrar]'); await pg2.wait_for_selector('[data-mod=grupo]', timeout=10000)
        await pg2.click('[data-a=close]') if await pg2.locator('#sheet [data-a=close]').count() else None
        await pg.reload(); await pg.wait_for_selector('[data-mod=grupo]', timeout=15000); await pg.wait_for_timeout(1500)
        print('grupo compacto:', re.sub(r'\s+',' ', await pg.text_content('[data-mod=grupo]')))
        await pg2.click('#nav-hoje'); await pg2.click('[data-a=start]'); await pg2.wait_for_selector('#set-0-0'); await pg2.wait_for_timeout(2500)
        await pg.reload(); await pg.wait_for_timeout(4000)
        print('ordem com Ana treinando:', [await x.get_attribute('data-mod') for x in await pg.query_selector_all('.mod')])
        print('grupo agora:', re.sub(r'\s+',' ', await pg.text_content('[data-mod=grupo]')))
        await pg.click('[data-a=grupo-abrir]'); await pg.wait_for_selector('.gm')
        print('expandido:', len(await pg.query_selector_all('.gm')), 'recolher:', await pg.query_selector('[data-a=grupo-recolher]') is not None)
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
