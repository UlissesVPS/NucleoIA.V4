#!/bin/bash
#===============================================================================
# Nucleo IA v4 - Health Check
# Verifica todos os componentes do sistema
#===============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="/var/www/nucleoia"

if [ -f "/root/.env.nucleoia" ]; then
    source /root/.env.nucleoia
elif [ -f "${PROJECT_ROOT}/backend/.env" ]; then
    export $(grep -v '^#' ${PROJECT_ROOT}/backend/.env | xargs)
fi

DB_NAME="${DB_NAME:-nucleoia_db}"
DB_USER="${DB_USER:-nucleoia_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

check_pass() { echo -e "  ${GREEN}+${NC} $1"; }
check_fail() { echo -e "  ${RED}x${NC} $1"; ERRORS=$((ERRORS + 1)); }
check_warn() { echo -e "  ${YELLOW}!${NC} $1"; WARNINGS=$((WARNINGS + 1)); }

ERRORS=0
WARNINGS=0

echo ""
echo "================================================================"
echo "  NUCLEO IA v4 - HEALTH CHECK"
echo "  $(date)"
echo "================================================================"
echo ""

# 1. PostgreSQL
echo ">> PostgreSQL"
if systemctl is-active --quiet postgresql; then
    check_pass "Servico PostgreSQL ativo"
else
    check_fail "Servico PostgreSQL inativo"
fi

if PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1;" > /dev/null 2>&1; then
    check_pass "Conexao com banco OK"

    USER_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    echo "      Usuarios no banco: ${USER_COUNT}"
else
    check_fail "Nao foi possivel conectar ao banco"
fi

echo ""

# 2. Nginx
echo ">> Nginx"
if systemctl is-active --quiet nginx; then
    check_pass "Servico Nginx ativo"
else
    check_fail "Servico Nginx inativo"
fi

if nginx -t 2>/dev/null; then
    check_pass "Configuracao Nginx valida"
else
    check_fail "Configuracao Nginx com erros"
fi

echo ""

# 3. PM2 / Node.js
echo ">> PM2 / Node.js"
if command -v pm2 &> /dev/null; then
    check_pass "PM2 instalado"
else
    check_fail "PM2 nao encontrado"
fi

PM2_STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import sys,json
apps=json.load(sys.stdin)
nucleoia=[a for a in apps if a['name']=='nucleoia-api']
print(nucleoia[0]['pm2_env']['status'] if nucleoia else 'not_found')
" 2>/dev/null)

if [ "${PM2_STATUS}" = "online" ]; then
    check_pass "Aplicacao nucleoia-api online"

    INSTANCES=$(pm2 jlist 2>/dev/null | python3 -c "
import sys,json
apps=json.load(sys.stdin)
print(len([a for a in apps if a['name']=='nucleoia-api']))
" 2>/dev/null)
    echo "      Instancias ativas: ${INSTANCES}"
elif [ "${PM2_STATUS}" = "not_found" ]; then
    check_fail "Aplicacao nucleoia-api nao encontrada no PM2"
else
    check_fail "Aplicacao nucleoia-api com status: ${PM2_STATUS}"
fi

echo ""

# 4. API
echo ">> API"
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null)
if [ "${API_HEALTH}" = "200" ]; then
    check_pass "API respondendo (HTTP 200)"
else
    check_fail "API nao respondendo (HTTP ${API_HEALTH})"
fi

HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://painel.nucleoia.online/api/health 2>/dev/null)
if [ "${HTTPS_STATUS}" = "200" ]; then
    check_pass "API via HTTPS OK"
else
    check_warn "API via HTTPS retornou HTTP ${HTTPS_STATUS}"
fi

echo ""

