# Lançar treino já feito (com dia, hora e duração) e limpeza dos botões
import asyncio, os, sys, re, datetime as dt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta
def txt(s): return re.sub(r'\s+', ' ', s or '').strip()
async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 's@t.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        await pg.click('#nav-hoje'); await pg.wait_for_selector('.qa')
        rapidas = [await x.get_attribute('data-a') for x in await pg.query_selector_all('.qa-b')]
        print('botões rápidos:', rapidas); assert 'cochilo' not in rapidas and 'lancar' in rapidas
        await pg.click('.qa-b[data-a=lancar]'); await pg.wait_for_selector('#lc-dia')
        ontem = (dt.date.today() - dt.timedelta(days=1)).isoformat()
        await pg.click('[data-a=lanc-tr][data-l=B]'); await pg.click('[data-a=lanc-dur][data-v="50"]')
        await pg.fill('#lc-dia', ontem); await pg.fill('#lc-ini', '18:00')
        await pg.locator('#sheet-card').screenshot(path=SHOTS+'l1-lancar.png')
        await pg.click('[data-a=lanc-go]'); await pg.wait_for_selector('#set-0-0')
        print('cabeçalho:', txt(await pg.text_content('.shead .st')))
        print('rascunho na nuvem:', len(fake.tables['drafts']))
        await pg.fill('#w-0-0-0', '40'); await pg.wait_for_timeout(150)
        print('série marcada ao digitar a carga:', 'done' in await pg.get_attribute('#set-0-0', 'class'), '| descanso:', await pg.is_visible('#rest') if await pg.query_selector('#rest') else False)
        await pg.click('[data-a=lanc-tudo]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=SHOTS+'l2-sessao.png')
        await pg.click('[data-a=finish]'); await pg.wait_for_selector('[data-a=save]'); await pg.click('[data-a=save]'); await pg.wait_for_timeout(900)
        s = fake.tables['sessions'][-1]
        print('salvo:', s['letter'], s['started_at'][:16], '| duração min:', s['dur_s']/60, '| séries:', s['sets_done'], '/', s['sets_total'])
        print('1ª série:', s['ex'][0]['sets'][0], '| 2ª série:', s['ex'][0]['sets'][1])
        if await pg.is_visible('#sheet'): await pg.click('#sheet [data-a=close] >> nth=0')
        # sem calendário no perfil; cochilo dentro do sono
        await pg.click('#nav-hoje'); await pg.click('[data-mod=sono] .mod-h'); await pg.wait_for_selector('#sheet-card [data-a=cochilo]')
        print('cochilo no sono: ok')
        await pg.click('#sheet [data-a=close] >> nth=0')
        await pg.click('.avatar, [data-a=perfil] >> nth=0') if await pg.query_selector('[data-a=perfil]') else None
        print('calendário removido:', 'Lembretes no calendário' not in (await pg.content()))
        print('ERROS:', [e for e in errs if 'Failed to load' not in e and 'vibrate' not in e])
        await b.close()
asyncio.run(main())
