import asyncio, sys
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH
async def main():
    fake = Fake(); errs = []
    for i, l in enumerate(open(FIX+'/catalogo.txt', encoding='utf8').read().strip().split('\n')):
        m, t, y = l.split('|'); fake.tables['exercise_catalog'].append({'id': i+1, 'modulo': int(m), 'titulo': t, 'youtube': y})
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Ana', 'ana@teste.com', errs)
        await ctx.route('https://www.youtube-nocookie.com/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<body style="background:#222;color:#fff;font:20px sans-serif">player</body>'))
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        await pg.click('[data-v="treino:A"]'); await pg.wait_for_selector('.vlink')
        n0 = len(ctx.pages)
        await pg.click('.vlink'); await pg.wait_for_selector('.pl-capa')
        print('iframe antes do toque:', await pg.locator('.player iframe').count())
        await pg.wait_for_timeout(300); await pg.screenshot(path=SH + 'p0-capa.png')
        await pg.click('.pl-capa'); await pg.wait_for_selector('.player iframe')
        print('src:', await pg.get_attribute('.player iframe','src'))
        print('abas abertas:', len(ctx.pages) - n0, '| iframe:', (await pg.get_attribute('.player iframe', 'src')).split('?')[0], '| título:', await pg.text_content('.pl-t'))
        await pg.wait_for_timeout(500); await pg.screenshot(path=SH + 'p1-player.png')
        await pg.click('#sheet [data-a=close]')
        await pg.click('[data-a=go][data-v=treinos]'); await pg.click('[data-a=biblioteca]'); await pg.wait_for_selector('.bib-i')
        await pg.click('.bib-i'); await pg.wait_for_selector('.pl-capa')
        print('biblioteca -> player:', await pg.text_content('.pl-t'), '| voltar:', await pg.locator('#sheet [data-a=biblioteca]').count())
        await pg.click('#sheet [data-a=biblioteca]'); await pg.wait_for_selector('.bib-i'); print('voltou à biblioteca: ok')
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
