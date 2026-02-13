# Guia de Contribuicao - NucleoIA V4

## Equipe

| Nome | Papel | Contato |
|------|-------|---------|
| Weverton (CEO) | Product Owner + Dev | weverton.wgcf78@gmail.com |
| Ulisses | Tech Lead + Dev | UlissesVPS (GitHub) |

---

## Workflow Git (OBRIGATORIO)

### Branches

| Branch | Proposito | Quem faz merge |
|--------|-----------|----------------|
| `main` | Producao (deploy ativo) | Somente via merge de `develop` |
| `develop` | Integracao | Merge de feature/fix branches |
| `feature/nome` | Nova funcionalidade | Qualquer dev |
| `fix/nome` | Correcao de bug | Qualquer dev |
| `hotfix/nome` | Correcao urgente em producao | Qualquer dev (merge direto em main) |

### Regra de Ouro: NUNCA commite direto em `main`

---

## Fluxo de Trabalho

### Antes de comecar qualquer trabalho:

```bash
# 1. Volte para develop e atualize
git checkout develop
git pull origin develop

# 2. Leia o CHANGELOG para saber o que mudou
cat docs/CHANGELOG.md | head -50

# 3. Crie sua branch
git checkout -b feature/minha-feature
# ou: git checkout -b fix/nome-do-bug
```

### Durante o trabalho:

```bash
# Commits frequentes e descritivos
git add arquivo1 arquivo2
git commit -m "feat: descricao curta do que foi feito"
```

### Ao finalizar:

```bash
# 1. Atualize o CHANGELOG.md com suas mudancas
nano docs/CHANGELOG.md

# 2. Commit final
git add .
git commit -m "docs: atualizar changelog com feature X"

# 3. Push da branch
git push origin feature/minha-feature

# 4. Merge para develop
git checkout develop
git pull origin develop
git merge feature/minha-feature
git push origin develop

# 5. Se for deploy para producao:
git checkout main
git pull origin main
git merge develop
git push origin main

# 6. Build e deploy
cd /var/www/nucleoia/frontend && npm run build
cd /var/www/nucleoia/backend && npm run build && pm2 restart nucleoia-api

# 7. Tag de versao (se necessario)
git tag -a v4.0.X -m "Descricao da versao"
git push origin v4.0.X
```

---

## Convencao de Commits

Formato: `tipo: descricao curta em portugues`

| Prefixo | Uso |
|---------|-----|
| `feat:` | Nova funcionalidade |
| `fix:` | Correcao de bug |
| `docs:` | Apenas documentacao |
| `refactor:` | Refatoracao sem mudar funcionalidade |
| `style:` | Formatacao, CSS, UI |
| `chore:` | Tarefas operacionais (deps, configs) |
| `hotfix:` | Correcao urgente em producao |
| `test:` | Testes |

Exemplos:
- `feat: adicionar filtro por categoria na pagina de prompts`
- `fix: corrigir login com senha incorreta retornando 500`
- `docs: atualizar documentacao de webhooks`
- `hotfix: corrigir crash no bulk-import com JSON malformado`

---

## Regras de Codigo

### Backend (Express + TypeScript + Prisma)
- Todos os endpoints autenticados usam middleware `authenticate` + `authorize(roles)`
- Prisma para TODAS as queries (nunca SQL raw, exceto migrations)
- Respostas sempre via `sendSuccess()` ou `sendError()` de `utils/response.ts`
- Uploads via middleware Multer em `middleware/upload.middleware.ts`
- Variaveis de ambiente em `backend/.env` (NUNCA hardcode)

### Frontend (React + TypeScript + React Query)
- TODAS as chamadas API via hooks em `hooks/useApi.ts` (NUNCA fetch direto)
- NUNCA usar `useState` com dados mock/ficticios
- Componentes shadcn-ui para UI (NUNCA HTML cru para forms/buttons/etc)
- i18n via `lib/i18n.ts` para textos voltados ao usuario
- Temas via `ThemeProvider` (dark/light/system)

### Geral
- NUNCA commitar `.env`, `node_modules/`, `dist/`, `uploads/`
- SEMPRE rodar build apos alteracoes antes de considerar pronto
- SEMPRE atualizar `docs/CHANGELOG.md` antes de encerrar a sessao
- SEMPRE atualizar os prompts de continuacao se alterar algo significativo

---

## Resolucao de Conflitos

Se voce e o outro dev alteraram o mesmo arquivo:

```bash
# 1. Puxe as alteracoes
git pull origin develop

# 2. Se houver conflito, o Git marca no arquivo:
# <<<<<<< HEAD
# (sua versao)
# =======
# (versao do outro)
# >>>>>>> origin/develop

# 3. Edite o arquivo resolvendo manualmente
# 4. Commit da resolucao
git add arquivo-com-conflito
git commit -m "fix: resolver conflito em arquivo-com-conflito"
```

### Prevencao de conflitos:
- Comunique o que vai trabalhar ANTES de comecar
- Trabalhe em arquivos diferentes quando possivel
- Faca pull frequente
- Commits pequenos e frequentes

---

## Checklist Pre-Deploy

- [ ] Todas as alteracoes commitadas
- [ ] CHANGELOG.md atualizado
- [ ] `git pull origin develop` sem conflitos
- [ ] Build do frontend: `cd frontend && npm run build` (sem erros)
- [ ] Build do backend: `cd backend && npm run build` (sem erros)
- [ ] PM2 restart: `pm2 restart nucleoia-api`
- [ ] Teste basico: login, dashboard, principal feature alterada
- [ ] Push para origin

---

## Rollback de Emergencia

Se algo quebrar apos deploy:

```bash
# Opcao 1: Voltar para tag estavel
git checkout v4.0.0  # ou a ultima tag estavel
cd frontend && npm run build
cd ../backend && npm run build && pm2 restart nucleoia-api

# Opcao 2: Script de rollback
bash /var/www/nucleoia/scripts/rollback.sh

# Opcao 3: Reverter ultimo commit
git revert HEAD
git push origin main
# Rebuild
```
