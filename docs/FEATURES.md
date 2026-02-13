# Features - NucleoIA V4

Lista completa de funcionalidades implementadas.

---

## Autenticacao e Usuarios

- [x] Login com email/senha (bcrypt)
- [x] Registro com aprovacao manual (usuario fica inativo)
- [x] Auto-aprovacao via webhook (Lastlink/Greenn)
- [x] JWT com access token (15min) + refresh token (7d, cookie HttpOnly)
- [x] Primeiro acesso via token unico (link por email)
- [x] Magic link (envio e verificacao)
- [x] Logout com invalidacao de sessao
- [x] Roles: SUPER_ADMIN, ADMIN, MEMBER
- [x] Perfil do usuario (nome, avatar, telefone, localizacao)
- [x] Preferencias (idioma, tema, notificacoes)
- [x] Alteracao de senha

---

## Dashboard

- [x] Estatisticas em tempo real (usuarios, prompts, cursos, produtos)
- [x] Usuarios online
- [x] Icones gradient customizados
- [x] Dados 100% da API (zero mock)

---

## Prompts

- [x] Listagem paginada com filtros (tipo, categoria)
- [x] Sistema de likes (curtir/descurtir, constraint unico)
- [x] Copiar prompt (incrementa contador)
- [x] Prompts da comunidade (usuarios podem criar)
- [x] Importacao em massa (POST /api/prompts/bulk-import, max 500/vez)
- [x] Download e otimizacao de imagens externas para WebP local
- [x] 2.498 prompts importados do Conektai
- [x] Thumbnails locais otimizados

---

## Cursos e Aulas

- [x] Hierarquia: Curso > Modulo > Aula
- [x] Upload de videos (ate 3 GB)
- [x] Upload de thumbnails e imagens
- [x] Progresso por aula (percentual + completado)
- [x] Ordenacao customizada (drag & drop)
- [x] Cursos publicados/rascunho
- [x] Cursos em destaque

---

## Ferramentas de IA

- [x] CRUD completo
- [x] Categorias: TEXT, VIDEO, IMAGE, VOICE, DESIGN, EDITING, PRESENTATIONS
- [x] URL de acesso externo
- [x] Ordenacao customizada
- [x] Status ativo/inativo

---

## Produtos

- [x] CRUD completo
- [x] Categorias: CURSO, EBOOK, MENTORIA, TEMPLATE
- [x] Preco com desconto (original vs atual)
- [x] Features em JSON
- [x] URL de compra
- [x] Produtos em destaque
- [x] Rating e contador de vendas
- [x] Video de apresentacao
- [x] Descricao completa (rich text)

---

## Admin

- [x] Gestao de usuarios (listar, ativar/desativar, alterar role)
- [x] Gestao de assinaturas (plano, status, gateway)
- [x] Usuarios online com IPs
- [x] Estatisticas de usuarios
- [x] Logs de atividade (paginado, filtros)
- [x] Envio de notificacoes
- [x] Notas administrativas por usuario

---

## Super Admin

- [x] API Keys (criar, listar, revogar)
- [x] Webhooks (CRUD + testar)
- [x] Backups (listar, agendar)
- [x] Config de TOTP secret
- [x] Credenciais compartilhadas (CRUD)
- [x] Stats do VPS

---

## Webhooks e Integracoes

- [x] Sistema de webhooks customizaveis
- [x] Assinatura HMAC-SHA256
- [x] Auto-desativacao apos 10 falhas
- [x] Integracao Lastlink (subscription.created, .canceled)
- [x] Integracao Greenn (subscription.created, .canceled)
- [x] Headers customizados por webhook
- [x] Logs de disparo

---

## Seguranca e Monitoramento

- [x] Tracking de IP por sessao (IP real via trust proxy)
- [x] Alerta de multi-IP (2+ IPs diferentes)
- [x] Historico completo de IPs
- [x] Rate limiting via Nginx (10 req/s)
- [x] Headers de seguranca (Helmet + Nginx)
- [x] CORS configurado
- [x] Compressao gzip

---

## Infraestrutura

- [x] PM2 cluster mode (max instances)
- [x] Nginx com HTTPS (Let's Encrypt)
- [x] Backup automatico diario
- [x] 7 tipos de backup (full, db, files, config, pre-deploy, daily, migration)
- [x] Rollback automatizado
- [x] Deploy seguro com backup pre-deploy
- [x] Health check endpoint
- [x] Log rotation

---

## Internacionalizacao (i18n)

- [x] 3 idiomas: pt-BR (padrao), en, es
- [x] Hook reativo (muda sem reload)
- [x] Persistencia em localStorage

---

## API Externa

- [x] 5 endpoints publicos com API key (X-API-Key)
- [x] Permissoes granulares por key
- [x] Suporte a keys de teste/producao

---

## Frontend

- [x] React 18 + Vite + TypeScript
- [x] TailwindCSS + shadcn-ui
- [x] React Query (cache, invalidacao automatica)
- [x] Tema dark/light/system
- [x] Layout responsivo (mobile + desktop)
- [x] Sidebar com navegacao
- [x] Protecao de rotas por role
- [x] Contexto de autenticacao global
