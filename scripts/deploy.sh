#!/bin/bash
#===============================================================================
# Nucleo IA v4 - Deploy Seguro
# Faz backup automatico antes de atualizar
#===============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="/var/www/nucleoia"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

log_info() { echo -e "${BLUE}i${NC} $1"; }
log_success() { echo -e "${GREEN}+${NC} $1"; }
log_warning() { echo -e "${YELLOW}!${NC} $1"; }
log_error() { echo -e "${RED}x${NC} $1"; }

echo ""
echo "================================================================"
echo "  NUCLEO IA v4 - DEPLOY SEGURO"
echo "  $(date)"
echo "================================================================"
echo ""

# 1. Backup pre-deploy
log_info "Etapa 1/6: Criando backup pre-deploy..."
bash "${PROJECT_ROOT}/scripts/backup.sh" pre-deploy

if [ $? -ne 0 ]; then
    log_error "Falha no backup pre-deploy. Deploy cancelado."
    exit 1
fi

# 2. Git pull
log_info "Etapa 2/6: Atualizando codigo do repositorio..."
cd "${PROJECT_ROOT}"
git fetch origin
git pull origin main

if [ $? -ne 0 ]; then
    log_error "Falha no git pull"
    echo ""
    read -p "Deseja fazer rollback? (s/N): " rollback
    if [ "${rollback}" = "s" ] || [ "${rollback}" = "S" ]; then
        bash "${PROJECT_ROOT}/scripts/rollback.sh"
    fi
    exit 1
fi

log_success "Codigo atualizado"

# 3. Instalar dependencias do backend (se necessario)
log_info "Etapa 3/6: Verificando dependencias do backend..."
cd "${BACKEND_DIR}"

if [ package.json -nt node_modules ] || [ ! -d node_modules ]; then
    log_info "Instalando dependencias..."
    npm install --production
else
    log_info "Dependencias ja atualizadas"
fi

# 4. Sincronizar banco (se schema mudou)
log_info "Etapa 4/6: Verificando schema do banco..."
if [ prisma/schema.prisma -nt node_modules/.prisma ]; then
    log_info "Sincronizando schema do banco..."
    npx prisma db push --accept-data-loss
    npx prisma generate
    log_success "Schema sincronizado"
else
    log_info "Schema ja sincronizado"
fi

# 5. Build do backend
log_info "Etapa 5/6: Build do backend..."
npm run build

if [ $? -ne 0 ]; then
    log_error "Falha no build do backend"
    echo ""
    read -p "Deseja fazer rollback? (s/N): " rollback
    if [ "${rollback}" = "s" ] || [ "${rollback}" = "S" ]; then
        bash "${PROJECT_ROOT}/scripts/rollback.sh"
    fi
    exit 1
fi

log_success "Build concluido"

# 6. Reiniciar PM2
log_info "Etapa 6/6: Reiniciando aplicacao..."
pm2 reload nucleoia-api

if [ $? -ne 0 ]; then
    log_error "Falha ao reiniciar PM2"
    pm2 restart nucleoia-api || true
fi

sleep 5

log_info "Verificando saude da aplicacao..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null)

if [ "${HEALTH_STATUS}" = "200" ]; then
    log_success "Aplicacao saudavel"
else
    log_warning "Aplicacao pode nao estar respondendo corretamente (HTTP ${HEALTH_STATUS})"
    echo ""
    echo "Verificando logs..."
    pm2 logs nucleoia-api --lines 20 --nostream
    echo ""
    read -p "Deseja fazer rollback? (s/N): " rollback
    if [ "${rollback}" = "s" ] || [ "${rollback}" = "S" ]; then
        bash "${PROJECT_ROOT}/scripts/rollback.sh"
    fi
fi

echo ""
echo "================================================================"
echo -e "  ${GREEN}+ DEPLOY CONCLUIDO COM SUCESSO${NC}"
echo "  Um backup pre-deploy foi criado automaticamente."
echo "  Para rollback: bash ${PROJECT_ROOT}/scripts/rollback.sh"
echo "================================================================"
echo ""
