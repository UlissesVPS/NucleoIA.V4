# Seguranca - NucleoIA V4

## Informacoes Sensiveis

### O que NUNCA deve ir para o Git:
- `backend/.env` (credenciais de banco, JWT secrets)
- Senhas de usuarios
- Chaves SSH
- Tokens de API
- Backups de banco de dados

### Protecoes implementadas:
- `.gitignore` configurado para excluir todos os arquivos sensiveis
- `.env.example` disponivel como template (sem valores reais)

---

## Autenticacao

### JWT (JSON Web Tokens)
- **Access Token:** Expira em 15 minutos
- **Refresh Token:** Expira em 7 dias
- Tokens assinados com chaves secretas de 64 bytes
- Middleware `authenticate` valida token em todas as rotas protegidas

### Senhas
- Hash com **bcrypt** (salt rounds: 10)
- Migracao do Supabase (magic links) para bcrypt completada
- Senhas nunca armazenadas em texto plano

### Roles (Papeis)
- `SUPER_ADMIN` - Acesso total ao sistema
- `ADMIN` - Gestao de conteudo e membros
- `MEMBER` - Acesso ao conteudo da plataforma

---

## Webhooks

### Assinatura HMAC-SHA256
- Todos os webhooks assinados com `X-Webhook-Signature`
- Secret por webhook armazenado no banco
- Auto-desativacao apos 10 falhas consecutivas

### Lastlink
- Endpoint: `POST /api/webhooks/lastlink`
- Valida assinatura antes de processar

### Greenn
- Webhooks registrados no banco com secrets individuais

---

## Rede e Infraestrutura

### Nginx
- HTTPS com Let's Encrypt (auto-renovacao)
- Proxy reverso para backend (porta 3001)
- Headers de seguranca configurados
- Rate limiting via Nginx

### PM2
- Cluster mode (2 instancias)
- Restart automatico em caso de crash
- Log rotation configurado

### PostgreSQL
- Acesso apenas via localhost (sem porta exposta)
- Usuario dedicado `nucleoia_user` (sem acesso superuser)
- Backups automaticos diarios

---

## Monitoramento

### IP Tracking
- Registro de IP real de cada sessao (via `trust proxy`)
- Alerta automatico para usuarios com 2+ IPs diferentes
- Historico completo de IPs acessivel pelo admin

### Logs
- Logs de aplicacao em `/var/www/nucleoia/logs/app/`
- Logs Nginx em `/var/www/nucleoia/logs/nginx/`
- Logs de backup em `/var/www/nucleoia/logs/backup/`

---

## Backup e Recuperacao

### Backups automaticos
- Script: `/var/www/nucleoia/scripts/backup.sh`
- Retencao: 30 dias
- Local: `/var/www/nucleoia/backups/`

### Rollback
- Via tags Git: `git checkout v4.0.X`
- Via script: `/var/www/nucleoia/scripts/rollback.sh`
- Restauracao de banco: `/var/www/nucleoia/scripts/restore.sh`

---

## Boas Praticas

1. **Nunca** compartilhe credenciais via chat/email sem criptografia
2. **Sempre** use `.env` para variaveis sensiveis
3. **Nunca** faca log de senhas ou tokens
4. **Sempre** valide input do usuario no backend
5. **Nunca** confie em dados vindos do frontend (sempre validar no backend)
6. **Sempre** use HTTPS em producao
7. **Nunca** exponha stack traces em respostas de erro em producao
