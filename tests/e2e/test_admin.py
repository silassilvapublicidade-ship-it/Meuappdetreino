import asyncio, sys, re
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake, BASE
from test_novos import nova_conta, treinar, APP, SH


def txt(s): return re.sub(r'\s+', ' ', s or '').strip()


async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@teste.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        ctx2, pg2 = await nova_conta(b, fake, 'Ana', 'ana@teste.com', errs)
        await pg2.click('[data-a=f-save]'); await pg2.wait_for_selector('.wcard', timeout=10000)
        await treinar(pg2, kg='20'); await pg2.click('[data-a=close]')
        await pg2.click('#nav-hoje'); await pg2.click('.avatar')
        print('Ana tem botão admin:', await pg2.locator('#sheet [data-v=admin]').count()); await pg2.click('#sheet [data-a=close]')

        silas = fake.users['silas@teste.com']['id']; fake.admins.add(silas); fake.editores.add(silas)
        await pg.reload(); await pg.wait_for_selector('.hero', timeout=10000)
        await pg.click('.avatar'); await pg.click('#sheet [data-v=admin]')
        await pg.wait_for_selector('.hl-row', timeout=10000); await pg.wait_for_timeout(400)
        print('saúde:'); [print('  ', txt(await x.text_content())) for x in await pg.query_selector_all('.hl-row')]
        await pg.screenshot(path=SH + 'a1-painel.png', full_page=True)

        # usuários
        await pg.click('[data-a=adm-tab][data-t=usuarios]'); await pg.wait_for_selector('.ucard', timeout=10000)
        print('usuários:', [txt(await x.text_content())[:90] for x in await pg.query_selector_all('.uc-h')])
        await pg.screenshot(path=SH + 'a2-usuarios.png', full_page=True)
        ana = fake.users['ana@teste.com']['id']
        await pg.click(f'[data-a=adm-fichas][data-id="{ana}"]'); await pg.wait_for_selector('#sheet [data-a=adm-f-edit]', timeout=10000)
        await pg.screenshot(path=SH + 'a3-fichas-ana.png')
        await pg.click('#sheet [data-a=adm-f-edit]'); await pg.wait_for_selector('#f-nome')
        print('editor título:', txt(await pg.text_content('.shead .st')))
        await pg.fill('#f-nome', 'Ficha da Ana (ajustada)')
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.ucard', timeout=10000); await pg.wait_for_timeout(300)
        print('toast:', await pg.text_content('#toast'))
        print('fichas da Ana no banco:', [(x['nome'], x['ativa']) for x in fake.tables['plans'] if x['user_id'] == ana])
        print('fichas do Silas intactas:', [(x['nome'], x['ativa']) for x in fake.tables['plans'] if x['user_id'] == silas])
        btn = pg.locator(f'[data-a=adm-senha][data-u="{ana}"]')
        await btn.click(); print('1º toque:', await btn.text_content())
        await btn.click(); await pg.wait_for_timeout(300); print('2º toque:', await pg.text_content('#toast'), '| recover chamado:', any(c[1].endswith('/recover') for c in fake.calls))

        # Ana recarrega e vê a ficha nova
        await pg2.reload(); await pg2.wait_for_selector('.hero', timeout=10000)
        await pg2.click('#nav-treinos'); print('Ana vê ficha:', await pg2.text_content('.card .h2'))

        # avisos
        await pg.click('[data-a=adm-tab][data-t=conteudo]'); await pg.wait_for_selector('#av-txt')
        await pg.fill('#av-txt', 'Academia fechada na sexta (feriado). Treino D fica para sábado.')
        await pg.select_option('#av-nivel', 'alerta'); await pg.click('[data-a=adm-aviso]')
        for _ in range(40):
            if fake.tables['app_avisos']: break
            await pg.wait_for_timeout(100)
        print('aviso notificar:', fake.tables['app_avisos'][-1].get('notificar'), '| toast:', await pg.text_content('#toast'))
        print('avisos no banco:', [(a['texto'][:25], a['nivel']) for a in fake.tables['app_avisos']])
        await pg.screenshot(path=SH + 'a4-conteudo.png', full_page=True)
        await pg2.click('#nav-hoje'); await pg2.reload(); await pg2.wait_for_selector('.aviso', timeout=10000)
        print('Ana vê aviso:', txt(await pg2.text_content('.aviso')))
        await pg2.screenshot(path=SH + 'a5-aviso-ana.png')
        await pg2.click('[data-a=aviso-x]'); await pg2.reload(); await pg2.wait_for_selector('.hero')
        print('aviso fechado continua fechado:', await pg2.locator('.aviso').count() == 0)

        # Ana tenta criar aviso direto (barrado) e gera um erro no app
        await pg2.evaluate("setTimeout(()=>{ throw new Error('Teste de erro na tela Hoje'); }, 0)")
        await pg2.wait_for_timeout(800)
        print('erros no banco:', [(e['msg'], e['tela']) for e in fake.tables['app_erros']])
        await pg.click('[data-a=adm-tab][data-t=erros]'); await pg.wait_for_selector('.erro', timeout=10000)
        print('erros na tela:', [txt(await x.text_content())[:100] for x in await pg.query_selector_all('.erro summary')])
        await pg.screenshot(path=SH + 'a6-erros.png')
        print('ERROS:', [e for e in errs if 'Failed to load' not in e and 'Teste de erro' not in e])
        await b.close()

asyncio.run(main())
