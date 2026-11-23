import asyncio, sys, base64
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake, BASE
async def main():
    fake = Fake()
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2)
        await ctx.route(BASE + '/**', fake.handle); await ctx.route('https://fonts.googleapis.com/**', lambda r: r.abort())
        pg = await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP+''); await pg.wait_for_selector('#f-auth')
        await pg.click('[data-a=auth-tab][data-t=criar]')
        await pg.fill('#a-nome','Silas Silva'); await pg.fill('#a-email','s@s.com'); await pg.fill('#a-senha','segredo123')
        await pg.click('#f-auth button[type=submit]'); await pg.wait_for_selector('.choices')
        await pg.click('[data-a=ob-modelo]'); await pg.wait_for_selector('#f-nome'); await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard')
        await pg.click('[data-a=perfil]'); await pg.set_input_files('#f-avatar',FIX + '/foto1.jpg'); await pg.wait_for_selector('.perfil-h img[src]', timeout=8000)
        await pg.fill('#p-insta','@silassilva.click'); await pg.click('[data-a=p-save]'); await pg.wait_for_timeout(300)
        print('perfil:', fake.tables['profiles'])
        await pg.click('[data-a=perfil]'); await pg.wait_for_timeout(500); await pg.screenshot(path=SHOTS+'p1.png'); await pg.click('[data-a=close]')
        await pg.click('#nav-hoje'); await pg.click('[data-a=start]'); await pg.wait_for_selector('#set-0-0')
        await pg.fill('#w-0-0-0','32'); await pg.fill('#r-0-0-0','10'); await pg.click('#set-0-0 .chk'); await pg.click('[data-a=rest-skip]')
        await pg.click('[data-a=finish]'); await pg.click('[data-a=save]'); await pg.wait_for_selector('[data-a=rs-share]', timeout=10000); await pg.click('[data-a=rs-share]'); await pg.wait_for_selector('#cardprev img', timeout=10000)
        for nome, tab in [('card-semana-perfil','semana'),('card-mes-perfil','mes')]:
            if tab=='mes': await pg.click('[data-a=share-tab][data-t=mes]'); await pg.wait_for_selector('#cardprev img', timeout=10000)
            src = await pg.get_attribute('#cardprev img','src')
            data = await pg.evaluate("async u=>{const b=await (await fetch(u)).blob(); return await new Promise(r=>{const f=new FileReader(); f.onload=()=>r(f.result); f.readAsDataURL(b);});}", src)
            open(SHOTS+f'{nome}.png','wb').write(base64.b64decode(data.split(',')[1]))
        print('ERRORS', errs); await b.close()
asyncio.run(main())
