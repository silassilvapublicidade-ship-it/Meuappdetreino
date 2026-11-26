# Cartão do treino com foto da pessoa: acha o rosto e põe o texto onde não cobre.
import asyncio, sys, os, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake, BASE

AMOSTRA = os.path.join(DIR, '..', '..', 'node_modules', '@vladmandic', 'face-api', 'demo', 'sample1.jpg')

async def salvar_card(pg, nome):
    src = await pg.get_attribute('#cardprev img', 'src')
    data = await pg.evaluate("async u=>{const b=await (await fetch(u)).blob(); return [b.type, await new Promise(r=>{const f=new FileReader(); f.onload=()=>r(f.result); f.readAsDataURL(b);})];}", src)
    open(SHOTS+nome, 'wb').write(base64.b64decode(data[1].split(',')[1]))
    return data[0], src

async def esperar_novo(pg, antes):
    await pg.wait_for_function("a=>{const i=document.querySelector('#cardprev img'); return i && i.src!==a;}", arg=antes, timeout=30000)

async def main():
    fake = Fake(); erros = []
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2)
        await ctx.route(BASE + '/**', fake.handle)
        await ctx.route('https://fonts.googleapis.com/**', lambda r: r.abort())
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.goto(APP); await pg.wait_for_selector('#f-auth')
        await pg.click('[data-a=auth-tab][data-t=criar]')
        await pg.fill('#a-nome','Silas Silva'); await pg.fill('#a-email','s@s.com'); await pg.fill('#a-senha','segredo123')
        await pg.click('#f-auth button[type=submit]'); await pg.wait_for_selector('.choices')
        await pg.click('[data-a=ob-modelo]'); await pg.wait_for_selector('#f-nome'); await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard')
        await pg.reload(); await pg.wait_for_selector('.hero')
        await pg.click('[data-a=start]'); await pg.wait_for_selector('#set-0-0')
        await pg.fill('#w-0-0-0','32'); await pg.click('#set-0-0 .chk')
        await pg.click('[data-a=rest-skip]'); await pg.click('[data-a=finish]'); await pg.click('[data-a=save]')
        await pg.wait_for_selector('[data-a=rs-share]', timeout=10000); await pg.click('[data-a=rs-share]')
        await pg.wait_for_selector('#cardprev img', timeout=10000)
        assert await pg.is_visible('[data-a=card-foto]'), 'sem botão de foto'

        # 1) foto deitada com rosto: o texto não pode cobrir
        await pg.set_input_files('#f-cardfoto', AMOSTRA)
        await pg.wait_for_selector('#card-pos', timeout=10000)
        await pg.wait_for_selector('#cardprev img', timeout=60000)
        tipo, src1 = await salvar_card(pg, 'cardfoto-1.jpg')
        info = await pg.inner_text('#card-foto-info')
        sel = await pg.get_attribute('#card-pos [aria-selected=true]', 'data-v')
        print('1:', tipo, sel, '|', info)
        assert tipo == 'image/jpeg' and 'Achei' in info and sel in ('baixo','cima'), info
        await pg.screenshot(path=SHOTS+'cardfoto-tela.png')

        # 2) forçar o texto em cima
        await pg.click('[data-a=card-pos][data-v=cima]'); await esperar_novo(pg, src1)
        _, src2 = await salvar_card(pg, 'cardfoto-2.jpg')
        print('2:', await pg.get_attribute('#card-pos [aria-selected=true]', 'data-v'), '|', await pg.inner_text('#card-foto-info'))

        # 3) foto em pé com o rosto lá embaixo: o texto tem de ir para cima
        dados = base64.b64encode(open(AMOSTRA,'rb').read()).decode()
        alta = await pg.evaluate("""async d=>{ const i=new Image(); i.src='data:image/jpeg;base64,'+d; await i.decode();
          const c=document.createElement('canvas'); c.width=1080; c.height=1920; const x=c.getContext('2d');
          x.fillStyle='#556'; x.fillRect(0,0,1080,1920); const h=1100, w=h*i.width/i.height; x.drawImage(i,(1080-w)/2,1920-h,w,h);
          return c.toDataURL('image/jpeg',.9); }""", dados)
        open(SHOTS+'alta.jpg','wb').write(base64.b64decode(alta.split(',')[1]))
        await pg.set_input_files('#f-cardfoto', SHOTS+'alta.jpg')
        await esperar_novo(pg, src2)
        _, src3 = await salvar_card(pg, 'cardfoto-3.jpg')
        sel3 = await pg.get_attribute('#card-pos [aria-selected=true]', 'data-v')
        print('3:', sel3, '|', await pg.inner_text('#card-foto-info'))
        assert sel3 == 'cima', sel3

        # 4) foto sem rosto: avisa e deixa trocar a posição
        await pg.set_input_files('#f-cardfoto', os.path.join(FIX, 'foto0.jpg'))
        await esperar_novo(pg, src3)
        info4 = await pg.inner_text('#card-foto-info'); print('4:', info4)
        assert 'Não achei' in info4, info4

        # voltar para os cartões normais e de volta para a foto
        await pg.click('[data-a=share-tab][data-t=mes]'); await pg.wait_for_selector('[data-a=share-tab][data-t=foto]')
        await pg.click('[data-a=share-tab][data-t=foto]'); await pg.wait_for_selector('#card-pos')
        print('ERROS', erros)
        assert not erros
        await b.close()
asyncio.run(main())
