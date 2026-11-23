# Abrir o app: mostra na hora o que está guardado no aparelho e depois atualiza com a nuvem
import asyncio, os, sys, time, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake, BASE
from test_novos import nova_conta
async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 's@t.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        await pg.click('#nav-hoje'); await pg.wait_for_selector('.hero')
        # internet lenta: cada pedido demora 1,5 s
        orig = fake.handle
        async def lento(route):
            await asyncio.sleep(1.5); return await orig(route)
        await ctx.unroute(BASE + '/**'); await ctx.route(BASE + '/**', lento)
        # login vencido: o app precisa renovar na internet
        await pg.evaluate("""()=>{ const k = Object.keys(localStorage).find(k=>k.endsWith('-auth-token')); const v = JSON.parse(localStorage.getItem(k)); v.expires_at = Math.floor(Date.now()/1000) - 60; localStorage.setItem(k, JSON.stringify(v)); }""")
        fake.tables['profiles'][0]['nome'] = 'Silas Atualizado'
        t = time.time(); await pg.reload(wait_until='commit'); await pg.wait_for_selector('.hero', timeout=20000)
        t1 = time.time() - t
        print('início apareceu em', round(t1, 2), 's (antes da internet responder)')
        assert t1 < 1.4, 'o início esperou a internet'
        await pg.wait_for_function("document.body.innerText.includes('Silas Atualizado') || document.querySelector('.avatar, .perfil-btn')", timeout=20000)
        for _ in range(60):
            if await pg.evaluate("JSON.stringify(localStorage).includes('Silas Atualizado')"): break
            await pg.wait_for_timeout(250)
        print('dados novos guardados:', await pg.evaluate("JSON.stringify(localStorage).includes('Silas Atualizado')"))
        # sessão inválida: volta para a tela de entrar e limpa a tela
        await ctx.unroute(BASE + '/**'); await ctx.route(BASE + '/**', orig)
        await pg.evaluate("""()=>{ const k = Object.keys(localStorage).find(k=>k.endsWith('-auth-token')); const v = JSON.parse(localStorage.getItem(k)); v.expires_at = Math.floor(Date.now()/1000) - 60; v.refresh_token = 'r-naoexiste'; localStorage.setItem(k, JSON.stringify(v)); }""")
        await pg.reload(); await pg.wait_for_selector('#f-auth', timeout=20000)
        print('sessão inválida -> tela de entrar:', await pg.is_visible('#f-auth'), '| hero sumiu:', await pg.query_selector('.hero') is None)
        print('ERROS:', [e for e in errs if 'Failed to load' not in e and '400' not in e])
        await b.close()
asyncio.run(main())
