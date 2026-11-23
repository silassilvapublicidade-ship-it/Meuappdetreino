import asyncio, sys, re
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake, BASE
from test_novos import nova_conta, APP, SH


async def main():
    fake = Fake(); errs = []; fake.inicio = {'completos': ['agua','sono','missoes','grupo'], 'auto': False}
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        # Silas: conta, ficha modelo e vira editor
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@teste.com', errs)
        print('campo de vídeo antes de ser editor:', await pg.locator('[data-e$=".video"]').count())
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        silas = fake.users['silas@teste.com']['id']; fake.editores.add(silas)
        await pg.reload(); await pg.wait_for_selector('.hero', timeout=10000)
        await pg.click('#nav-treinos'); await pg.click('[data-a=f-edit]'); await pg.wait_for_selector('#f-nome')
        print('campos de vídeo para o Silas:', await pg.locator('[data-e$=".video"]').count())
        await pg.fill('[data-e="w.A.ex.0.video"]', 'https://youtu.be/supino1')
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000); await pg.wait_for_timeout(300)
        print('biblioteca:', [(v['chave'], v['video']) for v in fake.tables['exercise_videos']])
        print('vídeo dentro da ficha salva:', fake.tables['plans'][0]['treinos']['w']['A']['ex'][0].get('video'))

        # Ana: mesma ficha modelo, sem edição de link
        ctx2, pg2 = await nova_conta(b, fake, 'Ana', 'ana@teste.com', errs)
        print('campos de vídeo para a Ana:', await pg2.locator('[data-e$=".video"]').count())
        # renomeia o 1º exercício com outra grafia para testar a chave
        await pg2.fill('[data-e="w.A.ex.0.n"]', 'Supino inclinado c/ halteres')
        await pg2.click('[data-a=f-save]'); await pg2.wait_for_selector('.wcard', timeout=10000)
        await pg2.click('[data-v="treino:A"]'); await pg2.wait_for_selector('.ex')
        print('Ana vê vídeo no treino A:', await pg2.locator('.vlink').count(), await pg2.get_attribute('.vlink', 'href'))
        await pg2.click('#nav-hoje'); await pg2.click('.avatar'); print('Ana tem botão Vídeos no perfil:', await pg2.locator('#sheet [data-a=videos]').count()); await pg2.click('#sheet [data-a=close]')
        # Ana tenta gravar direto no banco (deve ser barrada)
        r = await pg2.evaluate("""async()=>{ const k=Object.keys(localStorage).find(k=>k.includes('auth-token')); const t=JSON.parse(localStorage.getItem(k)).access_token;
            const res = await fetch('%s/rest/v1/exercise_videos', {method:'POST', headers:{'apikey':'x','authorization':'Bearer '+t,'content-type':'application/json'}, body: JSON.stringify({chave:'x',nome:'x',video:'https://x.com'})}); return res.status; }""" % BASE)
        print('Ana gravando direto no banco ->', r)

        # grupo + biblioteca no perfil do Silas
        await pg.click('#nav-hoje'); await pg.click('.gcta'); await pg.wait_for_selector('#g-nome'); await pg.click('[data-a=g-criar]'); await pg.wait_for_selector('.gcode')
        cod = (await pg.text_content('.gcode')).strip(); await pg.click('#sheet [data-a=close]')
        await pg2.click('#nav-hoje'); await pg2.click('.gcta'); await pg2.wait_for_selector('#g-cod'); await pg2.fill('#g-cod', cod); await pg2.click('[data-a=g-entrar]'); await pg2.wait_for_selector('.gm')
        await pg.click('.avatar'); await pg.click('#sheet [data-a=videos]'); await pg.wait_for_selector('.vlist', timeout=10000)
        print('lista do Silas:', await pg.locator('.vrow').count(), 'itens |', await pg.text_content('#sheet-card .note'))
        await pg.screenshot(path=SH + 'v1-biblioteca.png')
        await pg.fill('[data-vn="Puxada frontal na polia (aberta)"]', 'youtube.com/watch?v=puxada')
        await pg.fill('[data-vk="supino-inclinado-halteres"]', '')
        await pg.click('[data-a=v-save]'); await pg.wait_for_timeout(500)
        print('toast:', await pg.text_content('#toast'))
        print('biblioteca agora:', [(v['chave'], v['video']) for v in fake.tables['exercise_videos']])
        await pg2.reload(); await pg2.wait_for_selector('.hero', timeout=10000)
        await pg2.click('#nav-treinos'); await pg2.click('[data-v="treino:A"]'); await pg2.wait_for_selector('.ex')
        print('Ana depois:', [await x.get_attribute('href') for x in await pg2.query_selector_all('.vlink')])
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()

asyncio.run(main())