# 5. SSL
echo ">> SSL/TLS"
SSL_EXPIRY=$(echo | openssl s_client -servername painel.nucleoia.online -connect painel.nucleoia.online:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "${SSL_EXPIRY}" ]; then
    check_pass "Certificado SSL valido"
    echo "      Expira em: ${SSL_EXPIRY}"

    EXPIRY_EPOCH=$(date -d "${SSL_EXPIRY}" +%s 2>/dev/null)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

    if [ ${DAYS_LEFT} -lt 30 ]; then
        check_warn "Certificado expira em ${DAYS_LEFT} dias!"
    fi
else
    check_fail "Nao foi possivel verificar certificado SSL"
fi

echo ""

# 6. Disco
echo ">> Espaco em Disco"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')

if [ ${DISK_USAGE} -lt 80 ]; then
    check_pass "Uso de disco: ${DISK_USAGE}% (${DISK_AVAILABLE} disponivel)"
elif [ ${DISK_USAGE} -lt 90 ]; then
    check_warn "Uso de disco: ${DISK_USAGE}% (${DISK_AVAILABLE} disponivel)"
else
    check_fail "Uso de disco CRITICO: ${DISK_USAGE}% (${DISK_AVAILABLE} disponivel)"
fi

BACKUP_SIZE=$(du -sh "${PROJECT_ROOT}/backups" 2>/dev/null | cut -f1)
echo "      Backups ocupando: ${BACKUP_SIZE}"

echo ""

# 7. Memoria
echo ">> Memoria"
MEM_TOTAL=$(free -h | awk '/^Mem:/ {print $2}')
MEM_USED=$(free -h | awk '/^Mem:/ {print $3}')
MEM_PCT=$(free | awk '/^Mem:/ {printf "%.0f", $3/$2 * 100}')

if [ ${MEM_PCT} -lt 80 ]; then
    check_pass "Uso de memoria: ${MEM_PCT}% (${MEM_USED}/${MEM_TOTAL})"
elif [ ${MEM_PCT} -lt 90 ]; then
    check_warn "Uso de memoria: ${MEM_PCT}% (${MEM_USED}/${MEM_TOTAL})"
else
    check_fail "Uso de memoria CRITICO: ${MEM_PCT}% (${MEM_USED}/${MEM_TOTAL})"
fi

echo ""

# 8. Firewall
echo ">> Firewall"
if ufw status 2>/dev/null | grep -q "Status: active"; then
    check_pass "UFW ativo"
else
    check_warn "UFW nao esta ativo"
fi

echo ""

# 9. Backups
echo ">> Backups"
LATEST_BACKUP=$(find "${PROJECT_ROOT}/backups/" -name "*.tar.gz" -type f 2>/dev/null | sort -r | head -1)
if [ -n "${LATEST_BACKUP}" ]; then
    BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "${LATEST_BACKUP}")) / 3600 ))
    BACKUP_NAME=$(basename "${LATEST_BACKUP}")

    if [ ${BACKUP_AGE} -lt 24 ]; then
        check_pass "Ultimo backup: ${BACKUP_AGE}h atras (${BACKUP_NAME})"
    elif [ ${BACKUP_AGE} -lt 48 ]; then
        check_warn "Ultimo backup: ${BACKUP_AGE}h atras (${BACKUP_NAME})"
    else
        check_fail "Ultimo backup: ${BACKUP_AGE}h atras! (${BACKUP_NAME})"
    fi
else
    check_fail "Nenhum backup encontrado"
fi

echo ""
echo "================================================================"

if [ ${ERRORS} -eq 0 ] && [ ${WARNINGS} -eq 0 ]; then
    echo -e "  ${GREEN}+ SISTEMA SAUDAVEL${NC}"
elif [ ${ERRORS} -eq 0 ]; then
    echo -e "  ${YELLOW}! SISTEMA OK COM ${WARNINGS} AVISO(S)${NC}"
else
    echo -e "  ${RED}x SISTEMA COM ${ERRORS} ERRO(S) E ${WARNINGS} AVISO(S)${NC}"
fi

echo "================================================================"
echo ""

exit ${ERRORS}
