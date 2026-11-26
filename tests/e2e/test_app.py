import asyncio, sys, json
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake, BASE

APP = APP
FICHA_IMG = FIX + '/foto0.jpg'


async def main():
    fake = Fake()
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        await ctx.route(BASE + '/**', fake.handle)
        await ctx.route('https://fonts.googleapis.com/**', lambda r: r.abort())
        pg = await ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('response', lambda r: errs.append('400 '+r.url) if r.status==400 else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        await pg.goto(APP); await pg.wait_for_selector('#f-auth')
        await pg.screenshot(path=SHOTS+'s1-login.png')
        # senha errada
        await pg.fill('#a-email', 'ana@teste.com'); await pg.fill('#a-senha', 'x')
        await pg.click('#f-auth button[type=submit]'); await pg.wait_for_selector('.formmsg.err')
        print('erro login:', await pg.text_content('.formmsg.err'))
        # criar conta
        await pg.click('[data-a=auth-tab][data-t=criar]')
        await pg.fill('#a-nome', 'Ana Souza'); await pg.fill('#a-email', 'ana@teste.com'); await pg.fill('#a-senha', 'segredo123')
        await pg.click('#f-auth button[type=submit]')
        await pg.wait_for_selector('.choices', timeout=10000)
        await pg.screenshot(path=SHOTS+'s2-onboarding.png')
        # ficha por foto
        await pg.set_input_files('#f-ficha', FICHA_IMG)
        await pg.wait_for_selector('#f-nome', timeout=10000)
        print('fn:', fake.fn_calls[-1])
        print('editor treinos:', await pg.locator('.fw').count(), 'exercicios:', await pg.locator('.fx').count(), 'nome:', await pg.input_value('#f-nome'))
        await pg.screenshot(path=SHOTS+'s3-editor.png', full_page=True)
        # ajusta séries do 1º exercício e salva
        await pg.fill('[data-e="w.A.ex.0.s"]', '5')
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        plan = fake.tables['plans'][0]
        print('plano salvo:', plan['nome'], plan['treinos']['order'], plan['treinos']['w']['A']['ex'][0]['s'], plan['treinos']['w']['A']['ex'][1].get('parts'), plan['cronograma'])
        # treino
        await pg.click('#nav-hoje'); await pg.wait_for_selector('[data-a=start]')
        print('hero:', (await pg.text_content('.hero-name')))
        await pg.click('[data-a=trocar-treino]'); await pg.click('.tt-b [data-a=start][data-l="A"]'); await pg.wait_for_selector('#set-0-0')
        for si in range(5):
            await pg.fill(f'#w-0-{si}-0', '40'); await pg.click(f'#set-0-{si} .chk')
        await pg.fill('#w-1-0-0', '30'); await pg.fill('#w-1-0-1', '50'); await pg.click('#set-1-0 .chk')
        await pg.click('[data-a=rest-skip]')
        await pg.click('[data-a=finish]'); await pg.click('[data-a=save]'); await pg.wait_for_timeout(600)
        print('toast:', await pg.text_content('#toast'))
        print('sessions no banco:', len(fake.tables['sessions']), 'rascunhos:', len(fake.tables['drafts']))
        # depois de salvar abre a folha de compartilhar o card; fecha para seguir
        await pg.wait_for_selector('#sheet [data-a=close]')
        print('folha pós-treino:', (await pg.text_content('#sheet h2') or '').strip()[:60])
        await pg.click('#sheet [data-a=close]'); await pg.wait_for_timeout(400)
        # próximo treino A de novo -> sugestão
        await pg.click('#nav-treinos'); await pg.click('[data-v="treino:A"]'); await pg.wait_for_selector('.ex')
        print('sugestões:', [await x.text_content() for x in await pg.query_selector_all('.sug')])
        # avaliação
        await pg.click('#nav-evolucao'); await pg.click('[data-a=evo][data-t=corpo]')
        await pg.set_input_files('#f-aval', FIX+'/aval-teste.pdf')
        await pg.wait_for_selector('#mdate', timeout=10000)
        print('fn aval:', fake.fn_calls[-1]['types'])
        await pg.click('[data-a=msave]'); await pg.wait_for_timeout(500)
        print('avaliações:', len(fake.tables['assessments']), 'peso:', fake.tables['body_weights'])
        print('tiles:', [await x.text_content() for x in await pg.query_selector_all('.mtile')])
        # fotos
        await pg.click('[data-a=evo][data-t=corpo]'); await pg.click('[data-a=pnew]')
        await pg.click('[data-a=pslot][data-p=frente]'); await pg.set_input_files('#f-photo', FIX+'/foto0.jpg'); await pg.wait_for_timeout(200)
        await pg.click('[data-a=psave]'); await pg.wait_for_timeout(1200)
        print('fotos banco:', len(fake.tables['photos']), 'arquivos:', list(fake.files.keys())[:1])
        print('img src ok:', await pg.evaluate("Array.from(document.querySelectorAll('.ph img')).map(i=>i.complete && i.naturalWidth>0)"))
        await pg.screenshot(path=SHOTS+'s4-fotos.png')
        # nova ficha modelo -> troca
        await pg.click('#nav-treinos'); await pg.click('[data-v=onboarding]'); await pg.click('[data-a=ob-modelo]')
        await pg.wait_for_selector('#f-nome'); await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard')
        print('fichas:', [(x['nome'], x['ativa']) for x in fake.tables['plans']], 'cards:', await pg.locator('.wcard').count())
        # recarregar: dados vêm do banco
        await pg.reload(); await pg.wait_for_selector('.hero', timeout=10000)
        print('após reload hero:', await pg.text_content('.hero-name'), '| histórico:', len(fake.tables['sessions']))
        await pg.click('#nav-treinos'); await pg.click('[data-a=tr-tab][data-t=historico]'); print('linhas histórico:', await pg.locator('.hrow').count())
        # trocar para a ficha da Ana
        await pg.click('#nav-treinos'); await pg.click('[data-a=fichas]'); await pg.click('[data-a=f-usar]'); await pg.wait_for_timeout(400)
        print('ativa:', [(x['nome'], x['ativa']) for x in fake.tables['plans']], 'cards:', await pg.locator('.wcard').count())
        await pg.click('#nav-hoje'); await pg.screenshot(path=SHOTS+'s5-hoje.png')
        # sair
        await pg.click('[data-a=perfil]'); await pg.click('[data-a=sair]'); await pg.wait_for_selector('#f-auth', timeout=5000)
        print('saiu ok')
        # o 400 do login com senha errada é esperado (testado no começo)
        print('ERRORS:', [e for e in errs if 'fonts' not in e and 'ERR_FAILED' not in e and 'grant_type=password' not in e and 'status of 400' not in e])
        await b.close()

asyncio.run(main())
