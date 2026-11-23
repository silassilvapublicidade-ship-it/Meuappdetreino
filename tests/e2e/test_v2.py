import asyncio, sys, re
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake, BASE
from test_novos import nova_conta, SH, APP
def txt(s): return re.sub(r'\s+', ' ', s or '').strip()
VOZ = """window.webkitSpeechRecognition = class { constructor(){ this.lang=''; }
  start(){ setTimeout(()=>{ this.onresult && this.onresult({results:[[{transcript: window.__fala || '32 quilos 10'}]]}); this.onend && this.onend(); }, 50); } stop(){} }; window.SpeechRecognition = window.webkitSpeechRecognition;"""
async def main():
    fake = Fake(); errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 's@t.com', errs)
        await ctx.add_init_script(VOZ)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        await pg.reload(); await pg.wait_for_selector('.hero', timeout=15000)
        print('menu:', [txt(await x.text_content()) for x in await pg.query_selector_all('nav button')])
        # treino com voz + esforço/dor
        await pg.click('[data-a=start]'); await pg.wait_for_selector('#set-0-0')
        print('botão voz:', await pg.query_selector('[data-a=voz][data-ei="0"]') is not None)
        await pg.click('[data-a=voz][data-ei="0"]'); await pg.wait_for_timeout(400)
        print('voz preencheu:', await pg.input_value('#w-0-0-0'), await pg.input_value('#r-0-0-0'), 'feita:', 'done' in (await pg.get_attribute('#set-0-0', 'class')), '|', txt(await pg.text_content('#toast')))
        await pg.evaluate("window.__fala='trinta e dois e meio por oito'"); await pg.click('[data-a=voz][data-ei="0"]'); await pg.wait_for_timeout(400)
        print('voz 2:', await pg.input_value('#w-0-1-0'), await pg.input_value('#r-0-1-0'))
        await pg.screenshot(path=SH+'v1-voz.png')
        await pg.click('[data-a=finish]'); await pg.wait_for_selector('#fin-como')
        await pg.click('[data-a=fin-esf][data-v="5"]'); await pg.click('[data-a=fin-dor][data-v=ombro]')
        await pg.locator('#sheet-card').screenshot(path=SH+'v2-comofoi.png')
        await pg.click('[data-a=save]'); await pg.wait_for_timeout(900)
        s = fake.tables['sessions'][-1]; print('sessão:', s.get('esforco'), s.get('dor'))
        if await pg.is_visible('#sheet'): await pg.click('#sheet [data-a=close]')
        # próximo treino: aviso de dor
        await pg.click('#nav-treinos'); await pg.wait_for_timeout(200)
        await pg.click('#nav-hoje'); await pg.click('[data-a=trocar-treino]'); await pg.wait_for_timeout(200)
        await pg.click('#sheet-card [data-a=start][data-l=A]'); await pg.wait_for_selector('#set-0-0')
        print('avisos de dor:', len(await pg.query_selector_all('.ex .sug.estag')), '| no limite:', len(await pg.query_selector_all('.ex .sug')))
        await pg.click('[data-a=discard]') if await pg.query_selector('[data-a=discard]') else None
        await pg.wait_for_timeout(300)
        if await pg.is_visible('#sheet'):
            btn = await pg.query_selector('#sheet-card .btn.danger'); 
            if btn: await btn.click()
        # Treinos: ficha | histórico
        await pg.click('#nav-treinos'); await pg.wait_for_selector('[data-a=tr-tab]')
        await pg.click('[data-a=tr-tab][data-t=historico]'); await pg.wait_for_timeout(200)
        print('histórico:', len(await pg.query_selector_all('[data-a=hist]')))
        await pg.click('[data-a=hist] >> nth=0'); await pg.wait_for_timeout(200)
        print('detalhe como foi:', txt(await pg.text_content('#sheet-card .dex')))
        await pg.click('#sheet [data-a=close]')
        # Família
        await pg.click('#nav-familia'); await pg.wait_for_timeout(300)
        print('família sem grupo:', txt(await pg.text_content('main'))[:120])
        await pg.screenshot(path=SH+'v3-familia.png')
        # Progresso
        await pg.click('#nav-hoje'); await pg.click('.lvl'); await pg.wait_for_selector('.pts')
        print('progresso:', txt(await pg.text_content('.pts')), '| fogo:', txt(await pg.text_content('.lvlcard .lvl-fire')))
        await pg.screenshot(path=SH+'v4-progresso.png', full_page=True)
        # atalho água e sono aberto na nuvem
        await pg.goto(APP+'?acao=agua'); await pg.wait_for_timeout(2500)
        print('atalho água:', fake.tables['agua'])
        await pg.goto(APP+'?acao=sono'); await pg.wait_for_timeout(2500)
        prof = fake.tables['profiles'][0]
        print('sono_aberta nuvem:', prof.get('sono_aberta'), '| folha aberta:', await pg.is_visible('#sheet'))
        # outro aparelho: noite aberta aparece
        ctx2 = await b.new_context(viewport={'width':390,'height':844}); await ctx2.route(BASE+'/**', fake.handle)
        prof['sono_aberta'] = {'dormiu': __import__('time').time()*1000 - 7*3600e3, 'pausas': [], 'pausa': None, 'at': __import__('time').time()*1000}
        pg2 = await ctx2.new_page(); await pg2.goto(APP); await pg2.wait_for_selector('#f-auth')
        await pg2.fill('#a-email', 's@t.com'); await pg2.fill('#a-senha', 'segredo123'); await pg2.click('#f-auth button[type=submit]')
        await pg2.wait_for_selector('.hero', timeout=15000); await pg2.wait_for_timeout(500)
        print('outro aparelho:', txt(await pg2.text_content('[data-mod=sono]'))[:90])
        await pg2.click('.qa-b[data-a=sono-acordei]'); await pg2.wait_for_timeout(800)
        print('fechou na nuvem:', prof.get('sono_aberta', {}).get('fechada'), '| noites:', len(fake.tables['sono']))
        # fotos: guia
        if await pg.is_visible('#sheet'): await pg.click('#sheet [data-a=close] >> nth=0')
        await pg.click('#nav-evolucao'); await pg.click('[role=tab][data-t=corpo]'); await pg.click('[data-a=pnew]'); await pg.wait_for_selector('.guia')
        print('guia de fotos ok')
        print('manifest atalhos:', await pg.evaluate("fetch('/manifest.webmanifest').then(r=>r.json()).then(j=>j.shortcuts.map(s=>s.short_name))"))
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()
asyncio.run(main())
