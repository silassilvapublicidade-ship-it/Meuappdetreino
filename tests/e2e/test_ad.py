import asyncio, sys, base64, time, uuid, random
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH
def iso(ts): return time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(ts))
async def salvar(pg, nome):
    await pg.wait_for_selector('#cardprev img', timeout=15000)
    src = await pg.get_attribute('#cardprev img', 'src')
    data = await pg.evaluate("async u=>{ const b=await (await fetch(u)).blob(); return await new Promise(r=>{ const f=new FileReader(); f.onload=()=>r(f.result); f.readAsDataURL(b); }); }", src)
    open(SH + nome, 'wb').write(base64.b64decode(data.split(',')[1]))
async def main():
    fake = Fake(); errs = []; random.seed(3)
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@teste.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        uid = fake.users['silas@teste.com']['id']; plano = fake.tables['plans'][0]
        # um ano de treinos
        ini = time.mktime(time.strptime('2026-01-05 18:00', '%Y-%m-%d %H:%M'))
        letras = ['A','B','C','D','E']; ex = {'A':('Supino inclinado com halteres','supino-inclinado-com-halteres'),'B':('Agachamento livre (ou Smith)','agachamento-livre-ou-smith'),
              'C':('Remada curvada com barra','remada-curvada-com-barra'),'D':('Cadeira flexora','cadeira-flexora'),'E':('Leg press horizontal','leg-press-horizontal')}
        t = ini; k = 0
        while t < time.time() - 86400:
            if random.random() < 0.62:
                L = letras[k%5]; n, key = ex[L]; kg = 20 + k*0.25 if L=='A' else 60 + k*0.6
                fake.tables['sessions'].append({'id': str(uuid.uuid4()), 'user_id': uid, 'plan_id': plano['id'], 'letter': L, 'workout_name': 'Treino '+L,
                    'started_at': iso(t), 'ended_at': iso(t+3300), 'dur_s': 3300, 'notes': '', 'vol': int(kg*4*10), 'sets_done': 4, 'sets_total': 20,
                    'ex': [{'key': key, 'keys': [key], 'n': n, 'parts': [n], 'sets': [{'p': [{'kg': round(kg*2)/2, 'r': 10}]} for _ in range(4)]}]}); k += 1
            t += 86400
        # fotos e pesos
        for i, d in enumerate(['2026-03-02', '2026-11-10']):
            path = f'{uid}/{d}-frente-1.jpg'; fake.files[path] = open(f'{FIX}/foto_{i}.jpg','rb').read()
            fake.tables['photos'].append({'id': str(uuid.uuid4()), 'user_id': uid, 'd': d, 'pose': 'frente', 'path': path})
        fake.tables['body_weights'] += [{'user_id': uid, 'd': '2026-03-01', 'kg': 91.4}, {'user_id': uid, 'd': '2026-11-12', 'kg': 85.1}]
        await pg.reload(); await pg.wait_for_selector('.hero', timeout=10000)
        await pg.click('#nav-evolucao'); await pg.click('[data-a=evo][data-t=corpo]'); await pg.wait_for_selector('[data-a=share-ad]')
        await pg.click('[data-a=share-ad]'); await salvar(pg, 'd1-antesdepois.png'); await pg.click('#sheet [data-a=close]')
        await pg.click('#nav-treinos'); await pg.click('[data-a=tr-tab][data-t=historico]'); await pg.click('[data-a=share-retro]'); await salvar(pg, 'd2-retro.png')
        print('treinos:', len(fake.tables['sessions']), '| ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
