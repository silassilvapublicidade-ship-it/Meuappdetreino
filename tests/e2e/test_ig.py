import asyncio, sys, base64
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, treinar, SH
async def perfil(pg, foto, ig):
    await pg.click('#nav-hoje'); await pg.click('.avatar'); await pg.wait_for_selector('#p-insta')
    await pg.set_input_files('#f-avatar', foto); await pg.wait_for_timeout(1500)
    await pg.wait_for_selector('#p-insta'); await pg.fill('#p-insta', ig); await pg.click('[data-a=p-save]'); await pg.wait_for_timeout(500)
async def main():
    fake = Fake(); errs = []; fake.inicio = {'completos': ['agua','sono','missoes','grupo'], 'auto': False}
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@teste.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        await perfil(pg, FIX+'/foto1.jpg', 'silassilva.click')
        fake.admins.add(fake.users['silas@teste.com']['id'])
        await pg.click('.gcta'); await pg.wait_for_selector('#g-nome'); await pg.click('[data-a=g-criar]'); await pg.wait_for_selector('.gcode')
        cod = (await pg.text_content('.gcode')).strip(); await pg.click('#sheet [data-a=close]')
        ctx2, pg2 = await nova_conta(b, fake, 'Ana Souza', 'ana@teste.com', errs)
        await pg2.click('[data-a=f-save]'); await pg2.wait_for_selector('.wcard', timeout=10000)
        await perfil(pg2, FIX+'/foto2.jpg', 'ana.fit')
        await pg2.click('.gcta'); await pg2.wait_for_selector('#g-cod'); await pg2.fill('#g-cod', cod); await pg2.click('[data-a=g-entrar]'); await pg2.wait_for_selector('.gm')
        await treinar(pg2, kg='20')
        await pg2.wait_for_selector('#cardprev img'); src = await pg2.get_attribute('#cardprev img', 'src')
        data = await pg2.evaluate("async u=>{ const b=await (await fetch(u)).blob(); return await new Promise(r=>{ const f=new FileReader(); f.onload=()=>r(f.result); f.readAsDataURL(b); }); }", src)
        open(SH + 'i3-card-ana.png', 'wb').write(base64.b64decode(data.split(',')[1]))
        await pg2.click('#sheet [data-a=close]')
        await treinar(pg); await pg.click('#sheet [data-a=close]')
        await pg2.reload(); await pg2.wait_for_selector('.gm .rx', timeout=10000); await pg2.click('.rx >> nth=1'); await pg2.wait_for_timeout(400)
        await pg.reload(); await pg.wait_for_selector('.gm', timeout=10000); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=SH + 'i1-hoje.png', full_page=True)
        print('toast:', await pg.text_content('#toast'))
        await pg.click('header .avatar'); await pg.click('#sheet [data-v=admin]'); await pg.click('[data-a=adm-tab][data-t=usuarios]'); await pg.wait_for_selector('.ucard'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=SH + 'i2-admin.png')
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
