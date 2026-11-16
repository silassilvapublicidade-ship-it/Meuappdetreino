# Meus Treinos

App de treino para celular: cada pessoa tem login próprio, monta a própria ficha (modelo A–E, leitura de foto/PDF ou do zero), registra séries com timer de descanso, recebe sugestão de carga e acompanha avaliações físicas, peso e fotos de evolução.

**Stack:** Vite (JavaScript puro) · Supabase (login, Postgres com RLS, Storage, Edge Function) · Vercel.

## Estrutura

```
index.html                 casca do app (menu, timer, folhas)
src/main.js                telas e regras (treino, sugestão de carga, evolução, ficha)
src/modelo.js              ficha modelo A–E, catálogo de medidas, conversões de ficha
src/dados.js               acesso ao Supabase
src/style.css              visual
public/                    ícones e manifest (instalável na tela inicial)
supabase/migrations/       banco: tabelas, regras de acesso por usuário, bucket de fotos
supabase/functions/ler-documento/   lê avaliação física ou ficha (fotos/PDF) com a API do Claude
```

## Supabase

- Projeto: `fiewzckxrqaprybzynoc`.
- Cada tabela tem RLS: cada usuário só lê e grava as próprias linhas. Fotos ficam no bucket privado `fotos`, numa pasta por usuário.
- `.env.production` traz a URL e a chave **publicável** do projeto. Ela é feita para ficar no navegador; quem protege os dados são as regras do banco.

### Configurações no painel do Supabase

1. **Authentication → URL Configuration**: em *Site URL*, coloque o endereço do app na Vercel (ex.: `https://meuappdetreino.vercel.app`) e adicione o mesmo em *Redirect URLs*. Sem isso, o link de confirmação de e-mail aponta para `localhost`.
2. **Edge Functions → Secrets**: crie `ANTHROPIC_API_KEY` com uma chave da API do Claude (console.anthropic.com) para ligar a leitura automática de avaliações e fichas. Opcional: `ANTHROPIC_MODEL` (padrão `claude-sonnet-5-5`). Sem a chave, o app funciona e pede para digitar as medidas.

## Vercel

Importe o repositório na Vercel. O `vercel.json` já define build (`npm run build`) e pasta (`dist`); não precisa de variáveis de ambiente.

## Rodar localmente

```bash
npm install
npm run dev
```
