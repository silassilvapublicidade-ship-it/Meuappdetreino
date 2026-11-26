import asyncio, sys, json, re
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake, BASE

APP = APP
SH = SHOTS


async def nova_conta(b, fake, nome, email, errs):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, accept_downloads=True)
    await ctx.route(BASE + '/**', fake.handle)
    pg = await ctx.new_page()
    pg.on('console', lambda m: errs.append(nome + ': ' + m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append(nome + ' PAGEERROR ' + str(e)))
    await pg.goto(APP); await pg.wait_for_selector('#f-auth')
    await pg.click('[data-a=auth-tab][data-t=criar]')
    await pg.fill('#a-nome', nome); await pg.fill('#a-email', email); await pg.fill('#a-senha', 'segredo123')
    await pg.click('#f-auth button[type=submit]')
    await pg.wait_for_selector('.choices', timeout=10000)
    await pg.click('[data-a=ob-modelo]'); await pg.wait_for_selector('#f-nome')
    return ctx, pg


async def treinar(pg, kg='40', reps='12', trocar=None):
    await pg.click('#nav-hoje'); await pg.click('[data-a=start]'); await pg.wait_for_selector('#set-0-0')
    if trocar:
        await pg.click('[data-a=swap][data-ei="0"]'); await pg.wait_for_selector('#swap-n')
        await pg.screenshot(path=SH + 'n2-trocar.png')
        await pg.fill('#swap-n', trocar); await pg.click('[data-a=swap-go]'); await pg.wait_for_timeout(200)
    n = await pg.locator('#sets-0 .set').count()
    for si in range(n):
        await pg.fill(f'#w-0-{si}-0', kg); await pg.click(f'#set-0-{si} .chk')
    await pg.click('[data-a=rest-skip]')
    await pg.click('[data-a=finish]'); await pg.click('[data-a=save]')
    await pg.wait_for_selector('[data-a=rs-share]', timeout=10000); await pg.click('[data-a=rs-share]')
    await pg.wait_for_selector('#cardprev img', timeout=10000)


async def main():
    fake = Fake(); errs = []; fake.inicio = {'completos': ['agua','sono','missoes','grupo'], 'auto': False}
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        # ---------- Silas ----------
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@teste.com', errs)
        # vídeos não são mais editados na ficha: vêm da biblioteca (curados ou automáticos)
        print('campo de vídeo no editor:', await pg.locator('[data-e$=".video"]').count())
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        plan = fake.tables['plans'][0]
        print('ficha sem vídeo gravado:', all('video' not in e for w in plan['treinos']['w'].values() for e in w['ex']))
        await pg.click('[data-v="treino:A"]'); await pg.wait_for_selector('.ex')
        print('links vídeo na tela A:', await pg.locator('.vlink').count())
        await pg.screenshot(path=SH + 'n1-video.png')

        # treino com troca de exercício
        await treinar(pg, trocar='Supino com halteres')
        titulo = await pg.text_content('#sheet-card h2')
        print('título ao salvar:', titulo)
        s0 = fake.tables['sessions'][-1]
        print('sessão ex0:', s0['ex'][0]['n'], '| era:', s0['ex'][0].get('era'), '| sets:', len(s0['ex'][0]['sets']))
        src = await pg.get_attribute('#cardprev img', 'src')
        data = await pg.evaluate("async u=>{ const b=await (await fetch(u)).blob(); return await new Promise(r=>{ const f=new FileReader(); f.onload=()=>r(f.result); f.readAsDataURL(b); }); }", src)
        import base64
        open(SH + 'n3-story-conquista.png', 'wb').write(base64.b64decode(data.split(',')[1]))
        await pg.click('[data-a=close]')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=SH + 'n4-hoje.png', full_page=True)
        print('nível strip:', re.sub(r'\s+', ' ', await pg.text_content('.lvl')))

        # conquistas
        await pg.click('.lvl'); await pg.wait_for_selector('.lvlcard')
        print('conquistadas:', [await x.text_content() for x in await pg.query_selector_all('.badge.on b')])
        await pg.screenshot(path=SH + 'n5-conquistas.png', full_page=True)

        # lembretes no calendário foram removidos (a notificação do app faz isso)
        await pg.click('#nav-hoje'); await pg.click('.avatar')
        print('sem calendário:', await pg.locator('#sheet [data-a=lembretes]').count() == 0)
        await pg.click('#sheet [data-a=close]')

        # grupo: criar
        await pg.click('.avatar'); await pg.click('#sheet [data-a=grupo]'); await pg.wait_for_selector('#g-nome')
        await pg.screenshot(path=SH + 'n7-grupo-novo.png')
        await pg.fill('#g-nome', 'Família Silva'); await pg.click('[data-a=g-criar]'); await pg.wait_for_selector('.gcode')
        codigo = (await pg.text_content('.gcode')).strip()
        print('código:', codigo)
        await pg.screenshot(path=SH + 'n8-grupo-codigo.png')
        await pg.click('[data-a=close]')

        # ---------- Namorada ----------
        ctx2, pg2 = await nova_conta(b, fake, 'Ana', 'ana@teste.com', errs)
        await pg2.click('[data-a=f-save]'); await pg2.wait_for_selector('.wcard', timeout=10000)
        await treinar(pg2, kg='20'); await pg2.click('[data-a=close]')
        await pg2.click('#nav-hoje'); await pg2.click('.gcta'); await pg2.wait_for_selector('#g-cod')
        await pg2.fill('#g-cod', 'ZZZZZZ'); await pg2.click('[data-a=g-entrar]'); await pg2.wait_for_timeout(300)
        print('código errado:', await pg2.text_content('#toast'))
        await pg2.fill('#g-cod', codigo.lower()); await pg2.click('[data-a=g-entrar]')
        await pg2.wait_for_selector('.gm', timeout=10000); await pg2.wait_for_timeout(300)
        print('grupo da Ana:', [re.sub(r'\s+', ' ', await x.text_content()).strip() for x in await pg2.query_selector_all('.gm')])
        await pg2.screenshot(path=SH + 'n9-grupo-ana.png', full_page=True)

        # Silas recarrega e vê a Ana
        await pg.reload(); await pg.wait_for_selector('.gm', timeout=10000); await pg.wait_for_timeout(300)
        print('grupo do Silas:', [re.sub(r'\s+', ' ', await x.text_content()).strip() for x in await pg.query_selector_all('.gm')])

        # ---------- Offline ----------
        await pg.wait_for_timeout(1500)  # service worker guarda os arquivos
        print('sw:', await pg.evaluate("navigator.serviceWorker.controller ? 'controlando' : 'sem controle'"),
              '| cache:', await pg.evaluate("caches.open('mt-app').then(c=>c.keys()).then(k=>k.length)"))
        await ctx.set_offline(True); fake.down = True
        await pg.reload(); await pg.wait_for_selector('.hero', timeout=15000)
        await pg.wait_for_timeout(500)
        print('offline: hero:', await pg.text_content('.hero-name'), '| status:', await pg.text_content('#sync'), '| toast:', await pg.text_content('#toast'))
        await pg.screenshot(path=SH + 'n10-offline.png')
        antes = len(fake.tables['sessions'])
        await treinar(pg, kg='42.5')
        await pg.click('[data-a=close]')
        print('offline: sessões no banco', antes, '->', len(fake.tables['sessions']), '| pendentes:', await pg.evaluate("JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('mt.pending.')))||'[]').length"))
        await ctx.set_offline(False); fake.down = False
        await pg.wait_for_timeout(2500)
        print('online de novo: sessões no banco:', len(fake.tables['sessions']), '| status:', await pg.text_content('#sync'))

        # falhas de rede no modo offline e o 400 do código de grupo errado são esperados
        print('ERROS:', [e for e in errs if 'ERR_INTERNET_DISCONNECTED' not in e and 'ERR_FAILED' not in e and 'status of 400' not in e])
        await b.close()

if __name__ == '__main__':
    asyncio.run(main())
