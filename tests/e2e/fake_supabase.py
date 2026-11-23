"""Supabase falso (auth, PostgREST, storage e functions) para testar o app no navegador."""
import json, uuid, time, base64, re
from urllib.parse import urlparse, parse_qs, unquote

BASE = 'https://fiewzckxrqaprybzynoc.supabase.co'


def b64u(d):
    return base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip('=')


class Fake:
    def __init__(self):
        self.users = {}      # email -> {id, email, password, nome}
        self.tokens = {}     # token -> user id
        self.tables = {t: [] for t in ['profiles', 'plans', 'sessions', 'drafts', 'body_weights', 'assessments', 'photos', 'groups', 'group_members', 'exercise_videos', 'video_editores', 'app_avisos', 'app_erros', 'exercise_catalog', 'group_reactions', 'push_subs', 'agua', 'sono', 'sono_cochilos']}
        self.admins = set()
        self.editores = set()
        self.files = {}
        self.calls = []
        self.fn_calls = []
        self.down = False

    # ---------- helpers ----------
    def session_for(self, u):
        exp = int(time.time()) + 3600
        tok = b64u({'alg': 'HS256', 'typ': 'JWT'}) + '.' + b64u({'sub': u['id'], 'exp': exp, 'role': 'authenticated', 'email': u['email'], 'aud': 'authenticated'}) + '.sig'
        self.tokens[tok] = u['id']
        return {'access_token': tok, 'token_type': 'bearer', 'expires_in': 3600, 'expires_at': exp,
                'refresh_token': 'r-' + u['id'], 'user': self.user_obj(u)}

    def user_obj(self, u):
        return {'id': u['id'], 'aud': 'authenticated', 'role': 'authenticated', 'email': u['email'],
                'email_confirmed_at': '2026-11-16T00:00:00Z', 'user_metadata': {'nome': u['nome']}, 'app_metadata': {},
                'identities': [{'id': u['id']}], 'created_at': '2026-11-16T00:00:00Z'}

    def uid(self, req):
        h = req.headers.get('authorization', '')
        return self.tokens.get(h.replace('Bearer ', ''))

    def j(self, route, body, status=200, headers=None):
        hh = {'content-type': 'application/json', 'access-control-allow-origin': '*'}
        if headers: hh.update(headers)
        return route.fulfill(status=status, headers=hh, body=json.dumps(body) if body is not None else '')

    # ---------- router ----------
    async def handle(self, route):
        req = route.request
        u = urlparse(req.url)
        path, q = u.path, parse_qs(u.query)
        self.calls.append((req.method, path))
        if self.down:
            return await route.abort('internetdisconnected')
        if req.method == 'OPTIONS':
            return await route.fulfill(status=200, headers={'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'})
        if path.startswith('/auth/v1/'):
            return await self.auth(route, req, path[9:], q)
        if path.startswith('/rest/v1/'):
            return await self.rest(route, req, path[9:], u.query)
        if path.startswith('/storage/v1/'):
            return await self.storage(route, req, path[12:])
        if path.startswith('/functions/v1/'):
            return await self.fn(route, req, path[14:])
        return await self.j(route, {'error': 'not found'}, 404)

    async def auth(self, route, req, p, q):
        body = json.loads(req.post_data or '{}') if req.post_data else {}
        if p == 'signup':
            if body['email'] in self.users:
                return await self.j(route, {'code': 422, 'msg': 'User already registered', 'error_code': 'user_already_exists'}, 422)
            uu = {'id': str(uuid.uuid4()), 'email': body['email'], 'password': body['password'], 'nome': (body.get('data') or {}).get('nome', '')}
            self.users[body['email']] = uu
            self.tables['profiles'].append({'id': uu['id'], 'nome': uu['nome'] or None, **({'inicio': self.inicio} if getattr(self, 'inicio', None) else {})})
            return await self.j(route, self.session_for(uu))
        if p == 'token':
            gt = q.get('grant_type', [''])[0]
            if gt == 'password':
                uu = self.users.get(body.get('email'))
                if not uu or uu['password'] != body.get('password'):
                    return await self.j(route, {'code': 400, 'error_code': 'invalid_credentials', 'msg': 'Invalid login credentials'}, 400)
                return await self.j(route, self.session_for(uu))
            if gt == 'refresh_token':
                uid = body.get('refresh_token', '')[2:]
                uu = next((x for x in self.users.values() if x['id'] == uid), None)
                if not uu: return await self.j(route, {'msg': 'invalid'}, 400)
                return await self.j(route, self.session_for(uu))
        if p == 'user':
            uid = self.uid(req)
            uu = next((x for x in self.users.values() if x['id'] == uid), None)
            if not uu: return await self.j(route, {'msg': 'invalid'}, 401)
            if req.method == 'PUT':
                if body.get('password'): uu['password'] = body['password']
            return await self.j(route, self.user_obj(uu))
        if p == 'logout':
            return await route.fulfill(status=204, headers={'access-control-allow-origin': '*'}, body='')
        if p == 'recover':
            return await self.j(route, {})
        return await self.j(route, {'msg': 'unknown auth ' + p}, 404)

    def own(self, table, row, uid):
        if table in ('exercise_videos', 'app_avisos', 'exercise_catalog', 'group_reactions'): return True
        if table == 'app_erros': return uid in self.admins or row.get('user_id') == uid
        return row.get('id') == uid if table == 'profiles' else row.get('user_id') == uid

    def filt(self, rows, qs):
        params = parse_qs(qs, keep_blank_values=True)
        out = rows
        for k, vs in params.items():
            if k in ('select', 'order', 'limit', 'on_conflict', 'columns'): continue
            for v in vs:
                op, _, val = v.partition('.')
                val = unquote(val)
                if op == 'eq': out = [r for r in out if str(r.get(k)).lower() == val.lower()]
                elif op == 'neq': out = [r for r in out if str(r.get(k)).lower() != val.lower()]
                elif op == 'gt': pass
                elif op == 'gte': out = [r for r in out if str(r.get(k)) >= val]
                elif op == 'in':
                    vals = [x.strip('"') for x in val.strip('()').split(',')]
                    out = [r for r in out if str(r.get(k)) in vals]
        if 'order' in params:
            col, _, d = params['order'][0].partition('.')
            out = sorted(out, key=lambda r: (r.get(col) is None, str(r.get(col))), reverse=d.startswith('desc'))
        if 'limit' in params:
            out = out[:int(params['limit'][0])]
        return out

    async def rest(self, route, req, table, qs):
        uid = self.uid(req)
        if not uid: return await self.j(route, {'message': 'JWT required'}, 401)
        if table.startswith('rpc/'):
            return await self.rpc(route, req, table[4:], uid)
        if table == 'app_admins':
            return await self.j(route, [{'user_id': uid}] if uid in self.admins else [])
        if table == 'app_avisos' and req.method != 'GET' and uid not in self.admins:
            return await self.j(route, {'message': 'new row violates row-level security policy'}, 403)
        if table == 'app_erros' and req.method in ('GET', 'DELETE') and uid not in self.admins:
            return await self.j(route, [] if req.method == 'GET' else {'message': 'rls'}, 200 if req.method == 'GET' else 403)
        if table == 'video_editores':
            return await self.j(route, [{'user_id': uid}] if uid in self.editores else [])
        if table == 'exercise_videos' and req.method != 'GET' and uid not in self.editores:
            return await self.j(route, {'code': '42501', 'message': 'new row violates row-level security policy for table "exercise_videos"'}, 403)
        rows = self.tables[table]
        mine = [r for r in rows if self.own(table, r, uid)]
        if table == 'group_members' and 'groups(' in unquote(qs):
            mine = [dict(r, groups=next((dict(id=g['id'], nome=g['nome'], codigo=g['codigo']) for g in self.tables['groups'] if g['id'] == r['group_id']), None)) for r in mine]
        accept = req.headers.get('accept', '')
        prefer = req.headers.get('prefer', '')
        single = 'vnd.pgrst.object' in accept
        rep = 'return=representation' in prefer

        def respond(data, status=200):
            if single:
                if len(data) != 1:
                    return self.j(route, {'code': 'PGRST116', 'message': 'JSON object requested, multiple (or no) rows returned', 'details': 'Results contain %d rows' % len(data)}, 406)
                return self.j(route, data[0], status)
            return self.j(route, data, status)

        if req.method == 'GET':
            return await respond(self.filt(mine, qs))
        if req.method == 'POST':
            body = json.loads(req.post_data)
            items = body if isinstance(body, list) else [body]
            params = parse_qs(qs)
            conflict = params.get('on_conflict', [None])[0]
            merge = 'resolution=merge-duplicates' in prefer
            out = []
            for it in items:
                it = dict(it)
                if table == 'group_reactions': it.setdefault('from_user', uid)
                elif table not in ('profiles', 'exercise_videos', 'app_avisos'): it.setdefault('user_id', uid)
                if it.get('user_id') and it['user_id'] != uid and table != 'profiles':
                    return await self.j(route, {'message': 'new row violates row-level security policy'}, 403)
                existing = None
                if merge and conflict:
                    cols = conflict.split(',')
                    existing = next((r for r in rows if all(str(r.get(c)) == str(it.get(c)) for c in cols)), None)
                if existing:
                    existing.update(it); out.append(existing)
                else:
                    if table not in ('drafts', 'exercise_videos', 'push_subs') and 'id' not in it: it['id'] = str(uuid.uuid4())
                    if table == 'app_avisos': it.setdefault('ativo', True); it.setdefault('nivel', 'info'); it.setdefault('expira_em', None)
                    it.setdefault('created_at', time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()))
                    if table == 'plans':
                        it.setdefault('ativa', True); it.setdefault('nome', 'Minha ficha'); it['updated_at'] = it['created_at']
                    rows.append(it); out.append(it)
            if rep: return await respond(out, 201)
            return await route.fulfill(status=201, headers={'access-control-allow-origin': '*'}, body='')
        if req.method == 'PATCH':
            body = json.loads(req.post_data)
            tgt = self.filt(mine, qs)
            for r in tgt: r.update(body)
            if rep: return await respond(tgt)
            return await route.fulfill(status=204, headers={'access-control-allow-origin': '*'}, body='')
        if req.method == 'DELETE':
            tgt = self.filt(mine, qs)
            self.tables[table] = [r for r in rows if r not in tgt]
            return await route.fulfill(status=204, headers={'access-control-allow-origin': '*'}, body='')

    async def rpc(self, route, req, fn, uid):
        body = json.loads(req.post_data or '{}')
        G, M = self.tables['groups'], self.tables['group_members']
        now = time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime())
        if fn.startswith('admin_') and uid not in self.admins:
            return await self.j(route, {'code': 'P0001', 'message': 'sem_permissao'}, 400)
        if fn == 'admin_resumo':
            return await self.j(route, {'usuarios': len(self.users), 'treinos': len(self.tables['sessions']), 'treinos_7d': len(self.tables['sessions']), 'treinos_30d': len(self.tables['sessions']),
                'ativos_7d': len({x['user_id'] for x in self.tables['sessions']}), 'fichas': len(self.tables['plans']), 'avaliacoes': len(self.tables['assessments']), 'fotos': len(self.files),
                'fotos_mb': round(sum(len(v) for v in self.files.values()) / 1048576, 1), 'grupos': len(G), 'videos': len(self.tables['exercise_videos']),
                'erros_24h': len(self.tables['app_erros']), 'erros_7d': len(self.tables['app_erros']), 'agora': now})
        if fn in ('admin_usuarios', 'admin_usuarios_v2'):
            out = []
            for uu in self.users.values():
                ss = [x for x in self.tables['sessions'] if x['user_id'] == uu['id']]
                pr = next((p_ for p_ in self.tables['profiles'] if p_['id'] == uu['id']), {})
                fa = next((p_['nome'] for p_ in self.tables['plans'] if p_['user_id'] == uu['id'] and p_.get('ativa')), None)
                gm = next((g['nome'] for m in M for g in G if m['user_id'] == uu['id'] and g['id'] == m['group_id']), None)
                out.append({'user_id': uu['id'], 'nome': pr.get('nome'), 'email': uu['email'], 'avatar_path': pr.get('avatar_path'), 'instagram': pr.get('instagram'), 'criado_em': now, 'ultimo_login': now, 'confirmado': True,
                    'treinos': len(ss), 'treinos_30d': len(ss), 'ultimo_treino': max([x['started_at'] for x in ss], default=None), 'ficha': fa, 'admin': uu['id'] in self.admins, 'grupo': gm})
            return await self.j(route, out)
        if fn == 'admin_fichas':
            return await self.j(route, [p_ for p_ in self.tables['plans'] if p_['user_id'] == body['p_user']])
        if fn == 'admin_salvar_ficha':
            P = self.tables['plans']
            if body.get('p_id'):
                r = next(p_ for p_ in P if p_['id'] == body['p_id'] and p_['user_id'] == body['p_user'])
                r.update(nome=body['p_nome'], treinos=body['p_treinos'], cronograma=body['p_cronograma'], updated_at=now)
            else:
                for p_ in P:
                    if p_['user_id'] == body['p_user']: p_['ativa'] = False
                r = {'id': str(uuid.uuid4()), 'user_id': body['p_user'], 'nome': body['p_nome'], 'treinos': body['p_treinos'], 'cronograma': body['p_cronograma'], 'ativa': True, 'created_at': now, 'updated_at': now}
                P.append(r)
            return await self.j(route, r)
        if fn == 'admin_ativar_ficha':
            for p_ in self.tables['plans']:
                if p_['user_id'] == body['p_user']: p_['ativa'] = p_['id'] == body['p_id']
            return await route.fulfill(status=204, headers={'access-control-allow-origin': '*'}, body='')
        if fn == 'exercicios_da_familia':
            if uid not in self.editores: return await self.j(route, [])
            grupos = {m['group_id'] for m in M if m['user_id'] == uid}
            users = {uid} | {m['user_id'] for m in M if m['group_id'] in grupos}
            nomes = sorted({e['n'] for p_ in self.tables['plans'] if p_['user_id'] in users for w in p_['treinos']['w'].values() for e in w['ex']})
            return await self.j(route, [{'nome': n} for n in nomes])
        if fn == 'criar_grupo':
            g = {'id': str(uuid.uuid4()), 'nome': body['p_nome'] or 'Família', 'codigo': uuid.uuid4().hex[:6].upper(), 'created_by': uid, 'created_at': now}
            G.append(g); M.append({'group_id': g['id'], 'user_id': uid, 'joined_at': now})
            return await self.j(route, g)
        if fn == 'entrar_grupo':
            g = next((x for x in G if x['codigo'] == body['p_codigo'].upper()), None)
            if not g: return await self.j(route, {'code': 'P0001', 'message': 'codigo_invalido'}, 400)
            if not any(m['group_id'] == g['id'] and m['user_id'] == uid for m in M):
                time.sleep(0.01); M.append({'group_id': g['id'], 'user_id': uid, 'joined_at': time.strftime('%Y-%m-%dT%H:%M:%S.%f', time.gmtime())})
            return await self.j(route, g['id'])
        if fn == 'sair_grupo':
            self.tables['group_members'] = [m for m in M if not (m['group_id'] == body['p_grupo'] and m['user_id'] == uid)]
            return await route.fulfill(status=204, headers={'access-control-allow-origin': '*'}, body='')
        if fn == 'grupo_resumo':
            gid = body['p_grupo']
            if not any(m['group_id'] == gid and m['user_id'] == uid for m in M): return await self.j(route, [])
            out = []
            for m in sorted([m for m in M if m['group_id'] == gid], key=lambda m: m['joined_at']):
                pr = next((p for p in self.tables['profiles'] if p['id'] == m['user_id']), {})
                dias = sorted({dia_sp(s_['started_at']) for s_ in self.tables['sessions'] if s_['user_id'] == m['user_id']})
                out.append({'user_id': m['user_id'], 'nome': pr.get('nome'), 'avatar_path': pr.get('avatar_path'), 'instagram': pr.get('instagram'), 'dias': dias})
            return await self.j(route, out)
        if fn == 'vapid_publica':
            return await self.j(route, 'BAO3DIE5Gi4TkX8A22PEh0wmtOr4aoc872CwYgRiaopInptYc91o3pr9Ed7vpg4gGmkvTyd0riR0qZMtpuUXnLc')
        if fn == 'grupo_ao_vivo':
            gid = body['p_grupo']
            if not any(m['group_id'] == gid and m['user_id'] == uid for m in M): return await self.j(route, [])
            out = []
            for m in [m for m in M if m['group_id'] == gid]:
                d = next((x for x in self.tables['drafts'] if x['user_id'] == m['user_id']), None)
                row = {'user_id': m['user_id'], 'letra': None, 'treino': None, 'inicio': None, 'atualizado': None, 'exercicios': None, 'terminou': None, 'terminou_letra': None}
                if d and d.get('data'):
                    dd = d['data']
                    row.update({'letra': dd.get('letter'), 'treino': dd['w'].get('name'), 'inicio': '2026-11-16T10:00:00Z', 'atualizado': d.get('updated_at'),
                                'exercicios': [{'n': we['n'], 'f': sum(1 for st in de['sets'] if st.get('done')), 't': len(de['sets'])} for we, de in zip(dd['w']['ex'], dd['ex'])]})
                ss = [x for x in self.tables['sessions'] if x['user_id'] == m['user_id']]
                if ss:
                    last = max(ss, key=lambda x: x['started_at'])
                    row.update({'terminou': last.get('ended_at') or last['started_at'], 'terminou_letra': last.get('letter')})
                out.append(row)
            return await self.j(route, out)
        return await self.j(route, {'message': 'rpc ' + fn}, 404)

    async def storage(self, route, req, p):
        uid = self.uid(req)
        m = re.match(r'object/sign/fotos$', p)
        if m and req.method == 'POST':
            body = json.loads(req.post_data)
            return await self.j(route, [{'path': x, 'signedURL': '/object/sign/fotos/' + x + '?token=t', 'error': None} for x in body['paths']])
        m = re.match(r'object/sign/fotos/(.+)$', p)
        if m and req.method == 'GET':
            data = self.files.get(unquote(m.group(1)))
            if data is None: return await route.fulfill(status=404, body='')
            return await route.fulfill(status=200, headers={'content-type': 'image/jpeg', 'access-control-allow-origin': '*'}, body=data)
        m = re.match(r'object/fotos/(.+)$', p)
        if m and req.method == 'GET':
            data = self.files.get(unquote(m.group(1)))
            if data is None: return await self.j(route, {'error': 'not found'}, 404)
            return await route.fulfill(status=200, headers={'content-type': 'image/jpeg', 'access-control-allow-origin': '*'}, body=data)
        if m and req.method == 'POST':
            key = unquote(m.group(1))
            if not uid or not key.startswith(uid + '/'):
                return await self.j(route, {'statusCode': '403', 'error': 'Unauthorized', 'message': 'new row violates row-level security policy'}, 403)
            raw = req.post_data_buffer
            i, f = raw.find(b'\xff\xd8'), raw.rfind(b'\xff\xd9')
            self.files[key] = raw[i:f+2] if i >= 0 and f > i else raw
            return await self.j(route, {'Key': 'fotos/' + key, 'Id': str(uuid.uuid4())})
        if p == 'object/fotos' and req.method == 'DELETE':
            body = json.loads(req.post_data)
            for x in body.get('prefixes', []): self.files.pop(x, None)
            return await self.j(route, [])
        return await self.j(route, {'error': 'storage ' + p}, 404)

    async def fn(self, route, req, name):
        if not self.uid(req): return await self.j(route, {'msg': 'Invalid JWT'}, 401)
        body = json.loads(req.post_data)
        if body.get('tipo') == 'status':
            return await self.j(route, {'chave': False, 'valida': False, 'modelo': 'claude-sonnet-5-5'})
        if name == 'notificar':
            self.fn_calls.append({'tipo': 'notificar:' + body.get('tipo', '')})
            return await self.j(route, {'ok': True, 'enviados': 1})
        self.fn_calls.append({'tipo': body['tipo'], 'n': len(body['arquivos']), 'types': [a['type'] for a in body['arquivos']], 'sizes': [len(a['data']) for a in body['arquivos']]})
        if body['tipo'] == 'avaliacao':
            return await self.j(route, {'data': '2026-11-10', 'itens': [
                {'k': 'peso', 'rotulo': 'Peso', 'v': 108.4, 'u': 'kg'}, {'k': 'gordura_pct', 'rotulo': '% Gordura', 'v': 24.1, 'u': '%'},
                {'k': 'massa_magra', 'rotulo': 'Massa magra', 'v': 82.3, 'u': 'kg'}, {'k': 'cintura', 'rotulo': 'Cintura', 'v': 104, 'u': 'cm'},
                {'k': 'braco_d_contraido', 'rotulo': 'Braço D contraído', 'v': 41.5, 'u': 'cm'}]})
        return await self.j(route, {'nome': 'Ficha da Ana', 'treinos': [
            {'letra': 'A', 'nome': 'Inferior', 'foco': 'Glúteos e posterior', 'descanso': '60-90s', 'exercicios': [
                {'nome': 'Agachamento livre', 'series': 4, 'reps_min': 8, 'reps_max': 12, 'descanso_s': 90, 'dica': 'Desça até 90°', 'partes': None},
                {'nome': 'Cadeira abdutora + Elevação pélvica', 'series': 3, 'reps_min': 12, 'reps_max': 15, 'descanso_s': 60, 'dica': None, 'partes': ['Cadeira abdutora', 'Elevação pélvica']}]},
            {'letra': 'B', 'nome': 'Superior', 'foco': 'Costas e braços', 'descanso': '60s', 'exercicios': [
                {'nome': 'Puxada frontal', 'series': 3, 'reps_min': 10, 'reps_max': 12, 'descanso_s': 60, 'dica': None, 'partes': None},
                {'nome': 'Elevação lateral com halteres', 'series': 3, 'reps_min': 12, 'reps_max': 12, 'descanso_s': 45, 'dica': None, 'partes': None}]}],
            'cronograma': {'seg': 'A', 'ter': 'B', 'qua': 'descanso', 'qui': 'A', 'sex': 'B', 'sab': 'ativo', 'dom': 'descanso'}})


def dia_sp(iso):
    """Dia do treino no fuso de São Paulo (como o banco real faz)."""
    import datetime as _dt
    t = _dt.datetime.fromisoformat(str(iso).replace('Z', '+00:00'))
    if t.tzinfo is None: t = t.replace(tzinfo=_dt.timezone.utc)
    return (t.astimezone(_dt.timezone(_dt.timedelta(hours=-3)))).strftime('%Y-%m-%d')
