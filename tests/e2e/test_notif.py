import asyncio, sys, re
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, SH

async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@teste.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        await pg.click('#nav-hoje')
        # cria grupo para aparecer o convite de notificações
        await pg.click('.avatar'); await pg.click('#sheet [data-a=grupo]'); await pg.wait_for_selector('#g-nome')
        await pg.fill('#g-nome', 'Família'); await pg.click('[data-a=g-criar]'); await pg.wait_for_selector('.gcode'); await pg.click('[data-a=close]')
        await pg.wait_for_timeout(500)
        print('card ativar na Hoje:', await pg.locator('[data-a=notif]').count())
        await pg.click('.avatar'); await pg.click('#sheet [data-a=notif]'); await pg.wait_for_selector('#nt-grupo')
        print('estado:', re.sub(r'\s+',' ', (await pg.text_content('#sheet'))[:160]))
        await pg.wait_for_timeout(300); await pg.screenshot(path=SH+'nt1.png')
        await pg.uncheck('#nt-reacoes'); await pg.check('#nt-lem'); await pg.fill('#nt-hora', '06:30')
        await pg.click('[data-a=nt-save]'); await pg.wait_for_timeout(600)
        print('toast:', await pg.text_content('#toast'))
        pr = next(x for x in fake.tables['profiles'])
        print('perfil salvo:', pr.get('notif'), pr.get('lembrete_hora'))
        # ativar: no Chrome de teste não há serviço de push, então deve dar erro amigável
        await ctx.grant_permissions(['notifications'])
        await pg.click('.avatar'); await pg.click('#sheet [data-a=notif]'); await pg.wait_for_selector('#nt-grupo')
        print('reaberto, lembrete marcado:', await pg.is_checked('#nt-lem'), await pg.input_value('#nt-hora'), '| reações:', await pg.is_checked('#nt-reacoes'))
        if await pg.locator('[data-a=nt-on]').count():
            await pg.click('[data-a=nt-on]'); await pg.wait_for_timeout(4000)
            print('ao ativar:', await pg.text_content('#toast'), '| subs:', len(fake.tables['push_subs']))
        # lembretes do calendário tem atalho para notificações
        await pg.click('#sheet [data-a=close]') if await pg.locator('#sheet [data-a=close]').count() else None
        await pg.wait_for_timeout(300)
        await pg.click('.avatar'); await pg.click('#sheet [data-a=lembretes]'); await pg.wait_for_timeout(300)
        print('atalho em lembretes:', await pg.locator('#sheet [data-a=notif]').count())
        print('ERROS:', [e for e in errs if 'status of 400' not in e])
        await b.close()
asyncio.run(main())
