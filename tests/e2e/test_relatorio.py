import asyncio, os, sys, re, time, random, uuid, datetime as dt
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
        await pg.click('#nav-evolucao'); await pg.click('[data-a=relatorio]'); await pg.wait_for_selector('[data-a=rel-gerar]')
        await pg.locator('#sheet-card').screenshot(path=SHOTS+'r1-escolher.png')
        await pg.click('[data-a=rel-gerar]'); await pg.wait_for_selector('#sheet-card a[download]', timeout=30000)
        print('pronto:', txt(await pg.text_content('#sheet-card')))
        href = await pg.get_attribute('#sheet-card a[download]', 'href'); nome = await pg.get_attribute('#sheet-card a[download]', 'download')
        data = await pg.evaluate("async u=>{const b=await (await fetch(u)).blob(); const r=new FileReader(); return await new Promise(ok=>{r.onload=()=>ok(r.result); r.readAsDataURL(b);});}", href)
        import base64; open(SHOTS+'relatorio.pdf','wb').write(base64.b64decode(data.split(',')[1]))
        print('arquivo:', nome, os.path.getsize(SHOTS+'relatorio.pdf'), 'bytes')
        print('ERROS:', [e for e in errs if 'Failed to load' not in e and 'vibrate' not in e])
        await b.close()
asyncio.run(main())
