import asyncio, sys, json, time, uuid, base64
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake, BASE
async def main():
    fake = Fake()
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2)
        await ctx.route(BASE + '/**', fake.handle)
        await ctx.route('https://fonts.googleapis.com/**', lambda r: r.abort())
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP+''); await pg.wait_for_selector('#f-auth')
        await pg.click('[data-a=auth-tab][data-t=criar]')
        await pg.fill('#a-nome','Silas Silva'); await pg.fill('#a-email','s@s.com'); await pg.fill('#a-senha','segredo123')
        await pg.click('#f-auth button[type=submit]'); await pg.wait_for_selector('.choices')
        await pg.click('[data-a=ob-modelo]'); await pg.wait_for_selector('#f-nome'); await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard')
        uid = fake.tables['plans'][0]['user_id']; pid = fake.tables['plans'][0]['id']
        # treinos anteriores no mês e na semana
        now = time.time()
        for dd in [1,2,3,5,8,9,10,12,15,16]:
            t = now - dd*86400
            fake.tables['sessions'].append({'id':str(uuid.uuid4()),'user_id':uid,'plan_id':pid,'letter':'ABCDE'[dd%5],'workout_name':'Treino','started_at':time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(t)),'dur_s':3000,'ex':[],'vol':5000,'sets_done':20,'sets_total':20})
        await pg.reload(); await pg.wait_for_selector('.hero')
        await pg.click('[data-a=start]'); await pg.wait_for_selector('#set-0-0')
        for si in range(len(await pg.query_selector_all('input[id^="w-0-"][id$="-0"]'))):
            await pg.fill(f'#w-0-{si}-0','32'); await pg.fill(f'#r-0-{si}-0','10'); await pg.click(f'#set-0-{si} .chk')
        await pg.click('[data-a=rest-skip]'); await pg.click('[data-a=finish]'); await pg.click('[data-a=save]'); await pg.wait_for_selector('[data-a=rs-share]', timeout=10000); await pg.click('[data-a=rs-share]')
        await pg.wait_for_selector('#cardprev img', timeout=10000)
        await pg.screenshot(path=SHOTS+'sh1.png')
        src = await pg.get_attribute('#cardprev img','src')
        data = await pg.evaluate("async u=>{const b=await (await fetch(u)).blob(); return await new Promise(r=>{const f=new FileReader(); f.onload=()=>r(f.result); f.readAsDataURL(b);});}", src)
        open(SHOTS+'card-semana.png','wb').write(base64.b64decode(data.split(',')[1]))
        await pg.click('[data-a=share-tab][data-t=mes]'); await pg.wait_for_selector('#cardprev img', timeout=10000)
        src = await pg.get_attribute('#cardprev img','src')
        data = await pg.evaluate("async u=>{const b=await (await fetch(u)).blob(); return await new Promise(r=>{const f=new FileReader(); f.onload=()=>r(f.result); f.readAsDataURL(b);});}", src)
        open(SHOTS+'card-mes.png','wb').write(base64.b64decode(data.split(',')[1]))
        await pg.click('[data-a=close]')
        await pg.screenshot(path=SHOTS+'sh2-hoje.png')
        await pg.click('#nav-treinos'); await pg.screenshot(path=SHOTS+'sh3-treinos.png')
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
