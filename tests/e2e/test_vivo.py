import asyncio, sys, re
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH

async def main():
    fake = Fake(); errs = []; fake.inicio = {'completos': ['agua','sono','missoes','grupo'], 'auto': False}
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
        await pg2.fill('#g-cod', codigo); await pg2.click('[data-a=g-entrar]'); await pg2.wait_for_selector('.gm', timeout=10000)
        await pg2.click('[data-a=close]') if await pg2.locator('#sheet [data-a=close]').count() else None

        # os dois começam o treino de hoje
        await pg.reload(); await pg.wait_for_selector('[data-a=start]', timeout=10000)
        await pg.click('[data-a=start]'); await pg.wait_for_selector('#set-0-0')
        print('tela acesa:', await pg.evaluate("navigator.wakeLock ? 'api ok' : 'sem api'"))
        await pg2.click('#nav-hoje'); await pg2.click('[data-a=start]'); await pg2.wait_for_selector('#set-0-0')
        await pg2.wait_for_timeout(2500)  # rascunho da Ana vai para a nuvem
        await pg.wait_for_selector('.vivo-bar', timeout=40000)
        print('barra ao vivo (Silas):', re.sub(r'\s+', ' ', await pg.text_content('.vivo-bar')).strip())

        # Ana termina o 1º exercício
        n = await pg2.locator('#sets-0 .set').count()
        for si in range(n):
            await pg2.fill(f'#w-0-{si}-0', '20'); await pg2.click(f'#set-0-{si} .chk')
        await pg2.wait_for_timeout(2500)
        await pg.wait_for_selector('#vivo-ex-0 .vx.ok', timeout=40000)
        print('marcador no exercício:', await pg.text_content('#vivo-ex-0'))
        print('toast:', await pg.text_content('#toast'))
        await pg.locator('#vivo-ex-0').scroll_into_view_if_needed()
        await pg.screenshot(path=SH + 'v1-sessao.png')
        await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(200)
        await pg.screenshot(path=SH + 'v0-topo.png')
        await pg.click('.vivo-bar'); await pg.wait_for_selector('.vivo-pess')
        await pg.wait_for_timeout(300); await pg.screenshot(path=SH + 'v2-folha.png')
        await pg.click('#sheet [data-a=close]')

        # card do grupo na tela Hoje da Ana mostra o Silas treinando
        await pg2.click('[data-a=rest-skip]') if await pg2.locator('[data-a=rest-skip]').count() else None
        await pg2.click('#nav-hoje' ) if await pg2.locator('#nav-hoje').is_visible() else await pg2.click('[data-a=go][data-v=hoje]')
        await pg2.wait_for_selector('.vivo-tag', timeout=40000)
        print('tag no grupo (Ana):', await pg2.text_content('.vivo-tag'))
        await pg2.locator('#grupo-card').scroll_into_view_if_needed(); await pg2.screenshot(path=SH + 'v3-hoje.png')
        print('ERROS:', [e for e in errs if 'status of 400' not in e])
        await b.close()
asyncio.run(main())
