# NucleoIA V4 - Area de Membros

Plataforma completa de area de membros para gestao de prompts de IA, cursos, ferramentas e produtos digitais.

**Dominio:** [painel.nucleoia.online](https://painel.nucleoia.online)

---

## Sumario

- [Visao Geral](#visao-geral)
- [Stack Tecnologica](#stack-tecnologica)
- [Inicio Rapido](#inicio-rapido)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Documentacao](#documentacao)
- [Scripts Uteis](#scripts-uteis)
- [Equipe](#equipe)

---

## Visao Geral

O NucleoIA V4 e uma plataforma SaaS de area de membros projetada para entregar conteudo digital com foco em inteligencia artificial. O sistema oferece:

- Gestao de prompts de IA com categorias, likes e sistema de copia
- Biblioteca de ferramentas de IA catalogadas por categoria
- Cursos com modulos e aulas (video + texto)
- Loja de produtos digitais (cursos, ebooks, mentorias, templates)
- Painel administrativo completo
- Integracao com plataformas de pagamento (Greenn, Lastlink)
- Sistema de autenticacao robusto (JWT + refresh token + magic link)
- API externa com chaves de acesso
- Sistema de backups automatizados
- Monitoramento de IPs e sessoes
- Internacionalizacao (pt-BR, en, es)

---

## Stack Tecnologica

### Frontend
| Tecnologia | Versao | Uso |
|---|---|---|
| React | 18 | Framework UI |
| Vite | 5 | Build tool |
| TailwindCSS | 3 | Estilizacao |
| shadcn/ui | - | Componentes UI |
| React Query | 5 | Gerenciamento de estado servidor |
| React Router | 6 | Roteamento SPA |
| i18next | - | Internacionalizacao |

### Backend
| Tecnologia | Versao | Uso |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express | 4 | Framework HTTP |
| Prisma | 5 | ORM |
| PostgreSQL | 16 | Banco de dados |
| JWT | - | Autenticacao |
| Multer | - | Upload de arquivos |

### Infraestrutura
| Tecnologia | Uso |
|---|---|
| Nginx | Proxy reverso + SSL |
| PM2 | Gerenciador de processos (cluster mode) |
| Let's Encrypt | Certificado SSL |
| Hostinger VPS | Hospedagem |
| GitHub | Repositorio de codigo |

---

## Inicio Rapido

### Pre-requisitos

- Node.js 20 LTS
- PostgreSQL 16
- npm ou yarn

### 1. Clonar o repositorio

```bash
git clone https://github.com/UlissesVPS/NucleoIA.V4.git
cd NucleoIA.V4
```

### 2. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configurar variaveis de ambiente

```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env com suas credenciais

# Frontend
cp frontend/.env.example frontend/.env
# Editar frontend/.env com a URL da API
```

Variaveis obrigatorias do backend:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nucleoia"
JWT_SECRET="sua-chave-secreta"
JWT_REFRESH_SECRET="sua-chave-refresh"
FRONTEND_URL="http://localhost:5173"
PORT=3001
```

### 4. Configurar banco de dados

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### 5. Build e execucao

```bash
# Desenvolvimento
cd backend && npm run dev    # API em http://localhost:3001
cd frontend && npm run dev   # App em http://localhost:5173

# Producao
cd backend && npm run build && pm2 start ecosystem.config.js
cd frontend && npm run build  # Servir dist/ via Nginx
```

---

## Estrutura do Projeto

```
NucleoIA.V4/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Schema do banco de dados
│   │   ├── migrations/         # Migracoes do Prisma
│   │   └── seed.ts             # Seed inicial
│   ├── src/
│   │   ├── routes/             # Definicao de rotas Express
│   │   ├── controllers/        # Logica dos endpoints
│   │   ├── middleware/          # Auth, upload, rate-limit
│   │   ├── services/           # Logica de negocio
│   │   ├── utils/              # Utilitarios (jwt, email, etc)
│   │   └── server.ts           # Ponto de entrada
│   ├── uploads/                # Arquivos enviados
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Componentes React reutilizaveis
│   │   ├── pages/              # Paginas da aplicacao
│   │   ├── hooks/              # Hooks customizados (useApi, etc)
│   │   ├── lib/                # Utilitarios e configuracoes
│   │   ├── i18n/               # Arquivos de traducao
│   │   └── App.tsx             # Roteamento principal
│   ├── dist/                   # Build de producao
│   └── package.json
├── docs/                       # Documentacao completa
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── WEBHOOKS.md
│   ├── FEATURES.md
│   └── CHANGELOG.md
├── scripts/                    # Scripts de deploy/backup
│   ├── deploy.sh
│   ├── backup.sh
│   ├── rollback.sh
│   ├── health-check.sh
│   └── restore.sh
└── README.md                   # Este arquivo
```

---

## Documentacao

| Documento | Descricao |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura tecnica completa |
| [API.md](docs/API.md) | Documentacao de todos os endpoints da API |
| [DATABASE.md](docs/DATABASE.md) | Schema do banco, modelos e enums |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Guia de deploy e configuracao do servidor |
| [WEBHOOKS.md](docs/WEBHOOKS.md) | Integracoes com Greenn e Lastlink |
| [FEATURES.md](docs/FEATURES.md) | Lista completa de funcionalidades |
| [CHANGELOG.md](docs/CHANGELOG.md) | Historico de alteracoes |

---

## Scripts Uteis

```bash
# Deploy completo
./scripts/deploy.sh

# Backup do banco de dados
./scripts/backup.sh

# Rollback para versao anterior
./scripts/rollback.sh

# Verificacao de saude do sistema
./scripts/health-check.sh

# Restaurar backup
./scripts/restore.sh [arquivo.sql.gz]
```

---

## Equipe

Projeto desenvolvido e mantido pela equipe NucleoIA.

- **Repositorio:** [github.com/UlissesVPS/NucleoIA.V4](https://github.com/UlissesVPS/NucleoIA.V4)
- **Producao:** [painel.nucleoia.online](https://painel.nucleoia.online)

---

## Licenca

Projeto proprietario. Todos os direitos reservados.
