import asyncio, sys, re, time
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH
def txt(s): return re.sub(r'\s+', ' ', s or '').strip()
async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@t.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        plan = fake.tables['plans'][0]
        print('cronograma:', plan['cronograma'])
        await pg.click('#nav-hoje'); await pg.wait_for_selector('.hero')
        print('sugerido:', txt(await pg.text_content('.hero .big-letter')), '|', txt(await pg.text_content('.todayline')))
        await pg.click('[data-a=trocar-treino]'); await pg.wait_for_selector('.tt-list')
        print('lista:', txt(await pg.text_content('.tt-list'))[:300])
        await pg.wait_for_timeout(600); await pg.screenshot(path=SH+'t1-trocar.png')
        letras = await pg.eval_on_selector_all('.tt .tt-l', 'els=>els.map(e=>e.textContent)')
        outra = [l for l in letras if l != txt(await pg.text_content('.tt.tt-sug .tt-l'))][-1]
        await pg.click(f'.tt-b [data-a=start][data-l="{outra}"]'); await pg.wait_for_selector('#set-0-0')
        print('iniciou:', outra, '| sheet escondida:', await pg.is_hidden('#sheet'))
        await pg.fill('#w-0-0-0', '20'); await pg.click('#set-0-0 .chk')
        await pg.click('[data-a=rest-skip]'); await pg.click('[data-a=finish]'); await pg.click('[data-a=save]')
        await pg.wait_for_selector('.rs-top', timeout=8000); await pg.click('#sheet [data-a=close]')
        await pg.click('#nav-hoje'); await pg.wait_for_selector('.hero')
        print('depois de trocar -> sugerido:', txt(await pg.text_content('.hero .big-letter')), '|', txt(await pg.text_content('.hero .why')))
        await pg.click('[data-a=trocar-treino]'); await pg.wait_for_selector('.tt-list')
        print('lista 2:', txt(await pg.text_content('.tt-list'))[:300])
        await pg.click('#sheet [data-a=close]'); await pg.click('#nav-treinos'); await pg.wait_for_selector('.wcard')
        print('treinos:', [txt(x) for x in await pg.eval_on_selector_all('.wcard .exec', 'els=>els.map(e=>e.textContent)')])
        await pg.screenshot(path=SH+'t2-treinos.png', full_page=True)
        await pg.click('.wcard >> nth=4'); await pg.wait_for_selector('.whead')
        print('página do treino:', txt(await pg.text_content('.whead .exec')))
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
