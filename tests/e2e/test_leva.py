import asyncio, sys, re, time, uuid
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from ambiente import *
from playwright.async_api import async_playwright
from fake_supabase import Fake
from test_novos import nova_conta, treinar, SH

def txt(s): return re.sub(r'\s+', ' ', s or '').strip()
def iso(ts): return time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(ts))

async def main():
    fake = Fake(); errs = []; fake.inicio = {'completos': ['agua','sono','missoes','grupo'], 'auto': False}
    for i, l in enumerate(open(FIX+'/catalogo.txt', encoding='utf8').read().strip().split('\n')):
        m, t, y = l.split('|'); fake.tables['exercise_catalog'].append({'id': i+1, 'modulo': int(m), 'titulo': t, 'youtube': y})
    async with async_playwright() as p:
        b = await p.chromium.launch(**LANCAR)
        ctx, pg = await nova_conta(b, fake, 'Silas Silva', 'silas@teste.com', errs)
        await pg.click('[data-a=f-save]'); await pg.wait_for_selector('.wcard', timeout=10000)
        silas = fake.users['silas@teste.com']['id']
        plano = fake.tables['plans'][0]
        # ficha antiga (10 semanas) + histórico do supino parado há 4 semanas
        agora = time.time()
        plano['created_at'] = iso(agora - 70*86400)
        for k, (dias, kg, r) in enumerate([(40, 24, 10), (33, 26, 10), (26, 26, 9), (19, 26, 8), (12, 24, 10), (5, 26, 9)]):
            fake.tables['sessions'].append({'id': str(uuid.uuid4()), 'user_id': silas, 'plan_id': plano['id'], 'letter': 'A', 'workout_name': 'Superior 1',
                'started_at': iso(agora - dias*86400), 'ended_at': iso(agora - dias*86400 + 3600), 'dur_s': 3600, 'notes': '', 'vol': 1000, 'sets_done': 4, 'sets_total': 20,
                'ex': [{'key': 'supino-inclinado-com-halteres', 'keys': ['supino-inclinado-com-halteres'], 'n': 'Supino inclinado com halteres', 'parts': ['Supino inclinado com halteres'],
                        'sets': [{'p': [{'kg': kg, 'r': r}]} for _ in range(4)]}]})
        await pg.reload(); await pg.wait_for_selector('.hero', timeout=10000)
        print('aviso ficha vencendo:', txt(await pg.text_content('.aviso.n-alerta')) if await pg.locator('.aviso.n-alerta').count() else 'NÃO')
        print('card instalar:', await pg.locator('.aviso.inst').count())
        await pg.screenshot(path=SH + 'l1-hoje.png', full_page=True)

        # estagnação
        await pg.click('#nav-treinos'); print('treinos nota:', txt(await pg.text_content('.card .note')))
        await pg.click('[data-v="treino:A"]'); await pg.wait_for_selector('.ex')
        print('aquecimento:', txt(await pg.text_content('.aq summary')), '| itens:', await pg.locator('.aq .bib-i').count())
        print('estagnado:', txt(await pg.text_content('.sug.estag')) if await pg.locator('.sug.estag').count() else 'NÃO')
        await pg.click('.aq summary'); await pg.screenshot(path=SH + 'l2-treinoA.png')

        # cardio
        await pg.click('#nav-hoje'); await pg.click('[data-a=cardio]'); await pg.wait_for_selector('#cd-min')
        await pg.click('[data-a=cd-tipo][data-t="Bicicleta"]'); await pg.fill('#cd-min', '35'); await pg.fill('#cd-km', '12,5'); await pg.fill('#cd-kcal', '320')
        await pg.screenshot(path=SH + 'l3-cardio.png')
        await pg.click('[data-a=cd-save]'); await pg.wait_for_selector('#cardprev img', timeout=10000)
        print('título cardio:', await pg.text_content('#sheet-card h2'))
        src = await pg.get_attribute('#cardprev img', 'src')
        data = await pg.evaluate("async u=>{ const b=await (await fetch(u)).blob(); return await new Promise(r=>{ const f=new FileReader(); f.onload=()=>r(f.result); f.readAsDataURL(b); }); }", src)
        import base64; open(SH + 'l4-story-cardio.png', 'wb').write(base64.b64decode(data.split(',')[1]))
        await pg.click('#sheet [data-a=close]'); await pg.wait_for_timeout(500)
        cd = [x for x in fake.tables['sessions'] if x['letter'] == 'CARDIO']
        print('cardio no banco:', len(cd), cd[0]['workout_name'], cd[0]['dur_s'], cd[0]['ex'][0]['cardio'])
        print('hoje linha:', txt(await pg.text_content('.todayline')))

        # treino normal e correção
        await treinar(pg, kg='40', reps='12'); await pg.click('#sheet [data-a=close]')
        await pg.click('#nav-treinos'); await pg.click('[data-a=tr-tab][data-t=historico]'); await pg.click('.hrow >> nth=0')
        await pg.wait_for_selector('[data-a=h-edit]'); await pg.click('[data-a=h-edit]'); await pg.wait_for_selector('[data-he="0.0.0.kg"]')
        await pg.fill('[data-he="0.0.0.kg"]', '42,5'); await pg.fill('[data-he="0.0.0.r"]', '10')
        await pg.click('[data-a=he-del][data-ei="0"][data-si="3"]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=SH + 'l5-editar.png')
        await pg.click('[data-a=he-save]'); await pg.wait_for_timeout(800)
        ultimo = sorted([x for x in fake.tables['sessions'] if x['letter'] != 'CARDIO'], key=lambda x: x['started_at'])[-1]
        print('corrigido:', ultimo['ex'][0]['sets'][0], '| séries:', len(ultimo['ex'][0]['sets']), '| vol:', ultimo['vol'], '| toast:', await pg.text_content('#toast'))
        print('histórico linhas:', [txt(await x.text_content())[:60] for x in await pg.query_selector_all('.hrow')][:3])

        # metas
        await pg.click('#nav-evolucao'); await pg.click('[data-a=evo][data-t=corpo]')
        await pg.fill('#bkg', '85,1'); await pg.fill('#bdate', time.strftime('%Y-%m-%d', time.localtime(agora - 30*86400))); await pg.click('[data-a=bsave]'); await pg.wait_for_timeout(300)
        await pg.fill('#bkg', '83,9'); await pg.fill('#bdate', time.strftime('%Y-%m-%d', time.localtime(agora))); await pg.click('[data-a=bsave]'); await pg.wait_for_timeout(300)
        await pg.click('[data-a=metas]'); await pg.wait_for_selector('#mt-peso')
        await pg.fill('#mt-peso', '80'); await pg.fill('#mt-gord', '12'); await pg.click('[data-a=metas-save]'); await pg.wait_for_timeout(500)
        prof = next(x for x in fake.tables['profiles'] if x['id'] == silas)
        print('metas banco:', prof.get('meta_peso'), prof.get('meta_gordura'))
        print('metas tela:', [txt(await x.text_content()) for x in await pg.query_selector_all('.meta-l')])
        await pg.screenshot(path=SH + 'l6-metas.png')
        await pg.click('[data-a=evo][data-t=forca]'); print('bloco estagnados:', txt(await pg.text_content('.estag-c'))[:120] if await pg.locator('.estag-c').count() else 'NÃO')

        # grupo + reações
        await pg.click('#nav-hoje'); await pg.click('.gcta'); await pg.wait_for_selector('#g-nome'); await pg.click('[data-a=g-criar]'); await pg.wait_for_selector('.gcode')
        cod = (await pg.text_content('.gcode')).strip(); await pg.click('#sheet [data-a=close]')
        ctx2, pg2 = await nova_conta(b, fake, 'Ana', 'ana@teste.com', errs)
        await pg2.click('[data-a=f-save]'); await pg2.wait_for_selector('.wcard', timeout=10000)
        await pg2.click('#nav-hoje'); await pg2.click('.gcta'); await pg2.wait_for_selector('#g-cod'); await pg2.fill('#g-cod', cod); await pg2.click('[data-a=g-entrar]')
        await pg2.wait_for_selector('.gm .rx', timeout=10000)
        await pg2.click('.rx >> nth=1'); await pg2.wait_for_timeout(500)
        print('reação no banco:', [(r['emoji'], r['dia']) for r in fake.tables['group_reactions']])
        await pg2.screenshot(path=SH + 'l7-grupo-ana.png', full_page=True)
        await pg.reload(); await pg.wait_for_selector('.gm', timeout=10000); await pg.wait_for_timeout(1000)
        print('Silas vê:', txt(await pg.text_content('.gm-r.recebidas')) if await pg.locator('.gm-r.recebidas').count() else 'NÃO', '| toast:', await pg.text_content('#toast'))
        print('ERROS:', [e for e in errs if 'Failed to load' not in e])
        await b.close()

asyncio.run(main())
