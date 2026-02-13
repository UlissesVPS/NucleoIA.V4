# Documentacao da API - NucleoIA V4

Documentacao completa de todos os endpoints da API REST do NucleoIA V4.

---

## Sumario

- [Informacoes Gerais](#informacoes-gerais)
- [Autenticacao](#autenticacao)
- [Auth](#auth)
- [Magic Link](#magic-link)
- [Usuarios](#usuarios)
- [Prompts](#prompts)
- [Categorias](#categorias)
- [Cursos](#cursos)
- [Modulos](#modulos)
- [Aulas](#aulas)
- [Ferramentas de IA](#ferramentas-de-ia)
- [Produtos](#produtos)
- [Sistema](#sistema)
- [Chaves de API](#chaves-de-api)
- [Webhooks do Sistema](#webhooks-do-sistema)
- [Backups](#backups)
- [Perfil](#perfil)
- [Upload](#upload)
- [Sessoes](#sessoes)
- [Webhooks de Pagamento](#webhooks-de-pagamento)
- [TOTP](#totp)
- [Configuracoes de Pagina](#configuracoes-de-pagina)
- [Credenciais Compartilhadas](#credenciais-compartilhadas)
- [API Externa](#api-externa)
- [Health Check](#health-check)
- [Codigos de Erro](#codigos-de-erro)

---

## Informacoes Gerais

**Base URL:** `https://painel.nucleoia.online/api`

**Content-Type:** `application/json` (exceto uploads que usam `multipart/form-data`)

**Limite de body:** 50MB

---

## Autenticacao

A API utiliza dois metodos de autenticacao:

### JWT (Usuarios)

Enviar o token de acesso via:

- **Header:** `Authorization: Bearer <access_token>`
- **Cookie:** `accessToken` (definido automaticamente no login)

### API Key (API Externa)

Para endpoints da API externa (`/api/api/v1/*`):

- **Header:** `X-API-Key: <api_key>`
- **Query param:** `?api_key=<api_key>`

### Niveis de Acesso

| Nivel | Descricao | Simbolo neste doc |
|---|---|---|
| Publico | Sem autenticacao | -- |
| Auth | Qualquer usuario autenticado | AUTH |
| Admin | Role ADMIN ou SUPER_ADMIN | ADMIN |
| Super Admin | Role SUPER_ADMIN | SUPER |
| API Key | Chave de API valida | APIKEY |

---

## Auth

### Registrar usuario

```
POST /api/auth/register
Acesso: Publico
```

**Request Body:**

```json
{
  "name": "Nome Completo",
  "email": "usuario@email.com",
  "password": "senhaSegura123",
  "phone": "(11) 99999-9999"
}
```

**Response 201:**

```json
{
  "user": {
    "id": "uuid",
    "name": "Nome Completo",
    "email": "usuario@email.com",
    "role": "MEMBER",
    "plan": "MENSAL"
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

---

### Login

```
POST /api/auth/login
Acesso: Publico
```

**Request Body:**

```json
{
  "email": "usuario@email.com",
  "password": "senhaSegura123"
}
```

**Response 200:**

```json
{
  "user": {
    "id": "uuid",
    "name": "Nome Completo",
    "email": "usuario@email.com",
    "role": "MEMBER",
    "plan": "MENSAL",
    "subscription": {
      "status": "ACTIVE",
      "plan": "MENSAL",
      "expiresAt": "2026-03-13T00:00:00.000Z"
    }
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

**Notas:**
- Define cookies HttpOnly `accessToken` e `refreshToken`
- Cria registro na tabela Session com IP e user-agent
- Registra ActivityLog tipo LOGIN

---

### Logout

```
POST /api/auth/logout
Acesso: AUTH
```

**Response 200:**

```json
{
  "message": "Logout realizado com sucesso"
}
```

**Notas:**
- Invalida a sessao atual
- Limpa cookies
- Registra ActivityLog tipo LOGOUT

---

### Obter usuario atual

```
GET /api/auth/me
Acesso: AUTH
```

**Response 200:**

```json
{
  "user": {
    "id": "uuid",
    "name": "Nome Completo",
    "email": "usuario@email.com",
    "role": "MEMBER",
    "plan": "MENSAL",
    "avatar": "/uploads/avatars/avatar.jpg",
    "phone": "(11) 99999-9999",
    "subscription": {
      "status": "ACTIVE",
      "plan": "MENSAL",
      "expiresAt": "2026-03-13T00:00:00.000Z"
    }
  }
}
```

---

### Refresh token

```
POST /api/auth/refresh
Acesso: Publico
```

**Request Body:**

```json
{
  "refreshToken": "jwt..."
}
```

Ou via cookie `refreshToken`.

**Response 200:**

```json
{
  "accessToken": "novo-jwt..."
}
```

---

### Validar token de primeiro acesso

```
GET /api/auth/first-access/:token
Acesso: Publico
```

**Response 200:**

```json
{
  "valid": true,
  "user": {
    "name": "Nome",
    "email": "email@email.com"
  }
}
```

---

### Definir senha no primeiro acesso

```
POST /api/auth/first-access/:token
Acesso: Publico
```

**Request Body:**

```json
{
  "password": "novaSenhaSegura123"
}
```

**Response 200:**

```json
{
  "user": { ... },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

---

## Magic Link

### Enviar magic link

```
POST /api/auth/magic-link/send
Acesso: Publico
```

**Request Body:**

```json
{
  "email": "usuario@email.com"
}
```

**Response 200:**

```json
{
  "message": "Magic link enviado para o email"
}
```

---

### Verificar magic link

```
POST /api/auth/magic-link/verify
Acesso: Publico
```

**Request Body:**

```json
{
  "token": "token-do-magic-link"
}
```

**Response 200:**

```json
{
  "user": { ... },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

---

## Usuarios

### Listar usuarios

```
GET /api/users
Acesso: ADMIN
```

**Query Params:**

| Param | Tipo | Descricao |
|---|---|---|
| page | number | Pagina (default: 1) |
| limit | number | Itens por pagina (default: 20) |
| search | string | Busca por nome ou email |
| role | string | Filtro por role (MEMBER, ADMIN, SUPER_ADMIN) |
| status | string | Filtro por status de assinatura |

**Response 200:**

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Nome",
      "email": "email@email.com",
      "role": "MEMBER",
      "createdAt": "2026-02-09T...",
      "subscription": {
        "status": "ACTIVE",
        "plan": "MENSAL",
        "expiresAt": "2026-03-09T..."
      }
    }
  ],
  "total": 150,
  "page": 1,
  "totalPages": 8
}
```

---

### Usuarios online

```
GET /api/users/online
Acesso: ADMIN
```

**Response 200:**

```json
{
  "online": [
    {
      "id": "uuid",
      "name": "Nome",
      "email": "email@email.com",
      "lastActivity": "2026-02-13T...",
      "ip": "192.168.1.1"
    }
  ],
  "count": 5
}
```

---

### Estatisticas de usuarios

```
GET /api/users/stats
Acesso: ADMIN
```

**Response 200:**

```json
{
  "total": 150,
  "active": 120,
  "inactive": 20,
  "suspended": 5,
  "expired": 5,
  "newThisMonth": 15,
  "byPlan": {
    "MENSAL": 80,
    "TRIMESTRAL": 40,
    "SEMESTRAL": 30
  }
}
```

---

### Obter usuario

```
GET /api/users/:id
Acesso: ADMIN
```

**Response 200:**

```json
{
  "user": {
    "id": "uuid",
    "name": "Nome Completo",
    "email": "email@email.com",
    "role": "MEMBER",
    "phone": "(11) 99999-9999",
    "avatar": "/uploads/avatars/...",
    "createdAt": "...",
    "subscription": { ... },
    "sessions": [ ... ],
    "activityLogs": [ ... ]
  }
}
```

---

### Atualizar usuario

```
PUT /api/users/:id
Acesso: ADMIN
```

**Request Body:**

```json
{
  "name": "Novo Nome",
  "email": "novo@email.com",
  "role": "ADMIN",
  "phone": "(11) 88888-8888"
}
```

**Response 200:**

```json
{
  "user": { ... }
}
```

---

### Atualizar status do usuario

```
PATCH /api/users/:id/status
Acesso: ADMIN
```

**Request Body:**

```json
{
  "status": "SUSPENDED"
}
```

**Valores aceitos para status:** ACTIVE, INACTIVE, SUSPENDED

---

### Atualizar assinatura

```
PATCH /api/users/:id/subscription
Acesso: ADMIN
```

**Request Body:**

```json
{
  "plan": "TRIMESTRAL",
  "status": "ACTIVE",
  "expiresAt": "2026-06-13T00:00:00.000Z"
}
```

---

## Prompts

### Listar prompts

```
GET /api/prompts
Acesso: AUTH
```

**Query Params:**

| Param | Tipo | Descricao |
|---|---|---|
| page | number | Pagina |
| limit | number | Itens por pagina |
| search | string | Busca no titulo/descricao |
| category | string | Filtro por categoria (ID) |
| type | string | Filtro por tipo (IMAGE, VIDEO) |

**Response 200:**

```json
{
  "prompts": [
    {
      "id": "uuid",
      "title": "Titulo do Prompt",
      "description": "Descricao...",
      "content": "Conteudo do prompt...",
      "type": "IMAGE",
      "imageUrl": "/uploads/prompts/...",
      "category": {
        "id": "uuid",
        "name": "Categoria"
      },
      "likesCount": 10,
      "copiesCount": 25,
      "isLiked": true,
      "createdAt": "..."
    }
  ],
  "total": 500,
  "page": 1,
  "totalPages": 25
}
```

---

### Meus prompts (comunidade)

```
GET /api/prompts/my
Acesso: AUTH
```

Retorna prompts criados pelo usuario autenticado.

---

### Criar prompt comunitario

```
POST /api/prompts/my
Acesso: AUTH
```

**Request Body:**

```json
{
  "title": "Meu Prompt",
  "description": "Descricao do prompt",
  "content": "Conteudo completo do prompt...",
  "type": "IMAGE",
  "categoryId": "uuid-da-categoria"
}
```

---

### Obter prompt

```
GET /api/prompts/:id
Acesso: AUTH
```

---

### Curtir/descurtir prompt

```
POST /api/prompts/:id/like
Acesso: AUTH
```

**Comportamento:** Toggle. Se ja curtiu, remove a curtida. Se nao, adiciona.

**Response 200:**

```json
{
  "liked": true,
  "likesCount": 11
}
```

---

### Copiar prompt

```
POST /api/prompts/:id/copy
Acesso: AUTH
```

**Notas:**
- Incrementa contador de copias
- Registra ActivityLog tipo COPY

---

### Download de imagens de prompts

```
POST /api/prompts/download-images
Acesso: ADMIN
```

**Request Body:**

```json
{
  "prompts": [
    { "id": "uuid", "imageUrl": "https://exemplo.com/img.jpg" }
  ]
}
```

**Notas:** Faz download das imagens externas e salva localmente.

---

### Importacao em massa

```
POST /api/prompts/bulk-import
Acesso: ADMIN
```

**Request Body:**

```json
{
  "prompts": [
    {
      "title": "Titulo",
      "description": "Desc",
      "content": "Conteudo",
      "type": "IMAGE",
      "categoryId": "uuid",
      "imageUrl": "https://..."
    }
  ]
}
```

**Notas:** Maximo de 500 prompts por requisicao.

---

### Criar prompt (admin)

```
POST /api/prompts
Acesso: ADMIN
```

**Request Body:** Mesmo formato do prompt comunitario, com campo opcional `featured`.

---

### Atualizar prompt

```
PUT /api/prompts/:id
Acesso: ADMIN
```

---

### Deletar prompt

```
DELETE /api/prompts/:id
Acesso: ADMIN
```

---

## Categorias

### Listar categorias

```
GET /api/categories
Acesso: AUTH
```

**Response 200:**

```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Nome da Categoria",
      "slug": "nome-da-categoria",
      "promptCount": 45
    }
  ]
}
```

---

### Criar categoria

```
POST /api/categories
Acesso: ADMIN
```

**Request Body:**

```json
{
  "name": "Nova Categoria"
}
```

---

### Atualizar categoria

```
PUT /api/categories/:id
Acesso: ADMIN
```

---

### Deletar categoria

```
DELETE /api/categories/:id
Acesso: ADMIN
```

---

## Cursos

### Listar cursos

```
GET /api/courses
Acesso: AUTH
```

**Response 200:**

```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Nome do Curso",
      "description": "Descricao...",
      "imageUrl": "/uploads/courses/...",
      "totalLessons": 20,
      "completedLessons": 5,
      "progress": 25,
      "modules": [
        {
          "id": "uuid",
          "title": "Modulo 1",
          "order": 1,
          "lessonsCount": 5
        }
      ]
    }
  ]
}
```

---

### Obter curso com modulos e aulas

```
GET /api/courses/:id
Acesso: AUTH
```

**Response 200:**

```json
{
  "course": {
    "id": "uuid",
    "title": "Nome do Curso",
    "description": "Descricao completa...",
    "imageUrl": "...",
    "modules": [
      {
        "id": "uuid",
        "title": "Modulo 1",
        "order": 1,
        "lessons": [
          {
            "id": "uuid",
            "title": "Aula 1",
            "description": "...",
            "videoUrl": "...",
            "duration": 1200,
            "order": 1,
            "completed": false
          }
        ]
      }
    ]
  }
}
```

---

### Criar curso

```
POST /api/courses
Acesso: ADMIN
```

**Request Body:**

```json
{
  "title": "Nome do Curso",
  "description": "Descricao",
  "imageUrl": "/uploads/courses/imagem.jpg"
}
```

---

### Atualizar curso

```
PUT /api/courses/:id
Acesso: ADMIN
```

---

### Deletar curso

```
DELETE /api/courses/:id
Acesso: ADMIN
```

---

### Criar modulo

```
POST /api/courses/:id/modules
Acesso: ADMIN
```

**Request Body:**

```json
{
  "title": "Nome do Modulo",
  "order": 1
}
```

---

## Modulos

```
PUT /api/modules/:id       # Atualizar modulo (ADMIN)
DELETE /api/modules/:id     # Deletar modulo (ADMIN)
```

---

## Aulas

```
GET /api/lessons/:id              # Obter aula (AUTH)
POST /api/modules/:id/lessons     # Criar aula no modulo (ADMIN)
PUT /api/lessons/:id              # Atualizar aula (ADMIN)
DELETE /api/lessons/:id           # Deletar aula (ADMIN)
POST /api/lessons/:id/progress    # Marcar progresso (AUTH)
```

### Criar aula

```
POST /api/modules/:id/lessons
Acesso: ADMIN
```

**Request Body:**

```json
{
  "title": "Nome da Aula",
  "description": "Descricao",
  "videoUrl": "/uploads/videos/video.mp4",
  "content": "Conteudo complementar em texto...",
  "duration": 1200,
  "order": 1
}
```

### Marcar progresso

```
POST /api/lessons/:id/progress
Acesso: AUTH
```

**Request Body:**

```json
{
  "completed": true
}
```

---

## Ferramentas de IA

### Listar ferramentas

```
GET /api/ai-tools
Acesso: AUTH
```

**Query Params:**

| Param | Tipo | Descricao |
|---|---|---|
| category | string | TEXT, VIDEO, IMAGE, VOICE, DESIGN, EDITING, PRESENTATIONS |
| search | string | Busca por nome |

**Response 200:**

```json
{
  "tools": [
    {
      "id": "uuid",
      "name": "ChatGPT",
      "description": "Modelo de linguagem da OpenAI",
      "url": "https://chat.openai.com",
      "imageUrl": "/uploads/tools/chatgpt.png",
      "category": "TEXT",
      "order": 1,
      "featured": true
    }
  ]
}
```

---

### Obter ferramenta

```
GET /api/ai-tools/:id
Acesso: AUTH
```

---

### Criar ferramenta

```
POST /api/ai-tools
Acesso: ADMIN
```

**Request Body:**

```json
{
  "name": "Nome da Ferramenta",
  "description": "Descricao",
  "url": "https://...",
  "imageUrl": "/uploads/tools/...",
  "category": "TEXT",
  "order": 1,
  "featured": false
}
```

---

### Atualizar ferramenta

```
PUT /api/ai-tools/:id
Acesso: ADMIN
```

---

### Deletar ferramenta

```
DELETE /api/ai-tools/:id
Acesso: ADMIN
```

---

### Atualizar ordem

```
PATCH /api/ai-tools/:id/order
Acesso: ADMIN
```

**Request Body:**

```json
{
  "order": 3
}
```

---

## Produtos

### Listar produtos

```
GET /api/products
Acesso: AUTH
```

**Query Params:**

| Param | Tipo | Descricao |
|---|---|---|
| category | string | CURSO, EBOOK, MENTORIA, TEMPLATE |
| search | string | Busca por nome |
| featured | boolean | Apenas destaques |

---

### Produtos em destaque

```
GET /api/products/featured
Acesso: AUTH
```

---

### Obter produto

```
GET /api/products/:id
Acesso: AUTH
```

**Response 200:**

```json
{
  "product": {
    "id": "uuid",
    "name": "Nome do Produto",
    "description": "Descricao completa...",
    "price": "97.00",
    "imageUrl": "/uploads/products/...",
    "category": "CURSO",
    "url": "https://link-de-venda.com",
    "featured": true,
    "createdAt": "..."
  }
}
```

---

### Criar produto

```
POST /api/products
Acesso: ADMIN
```

**Request Body:**

```json
{
  "name": "Nome do Produto",
  "description": "Descricao",
  "price": 97.00,
  "imageUrl": "/uploads/products/...",
  "category": "CURSO",
  "url": "https://link-de-venda.com",
  "featured": false
}
```

---

### Atualizar produto

```
PUT /api/products/:id
Acesso: ADMIN
```

---

### Deletar produto

```
DELETE /api/products/:id
Acesso: ADMIN
```

---

## Sistema

### Estatisticas publicas

```
GET /api/system/stats/public
Acesso: Publico
```

**Response 200:**

```json
{
  "totalUsers": 150,
  "totalPrompts": 500,
  "totalCourses": 10,
  "totalTools": 30
}
```

---

### Estatisticas completas

```
GET /api/system/stats
Acesso: ADMIN
```

**Response 200:**

```json
{
  "users": { "total": 150, "active": 120, "new": 15 },
  "prompts": { "total": 500, "thisMonth": 50 },
  "courses": { "total": 10, "lessons": 80 },
  "products": { "total": 25 },
  "tools": { "total": 30 },
  "sessions": { "active": 20 },
  "revenue": { "mrr": 5000 }
}
```

---

### Logs de atividade

```
GET /api/system/activity-logs
Acesso: ADMIN
```

**Query Params:**

| Param | Tipo | Descricao |
|---|---|---|
| page | number | Pagina |
| limit | number | Itens por pagina |
| type | string | LOGIN, LOGOUT, TWO_FA, PROMPT, COPY, LESSON, SUSPEND, ADMIN, SYSTEM, BACKUP |
| userId | string | Filtro por usuario |
| startDate | string | Data inicio (ISO) |
| endDate | string | Data fim (ISO) |

---

### Estatisticas da VPS

```
GET /api/system/vps-stats
Acesso: ADMIN
```

**Response 200:**

```json
{
  "cpu": { "usage": 25, "cores": 4 },
  "memory": { "total": 8192, "used": 4096, "percentage": 50 },
  "disk": { "total": 80, "used": 35, "percentage": 43 },
  "uptime": 864000,
  "loadAvg": [0.5, 0.3, 0.2]
}
```

---

### Usuarios online (com IPs)

```
GET /api/system/online-users
Acesso: ADMIN
```

---

### Alertas de IP

```
GET /api/system/ip-alerts
Acesso: ADMIN
```

**Notas:** Detecta usuarios que acessam de multiplos IPs simultaneamente.

---

### Historico de IPs

```
GET /api/system/ip-history
Acesso: ADMIN
```

**Query Params:**

| Param | Tipo | Descricao |
|---|---|---|
| userId | string | Filtro por usuario |

---

### Enviar notificacao

```
POST /api/system/notifications/send
Acesso: ADMIN
```

**Request Body:**

```json
{
  "title": "Titulo da Notificacao",
  "message": "Mensagem...",
  "type": "info",
  "userIds": ["uuid1", "uuid2"]
}
```

---

## Chaves de API

### Listar chaves

```
GET /api/system/api-keys
Acesso: ADMIN
```

---

### Criar chave

```
POST /api/system/api-keys
Acesso: ADMIN
```

**Request Body:**

```json
{
  "name": "Chave de Producao",
  "type": "PRODUCTION"
}
```

**Tipos:** PRODUCTION, TEST, IMPORT, CUSTOM

**Response 201:**

```json
{
  "apiKey": {
    "id": "uuid",
    "name": "Chave de Producao",
    "key": "nuc_prod_xxxxxxxxxxxxxx",
    "type": "PRODUCTION",
    "status": "ACTIVE",
    "createdAt": "..."
  }
}
```

**Nota:** A chave completa so e exibida uma vez, no momento da criacao.

---

### Revogar chave

```
DELETE /api/system/api-keys/:id
Acesso: ADMIN
```

---

## Webhooks do Sistema

### Listar webhooks

```
GET /api/system/webhooks
Acesso: ADMIN
```

---

### Criar webhook

```
POST /api/system/webhooks
Acesso: ADMIN
```

**Request Body:**

```json
{
  "name": "Notificacao Discord",
  "url": "https://discord.com/api/webhooks/...",
  "events": ["user.created", "subscription.activated"],
  "secret": "chave-secreta-hmac"
}
```

---

### Atualizar webhook

```
PUT /api/system/webhooks/:id
Acesso: ADMIN
```

---

### Deletar webhook

```
DELETE /api/system/webhooks/:id
Acesso: ADMIN
```

---

### Testar webhook

```
POST /api/system/webhooks/:id/test
Acesso: ADMIN
```

**Notas:** Envia payload de teste para a URL configurada.

---

## Backups

### Listar backups

```
GET /api/system/backups
Acesso: ADMIN
```

**Response 200:**

```json
{
  "backups": [
    {
      "id": "uuid",
      "type": "AUTO",
      "status": "SUCCESS",
      "filename": "backup-2026-02-13.sql.gz",
      "size": 15000000,
      "createdAt": "..."
    }
  ]
}
```

---

### Obter agenda de backup

```
GET /api/system/backups/schedule
Acesso: ADMIN
```

---

### Atualizar agenda de backup

```
PUT /api/system/backups/schedule
Acesso: ADMIN
```

**Request Body:**

```json
{
  "enabled": true,
  "frequency": "daily",
  "time": "03:00",
  "retention": 30
}
```

---

## Perfil

### Obter perfil

```
GET /api/profile
Acesso: AUTH
```

---

### Atualizar perfil

```
PUT /api/profile
Acesso: AUTH
```

**Request Body:**

```json
{
  "name": "Novo Nome",
  "phone": "(11) 99999-9999",
  "bio": "Minha bio..."
}
```

---

### Atualizar preferencias

```
PUT /api/profile/preferences
Acesso: AUTH
```

**Request Body:**

```json
{
  "language": "pt-BR",
  "theme": "dark",
  "notifications": true
}
```

---

### Estatisticas do perfil

```
GET /api/profile/stats
Acesso: AUTH
```

**Response 200:**

```json
{
  "promptsCopied": 45,
  "promptsLiked": 20,
  "lessonsCompleted": 15,
  "coursesInProgress": 3
}
```

---

### Alterar senha

```
PUT /api/profile/password
Acesso: AUTH
```

**Request Body:**

```json
{
  "currentPassword": "senhaAtual",
  "newPassword": "novaSenha123"
}
```

---

### Atualizar avatar

```
PUT /api/profile/avatar
Acesso: AUTH
Content-Type: multipart/form-data
```

**Form Data:**

| Campo | Tipo | Descricao |
|---|---|---|
| avatar | File | Imagem JPG/PNG (max 5MB) |

---

## Upload

### Upload de imagem

```
POST /api/upload/image
Acesso: ADMIN
Content-Type: multipart/form-data
```

**Form Data:**

| Campo | Tipo | Limite |
|---|---|---|
| image | File | 15MB max |

**Formatos aceitos:** JPEG, PNG, GIF, WebP

**Response 200:**

```json
{
  "url": "/uploads/images/1707840000-imagem.jpg"
}
```

---

### Upload de thumbnail

```
POST /api/upload/thumbnail
Acesso: ADMIN
Content-Type: multipart/form-data
```

**Form Data:**

| Campo | Tipo | Limite |
|---|---|---|
| thumbnail | File | 10MB max |

---

### Upload de video

```
POST /api/upload/video
Acesso: ADMIN
Content-Type: multipart/form-data
```

**Form Data:**

| Campo | Tipo | Limite |
|---|---|---|
| video | File | 3GB max |

**Formatos aceitos:** MP4, WebM, QuickTime

---

## Sessoes

### Heartbeat

```
POST /api/sessions/heartbeat
Acesso: AUTH
```

**Notas:** Atualiza timestamp de ultima atividade da sessao. Deve ser chamado periodicamente pelo frontend.

---

### Sessoes ativas

```
GET /api/sessions/active
Acesso: AUTH
```

**Response 200:**

```json
{
  "sessions": [
    {
      "id": "uuid",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "lastActivity": "2026-02-13T...",
      "current": true
    }
  ]
}
```

---

### Encerrar sessao

```
DELETE /api/sessions/:id
Acesso: AUTH
```

**Notas:** Permite encerrar outras sessoes do proprio usuario.

---

## Webhooks de Pagamento

### Webhook Greenn

```
POST /api/webhooks/green
Acesso: Publico
```

**Notas:**
- Recebe eventos de compra/cancelamento da plataforma Greenn
- Valida assinatura HMAC-SHA256
- Eventos processados: compra aprovada, cancelamento, reembolso
- Cria/atualiza usuario e assinatura automaticamente

---

### Webhook Lastlink

```
POST /api/webhooks/lastlink
Acesso: Publico
```

**Notas:**
- Recebe eventos de assinatura da plataforma Lastlink
- Valida assinatura HMAC-SHA256
- Eventos processados: assinatura ativada, cancelada, expirada
- Cria usuario automaticamente se nao existir

---

## TOTP

### Gerar codigo

```
POST /api/totp/generate
Acesso: AUTH
```

**Response 200:**

```json
{
  "code": "123456",
  "expiresAt": "2026-02-13T12:05:00.000Z"
}
```

---

### Status do TOTP

```
GET /api/totp/status
Acesso: AUTH
```

---

### Codigo atual

```
GET /api/totp/code
Acesso: AUTH
```

---

### Configurar secret

```
PUT /api/totp/secret
Acesso: SUPER
```

**Request Body:**

```json
{
  "secret": "JBSWY3DPEHPK3PXP"
}
```

---

## Configuracoes de Pagina

### Obter configuracoes de pagina

```
GET /api/settings/page/:page
Acesso: AUTH
```

**Parametro `page`:** nome da pagina (ex: "dashboard", "prompts", "courses")

**Response 200:**

```json
{
  "settings": {
    "page": "dashboard",
    "config": { ... }
  }
}
```

---

### Atualizar configuracoes de pagina

```
PUT /api/settings/page/:page
Acesso: ADMIN
```

---

## Credenciais Compartilhadas

### Listar credenciais

```
GET /api/shared-credentials
Acesso: AUTH
```

**Response 200:**

```json
{
  "credentials": [
    {
      "id": "uuid",
      "name": "ChatGPT Plus",
      "value": "login@email.com / senha123",
      "description": "Conta compartilhada"
    }
  ]
}
```

---

### Atualizar credencial

```
PUT /api/shared-credentials/:id
Acesso: SUPER
```

---

## API Externa

Endpoints publicos acessiveis via chave de API. Destinados a integracao com sistemas externos.

**Base:** `/api/api/v1`
**Autenticacao:** Header `X-API-Key` ou query param `api_key`

### Listar prompts

```
GET /api/api/v1/prompts
Acesso: APIKEY
```

---

### Listar categorias

```
GET /api/api/v1/categories
Acesso: APIKEY
```

---

### Listar produtos

```
GET /api/api/v1/products
Acesso: APIKEY
```

---

### Listar cursos

```
GET /api/api/v1/courses
Acesso: APIKEY
```

---

### Estatisticas

```
GET /api/api/v1/stats
Acesso: APIKEY
```

---

## Health Check

```
GET /api/health
Acesso: Publico
```

**Response 200:**

```json
{
  "status": "ok",
  "timestamp": "2026-02-13T12:00:00.000Z",
  "uptime": 864000,
  "version": "4.0.0"
}
```

---

## Codigos de Erro

| Codigo | Descricao |
|---|---|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Requisicao invalida (dados faltando ou invalidos) |
| 401 | Nao autenticado (token ausente ou expirado) |
| 403 | Nao autorizado (permissao insuficiente) |
| 404 | Recurso nao encontrado |
| 409 | Conflito (ex: email ja cadastrado) |
| 413 | Arquivo muito grande |
| 429 | Muitas requisicoes (rate limit) |
| 500 | Erro interno do servidor |

**Formato de erro padrao:**

```json
{
  "error": "Mensagem descritiva do erro",
  "details": { ... }
}
```
