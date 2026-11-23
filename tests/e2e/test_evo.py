import asyncio, sys, re, time, random, uuid, datetime as dt
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH
def txt(s): return re.sub(r'\s+', ' ', s or '').strip()
def iso(t): return dt.datetime.fromtimestamp(t, dt.timezone.utc).isoformat()
SP = dt.timezone(dt.timedelta(hours=-3))
import unicodedata
def slug(x):
    x = unicodedata.normalize('NFD', x); x = ''.join(c for c in x if not unicodedata.combining(c)).lower(); x = re.sub(r'\(.*?\)', '', x); return re.sub(r'[^a-z0-9]+', '-', x).strip('-')
async def main():
    fake = Fake(); errs = []; random.seed(7)
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@teste.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        uid = fake.users['silas@teste.com']['id']; plano = fake.tables['plans'][0]
        W = plano['treinos']['w']; letras = [l for l in plano['treinos'].get('order', sorted(W.keys()))]
        agora = time.time(); t = agora - 112*86400; k = 0; base = {}
        while t < agora - 3600:
            d = dt.datetime.fromtimestamp(t, SP)
            if d.weekday() < 5 and random.random() < 0.8:
                L = letras[k % len(letras)]; w = W[L]; exs = []; vol = 0
                hora = random.choice([7, 18, 19])
                st = dt.datetime(d.year, d.month, d.day, hora, 0, tzinfo=SP).timestamp()
                for e in w['ex']:
                    parts = [x.strip() for x in re.split(r'\s+\+\s+', e['n']) if x.strip()]; keys = [slug(x) for x in parts]; e = dict(e, parts=parts); sets = []
                    for _ in range(int(e.get('s', 3))):
                        ps = []
                        for kk in keys:
                            b0 = base.setdefault(kk, random.choice([10, 20, 30, 40, 60]))
                            prog = 0 if 'flexora' in kk else (agora - 112*86400 - t) / -86400 * random.choice([0.08, 0.15, 0.25])
                            kg = round((b0 + prog) * 2) / 2; ps.append({'kg': kg, 'r': random.choice([8, 10, 12])}); vol += kg * 10
                        sets.append({'p': ps, 'done': True})
                    exs.append({'key': keys[0], 'keys': keys, 'n': e['n'], 'parts': e['parts'], 'sets': sets})
                fake.tables['sessions'].append({'id': str(uuid.uuid4()), 'user_id': uid, 'plan_id': plano['id'], 'letter': L, 'workout_name': w['name'],
                    'started_at': iso(st), 'ended_at': iso(st+3300), 'dur_s': 3300, 'notes': '', 'vol': int(vol), 'sets_done': 20, 'sets_total': 20, 'ex': exs})
                k += 1
            t += 86400
        for i in range(16):
            dd = (dt.datetime.now(SP) - dt.timedelta(days=7*i+1)).date()
            fake.tables['body_weights'].append({'user_id': uid, 'd': dd.isoformat(), 'kg': round(86 + i*0.35 + random.uniform(-.3,.3), 1)})
        fake.tables['body_weights'].sort(key=lambda x: x['d'])
        for i in range(1, 40):
            dd = (dt.datetime.now(SP) - dt.timedelta(days=i)).date()
            dorm = dt.datetime(dd.year, dd.month, dd.day, 0, 0, tzinfo=SP) - dt.timedelta(minutes=random.choice([30, 60, 120]))
            acor = dt.datetime(dd.year, dd.month, dd.day, 6, 30, tzinfo=SP)
            fake.tables['sono'].append({'user_id': uid, 'dia': dd.isoformat(), 'dormiu': dorm.isoformat(), 'acordou': acor.isoformat(), 'qualidade': 4, 'obs': None, 'pausas': []})
            fake.tables['agua'].append({'user_id': uid, 'dia': dd.isoformat(), 'ml': random.choice([1500, 2500, 3500])})
        for i, d in enumerate([(dt.datetime.now(SP)-dt.timedelta(days=100)).date().isoformat(), (dt.datetime.now(SP)-dt.timedelta(days=2)).date().isoformat()]):
            path = f'{uid}/{d}-frente-1.jpg'; fake.files[path] = open(f'{FIX}/foto_{i}.jpg','rb').read()
            fake.tables['photos'].append({'id': str(uuid.uuid4()), 'user_id': uid, 'd': d, 'pose': 'frente', 'path': path})
        fake.tables['profiles'][0]['meta_peso'] = 82
        await pg.set_viewport_size({'width': 390, 'height': 844})
        await pg.reload(); await pg.wait_for_selector('.hero', timeout=15000)
        await pg.click('#nav-evolucao'); await pg.wait_for_selector('.rtg'); await pg.wait_for_timeout(400)
        print('abas:', [txt(await x.text_content()) for x in await pg.query_selector_all('.seg [role=tab]')])
        print('tiles:', [txt(await x.text_content()) for x in await pg.query_selector_all('.rt')])
        for sec in await pg.query_selector_all('section.card'):
            print('--', txt(await sec.text_content())[:330])
        await pg.screenshot(path=SH+'e1-resumo.png', full_page=True)
        await pg.click('[data-a=evo-cmp][data-v="3m"]'); await pg.wait_for_timeout(200)
        print('3m:', txt(await pg.text_content('.cmpt'))[:200])
        await pg.click('[data-a=share-evo] >> nth=0'); await pg.wait_for_selector('#cardprev img', timeout=15000)
        src = await pg.get_attribute('#cardprev img', 'src')
        data = await pg.evaluate("async u=>{const b=await (await fetch(u)).blob(); const r=new FileReader(); return await new Promise(ok=>{r.onload=()=>ok(r.result); r.readAsDataURL(b);});}", src)
        import base64; open(SH+'e2-card.png','wb').write(base64.b64decode(data.split(',')[1]))
        await pg.click('#sheet [data-a=close]')
        await pg.click('[data-a=evo][data-t=forca]'); await pg.wait_for_selector('.mmap'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=SH+'e3-forca.png', full_page=True)
        print('níveis mapa:', [await x.get_attribute('class') + ':' + (await x.get_attribute('data-m')) for x in await pg.query_selector_all('.mm')])
        await pg.click('[data-a=evo-mm][data-v="30"]'); await pg.wait_for_timeout(200)
        await pg.click('.mm[data-m=peito] >> nth=0'); await pg.wait_for_timeout(300)
        print('músculo:', txt(await pg.text_content('#sheet-card'))[:250])
        await pg.locator('#sheet-card').screenshot(path=SH+'e4-musculo.png')
        await pg.click('#sheet-card .exr >> nth=0'); await pg.wait_for_timeout(300)
        print('exercício:', txt(await pg.text_content('#sheet-card'))[:250])
        await pg.locator('#sheet-card').screenshot(path=SH+'e5-ex.png')
        await pg.click('#sheet [data-a=close]')
        await pg.click('[data-a=ex-filtro][data-v=B]'); await pg.wait_for_timeout(200)
        print('filtro B:', len(await pg.query_selector_all('.exl .exr')))
        if await pg.query_selector('[data-a=evo-recs]'): await pg.click('[data-a=evo-recs]'); await pg.wait_for_timeout(200); print('recordes:', len(await pg.query_selector_all('#sheet-card .rec-c'))); await pg.click('#sheet [data-a=close]')
        await pg.click('[data-a=evo][data-t=corpo]'); await pg.wait_for_selector('#cmp'); await pg.wait_for_timeout(1200)
        await pg.locator('#cmp').scroll_into_view_if_needed(); box = await pg.locator('#cmp').bounding_box()
        await pg.mouse.move(box['x']+box['width']*0.5, box['y']+box['height']/2); await pg.mouse.down(); await pg.mouse.move(box['x']+box['width']*0.2, box['y']+box['height']/2, steps=5); await pg.mouse.up()
        print('arrastou:', await pg.evaluate("document.querySelector('#cmp-div').style.left"))
        print('nota cmp:', txt(await pg.text_content('#cmp + p')))
        await pg.screenshot(path=SH+'e6-corpo.png', full_page=True)
        await pg.click('#nav-hoje'); await pg.click('.lvl'); await pg.wait_for_timeout(300)
        print('conquistas abre:', await pg.query_selector('.lvlcard') is not None)
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
