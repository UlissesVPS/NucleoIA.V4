#!/bin/bash
#===============================================================================
# Nucleo IA v4 - Script de Restore
# Uso: bash restore.sh <arquivo_backup.tar.gz>
#===============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="/var/www/nucleoia"
BACKUP_ROOT="${PROJECT_ROOT}/backups"
LOG_DIR="${PROJECT_ROOT}/logs/backup"
TEMP_DIR="/tmp/nucleoia_restore_$$"

if [ -f "/root/.env.nucleoia" ]; then
    source /root/.env.nucleoia
elif [ -f "${PROJECT_ROOT}/backend/.env" ]; then
    export $(grep -v '^#' ${PROJECT_ROOT}/backend/.env | xargs)
fi

DB_NAME="${DB_NAME:-nucleoia_db}"
DB_USER="${DB_USER:-nucleoia_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

log_info() { echo -e "${BLUE}i${NC} $1"; }
log_success() { echo -e "${GREEN}+${NC} $1"; }
log_warning() { echo -e "${YELLOW}!${NC} $1"; }
log_error() { echo -e "${RED}x${NC} $1"; }

cleanup() {
    if [ -d "${TEMP_DIR}" ]; then
        rm -rf "${TEMP_DIR}"
    fi
}

trap cleanup EXIT

verify_backup() {
    local backup_file=$1

    if [ ! -f "${backup_file}" ]; then
        log_error "Arquivo de backup nao encontrado: ${backup_file}"
        exit 1
    fi

    if [[ ! "${backup_file}" =~ \.tar\.gz$ ]]; then
        log_error "Arquivo deve ser .tar.gz"
        exit 1
    fi

    log_success "Arquivo de backup verificado"
}

extract_backup() {
    local backup_file=$1

    mkdir -p "${TEMP_DIR}"

    log_info "Extraindo backup..."
    tar -xzf "${backup_file}" -C "${TEMP_DIR}"

    EXTRACTED_DIR=$(find "${TEMP_DIR}" -maxdepth 1 -type d -name "backup_*" | head -1)

    if [ -z "${EXTRACTED_DIR}" ]; then
        log_error "Estrutura de backup invalida"
        exit 1
    fi

    log_success "Backup extraido"
    echo "${EXTRACTED_DIR}"
}

show_backup_info() {
    local backup_dir=$1

    echo ""
    echo "================================================================"
    echo "  INFORMACOES DO BACKUP"
    echo "================================================================"

    if [ -f "${backup_dir}/metadata.json" ]; then
        cat "${backup_dir}/metadata.json" | python3 -m json.tool 2>/dev/null || cat "${backup_dir}/metadata.json"
    fi

    echo ""
    echo "Conteudo:"
    [ -d "${backup_dir}/database" ] && echo "  + Banco de dados"
    [ -d "${backup_dir}/uploads" ] && echo "  + Arquivos de upload"
    [ -d "${backup_dir}/config" ] && echo "  + Configuracoes"
    echo ""
}

pre_restore_backup() {
    log_info "Criando backup de seguranca antes do restore..."

    bash "${PROJECT_ROOT}/scripts/backup.sh" full

    if [ $? -eq 0 ]; then
        log_success "Backup de seguranca criado"
    else
        log_error "Falha ao criar backup de seguranca"
        exit 1
    fi
}

restore_database() {
    local backup_dir=$1
    local db_backup="${backup_dir}/database/${DB_NAME}.custom"

    if [ ! -f "${db_backup}" ]; then
        log_warning "Backup do banco nao encontrado, pulando..."
        return 0
    fi

    log_info "Restaurando banco de dados..."

    pm2 stop nucleoia-api 2>/dev/null || true

    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" 2>/dev/null || true

    PGPASSWORD="${DB_PASSWORD}" pg_restore \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        "${db_backup}" 2>> "${LOG_DIR}/restore.log"

    if [ $? -eq 0 ]; then
        log_success "Banco de dados restaurado"
    else
        log_warning "Restore concluido com alguns avisos (verifique ${LOG_DIR}/restore.log)"
    fi

    pm2 start nucleoia-api 2>/dev/null || true
}

restore_files() {
    local backup_dir=$1
    local files_backup="${backup_dir}/uploads"
    local uploads_dest="${PROJECT_ROOT}/backend/uploads"

    if [ ! -d "${files_backup}" ] || [ -f "${files_backup}/.empty" ]; then
        log_info "Sem arquivos para restaurar"
        return 0
    fi

    log_info "Restaurando arquivos..."

    mkdir -p "${uploads_dest}"
    cp -r "${files_backup}"/* "${uploads_dest}/" 2>/dev/null || true

    chown -R www-data:www-data "${uploads_dest}" 2>/dev/null || true
    chmod -R 755 "${uploads_dest}"

    local file_count=$(find "${uploads_dest}" -type f | wc -l)
    log_success "Arquivos restaurados: ${file_count} arquivos"
}

restore_config() {
    local backup_dir=$1
    local config_backup="${backup_dir}/config"

    if [ ! -d "${config_backup}" ]; then
        log_info "Sem configuracoes para restaurar"
        return 0
    fi

    log_warning "Restauracao de configuracoes requer revisao manual"

    echo ""
    echo "Arquivos de configuracao disponiveis:"
    ls -la "${config_backup}/"
    echo ""
    echo "Para restaurar manualmente:"
    echo "  cp ${config_backup}/.env ${PROJECT_ROOT}/backend/.env"
    echo "  cp ${config_backup}/nginx.conf /etc/nginx/sites-available/nucleoia"
    echo ""
}

validate_restore() {
    log_info "Validando restore..."

    PGPASSWORD="${DB_PASSWORD}" psql \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        log_success "Conexao com banco OK"
    else
        log_error "Falha na conexao com banco"
        return 1
    fi

    sleep 3
    local api_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null)

    if [ "${api_response}" = "200" ]; then
        log_success "API respondendo"
    else
        log_warning "API nao esta respondendo (codigo: ${api_response})"
    fi
}

confirm_restore() {
    echo ""
    echo -e "${YELLOW}! ATENCAO: Esta operacao ira sobrescrever dados existentes!${NC}"
    echo ""
    read -p "Deseja continuar com o restore? (digite 'SIM' para confirmar): " confirm

    if [ "${confirm}" != "SIM" ]; then
        log_info "Restore cancelado pelo usuario"
        exit 0
    fi
}

main() {
    local backup_file=$1

    if [ -z "${backup_file}" ]; then
        echo ""
        echo "Uso: $0 <arquivo_backup.tar.gz>"
        echo ""
        echo "Backups disponiveis:"
        find "${BACKUP_ROOT}" -name "*.tar.gz" -type f -printf "  %p (%s bytes, %Tc)\n" | sort -r | head -10
        echo ""
        exit 1
    fi

    if [[ ! "${backup_file}" = /* ]]; then
        backup_file="${BACKUP_ROOT}/${backup_file}"
    fi

    echo ""
    echo "================================================================"
    echo "  NUCLEO IA v4 - RESTORE"
    echo "================================================================"
    echo ""

    verify_backup "${backup_file}"

    EXTRACTED_DIR=$(extract_backup "${backup_file}")

    show_backup_info "${EXTRACTED_DIR}"

    confirm_restore

    pre_restore_backup

    restore_database "${EXTRACTED_DIR}"
    restore_files "${EXTRACTED_DIR}"
    restore_config "${EXTRACTED_DIR}"

    validate_restore

    echo ""
    echo "================================================================"
    echo -e "  ${GREEN}+ RESTORE CONCLUIDO${NC}"
    echo "================================================================"
    echo ""
}

main "$@"
