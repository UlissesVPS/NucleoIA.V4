# Deployment - NucleoIA V4

## Infraestrutura

| Componente | Detalhes |
|-----------|----------|
| VPS | Hostinger (Ubuntu 22.04) |
| Dominio | painel.nucleoia.online |
| SSL | Let's Encrypt (auto-renovacao via Certbot) |
| Web Server | Nginx (HTTPS + proxy reverso) |
| App Server | PM2 (cluster mode, max instances) |
| Banco | PostgreSQL 16 (nativo, localhost only) |
| Node.js | v18+ |

---

## Estrutura de Arquivos

```
/var/www/nucleoia/
├── backend/
│   ├── src/             # Codigo fonte TypeScript
│   ├── dist/            # Build compilado (gitignored)
│   ├── uploads/         # Midia dos usuarios (gitignored)
│   ├── prisma/          # Schema do banco
│   ├── ecosystem.config.js  # Config PM2
│   └── .env             # Variaveis de ambiente (gitignored)
├── frontend/
│   ├── src/             # Codigo fonte React
│   └── dist/            # Build de producao (gitignored)
├── scripts/
│   ├── deploy.sh        # Deploy seguro (backup + pull + build + restart)
│   ├── backup.sh        # Backup (full/db/files/config/pre-deploy/daily)
│   ├── rollback.sh      # Rollback para ultimo backup pre-deploy
│   ├── restore.sh       # Restaurar backup especifico
│   └── health-check.sh  # Verificar saude do sistema
├── backups/             # Backups compactados (gitignored)
├── logs/                # Logs da aplicacao (gitignored)
│   ├── app/             # Logs PM2
│   ├── nginx/           # Logs Nginx
│   └── backup/          # Logs de backup
└── docs/                # Documentacao
```

---

## Deploy (Padrao)

### Via script automatizado:
```bash
cd /var/www/nucleoia
bash scripts/deploy.sh
```

O script `deploy.sh` executa:
1. Backup pre-deploy automatico
2. `git pull origin main`
3. `npm install --production` (se package.json mudou)
4. `npx prisma db push` (se schema mudou)
5. `npm run build` (backend)
6. `pm2 reload nucleoia-api`
7. Health check automatico
8. Oferece rollback se falhar

### Deploy manual:
```bash
# Backend
cd /var/www/nucleoia/backend
npm run build
pm2 restart nucleoia-api

# Frontend
cd /var/www/nucleoia/frontend
npm run build

# Ambos
cd /var/www/nucleoia
bash scripts/deploy.sh
```

---

## PM2

### ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'nucleoia-api',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production' },
    error_file: '/var/www/nucleoia/logs/app/error.log',
    out_file: '/var/www/nucleoia/logs/app/out.log',
    log_file: '/var/www/nucleoia/logs/app/combined.log',
    time: true,
  }],
};
```

### Comandos PM2:
```bash
pm2 status                          # Ver status
pm2 restart nucleoia-api            # Restart
pm2 reload nucleoia-api             # Reload graceful (zero downtime)
pm2 logs nucleoia-api --lines 50    # Ver logs
pm2 monit                           # Monitor em tempo real
```

---

## Nginx

Arquivo: `/etc/nginx/sites-available/nucleoia`

### Configuracao principal:
- **HTTP :80** -> redireciona para HTTPS
- **HTTPS :443** -> SSL com Let's Encrypt
- **`/`** -> Serve `frontend/dist/` (React SPA com fallback para index.html)
- **`/api/`** -> Proxy para `localhost:3001` (Express)
- **`/uploads/`** -> Alias para `backend/uploads/` (arquivos estaticos)

### Seguranca:
- Rate limiting: 10 req/s com burst de 20
- Headers: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- Arquivos ocultos bloqueados (deny all)

### Limites:
- `client_max_body_size 3G` (para upload de videos)
- `proxy_read_timeout 600s` (para uploads grandes)

### Comandos Nginx:
```bash
nginx -t                    # Testar configuracao
systemctl reload nginx      # Recarregar
systemctl restart nginx     # Reiniciar
```

---

## Backup e Rollback

### Tipos de backup:
```bash
bash scripts/backup.sh full        # Completo (DB + uploads + config)
bash scripts/backup.sh db          # Apenas banco
bash scripts/backup.sh files       # Apenas uploads
bash scripts/backup.sh config      # Apenas configs (.env, nginx, schema)
bash scripts/backup.sh pre-deploy  # Antes de deploy (automatico no deploy.sh)
bash scripts/backup.sh daily       # Diario (cron)
bash scripts/backup.sh migration   # Antes de migracao
```

### Rollback:
```bash
bash scripts/rollback.sh    # Restaura ultimo backup pre-deploy
```

### Retencao:
- Backups mantidos por 30 dias
- Limpeza automatica de backups antigos

---

## SSL (Let's Encrypt)

```bash
# Renovar manualmente
certbot renew

# Verificar certificado
certbot certificates

# Auto-renovacao: configurada via cron/systemd timer
```

---

## Health Check

```bash
# Via curl
curl -s http://localhost:3001/api/health
# Resposta: {"status":"ok","timestamp":"..."}

# Via script
bash scripts/health-check.sh
```

---

## Variaveis de Ambiente

Arquivo: `backend/.env` (template em `backend/.env.example`)

| Variavel | Descricao |
|----------|-----------|
| PORT | Porta do Express (3001) |
| DATABASE_URL | String de conexao PostgreSQL |
| JWT_SECRET | Secret do access token (64 bytes) |
| JWT_REFRESH_SECRET | Secret do refresh token (64 bytes) |
| FRONTEND_URL | URL do frontend para CORS |
| UPLOAD_PATH | Caminho para uploads |
| BACKUP_PATH | Caminho para backups |

---

## Troubleshooting

```bash
# Backend nao responde
pm2 logs nucleoia-api --lines 100 --err
pm2 restart nucleoia-api

# Nginx erro 502
systemctl status nginx
nginx -t
systemctl restart nginx

# Banco inacessivel
systemctl status postgresql
sudo -u postgres psql -c "SELECT 1;"

# Disco cheio
df -h
du -sh /var/www/nucleoia/backend/uploads/
du -sh /var/www/nucleoia/backups/

# Verificar portas
ss -tlnp | grep -E '3001|5432|443|80'
```
