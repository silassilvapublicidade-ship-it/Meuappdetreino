import asyncio, sys, re
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake, BASE
from test_novos import nova_conta, APP, SH

async def main():
    fake = Fake(); errs = []
    for i, l in enumerate(open(FIX+'/catalogo.txt', encoding='utf8').read().strip().split('\n')):
        m, t, y = l.split('|'); fake.tables['exercise_catalog'].append({'id': i+1, 'modulo': int(m), 'titulo': t, 'youtube': y})
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Ana', 'ana@teste.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        await pg.click('[data-v="treino:A"]'); await pg.wait_for_selector('.ex')
        n_ex = await pg.locator('.ex').count(); n_v = await pg.locator('.vlink').count()
        print('Ana (sem admin) treino A: exercícios', n_ex, 'com vídeo', n_v)
        # ficha nova lida por foto
        await pg.click('[data-a=go][data-v=treinos]'); await pg.click('[data-v=onboarding]')
        await pg.set_input_files('#f-ficha', FIX+'/foto0.jpg'); await pg.wait_for_selector('#f-nome', timeout=10000)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        for L in ['A', 'B']:
            await pg.click(f'[data-v="treino:{L}"]'); await pg.wait_for_selector('.ex')
            arts = await pg.query_selector_all('.ex')
            for a in arts:
                nome = (await (await a.query_selector('h3')).text_content()).strip()
                v = await a.query_selector('.vlink')
                print(f'  ficha nova {L}:', nome, '→', (await v.get_attribute('href')) if v else 'sem vídeo')
            await pg.click('[data-a=go][data-v=treinos]')
        await pg.click('[data-a=biblioteca]'); await pg.wait_for_selector('.bib-i')
        await pg.fill('#bib-q', 'rosca martelo'); await pg.wait_for_timeout(200)
        print('busca "rosca martelo":', [await x.text_content() for x in await pg.query_selector_all('.bib-i')])
        await pg.fill('#bib-q', ''); await pg.wait_for_timeout(200)
        await pg.screenshot(path=SH + 'b1-biblioteca.png')
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
