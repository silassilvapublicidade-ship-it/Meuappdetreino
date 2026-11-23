import asyncio, sys, base64
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, treinar, SH
async def salvar(pg, nome):
    await pg.wait_for_selector('#cardprev img', timeout=10000)
    src = await pg.get_attribute('#cardprev img', 'src')
    data = await pg.evaluate("async u=>{ const b=await (await fetch(u)).blob(); return await new Promise(r=>{ const f=new FileReader(); f.onload=()=>r(f.result); f.readAsDataURL(b); }); }", src)
    open(SH + nome, 'wb').write(base64.b64decode(data.split(',')[1]))
async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@teste.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        await treinar(pg)
        print('abas:', [await x.text_content() for x in await pg.query_selector_all('#sheet [data-a=share-tab]')])
        await pg.click('#sheet [data-a=share-tab][data-t=conquista]'); await pg.wait_for_timeout(300)
        await salvar(pg, 'c1-conquista.png')
        await pg.click('#sheet [data-a=close]')
        await pg.click('#nav-evolucao'); await pg.click('[role=tab][data-a=evo][data-t=resumo]'); await pg.click('[data-a=evo][data-t=conquistas]'); await pg.wait_for_selector('.badge.on')
        await pg.click('button.badge.on'); await salvar(pg, 'c2-conquista-tab.png')
        print('título:', await pg.text_content('#sheet-card h2'))
        await pg.click('#sheet [data-a=close]')
        await pg.screenshot(path=SH + 'c3-tab.png')
        for _ in range(9): await treinar(pg); await pg.click('#sheet [data-a=close]')
        await pg.click('#nav-evolucao'); await pg.click('[role=tab][data-a=evo][data-t=resumo]'); await pg.click('[data-a=evo][data-t=conquistas]'); await pg.click('[data-a=share-nv]'); await salvar(pg, 'c4-nivel.png')
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
