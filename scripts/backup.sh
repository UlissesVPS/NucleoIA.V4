#!/bin/bash
#===============================================================================
# Nucleo IA v4 - Script de Backup
# Uso: bash backup.sh [tipo]
# Tipos: full, db, files, config, pre-deploy, daily, migration
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
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
DATE_ONLY=$(date +%Y-%m-%d)

# Carregar variaveis de ambiente
if [ -f "/root/.env.nucleoia" ]; then
    source /root/.env.nucleoia
elif [ -f "${PROJECT_ROOT}/backend/.env" ]; then
    export $(grep -v '^#' ${PROJECT_ROOT}/backend/.env | xargs)
fi

DB_NAME="${DB_NAME:-nucleoia_db}"
DB_USER="${DB_USER:-nucleoia_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_DIR}/backup.log"
}

log_info() { log "INFO" "$1"; echo -e "${BLUE}i${NC} $1"; }
log_success() { log "SUCCESS" "$1"; echo -e "${GREEN}+${NC} $1"; }
log_warning() { log "WARNING" "$1"; echo -e "${YELLOW}!${NC} $1"; }
log_error() { log "ERROR" "$1"; echo -e "${RED}x${NC} $1"; }

check_disk_space() {
    local required_mb=$1
    local available_mb=$(df -m "${BACKUP_ROOT}" | awk 'NR==2 {print $4}')

    if [ "${available_mb}" -lt "${required_mb}" ]; then
        log_error "Espaco insuficiente: ${available_mb}MB disponivel, ${required_mb}MB necessario"
        return 1
    fi
    log_info "Espaco em disco OK: ${available_mb}MB disponivel"
    return 0
}

