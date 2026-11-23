import asyncio, sys
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH
async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Ana', 'ana@teste.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        for L in 'ABCDE':
            if not await pg.locator(f'[data-v="treino:{L}"]').count(): continue
            await pg.click(f'[data-v="treino:{L}"]'); await pg.wait_for_selector('.exlist')
            chips = await pg.locator('.chip.tq').all_text_contents()
            print(L, chips)
            if chips and not await pg.locator('#sheet .tq-passos').count():
                await pg.locator('.chip.tq').first.scroll_into_view_if_needed()
                await pg.screenshot(path=SH+'tq0.png')
                await pg.locator('.chip.tq').first.click(); await pg.wait_for_selector('#sheet .tq-passos')
                await pg.wait_for_timeout(400); await pg.screenshot(path=SH+'tq1.png')
                await pg.click('#sheet [data-a=close]'); await pg.wait_for_timeout(300)
            await pg.click('[data-a=go][data-v=treinos]')
        # sessão
        await pg.click('#nav-hoje'); await pg.click('[data-a=start]'); await pg.wait_for_selector('#set-0-0')
        print('sessão chips:', await pg.locator('.chip.tq').count())
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
