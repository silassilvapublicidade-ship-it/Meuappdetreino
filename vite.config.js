import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

// Versão do app mostrada na área do admin: commit + data da publicação (horário de Brasília).
let sha = process.env.VERCEL_GIT_COMMIT_SHA || '';
if(!sha){ try{ sha = execSync('git rev-parse HEAD').toString().trim(); }catch(e){ sha = 'local'; } }
const quando = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default defineConfig({
  define: { __VERSAO__: JSON.stringify(sha.slice(0, 7) + ' · ' + quando) }
});