backup_database() {
    local backup_dir=$1
    local db_backup_dir="${backup_dir}/database"
    mkdir -p "${db_backup_dir}"

    log_info "Iniciando backup do banco de dados..."

    PGPASSWORD="${DB_PASSWORD}" pg_dump \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        -Fc \
        -f "${db_backup_dir}/${DB_NAME}.custom" 2>> "${LOG_DIR}/backup.log"

    if [ $? -eq 0 ]; then
        log_success "Backup formato custom criado"
    else
        log_error "Falha no backup formato custom"
        return 1
    fi

    PGPASSWORD="${DB_PASSWORD}" pg_dump \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        --no-owner \
        --no-acl \
        -f "${db_backup_dir}/${DB_NAME}.sql" 2>> "${LOG_DIR}/backup.log"

    if [ $? -eq 0 ]; then
        log_success "Backup formato SQL criado"
    else
        log_warning "Falha no backup formato SQL (continuando...)"
    fi

    log_info "Salvando contagens das tabelas..."
    PGPASSWORD="${DB_PASSWORD}" psql \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        -c "SELECT table_name,
            (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
            FROM (
                SELECT table_name,
                query_to_xml('SELECT COUNT(*) as cnt FROM ' || quote_ident(table_name), false, true, '') as xml_count
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ) t
            ORDER BY table_name;" \
        -o "${db_backup_dir}/table_counts.txt" 2>> "${LOG_DIR}/backup.log"

    return 0
}

backup_files() {
    local backup_dir=$1
    local files_backup_dir="${backup_dir}/uploads"
    local uploads_source="${PROJECT_ROOT}/backend/uploads"

    if [ -d "${uploads_source}" ] && [ "$(ls -A ${uploads_source} 2>/dev/null)" ]; then
        log_info "Iniciando backup dos arquivos..."
        mkdir -p "${files_backup_dir}"

        cp -r "${uploads_source}"/* "${files_backup_dir}/" 2>> "${LOG_DIR}/backup.log"

        if [ $? -eq 0 ]; then
            local file_count=$(find "${files_backup_dir}" -type f | wc -l)
            log_success "Backup de arquivos concluido: ${file_count} arquivos"
        else
            log_warning "Alguns arquivos podem nao ter sido copiados"
        fi
    else
        log_info "Diretorio de uploads vazio ou inexistente, pulando..."
        mkdir -p "${files_backup_dir}"
        echo "Nenhum arquivo para backup" > "${files_backup_dir}/.empty"
    fi

    return 0
}

backup_config() {
    local backup_dir=$1
    local config_backup_dir="${backup_dir}/config"
    mkdir -p "${config_backup_dir}"

    log_info "Iniciando backup das configuracoes..."

    if [ -f "${PROJECT_ROOT}/backend/.env" ]; then
        cp "${PROJECT_ROOT}/backend/.env" "${config_backup_dir}/.env"
        log_success "Backup do .env"
    fi

    if [ -f "${PROJECT_ROOT}/backend/ecosystem.config.js" ]; then
        cp "${PROJECT_ROOT}/backend/ecosystem.config.js" "${config_backup_dir}/"
        log_success "Backup do ecosystem.config.js"
    fi

    if [ -f "/etc/nginx/sites-available/nucleoia" ]; then
        cp "/etc/nginx/sites-available/nucleoia" "${config_backup_dir}/nginx.conf"
        log_success "Backup da config Nginx"
    fi

    if [ -f "${PROJECT_ROOT}/backend/prisma/schema.prisma" ]; then
        cp "${PROJECT_ROOT}/backend/prisma/schema.prisma" "${config_backup_dir}/"
        log_success "Backup do schema.prisma"
    fi

    if [ -f "${PROJECT_ROOT}/backend/package.json" ]; then
        cp "${PROJECT_ROOT}/backend/package.json" "${config_backup_dir}/"
        log_success "Backup do package.json"
    fi

    return 0
}

create_metadata() {
    local backup_dir=$1
    local backup_type=$2

    local db_size=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));" 2>/dev/null | tr -d ' ')
    local backup_size=$(du -sh "${backup_dir}" 2>/dev/null | cut -f1)

    cat > "${backup_dir}/metadata.json" << EOF
{
    "timestamp": "${TIMESTAMP}",
    "type": "${backup_type}",
    "database": {
        "name": "${DB_NAME}",
        "size": "${db_size}"
    },
    "backup_size": "${backup_size}",
    "hostname": "$(hostname)",
    "created_by": "backup.sh",
    "components": {
        "database": $([ -f "${backup_dir}/database/${DB_NAME}.custom" ] && echo "true" || echo "false"),
        "files": $([ -d "${backup_dir}/uploads" ] && echo "true" || echo "false"),
        "config": $([ -d "${backup_dir}/config" ] && echo "true" || echo "false")
    }
}
EOF
    log_success "Metadata criado"
}

compress_backup() {
    local backup_dir=$1
    local backup_name=$(basename "${backup_dir}")
    local parent_dir=$(dirname "${backup_dir}")
    local archive="${parent_dir}/${backup_name}.tar.gz"

    log_info "Compactando backup..."

    cd "${parent_dir}"
    tar -czf "${archive}" "${backup_name}" 2>> "${LOG_DIR}/backup.log"

    if [ $? -eq 0 ]; then
        rm -rf "${backup_dir}"
        local archive_size=$(du -h "${archive}" | cut -f1)
        log_success "Backup compactado: ${archive} (${archive_size})"
        # Return archive path via global variable to avoid mixing with log output
        BACKUP_ARCHIVE="${archive}"
    else
        log_error "Falha na compactacao"
        return 1
    fi
}

cleanup_old_backups() {
    local backup_type_dir=$1

    log_info "Limpando backups com mais de ${RETENTION_DAYS} dias em ${backup_type_dir}..."

    local deleted=$(find "${backup_type_dir}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)

    if [ "${deleted}" -gt 0 ]; then
        log_info "Removidos ${deleted} backups antigos"
    else
        log_info "Nenhum backup antigo para remover"
    fi
}

log_backup_to_db() {
    local archive=$1
    local backup_type=$2
    local duration=$3

    local filename=$(basename "${archive}")
    local size_bytes=$(stat -c%s "${archive}" 2>/dev/null || echo "0")

    PGPASSWORD="${DB_PASSWORD}" psql \
        -h "${DB_HOST}" \
        -p "${DB_PORT}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}" \
        -c "INSERT INTO backup_records (id, name, filename, type, status, size_bytes, components, duration_secs, created_at)
            VALUES (
                gen_random_uuid(),
                'Backup ${backup_type} ${TIMESTAMP}',
                '${filename}',
                '$([ "${backup_type}" = "daily" ] && echo "AUTO" || echo "MANUAL")',
                'SUCCESS',
                ${size_bytes},
                '{\"database\": true, \"files\": true, \"config\": true}',
                ${duration},
                NOW()
            );" 2>/dev/null || true
}

do_backup() {
    local backup_type=$1
    local backup_subdir=""

    case "${backup_type}" in
        full)       backup_subdir="manual" ;;
        db)         backup_subdir="manual" ;;
        files)      backup_subdir="manual" ;;
        config)     backup_subdir="manual" ;;
        pre-deploy) backup_subdir="pre-deploy" ;;
        daily)      backup_subdir="daily" ;;
        migration)  backup_subdir="migrations" ;;
        *)
            log_error "Tipo de backup invalido: ${backup_type}"
            echo "Uso: $0 [full|db|files|config|pre-deploy|daily|migration]"
            exit 1
            ;;
    esac

    local backup_dir="${BACKUP_ROOT}/${backup_subdir}/backup_${TIMESTAMP}"

    echo ""
    echo "================================================================"
    echo "  NUCLEO IA v4 - BACKUP ${backup_type^^}"
    echo "  Timestamp: ${TIMESTAMP}"
    echo "================================================================"
    echo ""

    check_disk_space 500 || exit 1

    mkdir -p "${backup_dir}"

    local start_time=$(date +%s)

    case "${backup_type}" in
        full|daily|pre-deploy|migration)
            backup_database "${backup_dir}" || exit 1
            backup_files "${backup_dir}"
            backup_config "${backup_dir}"
            ;;
        db)
            backup_database "${backup_dir}" || exit 1
            ;;
        files)
            backup_files "${backup_dir}"
            ;;
        config)
            backup_config "${backup_dir}"
            ;;
    esac

    create_metadata "${backup_dir}" "${backup_type}"

    BACKUP_ARCHIVE=""
    compress_backup "${backup_dir}"
    local archive="${BACKUP_ARCHIVE}"

    cleanup_old_backups "${BACKUP_ROOT}/${backup_subdir}"

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    echo "================================================================"
    echo -e "  ${GREEN}+ BACKUP CONCLUIDO COM SUCESSO${NC}"
    echo "  Arquivo: ${archive}"
    echo "  Duracao: ${duration} segundos"
    echo "================================================================"
    echo ""

    log_backup_to_db "${archive}" "${backup_type}" "${duration}"

    return 0
}

show_help() {
    echo ""
    echo "Nucleo IA v4 - Sistema de Backup"
    echo ""
    echo "Uso: $0 [tipo]"
    echo ""
    echo "Tipos de backup:"
    echo "  full       - Backup completo (banco + arquivos + config)"
    echo "  db         - Apenas banco de dados"
    echo "  files      - Apenas arquivos de upload"
    echo "  config     - Apenas configuracoes"
    echo "  pre-deploy - Backup completo antes de deploy"
    echo "  daily      - Backup diario automatico"
    echo "  migration  - Backup antes de migracao"
    echo ""
    echo "Exemplos:"
    echo "  $0 full        # Backup completo manual"
    echo "  $0 pre-deploy  # Antes de fazer deploy"
    echo "  $0 migration   # Antes de migrar dados"
    echo ""
}

if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

BACKUP_TYPE="${1:-full}"
do_backup "${BACKUP_TYPE}"
