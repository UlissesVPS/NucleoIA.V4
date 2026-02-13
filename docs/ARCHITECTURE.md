# Arquitetura Tecnica - NucleoIA V4

Documento de referencia da arquitetura tecnica completa do sistema NucleoIA V4.

---

## Sumario

- [Visao Geral](#visao-geral)
- [Arquitetura de Deplou](#arquitetura-de-deploy)
- [Backend](#backend)
  - [Estrutura de Camadas](#estrutura-de-camadas)
  - [Fluxo de Requisicao](#fluxo-de-requisicao)
  - [Middleware](#middleware)
  - [Prisma ORM](#prisma-orm)
- [Frontend](#frontend)
  - [Estrutura de Diretarios](#estrutura-de-diretorios)
  - [Padrao React Query](#padrao-react-query)
  - [Roteamento](#roteamento)
- [Autenticacao](#autenticacao)
  - [Fluxo JWT](#fluxo-jwt)
  - [Refresh Token](#refresh-token)
  - [Magic Link](#magic-link)
  - [Primeiro Acesso](#primeiro-acesso)
  - [TOTP (Autenticador)](#totp-autenticador)
- [Upload de Arquivos](#upload-de-arquivos)
- [Webhooks](#webhooks)
- [API Externa](#api-externa)
- [Internacionalizacao](#internacionalizacao)
- [Seguranca](#seguranca)

---

## Visao Geral

O NucleoIA V4 segue uma arquitetura monolitica modular com separacao clara entre frontend SPA e backend API REST. A comunicacao entre as camadas e feita exclusivamente via HTTP/JSON.

```
                    Internet
                       |
                    [Nginx]
                   /       \
            HTTPS/443    Static Files
                |         (frontend/dist)
           [PM2 Cluster]
           /           \
     [Express:3001]  [Express:3001]
       Instance 1      Instance 2
            \           /
         [PostgreSQL 16]
              :5432
```

---

## Arquitetura de Deploy

### Camada de Rede

```
Cliente (Browser)
    |
    | HTTPS (TLS 1.2/1.3)
    v
[Nginx - Proxy Reverso]
    |-- Certificado SSL (Let's Encrypt, auto-renovacao)
    |-- Compressao gzip
    |-- Headers de seguranca
    |-- Servir arquivos estaticos do frontend (dist/)
    |-- Servir arquivos de upload (/uploads)
    |-- Proxy para /api -> localhost:3001
    v
[PM2 - Gerenciador de Processos]
    |-- Modo cluster (2 instancias)
    |-- Auto-restart em falha
    |-- Log rotation
    |-- Monitoramento de memoria
    v
[Express - Servidor HTTP]
    |-- Porta 3001
    |-- trust proxy: true (IP real via X-Forwarded-For)
    |-- JSON body limit: 50MB
    v
[PostgreSQL 16]
    |-- Porta 5432
    |-- Acesso via Prisma ORM
    |-- Conexao pool gerenciado pelo Prisma
```

### Fluxo de Requisicao Completo

1. Cliente envia requisicao HTTPS para `painel.nucleoia.online`
2. Nginx termina o SSL e roteia:
   - `/api/*` -> proxy para `localhost:3001`
   - `/uploads/*` -> servir diretamente do disco
   - `/*` -> servir `frontend/dist/index.html` (SPA fallback)
3. PM2 distribui entre as instancias (round-robin)
4. Express processa a requisicao pelo pipeline de middleware
5. Rota -> Controller -> Prisma -> PostgreSQL
6. Resposta JSON retorna pelo mesmo caminho

---

## Backend

### Estrutura de Camadas

O backend segue o padrao de camadas (Layered Architecture):

```
src/
├── server.ts           # Ponto de entrada, configuracao Express
├── routes/             # Definicao de rotas e middlewares por recurso
│   ├── auth.ts
│   ├── users.ts
│   ├── prompts.ts
│   ├── categories.ts
│   ├── courses.ts
│   ├── modules.ts
│   ├── lessons.ts
│   ├── aiTools.ts
│   ├── products.ts
│   ├── system.ts
│   ├── profile.ts
│   ├── upload.ts
│   ├── sessions.ts
│   ├── webhookRoutes.ts
│   ├── totp.ts
│   ├── settings.ts
│   ├── sharedCredentials.ts
│   ├── magicLink.ts
│   ├── externalApi.ts
│   └── health.ts
├── controllers/        # Logica dos handlers HTTP
│   ├── authController.ts
│   ├── userController.ts
│   ├── promptController.ts
│   ├── categoryController.ts
│   ├── courseController.ts
│   ├── aiToolController.ts
│   ├── productController.ts
│   ├── systemController.ts
│   ├── profileController.ts
│   ├── uploadController.ts
│   ├── sessionController.ts
│   ├── webhookController.ts
│   ├── totpController.ts
│   ├── settingsController.ts
│   ├── sharedCredentialsController.ts
│   └── externalApiController.ts
├── middleware/
│   ├── auth.ts         # Verificacao JWT + roles
│   ├── upload.ts       # Configuracao Multer
│   └── rateLimiter.ts  # Rate limiting
├── services/           # Logica de negocio reutilizavel
│   └── webhookService.ts
├── utils/
│   ├── jwt.ts          # Geracao/verificacao de tokens
│   ├── email.ts        # Envio de emails
│   ├── hash.ts         # Hash de senhas (bcrypt)
│   └── logger.ts       # Logging
└── types/              # Tipos TypeScript
```

### Fluxo de Requisicao

```
Requisicao HTTP
    |
    v
[Express Middleware Global]
    |-- helmet()           # Headers de seguranca
    |-- cors()             # CORS configurado
    |-- compression()      # Compressao gzip
    |-- morgan()           # Logging HTTP
    |-- cookieParser()     # Parse de cookies
    |-- express.json()     # Parse JSON (limit: 50mb)
    |-- express.static()   # Arquivos estaticos (/uploads)
    v
[Router]
    |-- Roteamento por prefixo (/api/auth, /api/prompts, etc)
    v
[Middleware de Rota]
    |-- authMiddleware     # Verifica JWT, extrai userId
    |-- adminMiddleware    # Verifica role ADMIN ou SUPER_ADMIN
    |-- superAdminMiddleware # Verifica role SUPER_ADMIN
    |-- uploadMiddleware   # Processa multipart/form-data
    v
[Controller]
    |-- Validacao de input
    |-- Chamada ao Prisma
    |-- Formatacao de resposta
    |-- Tratamento de erros
    v
[Prisma Client]
    |-- Query builder type-safe
    |-- Connection pool
    |-- Transacoes quando necessario
    v
[PostgreSQL 16]
```

### Middleware

#### Auth Middleware (`authMiddleware`)
- Extrai token do header `Authorization: Bearer <token>` ou cookie `accessToken`
- Verifica assinatura e expiracao do JWT
- Injeta `req.userId` e `req.userRole` na requisicao
- Retorna 401 se token invalido/expirado

#### Admin Middleware (`adminMiddleware`)
- Depende do `authMiddleware` (executado antes)
- Verifica se `req.userRole` e `ADMIN` ou `SUPER_ADMIN`
- Retorna 403 se nao autorizado

#### Super Admin Middleware (`superAdminMiddleware`)
- Verifica se `req.userRole` e `SUPER_ADMIN`
- Retorna 403 se nao autorizado

#### Upload Middleware
- Utiliza Multer com storage em disco
- Limites de tamanho por tipo:
  - Imagem: 15MB
  - Thumbnail: 10MB
  - Video: 3GB
- Diretorio: `uploads/` na raiz do backend

### Prisma ORM

O Prisma e utilizado como ORM unico para acesso ao PostgreSQL. Principais caracteristicas:

- Schema definido em `prisma/schema.prisma` (21 modelos, 11 enums)
- Migracoes versionadas em `prisma/migrations/`
- Client gerado com tipos TypeScript automaticos
- Connection pool gerenciado automaticamente
- Instancia singleton exportada para uso em controllers

```typescript
// Padrao de uso nos controllers
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Exemplo: listar prompts com paginacao
const prompts = await prisma.prompt.findMany({
  skip: (page - 1) * limit,
  take: limit,
  include: { category: true, likes: true },
  orderBy: { createdAt: 'desc' },
});
```

---

## Frontend

### Estrutura de Diretorios

```
src/
├── App.tsx              # Roteamento principal
├── main.tsx             # Ponto de entrada
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── layout/          # Sidebar, Header, etc
│   └── shared/          # Componentes compartilhados
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Prompts.tsx
│   ├── MeusPrompts.tsx
│   ├── Aulas.tsx
│   ├── Produtos.tsx
│   ├── IAs.tsx
│   ├── Perfil.tsx
│   ├── Configuracoes.tsx
│   ├── FAQ.tsx
│   ├── Networking.tsx
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminProdutos.tsx
│   │   └── AdminSistema.tsx
│   └── auth/
│       ├── MagicLink.tsx
│       └── PrimeiroAcesso.tsx
├── hooks/
│   └── useApi.ts        # Hooks React Query para cada recurso
├── lib/
│   ├── api.ts           # Cliente axios configurado
│   ├── auth.ts          # Contexto de autenticacao
│   └── utils.ts         # Utilitarios gerais
├── i18n/
│   ├── pt-BR.json
│   ├── en.json
│   └── es.json
└── types/               # Tipos compartilhados
```

### Padrao React Query

O frontend utiliza React Query (TanStack Query) como camada de comunicacao com a API. Todos os hooks estao centralizados em `src/hooks/useApi.ts`.

**Licao critica aprendida:** Na versao anterior, as paginas usavam `useState` com dados hardcoded de arquivos locais (`@/data/products.ts`, `@/data/ai-tools.ts`). Todas as operacoes CRUD modificavam apenas o estado React local, nunca chamavam a API. O backend funcionava perfeitamente, mas o frontend nao persistia nada. A correcao foi reescrever todas as paginas para usar hooks React Query que chamam a API real.

```typescript
// Padrao correto (hooks/useApi.ts)
export function usePrompts(params?: { page?: number; category?: string }) {
  return useQuery({
    queryKey: ['prompts', params],
    queryFn: () => api.get('/api/prompts', { params }).then(r => r.data),
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePromptData) =>
      api.post('/api/prompts', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
}
```

**Normalizacao de dados:** O backend e o frontend tem diferencas de nomenclatura que devem ser tratadas:

| Backend (Prisma) | Frontend (Componentes) | Solucao |
|---|---|---|
| `imageUrl` | `image` | Funcao helper de normalizacao |
| Categorias UPPERCASE (`TEXT`, `VIDEO`) | Display names | Mapeamento no frontend |
| IDs UUID (string) | IDs numericos (legado) | Migrado para UUID |
| Precos Decimal | Strings formatadas | Formatacao na exibicao |

### Roteamento

O roteamento e gerenciado pelo React Router v6 com protecao de rotas por autenticacao e role.

```
Rotas Publicas (sem autenticacao):
  /login
  /auth/magic
  /primeiro-acesso
  /solicitar-acesso

Rotas Protegidas (autenticacao obrigatoria):
  /                   # Dashboard
  /comece-aqui        # Onboarding
  /ias                # Ferramentas de IA
  /autenticador       # TOTP
  /dicloak            # DiCloak
  /prompts            # Biblioteca de prompts
  /meus-prompts       # Prompts do usuario
  /aulas              # Lista de cursos
  /aulas/:cursoId     # Aulas de um curso
  /produtos           # Loja de produtos
  /perfil             # Perfil do usuario
  /configuracoes      # Configuracoes
  /faq                # FAQ
  /networking         # Networking

Rotas Admin (role ADMIN ou SUPER_ADMIN):
  /admin              # Dashboard admin
  /admin/produtos     # Gerenciar produtos

Rotas Super Admin (role SUPER_ADMIN):
  /admin/sistema      # Gestao do sistema
```

---

## Autenticacao

O sistema de autenticacao utiliza multiplos mecanismos complementares.

### Fluxo JWT

```
1. Login (POST /api/auth/login)
   |-- Valida email + senha (bcrypt)
   |-- Gera Access Token (JWT, expiracao curta: 15min)
   |-- Gera Refresh Token (JWT, expiracao longa: 7 dias)
   |-- Salva sessao no banco (Session model)
   |-- Define cookies HttpOnly com ambos tokens
   |-- Retorna dados do usuario + tokens

2. Requisicao Autenticada
   |-- Frontend envia Access Token via:
   |   - Header: Authorization: Bearer <token>
   |   - Cookie: accessToken
   |-- authMiddleware verifica e decodifica
   |-- Injeta userId e role na request

3. Token Expirado
   |-- Frontend recebe 401
   |-- Automaticamente chama POST /api/auth/refresh
   |-- Recebe novo access token
   |-- Repete requisicao original

4. Logout (POST /api/auth/logout)
   |-- Invalida sessao no banco
   |-- Limpa cookies
```

### Refresh Token

```
POST /api/auth/refresh
  |-- Recebe refresh token via cookie ou body
  |-- Verifica assinatura e expiracao
  |-- Verifica se sessao existe e esta ativa
  |-- Gera novo access token
  |-- Retorna novo access token
```

### Magic Link

```
1. POST /api/auth/magic-link/send
   |-- Recebe email
   |-- Gera token unico (expiracao: 15min)
   |-- Envia email com link de acesso

2. POST /api/auth/magic-link/verify
   |-- Recebe token
   |-- Valida token e expiracao
   |-- Cria sessao e retorna JWT
```

### Primeiro Acesso

Fluxo para novos usuarios criados por webhook ou admin:

```
1. Admin cria usuario ou webhook cria automaticamente
   |-- Usuario recebe email com link de primeiro acesso
   |-- Link contem token unico

2. GET /api/auth/first-access/:token
   |-- Valida token
   |-- Retorna dados basicos do usuario

3. POST /api/auth/first-access/:token
   |-- Recebe nova senha
   |-- Define senha e ativa conta
   |-- Cria sessao e retorna JWT
```

### TOTP (Autenticador)

Sistema de codigos temporarios (Time-based One-Time Password):

```
1. POST /api/totp/generate
   |-- Gera novo codigo TOTP
   |-- Salva no banco com expiracao

2. GET /api/totp/code
   |-- Retorna codigo atual valido

3. GET /api/totp/status
   |-- Retorna se TOTP esta configurado

4. PUT /api/totp/secret (Super Admin)
   |-- Configura secret TOTP
```

---

## Upload de Arquivos

### Fluxo de Upload

```
1. Frontend envia FormData para /api/upload/{tipo}
   |-- tipo: image, thumbnail, video

2. Middleware Multer processa o arquivo
   |-- Valida tipo MIME
   |-- Valida tamanho (image:15MB, thumbnail:10MB, video:3GB)
   |-- Salva em /uploads/{tipo}/{timestamp}-{nome}

3. Controller retorna URL do arquivo
   |-- URL relativa: /uploads/{tipo}/{arquivo}

4. Nginx serve arquivos estaticos
   |-- /uploads/ -> backend/uploads/
```

### Configuracao do Multer

```
Armazenamento: disco local
Diretorio: backend/uploads/
Nomenclatura: {timestamp}-{nome-original}
Filtros MIME:
  - Imagens: image/jpeg, image/png, image/gif, image/webp
  - Videos: video/mp4, video/webm, video/quicktime
```

---

## Webhooks

### Webhooks de Entrada (Plataformas de Pagamento)

O sistema recebe webhooks de plataformas de pagamento para automatizar a gestao de assinaturas.

```
POST /api/webhooks/green    # Greenn
POST /api/webhooks/lastlink # Lastlink

Fluxo:
1. Plataforma envia evento (compra, cancelamento, etc)
2. Middleware valida assinatura HMAC-SHA256
3. Controller processa evento:
   - Compra: cria usuario + assinatura ACTIVE
   - Cancelamento: atualiza status para CANCELED
   - Reembolso: atualiza status para CANCELED
4. Registra ActivityLog
```

### Webhooks de Saida (Sistema de Notificacao)

O admin pode configurar webhooks para notificar sistemas externos:

```
CRUD: /api/system/webhooks
Teste: POST /api/system/webhooks/:id/test

Comportamento:
- Fire-and-forget (nao aguarda resposta)
- Timeout: 10 segundos
- Auto-desativa apos 10 falhas consecutivas
- Status: ACTIVE, PAUSED, ERROR
```

---

## API Externa

API publica acessivel via chave de API (API Key):

```
Base: /api/api/v1
Autenticacao: Header X-API-Key ou query param ?api_key=

Endpoints:
  GET /prompts    # Listar prompts
  GET /categories # Listar categorias
  GET /products   # Listar produtos
  GET /courses    # Listar cursos
  GET /stats      # Estatisticas

Tipos de chave: PRODUCTION, TEST, IMPORT, CUSTOM
Status: ACTIVE, REVOKED
```

---

## Internacionalizacao

O frontend suporta 3 idiomas via i18next:

| Idioma | Arquivo | Codigo |
|---|---|---|
| Portugues (Brasil) | `i18n/pt-BR.json` | pt-BR |
| Ingles | `i18n/en.json` | en |
| Espanhol | `i18n/es.json` | es |

A deteccao de idioma segue a ordem:
1. Preferencia salva no localStorage
2. Idioma do navegador
3. Fallback: pt-BR

---

## Seguranca

### Medidas Implementadas

| Medida | Implementacao |
|---|---|
| HTTPS | Let's Encrypt via Nginx |
| Headers de seguranca | Helmet.js |
| CORS | Configurado para dominio especifico |
| Rate limiting | Express rate limiter |
| Senhas | bcrypt com salt rounds |
| JWT HttpOnly cookies | Protecao contra XSS |
| Trust proxy | IP real via Nginx |
| Validacao de input | Verificacao em controllers |
| HMAC-SHA256 | Validacao de webhooks |
| Sessoes | Controle de sessoes ativas + IP tracking |
| Monitoramento de IP | Deteccao de multi-IP por usuario |
