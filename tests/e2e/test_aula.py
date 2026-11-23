import asyncio, sys, re, time, base64
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH
def txt(s): return re.sub(r'\s+', ' ', s or '').strip()
async def salvar_card(pg, nome):
    await pg.wait_for_selector('#cardprev img', timeout=15000)
    src = await pg.get_attribute('#cardprev img', 'src')
    data = await pg.evaluate("async u=>{ const b=await (await fetch(u)).blob(); return await new Promise(r=>{ const f=new FileReader(); f.onload=()=>r(f.result); f.readAsDataURL(b); }); }", src)
    open(SH+nome, 'wb').write(base64.b64decode(data.split(',')[1]))
async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Cintia Guedes', 'cintia@t.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        uid = fake.tables['profiles'][0]['id']
        fake.tables['body_weights'].append({'user_id': uid, 'd': time.strftime('%Y-%m-%d'), 'kg': 62})
        await pg.reload(); await pg.wait_for_selector('.hero', timeout=15000)
        await pg.click('[data-a=cardio]'); await pg.wait_for_selector('.aulas')
        await pg.click('.aula-b[data-t=Spinning]'); await pg.wait_for_selector('.intens')
        await pg.click('.int-b[data-k=forte]'); await pg.fill('#cd-min', '45'); await pg.wait_for_timeout(200)
        print('estimativa:', txt(await pg.text_content('#cd-est')), '| botão:', await pg.text_content('#cd-save'), '| km visível:', await pg.is_visible('#cd-km'))
        await pg.screenshot(path=SH+'a1-sheet.png')
        await pg.click('#cd-save'); await salvar_card(pg, 'a2-card-spinning.png')
        print('título:', txt(await pg.text_content('#sheet h2')))
        s = fake.tables['sessions'][-1]; print('salvo:', s['workout_name'], s['ex'][0]['cardio'])
        await pg.click('#sheet [data-a=close]')
        # jump com calorias do relógio
        await pg.click('[data-a=cardio]'); await pg.wait_for_selector('.aulas')
        await pg.click('.aula-b[data-t=Jump]'); await pg.click('.int-b[data-k="muito forte"]')
        print('km visível no jump:', await pg.is_visible('#cd-km'))
        await pg.fill('#cd-min', '50'); await pg.fill('#cd-kcal', '480')
        await pg.click('#cd-save'); await salvar_card(pg, 'a3-card-jump.png')
        print('salvo:', fake.tables['sessions'][-1]['ex'][0]['cardio'])
        await pg.click('#sheet [data-a=close]')
        await pg.click('#nav-treinos'); await pg.click('[data-a=tr-tab][data-t=historico]'); await pg.wait_for_timeout(400)
        print('histórico:', txt(await pg.text_content('#app'))[:200])
        # pump
        await pg.click('#nav-hoje'); await pg.click('[data-a=cardio]'); await pg.wait_for_selector('.aulas')
        await pg.click('.aula-b[data-t=Pump]'); await pg.click('.int-b[data-k=moderada]'); await pg.fill('#cd-min', '55'); await pg.wait_for_timeout(150)
        print('pump estimativa:', txt(await pg.text_content('#cd-est')), '| km visível:', await pg.is_visible('#cd-km'))
        await pg.screenshot(path=SH+'a4-pump-sheet.png')
        await pg.click('#cd-save'); await salvar_card(pg, 'a5-card-pump.png')
        print('pump salvo:', fake.tables['sessions'][-1]['workout_name'], fake.tables['sessions'][-1]['ex'][0]['cardio'])
        await pg.click('#sheet [data-a=close]')
        # esteira continua igual
        await pg.click('#nav-hoje'); await pg.click('[data-a=cardio]'); await pg.wait_for_selector('.aulas')
        await pg.click('[data-a=cd-tipo][data-t=Esteira]')
        print('esteira: intensidade some?', await pg.locator('.intens').count()==0, '| botão:', await pg.text_content('#cd-save'))
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
