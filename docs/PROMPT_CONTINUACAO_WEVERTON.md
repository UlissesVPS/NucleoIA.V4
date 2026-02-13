# PROMPT DE CONTINUACAO - WEVERTON (CEO)

Cole TODO o conteudo abaixo na primeira mensagem de uma nova sessao do Claude Code.

---

## CONTEXTO OBRIGATORIO

Voce esta trabalhando no projeto **NucleoIA V4** - uma area de membros completa com cursos, prompts de IA, ferramentas e gestao de assinantes.

## CREDENCIAIS

- **VPS Hostinger:** root@76.13.231.9
- **SSH:** Chave SSH configurada (autenticacao sem senha)
- **Projeto:** /var/www/nucleoia
- **Dominio:** painel.nucleoia.online
- **GitHub:** https://github.com/UlissesVPS/NucleoIA.V4
- **DB:** PostgreSQL 16 nativo, user: nucleoia_user, db: nucleoia_db

### Contas de Acesso
- **Admin (Weverton):** weverton.wgcf78@gmail.com / @Veeto133 (role: SUPER_ADMIN)
- **Teste:** testenucleo00@gmail.com / 123456 (role: MEMBER)

## STACK TECNICA

- **Frontend:** React 18 + Vite + TypeScript + TailwindCSS + shadcn-ui + React Query
- **Backend:** Express + Prisma ORM + PostgreSQL 16
- **Infra:** PM2 (cluster mode, 2 instancias) + Nginx + Let's Encrypt SSL

## WORKFLOW GIT (OBRIGATORIO - LEIA ANTES DE FAZER QUALQUER COISA)

O projeto usa Git com branches. **NUNCA commite direto em main.**

### Antes de comecar QUALQUER trabalho:
```bash
ssh root@76.13.231.9
cd /var/www/nucleoia

# 1. Veja o que mudou recentemente
cat docs/CHANGELOG.md | head -60

# 2. Atualize o codigo
git checkout develop
git pull origin develop

# 3. Crie sua branch
git checkout -b feature/nome-da-feature
# ou: git checkout -b fix/nome-do-bug
```

### Ao terminar o trabalho:
```bash
# 1. Atualize o CHANGELOG
nano docs/CHANGELOG.md
# Adicione suas mudancas na secao [Unreleased]

# 2. Commit e push
git add .
git commit -m "feat: descricao do que foi feito"
git push origin feature/nome-da-feature

# 3. Merge para develop
git checkout develop
git pull origin develop
git merge feature/nome-da-feature
git push origin develop

# 4. Se for deploy para producao:
git checkout main
git pull origin main
git merge develop
git push origin main

# 5. Build e deploy
cd /var/www/nucleoia/frontend && npm run build
cd /var/www/nucleoia/backend && npm run build && pm2 restart nucleoia-api
```

### Convencao de commits:
- `feat:` nova feature
- `fix:` correcao de bug
- `docs:` documentacao
- `hotfix:` correcao urgente

## REGRAS DO PROJETO

1. **NUNCA use dados mock/ficticios** - Todo dado vem da API real
2. **React Query obrigatorio** - Hooks em `frontend/src/hooks/useApi.ts`
3. **SEMPRE atualize o CHANGELOG** antes de encerrar a sessao
4. **SEMPRE faca pull antes de comecar** para evitar conflitos com o Ulisses
5. **SEMPRE faca build antes de considerar pronto**

## COMANDOS UTEIS

```bash
# Build frontend
ssh root@76.13.231.9 "cd /var/www/nucleoia/frontend && npm run build"

# Build backend + restart
ssh root@76.13.231.9 "cd /var/www/nucleoia/backend && npm run build && pm2 restart nucleoia-api"

# Ver logs do backend
ssh root@76.13.231.9 "pm2 logs nucleoia-api --lines 50"

# Consultar banco
ssh root@76.13.231.9 "sudo -u postgres psql -d nucleoia_db"

# Ver status do PM2
ssh root@76.13.231.9 "pm2 status"

# Health check
ssh root@76.13.231.9 "curl -s http://localhost:3001/api/health"
```

## DOCUMENTACAO

Toda a documentacao esta em `/var/www/nucleoia/docs/`:
- `ARCHITECTURE.md` - Arquitetura tecnica
- `API.md` - Todos os endpoints
- `DATABASE.md` - Schema do banco (Prisma)
- `DEPLOYMENT.md` - Como fazer deploy
- `CONTRIBUTING.md` - Regras de contribuicao
- `WEBHOOKS.md` - Integracoes Lastlink/Greenn
- `FEATURES.md` - Lista de features
- `CHANGELOG.md` - Historico de mudancas
- `SECURITY.md` - Seguranca

## ARQUIVOS-CHAVE

### Backend
- `backend/src/controllers/` - Todos os controllers
- `backend/src/routes/` - Todas as rotas
- `backend/src/services/` - Servicos (webhooks, email)
- `backend/src/middleware/` - Auth, upload, error handling
- `backend/prisma/schema.prisma` - Schema do banco

### Frontend
- `frontend/src/hooks/useApi.ts` - TODOS os hooks React Query
- `frontend/src/pages/` - Todas as paginas
- `frontend/src/components/` - Componentes reutilizaveis
- `frontend/src/lib/i18n.ts` - Sistema de traducao
- `frontend/src/contexts/AuthContext.tsx` - Contexto de autenticacao

## ESTADO ATUAL DO SISTEMA (Fev 2026)

### Funcionando:
- Login/registro com bcrypt
- Dashboard com stats reais
- 2.498 prompts importados (categoria Criativo)
- Sistema de cursos/aulas com upload
- Webhooks Lastlink + Greenn
- i18n (pt-BR, en, es)
- Monitoramento de IP
- Importador de prompts em massa
- Git + GitHub configurado

### Para consultar stats rapido:
```bash
ssh root@76.13.231.9 "sudo -u postgres psql -d nucleoia_db -c 'SELECT
  (SELECT COUNT(*) FROM users) as usuarios,
  (SELECT COUNT(*) FROM users WHERE is_active=true) as ativos,
  (SELECT COUNT(*) FROM prompts) as prompts,
  (SELECT COUNT(*) FROM courses) as cursos;'"
```
