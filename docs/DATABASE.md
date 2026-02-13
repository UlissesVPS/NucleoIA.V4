# Database - NucleoIA V4

ORM: **Prisma** | Banco: **PostgreSQL 16** (nativo, nao Docker)

---

## Conexao

```
Host: localhost
Port: 5432
Database: nucleoia_db
User: nucleoia_user
```

Acesso via terminal: `sudo -u postgres psql -d nucleoia_db`

---

## Enums

| Enum | Valores |
|------|---------|
| Role | SUPER_ADMIN, ADMIN, MEMBER |
| Plan | MENSAL, TRIMESTRAL, SEMESTRAL |
| SubscriptionStatus | ACTIVE, INACTIVE, SUSPENDED, PENDING, EXPIRED, CANCELED |
| PromptType | IMAGE, VIDEO |
| AIToolCategory | TEXT, VIDEO, IMAGE, VOICE, DESIGN, EDITING, PRESENTATIONS |
| ProductCategory | CURSO, EBOOK, MENTORIA, TEMPLATE |
| ActivityType | LOGIN, LOGOUT, TWO_FA, PROMPT, COPY, LESSON, SUSPEND, ADMIN, SYSTEM, BACKUP |
| ApiKeyType | PRODUCTION, TEST, IMPORT, CUSTOM |
| ApiKeyStatus | ACTIVE, REVOKED |
| WebhookStatus | ACTIVE, PAUSED, ERROR |
| BackupType | AUTO, MANUAL |
| BackupStatus | SUCCESS, FAILED, IN_PROGRESS |

---

## Modelos (21 tabelas)

### users
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| email | String | Unique |
| password_hash | String | bcrypt |
| name | String | |
| role | Role | default: MEMBER |
| avatar_url | String? | |
| is_active | Boolean | default: true |
| needs_password_reset | Boolean | default: false |
| first_access_token | String? | Unique, para primeiro acesso |
| first_access_expires | DateTime? | |
| greenn_client_id | String? | ID do cliente no Greenn |
| language | String | default: pt-BR |
| theme | String | default: dark |
| notify_* | Boolean | 7 campos de preferencia de notificacao |
| phone | String? | |
| location | String? | |
| admin_notes | String? | |

Relacoes: 1--1 Subscription, 1--N Session, Prompt, PromptLike, LessonProgress, ActivityLog, TotpCode

### subscriptions
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK users, Unique (1:1) |
| plan | Plan | default: MENSAL |
| status | SubscriptionStatus | default: ACTIVE |
| started_at | DateTime | |
| expires_at | DateTime? | |
| payment_gateway | String? | lastlink, greenn, etc |
| external_id | String? | ID na plataforma de pagamento |

### sessions
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK users |
| token | String | Unique (refresh token) |
| ip | String | IP real via trust proxy |
| user_agent | String? | |
| device, browser | String? | Detectados no login |
| city, state | String? | Geolocalizacao |
| current_page | String? | Pagina atual (heartbeat) |
| is_active | Boolean | |
| connected_at | DateTime | |
| last_activity | DateTime | Atualizado no heartbeat |
| expires_at | DateTime | |

### categories
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| name | String | Unique |
| slug | String | Unique |
| prompt_count | Int | Contador desnormalizado |

### prompts
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| title | String | |
| type | PromptType | IMAGE ou VIDEO |
| category_id | UUID | FK categories |
| content | String | Conteudo do prompt |
| description | String? | |
| thumbnail_url | String? | URL local (/uploads/thumbnails/*.webp) |
| media_url | String? | |
| tags | String[] | Array PostgreSQL |
| likes | Int | Contador desnormalizado |
| author_id | UUID | FK users |
| is_community | Boolean | Prompt criado por usuario |

### prompt_likes
Unique constraint: (user_id, prompt_id) - impede curtidas duplicadas.

### ai_tools
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| name | String | |
| description | String | |
| image_url | String | |
| category | AIToolCategory | |
| unlimited | Boolean | Se o acesso e ilimitado |
| access_url | String? | URL da ferramenta |
| is_active | Boolean | |
| order | Int | Ordem de exibicao |

### courses / modules / lessons
Hierarquia: Course 1--N Module 1--N Lesson

- **courses:** title, description, thumbnail, total_duration, is_published, is_new, order, icon_type, color, is_featured
- **modules:** course_id (FK), title, description, order
- **lessons:** module_id (FK), title, description, video_url, thumbnail, duration, duration_seconds, order

### lesson_progress
Unique constraint: (user_id, lesson_id). Campos: completed, progress_pct, completed_at.

### products
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| title, description | String | |
| image_url | String | |
| price | Decimal(10,2) | |
| original_price | Decimal(10,2)? | Preco antes do desconto |
| discount | Int? | Percentual |
| features | Json | Array de features |
| category | ProductCategory | |
| is_featured | Boolean | |
| sales_count | Int | |
| rating | Decimal(2,1) | |
| purchase_url | String? | URL de compra |
| full_description | Text? | |
| video_url | String? | |
| is_active | Boolean | |
| order | Int | |

### activity_logs
Indices: created_at, type. Campos: user_id (nullable FK), type (ActivityType), description, ip_address, metadata (Json).

### api_keys
Campos: name, key_hash (bcrypt do key), key_prefix (primeiros chars para identificacao), type, permissions (Json), status, expires_at.

### webhooks
Campos: name, url, event, secret, status, last_status (HTTP code), last_fired, failures (auto-desativa em 10+), headers (Json custom).

### totp_codes
Campos: user_id (FK), tool_name, secret. Para TOTP de ferramentas compartilhadas.

### backup_records
Campos: name, filename, type (AUTO/MANUAL), status, size_bytes (BigInt), components (Json), log (Json), duration_secs.

### backup_schedule
Campos: enabled, frequency, hour, minute, weekday, components (Json), retention (dias), notify_email, email.

### news / news_config
- **news:** title, content (Text), image_url, is_published, published_at
- **news_config:** auto_show_on_login, display_days

### shared_credentials
Campos: service_name, login_url, username, password, notes (Text), totp_secret, is_active.

### page_settings
Campos: page (Unique), cover_image_url, banner_title, banner_subtitle, use_featured_fallback.

---

## Comandos Uteis

```bash
# Gerar Prisma Client
cd backend && npx prisma generate

# Sincronizar schema com banco
cd backend && npx prisma db push

# Abrir Prisma Studio (GUI)
cd backend && npx prisma studio

# Consultar contagens
sudo -u postgres psql -d nucleoia_db -c "
  SELECT
    (SELECT COUNT(*) FROM users) as usuarios,
    (SELECT COUNT(*) FROM users WHERE is_active=true) as ativos,
    (SELECT COUNT(*) FROM prompts) as prompts,
    (SELECT COUNT(*) FROM courses) as cursos,
    (SELECT COUNT(*) FROM products) as produtos;
"
```
