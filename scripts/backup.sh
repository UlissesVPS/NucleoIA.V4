#!/bin/bash
#===============================================================================
# Nucleo IA v4 - Backup Script (Improved)
# Prevents disk from filling up:
#   - DB backups (small, critical): kept 7 days
#   - Code backups (excludes uploads/videos): kept 3 days
#   - Pre-flight disk space check (skips if >85% full)
#   - gzip compression
#
# Usage: bash backup.sh [daily|db|code|full]
#   daily = db + code (default for cron)
#   db    = database only
#   code  = code + config (excludes videos)
#   full  = db + code
#===============================================================================

set -euo pipefail

PROJECT_ROOT="/var/www/nucleoia"
BACKUP_ROOT="${PROJECT_ROOT}/backups"
LOG_DIR="${PROJECT_ROOT}/logs/backup"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

# Ensure log directory exists
mkdir -p "${LOG_DIR}"

# Load environment
if [ -f "/root/.env.nucleoia" ]; then
    source /root/.env.nucleoia
elif [ -f "${PROJECT_ROOT}/backend/.env" ]; then
    set +e
    export $(grep -v '^#' "${PROJECT_ROOT}/backend/.env" | grep -v '^\s*$' | xargs) 2>/dev/null
    set -e
fi

DB_NAME="${DB_NAME:-nucleoia_db}"
DB_USER="${DB_USER:-nucleoia_user}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

DB_RETENTION_DAYS=7
CODE_RETENTION_DAYS=3

# Disk usage threshold (percentage) - skip backup if above this
DISK_THRESHOLD=85

log() {
    local level="$1"
    local message="$2"
    local ts
    ts=$(date '+%Y-%m-%d %H:%M:%S')
    echo "${ts} [${level}] ${message}" | tee -a "${LOG_DIR}/backup.log"
}

#---------------------------------------
# Pre-flight: check disk usage percentage
#---------------------------------------
check_disk_space() {
    local usage_pct
    usage_pct=$(df "${BACKUP_ROOT}" | awk 'NR==2 {gsub(/%/,""); print $5}')

    if [ "${usage_pct}" -ge "${DISK_THRESHOLD}" ]; then
        log "ERROR" "Disk usage is ${usage_pct}% (threshold ${DISK_THRESHOLD}%). Skipping backup."
        # Try to clean up old backups even when disk is full
        cleanup_old_backups
        exit 1
    fi
    log "INFO" "Disk usage: ${usage_pct}% (threshold: ${DISK_THRESHOLD}%) - OK"
}

#---------------------------------------
# Database backup (pg_dump + gzip)
#---------------------------------------
backup_database() {
    local db_dir="${BACKUP_ROOT}/db"
    mkdir -p "${db_dir}"

    local outfile="${db_dir}/db_${TIMESTAMP}.sql.gz"

    log "INFO" "Starting database backup..."

    if sudo -u postgres pg_dump "${DB_NAME}" | gzip -6 > "${outfile}" 2>> "${LOG_DIR}/backup.log"; then
        local size
        size=$(du -h "${outfile}" | cut -f1)
        log "SUCCESS" "DB backup created: ${outfile} (${size})"
    else
        log "ERROR" "Database backup FAILED"
        rm -f "${outfile}"
        return 1
    fi
}

#---------------------------------------
# Code backup (tar.gz, excludes videos)
#---------------------------------------
backup_code() {
    local code_dir="${BACKUP_ROOT}/code"
    mkdir -p "${code_dir}"

    local outfile="${code_dir}/code_${TIMESTAMP}.tar.gz"

    log "INFO" "Starting code backup (excluding uploads/videos)..."

    tar -czf "${outfile}" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='backups' \
        --exclude='logs' \
        --exclude='backend/uploads/videos' \
        --exclude='backend/dist' \
        --exclude='frontend/node_modules' \
        --exclude='frontend/dist' \
        -C /var/www \
        nucleoia 2>> "${LOG_DIR}/backup.log"

    if [ $? -eq 0 ]; then
        local size
        size=$(du -h "${outfile}" | cut -f1)
        log "SUCCESS" "Code backup created: ${outfile} (${size})"
    else
        log "ERROR" "Code backup FAILED"
        rm -f "${outfile}"
        return 1
    fi
}

#---------------------------------------
# Cleanup old backups
#---------------------------------------
cleanup_old_backups() {
    log "INFO" "Cleaning up old backups..."

    # DB backups: keep 7 days
    local db_deleted=0
    if [ -d "${BACKUP_ROOT}/db" ]; then
        db_deleted=$(find "${BACKUP_ROOT}/db" -name "*.sql.gz" -mtime +${DB_RETENTION_DAYS} -delete -print 2>/dev/null | wc -l)
    fi

    # Code backups: keep 3 days
    local code_deleted=0
    if [ -d "${BACKUP_ROOT}/code" ]; then
        code_deleted=$(find "${BACKUP_ROOT}/code" -name "*.tar.gz" -mtime +${CODE_RETENTION_DAYS} -delete -print 2>/dev/null | wc -l)
    fi

    # Clean up old daily/ directory backups (legacy format)
    local legacy_deleted=0
    if [ -d "${BACKUP_ROOT}/daily" ]; then
        legacy_deleted=$(find "${BACKUP_ROOT}/daily" -name "*.tar.gz" -mtime +3 -delete -print 2>/dev/null | wc -l)
        # Also remove any uncompressed backup directories older than 1 day
        find "${BACKUP_ROOT}/daily" -maxdepth 1 -type d -name "backup_*" -mtime +1 -exec rm -rf {} + 2>/dev/null || true
    fi

    log "INFO" "Cleanup: removed ${db_deleted} old DB backups, ${code_deleted} old code backups, ${legacy_deleted} old legacy backups"

    # Report disk usage after cleanup
    local usage_pct
    usage_pct=$(df "${BACKUP_ROOT}" | awk 'NR==2 {gsub(/%/,""); print $5}')
    local avail
    avail=$(df -h "${BACKUP_ROOT}" | awk 'NR==2 {print $4}')
    log "INFO" "Disk after cleanup: ${usage_pct}% used, ${avail} available"
}

#---------------------------------------
# Main
#---------------------------------------
main() {
    local backup_type="${1:-daily}"
    local start_time
    start_time=$(date +%s)

    echo "================================================================"
    echo "  NUCLEO IA v4 - BACKUP (${backup_type})"
    echo "  Timestamp: ${TIMESTAMP}"
    echo "================================================================"

    # Always check disk space first
    check_disk_space

    case "${backup_type}" in
        daily|full)
            backup_database
            backup_code
            ;;
        db)
            backup_database
            ;;
        code)
            backup_code
            ;;
        *)
            log "ERROR" "Unknown backup type: ${backup_type}. Use: daily|db|code|full"
            exit 1
            ;;
    esac

    # Cleanup after backup
    cleanup_old_backups

    local end_time
    end_time=$(date +%s)
    local duration=$(( end_time - start_time ))

    log "SUCCESS" "Backup (${backup_type}) completed in ${duration}s"
    echo "================================================================"
    echo "  BACKUP COMPLETED - ${duration}s"
    echo "================================================================"
}

main "$@"
