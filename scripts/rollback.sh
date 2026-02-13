#!/bin/bash
#===============================================================================
# Nucleo IA v4 - Rollback Rapido
# Restaura automaticamente o ultimo backup pre-deploy
#===============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="/var/www/nucleoia"
BACKUP_ROOT="${PROJECT_ROOT}/backups"
PRE_DEPLOY_DIR="${BACKUP_ROOT}/pre-deploy"

log_info() { echo -e "${BLUE}i${NC} $1"; }
log_success() { echo -e "${GREEN}+${NC} $1"; }
log_warning() { echo -e "${YELLOW}!${NC} $1"; }
log_error() { echo -e "${RED}x${NC} $1"; }

echo ""
echo "================================================================"
echo "  NUCLEO IA v4 - ROLLBACK RAPIDO"
echo "================================================================"
echo ""

LATEST_BACKUP=$(ls -t "${PRE_DEPLOY_DIR}"/*.tar.gz 2>/dev/null | head -1)

if [ -z "${LATEST_BACKUP}" ]; then
    log_error "Nenhum backup pre-deploy encontrado em ${PRE_DEPLOY_DIR}"
    echo ""
    echo "Backups disponiveis em outros diretorios:"
    find "${BACKUP_ROOT}" -name "*.tar.gz" -type f | head -5
    echo ""
    exit 1
fi

BACKUP_NAME=$(basename "${LATEST_BACKUP}")
BACKUP_DATE=$(stat -c %y "${LATEST_BACKUP}" | cut -d'.' -f1)

echo "Ultimo backup pre-deploy encontrado:"
echo "  Arquivo: ${BACKUP_NAME}"
echo "  Data: ${BACKUP_DATE}"
echo "  Tamanho: $(du -h "${LATEST_BACKUP}" | cut -f1)"
echo ""

echo -e "${YELLOW}! ATENCAO: Isto ira restaurar o sistema ao estado anterior ao ultimo deploy!${NC}"
echo ""
read -p "Confirmar rollback? (digite 'ROLLBACK' para confirmar): " confirm

if [ "${confirm}" != "ROLLBACK" ]; then
    log_info "Rollback cancelado"
    exit 0
fi

echo ""
log_info "Iniciando rollback..."

bash "${PROJECT_ROOT}/scripts/restore.sh" "${LATEST_BACKUP}"

echo ""
echo "================================================================"
echo -e "  ${GREEN}+ ROLLBACK CONCLUIDO${NC}"
echo "  Sistema restaurado ao estado de: ${BACKUP_DATE}"
echo "================================================================"
echo ""
